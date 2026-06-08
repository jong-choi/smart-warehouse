require("ts-node/register/transpile-only");
require("tsconfig-paths/register");

const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, it } = require("node:test");
const express = require("express");
const { createServer } = require("node:http");
const SSEChatbotController =
  require("../controllers/sseChatbotControllers/controller").default;
const {
  SessionStore,
} = require("../controllers/sseChatbotControllers/sessionStore");
const {
  createSSEChatbotRouter,
} = require("../routes/sseChatbotRoutes/router");

const createAgent = (modelName, eventsFactory) => ({
  modelName,
  streamEvents: eventsFactory,
});

const streamEvents = (...events) =>
  async function* () {
    for (const event of events) {
      yield event;
    }
  };

const responseChunk = (text) => ({
  event: "on_chat_model_stream",
  data: {
    chunk: {
      content: text,
      additional_kwargs: {},
    },
  },
});

const responseEnd = () => ({
  event: "on_chat_model_end",
  data: {
    output: {
      response_metadata: {},
      usage_metadata: {},
    },
  },
});

const readUntil = async (reader, predicate) => {
  const decoder = new TextDecoder();
  let output = "";

  while (!predicate(output)) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }

  return output;
};

describe("SSE chatbot HTTP contract", () => {
  let server;
  let baseUrl;
  let runtime;

  beforeEach(async () => {
    runtime = {
      primary: createAgent(
        "gpt-oss-primary",
        streamEvents(responseChunk("테스트 응답"), responseEnd())
      ),
      fallback: createAgent(
        "gpt-oss-fallback",
        streamEvents(responseChunk("폴백 응답"), responseEnd())
      ),
      clearSession: async () => {},
    };

    const controller = new SSEChatbotController(runtime, new SessionStore());
    const app = express();
    app.use(express.json());
    app.use("/api/chat", createSSEChatbotRouter(controller));

    server = createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections?.();
    });
  });

  it("keeps session, welcome, send, and clear wire payloads stable", async () => {
    const sessionResponse = await fetch(`${baseUrl}/api/chat/session`, {
      method: "POST",
    });
    assert.equal(sessionResponse.status, 200);

    const { sessionId } = await sessionResponse.json();
    assert.match(sessionId, /^[0-9a-f-]{36}$/);

    const streamResponse = await fetch(
      `${baseUrl}/api/chat/stream?sessionId=${sessionId}`
    );
    assert.equal(streamResponse.status, 200);
    assert.equal(
      streamResponse.headers.get("content-type"),
      "text/event-stream"
    );

    const reader = streamResponse.body.getReader();
    const welcomeEvents = await readUntil(
      reader,
      (text) => (text.match(/event: end/g) || []).length >= 1
    );
    assert.match(welcomeEvents, /event: start\ndata: \{\}\n\n/);
    assert.match(
      welcomeEvents,
      /event: chunk\ndata: \{"type":"response","text":"안녕하세요! 스마트 창고 챗봇입니다\. 무엇을 도와드릴까요\?"\}\n\n/
    );
    assert.match(
      welcomeEvents,
      /event: end\ndata: \{"fullResponse":"안녕하세요! 스마트 창고 챗봇입니다\. 무엇을 도와드릴까요\?"\}\n\n/
    );

    const sendResponse = await fetch(`${baseUrl}/api/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: "현재 상태를 알려줘",
        systemContext: "대시보드",
        isDBAllowed: true,
      }),
    });
    assert.equal(sendResponse.status, 200);
    assert.deepEqual(await sendResponse.json(), { ok: true });

    const answerEvents = await readUntil(
      reader,
      (text) => (text.match(/event: end/g) || []).length >= 1
    );
    assert.match(
      answerEvents,
      /event: chunk\ndata: \{"type":"response","text":"테스트 응답"\}\n\n/
    );
    assert.match(
      answerEvents,
      /event: end\ndata: \{"fullResponse":"테스트 응답","reasoningSummary":"No reasoning summary available","reasoningTokens":0,"metadata":\{"model":"gpt-oss-primary","reasoningEffort":"high"\}\}\n\n/
    );

    const clearResponse = await fetch(`${baseUrl}/api/chat/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    assert.equal(clearResponse.status, 200);
    assert.deepEqual(await clearResponse.json(), { ok: true });

    const clearEvents = await readUntil(
      reader,
      (text) => (text.match(/event: end/g) || []).length >= 1
    );
    assert.match(
      clearEvents,
      /event: chunk\ndata: \{"text":"대화를 초기화했습니다\."\}\n\n/
    );
    assert.match(
      clearEvents,
      /event: end\ndata: \{"fullResponse":"대화를 초기화했습니다\."\}\n\n/
    );

    await reader.cancel();
  });

  it("preserves validation status codes", async () => {
    const invalidPayload = await fetch(`${baseUrl}/api/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: 123 }),
    });
    assert.equal(invalidPayload.status, 400);
    assert.deepEqual(await invalidPayload.json(), {
      error: "invalid payload",
    });

    const missingStream = await fetch(
      `${baseUrl}/api/chat/stream?sessionId=missing`
    );
    assert.equal(missingStream.status, 404);
  });

  it("uses fallback only when primary fails before emitting activity", async () => {
    runtime.primary.streamEvents = async function* () {
      throw new Error("primary unavailable");
    };

    const sessionResponse = await fetch(`${baseUrl}/api/chat/session`, {
      method: "POST",
    });
    const { sessionId } = await sessionResponse.json();
    const streamResponse = await fetch(
      `${baseUrl}/api/chat/stream?sessionId=${sessionId}`
    );
    const reader = streamResponse.body.getReader();
    await readUntil(reader, (text) => /event: end/.test(text));

    const sendResponse = await fetch(`${baseUrl}/api/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: "폴백 테스트" }),
    });
    assert.equal(sendResponse.status, 200);

    const fallbackEvents = await readUntil(reader, (text) =>
      /event: end/.test(text)
    );
    assert.match(fallbackEvents, /"text":"폴백 응답"/);
    assert.match(fallbackEvents, /"model":"gpt-oss-fallback"/);

    await reader.cancel();
  });
});
