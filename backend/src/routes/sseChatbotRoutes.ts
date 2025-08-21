import express, { type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";

// 환경/모델 설정
const MODEL_NAME_MAP = {
  qwen306: "qwen3:0.6b",
  exaone3524b: "exaone3.5:2.4b",
};
const MODEL_NAME = MODEL_NAME_MAP.qwen306;

// Ollama/LLM 설정 (필요 시 OpenAI로 전환 가능)
// const createLLMModel = () => {
//   const authorizedFetch: typeof fetch = (input, init = {}) => {
//     init.headers = {
//       ...(init.headers as Record<string, string>),
//       "LLM-SECRET-KEY": process.env.LLM_SECRET_KEY!,
//     } as any;
//     return fetch(input as any, init);
//   };

//   return new ChatOllama({
//     model: MODEL_NAME,
//     baseUrl: process.env.ORACLE_OLLAMA_HOST,
//     fetch: authorizedFetch as any,
//     streaming: true,
//   });
// };

export const createLLMModel = () => {
  return new ChatOpenAI({
    model: "gpt-5-nano-2025-08-07",
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const SYSTEM_PROMPT = `당신은 물류 관리 시스템을 위한 전문 챗봇입니다. 항상 한국어로 친절하고 정확하게 답변해주세요. 물류, 운송, 창고 관리, 배송 등과 관련하여 특히 전문적이고 실용적인 면모를 발휘해주세요.`;

type Session = {
  id: string;
  res?: Response;
  abort?: AbortController;
  history: ChatMessageHistoryWithDeletion;
};

const sessions = new Map<string, Session>();

const router = express.Router();

// 세션 생성
router.post("/session", (req: Request, res: Response) => {
  const id = randomUUID();
  sessions.set(id, { id, history: new ChatMessageHistoryWithDeletion() });
  res.json({ sessionId: id });
});

// SSE 스트림 연결
router.get("/stream", (req: Request, res: Response) => {
  const id = String(req.query.sessionId || "");
  const s = sessions.get(id);
  if (!s) return res.status(404).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as any).flushHeaders?.();

  s.res = res;
  s.abort = new AbortController();

  const ping = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 20000);

  req.on("close", () => {
    clearInterval(ping);
    s.abort?.abort();
    s.res = undefined;
  });
});

// 대화 전송 (POST)
router.post("/send", async (req: Request, res: Response) => {
  const { sessionId, message, systemContext } = req.body || {};
  const requestStart = Date.now();
  console.log("[/api/chat/send] incoming", {
    sessionId:
      typeof sessionId === "string" && sessionId
        ? `${String(sessionId).slice(0, 8)}...`
        : null,
    messageLen: typeof message === "string" ? message.length : null,
    hasSystemContext: Boolean(systemContext),
    time: new Date().toISOString(),
  });
  if (!sessionId || typeof message !== "string") {
    console.warn("[/api/chat/send] invalid payload", {
      hasSessionId: Boolean(sessionId),
      messageType: typeof message,
    });
    return res.status(400).json({ error: "invalid payload" });
  }
  const s = sessions.get(sessionId);
  if (!s || !s.res) {
    console.warn("[/api/chat/send] invalid session or no SSE res", {
      hasSession: Boolean(s),
      hasSSE: Boolean(s?.res),
    });
    return res.status(400).json({ error: "invalid session" });
  }

  try {
    // 프롬프트/체인 구성
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);
    const llm = createLLMModel();
    console.log("[/api/chat/send] LLM ready", {
      provider: (llm as any)?.constructor?.name,
      modelConfigured: (llm as any)?.model ?? (llm as any)?.modelName,
      openaiKeySet: Boolean(process.env.OPENAI_API_KEY),
      ollamaHostSet: Boolean(process.env.ORACLE_OLLAMA_HOST),
    });
    const runnable = prompt.pipe(llm);
    const chatChain = new RunnableWithMessageHistory({
      runnable,
      getMessageHistory: async () => s.history,
      inputMessagesKey: "input",
      historyMessagesKey: "history",
    });

    // 시스템 컨텍스트 처리(화면 정보 반영)
    if (systemContext) {
      await s.history.deleteMessages(
        (m: BaseMessage) => m.getType() === "system"
      );
      const sys = new SystemMessage({
        content: `화면 정보 기반으로 답변하세요. 항상 한국어로 답변합니다.\nuser message: ${message}\nscreen context: ${systemContext}`,
      });
      await s.history.addMessage(sys);
    }

    // 스트리밍 시작 신호
    s.res.write(`event: start\n`);
    s.res.write(`data: {}\n\n`);

    let full = "";
    let firstChunkMs: number | null = null;
    const eventStream = chatChain.streamEvents({ input: message }, {
      version: "v2",
      signal: s.abort?.signal,
      configurable: { sessionId },
    } as any);

    for await (const event of eventStream as any) {
      if (event?.event === "on_chat_model_stream") {
        // v0.3: event.data.chunk.message.content 또는 event.data.chunk.content
        const chunk = event?.data?.chunk;
        let content = "";
        const raw = chunk?.message?.content ?? chunk?.content ?? "";
        if (Array.isArray(raw)) {
          content = raw
            .map((c) => (typeof c === "string" ? c : c?.text ?? ""))
            .join("");
        } else if (typeof raw === "string") {
          content = raw;
        } else if (raw && typeof raw === "object" && raw?.text) {
          content = String(raw.text);
        }

        if (content) {
          full += content;
          if (firstChunkMs === null) {
            firstChunkMs = Date.now() - requestStart;
            console.log("[/api/chat/send] first chunk", {
              firstChunkMs,
              chunkLen: content.length,
            });
          }
          s.res.write(`event: chunk\n`);
          s.res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }
    }

    s.res.write(`event: end\n`);
    s.res.write(`data: ${JSON.stringify({ fullResponse: full })}\n\n`);
    const totalMs = Date.now() - requestStart;
    console.log("[/api/chat/send] completed", {
      totalMs,
      firstChunkMs,
      fullLen: full.length,
    });
    res.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/chat/send] error", {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
      cause: e?.cause,
    });
    s.res.write(`event: error\n`);
    s.res.write(
      `data: ${JSON.stringify({
        message: "응답 생성 중 오류가 발생했습니다.",
      })}\n\n`
    );
    return res.status(500).json({ error: "failed to generate" });
  }
});

// 히스토리 초기화
router.post("/clear", async (req: Request, res: Response) => {
  const { sessionId } = req.body || {};
  const s = sessionId ? sessions.get(sessionId) : undefined;
  if (!s) return res.status(400).json({ error: "invalid session" });
  await s.history.clear();
  s.res?.write(`event: start\n` + `data: {}\n\n`);
  s.res?.write(
    `event: chunk\n` +
      `data: ${JSON.stringify({ text: "대화를 초기화했습니다." })}\n\n`
  );
  s.res?.write(
    `event: end\n` +
      `data: ${JSON.stringify({ fullResponse: "대화를 초기화했습니다." })}\n\n`
  );
  res.json({ ok: true });
});

export default router;
