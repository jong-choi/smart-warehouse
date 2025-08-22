import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";
import { sessionStore } from "./sessionStore";
import { createLLMModel, createSystemPrompt } from "./model";
import { MODEL_NAME, SYSTEM_PROMPT } from "./constants";
import { googleSearchTool } from "@src/utils/googleSearchTool";

// LangGraph 메모리 체크포인터 및 에이전트를 모듈 스코프로 1회 생성해 세션별(thread_id) 히스토리를 유지
const checkpointer = new MemorySaver();

const agent = createReactAgent({
  llm: createLLMModel(),
  tools: [googleSearchTool],
  checkpointer,
  // 요청 시 config.configurable에 전달된 systemContext/isDBAllowed를 이용해
  // 해당 턴의 LLM 입력에만 SystemMessage를 prepend (영구 히스토리 오염 방지)
  prompt: (state: any, config: any) => {
    const cfg = (config?.configurable ?? {}) as {
      systemContext?: string;
      isDBAllowed?: boolean;
    };

    const messages = (state as any)?.messages ?? [];
    const baseline = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      ...messages,
    ];

    let userText = "";
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (typeof m?.getType === "function" && m.getType() === "human") {
        const c = (m as any).content;
        if (typeof c === "string") {
          userText = c;
        } else if (Array.isArray(c)) {
          userText = c
            .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
            .filter(Boolean)
            .join("");
        }
        break;
      }
    }
    let sysContent: string | undefined;
    if (cfg.systemContext || cfg.isDBAllowed) {
      sysContent = createSystemPrompt(
        userText,
        cfg.systemContext || "",
        !!cfg.isDBAllowed
      );
    }

    if (typeof sysContent === "string" && sysContent) {
      return [new SystemMessage({ content: sysContent }), ...baseline];
    }
    return baseline;
  },
});

export default class SSEChatbotController {
  createSession = (req: Request, res: Response) => {
    const id = randomUUID();
    sessionStore.set({ id, history: new ChatMessageHistoryWithDeletion() });
    res.json({ sessionId: id });
  };

  openStream = (req: Request, res: Response) => {
    const id = String(req.query.sessionId || "");
    const s = sessionStore.get(id);

    if (!s) {
      return res.status(404).end();
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    (res as any).flushHeaders?.();

    s.res = res;
    s.abort = new AbortController();

    const ping = setInterval(() => {
      res.write(`event: ping\ndata: {}\n\n`);
    }, 20000);

    // 연결 직후 환영 메시지 즉시 전송 (비스트리밍)
    const welcomeMessage =
      "안녕하세요! 스마트 창고 챗봇입니다. 무엇을 도와드릴까요?";
    res.write(`event: start\ndata: {}\n\n`);
    res.write(
      `event: chunk\n` +
        `data: ${JSON.stringify({
          type: "response",
          text: welcomeMessage,
        })}\n\n`
    );
    res.write(
      `event: end\n` +
        `data: ${JSON.stringify({ fullResponse: welcomeMessage })}\n\n`
    );

    req.on("close", () => {
      clearInterval(ping);
      s.abort?.abort();
      s.res = undefined;
    });
  };

  sendMessage = async (req: Request, res: Response) => {
    const { sessionId, message, systemContext, isDBAllowed } = req.body || {};

    if (!sessionId || typeof message !== "string") {
      return res.status(400).json({ error: "invalid payload" });
    }

    const s = sessionStore.get(sessionId);
    if (!s || !s.res) {
      return res.status(400).json({ error: "invalid session" });
    }

    try {
      s.res.write(`event: start\ndata: {}\n\n`);

      let fullResponse = "";
      let fullReasoning = "";
      let reasoningTokens = 0;
      let reasoningBuffer = "";

      const eventStream = agent.streamEvents(
        { messages: [new HumanMessage(message)] },
        {
          version: "v2",
          signal: s.abort?.signal,
          configurable: { thread_id: sessionId, systemContext, isDBAllowed },
        }
      );

      for await (const event of eventStream) {
        // 툴 관련 이벤트 로깅(바인딩/호출 가시화)
        if (event?.event === "on_tool_start") {
          console.log(
            "[tool-start]",
            (event as any)?.name,
            (event as any)?.data?.input
          );
        }
        if (event?.event === "on_tool_end") {
          console.log("[tool-end]", (event as any)?.name);
        }

        if (
          event?.event !== "on_chat_model_stream" &&
          event?.event !== "on_chat_model_end"
        ) {
          continue;
        }

        if (event?.event === "on_chat_model_stream") {
          const chunk = (event as any)?.data?.chunk;
          if (!chunk) continue;

          if (typeof chunk.content === "string" && chunk.content) {
            fullResponse += chunk.content;
            s.res.write(`event: chunk\n`);
            s.res.write(
              `data: ${JSON.stringify({
                type: "response",
                text: chunk.content,
              })}\n\n`
            );
          }

          if (Array.isArray(chunk.content)) {
            for (const block of chunk.content) {
              if (
                block?.type === "text" &&
                typeof block?.text === "string" &&
                block.text
              ) {
                fullResponse += block.text;
                s.res.write(`event: chunk\n`);
                s.res.write(
                  `data: ${JSON.stringify({
                    type: "response",
                    text: block.text,
                  })}\n\n`
                );
              } else {
                console.log(event.event);
              }
            }
          }

          const reasoningKw = (chunk as any)?.additional_kwargs?.reasoning;
          if (reasoningKw?.summary && Array.isArray(reasoningKw.summary)) {
            for (const part of reasoningKw.summary) {
              if (
                part?.type === "summary_text" &&
                typeof part?.text === "string" &&
                part.text
              ) {
                reasoningBuffer += part.text;
                s.res.write(`event: reasoning\n`);
                s.res.write(
                  `data: ${JSON.stringify({
                    type: "reasoning",
                    text: part.text,
                    isThinking: true,
                  })}\n\n`
                );
              }
            }
          }
        }

        if (event?.event === "on_chat_model_end") {
          const output = (event as any)?.data?.output;
          const md = output?.response_metadata || output?.additional_kwargs;

          if (reasoningBuffer && !fullReasoning) {
            fullReasoning = reasoningBuffer;
            s.res.write(`event: reasoning_complete\n`);
            s.res.write(
              `data: ${JSON.stringify({
                type: "reasoning_complete",
                summary: fullReasoning,
              })}\n\n`
            );
          }

          const metaSummary = md?.reasoning_summary || md?.reasoning?.summary;
          if (!fullReasoning && Array.isArray(metaSummary)) {
            fullReasoning = metaSummary
              .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
              .filter(Boolean)
              .join("");
            s.res.write(`event: reasoning_summary\n`);
            s.res.write(
              `data: ${JSON.stringify({
                type: "reasoning_summary",
                summary: fullReasoning,
              })}\n\n`
            );
          }

          const usage = md?.usage || output?.usage_metadata;
          if (usage && typeof usage?.reasoning_tokens === "number") {
            reasoningTokens = usage.reasoning_tokens;
          }
        }
      }

      s.res.write(`event: end\n`);
      s.res.write(
        `data: ${JSON.stringify({
          fullResponse,
          reasoningSummary: fullReasoning || "No reasoning summary available",
          reasoningTokens,
          metadata: { model: MODEL_NAME, reasoningEffort: "high" },
        })}\n\n`
      );

      res.json({ ok: true });
    } catch (e: any) {
      console.error("[/api/chat/send] Error:", e);
      s.res.write(`event: error\n`);
      s.res.write(
        `data: ${JSON.stringify({
          message: "응답 생성 중 오류가 발생했습니다.",
          error: e?.message,
        })}\n\n`
      );
      return res
        .status(500)
        .json({ error: "failed to generate", details: e?.message });
    }
  };

  clearHistory = async (req: Request, res: Response) => {
    const { sessionId } = req.body || {};
    const s = sessionId ? sessionStore.get(sessionId) : undefined;

    if (!s) {
      return res.status(400).json({ error: "invalid session" });
    }

    await s.history.clear();
    await checkpointer.deleteThread(sessionId);

    s.res?.write(`event: start\ndata: {}\n\n`);
    s.res?.write(
      `event: chunk\n` +
        `data: ${JSON.stringify({ text: "대화를 초기화했습니다." })}\n\n`
    );
    s.res?.write(
      `event: end\n` +
        `data: ${JSON.stringify({
          fullResponse: "대화를 초기화했습니다.",
        })}\n\n`
    );

    res.json({ ok: true });
  };
}
