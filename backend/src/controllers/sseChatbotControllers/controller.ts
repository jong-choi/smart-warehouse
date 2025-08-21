import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";
import { sessionStore } from "./sessionStore";
import { createLLMModel, createSystemPrompt } from "./model";
import { MODEL_NAME, SYSTEM_PROMPT } from "./constants";

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
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT],
        new MessagesPlaceholder("history"),
        ["human", "{input}"],
      ]);

      const llm = createLLMModel();
      const runnable = prompt.pipe(llm);

      const chatChain = new RunnableWithMessageHistory({
        runnable,
        getMessageHistory: async () => s.history,
        inputMessagesKey: "input",
        historyMessagesKey: "history",
      });

      if (systemContext || isDBAllowed) {
        await s.history.deleteMessages(
          (m: BaseMessage) => m.getType() === "system"
        );
        const sys = new SystemMessage({
          content: createSystemPrompt(message, systemContext, isDBAllowed),
        });
        await s.history.addMessage(sys);
      }

      s.res.write(`event: start\ndata: {}\n\n`);

      let fullResponse = "";
      let fullReasoning = "";
      let reasoningTokens = 0;
      let reasoningBuffer = "";

      const eventStream = chatChain.streamEvents({ input: message }, {
        version: "v2",
        signal: s.abort?.signal,
        configurable: { sessionId },
      } as any);

      for await (const event of eventStream) {
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
