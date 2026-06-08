import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  isObject,
  isToolStartEvent,
  isToolEndEvent,
  isChatStreamEvent,
  isChatEndEvent,
} from "@src/typings/sseChatbot";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";
import { SessionStore, sessionStore } from "./sessionStore";
import { SESSION_IDLE_TIMEOUT_MS } from "./constants";
import type { ChatAgent, ChatRuntime } from "./runtime";
import { safeSSEvent } from "@src/utils/safeSSE";

// 챗봇 로직
export default class SSEChatbotController {
  constructor(
    private readonly runtime: ChatRuntime,
    private readonly sessions: SessionStore = sessionStore
  ) {}

  createSession = (req: Request, res: Response) => {
    const id = randomUUID();
    this.sessions.set({
      id,
      history: new ChatMessageHistoryWithDeletion(),
    });
    //일정 시간 비활성화시 세션 종료
    this.sessions.setIdleTimer(id, SESSION_IDLE_TIMEOUT_MS, () => {
      const cur = this.sessions.get(id);
      cur?.abort?.abort();
      if (cur?.res) {
        safeSSEvent(cur.res, "expired", { reason: "idle_timeout" });
        cur.res.end?.();
      }
      void this.runtime.clearSession(id);
      this.sessions.delete(id);
    });
    res.json({ sessionId: id });
  };

  openStream = (req: Request, res: Response) => {
    const id = String(req.query.sessionId || "");
    const s = this.sessions.get(id);

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

    this.sessions.setIdleTimer(id, SESSION_IDLE_TIMEOUT_MS, () => {
      const cur = this.sessions.get(id);
      cur?.abort?.abort();
      if (cur?.res) {
        safeSSEvent(cur.res, "expired", { reason: "idle_timeout" });
        cur.res.end?.();
      }
      void this.runtime.clearSession(id);
      this.sessions.delete(id);
    });

    const ping = setInterval(() => {
      if (!safeSSEvent(res, "ping", {})) {
        clearInterval(ping);
      }
    }, 20000);

    // 연결 직후 환영 메시지 즉시 전송 (비스트리밍)
    const welcomeMessage =
      "안녕하세요! 스마트 창고 챗봇입니다. 무엇을 도와드릴까요?";
    safeSSEvent(res, "start", {});
    safeSSEvent(res, "chunk", { type: "response", text: welcomeMessage });
    safeSSEvent(res, "end", { fullResponse: welcomeMessage });

    req.on("close", () => {
      clearInterval(ping);
      s.abort?.abort();
      s.res = undefined;
      this.sessions.delete(id);
      void this.runtime.clearSession(id);
    });
  };

  sendMessage = async (req: Request, res: Response) => {
    const { sessionId, message, systemContext, isDBAllowed } = req.body || {};

    if (!sessionId || typeof message !== "string") {
      return res.status(400).json({ error: "invalid payload" });
    }

    const s = this.sessions.get(sessionId);
    if (!s || !s.res) {
      return res.status(400).json({ error: "invalid session" });
    }

    try {
      // 요청이 시작될 때는 타임아웃을 일시 해제하여 스트리밍 중 만료를 방지
      this.sessions.clearIdleTimer(sessionId);
      safeSSEvent(s.res, "start", {});

      let fullResponse = "";
      let fullReasoning = "";
      let reasoningTokens = 0;
      let reasoningBuffer = "";
      let primaryActivity = false;

      const runAgent = async (
        chatAgent: ChatAgent,
        onActivity?: () => void
      ) => {
        const eventStream = chatAgent.streamEvents({
          sessionId,
          message,
          systemContext,
          isDBAllowed,
          signal: s.abort?.signal,
        });

        for await (const event of eventStream) {
          if (isToolStartEvent(event)) {
            onActivity?.();
            const { name, data } = event;
            safeSSEvent(s.res, "tool_start", { name, input: data?.input });
            continue;
          }

          if (isToolEndEvent(event)) {
            onActivity?.();
            safeSSEvent(s.res, "tool_end", { name: event.name });
            continue;
          }

          if (isChatStreamEvent(event)) {
            const chunk = event.data?.chunk;
            if (!chunk) continue;
            onActivity?.();

            if (typeof chunk.content === "string" && chunk.content) {
              fullResponse += chunk.content;
              safeSSEvent(s.res, "chunk", {
                type: "response",
                text: chunk.content,
              });
            }

            if (Array.isArray(chunk.content)) {
              for (const block of chunk.content) {
                if (
                  typeof block === "object" &&
                  block !== null &&
                  "text" in block &&
                  typeof (block as { text: unknown }).text === "string"
                ) {
                  const text = (block as { text: string }).text;
                  fullResponse += text;
                  safeSSEvent(s.res, "chunk", {
                    type: "response",
                    text,
                  });
                }
              }
            }

            const kw = isObject(chunk.additional_kwargs)
              ? (chunk.additional_kwargs as Record<string, unknown>)
              : undefined;
            const reasoning = kw?.reasoning as
              | { summary?: Array<{ type?: string; text?: string }> }
              | undefined;

            if (Array.isArray(reasoning?.summary)) {
              for (const part of reasoning.summary) {
                if (
                  part?.type === "summary_text" &&
                  typeof part.text === "string" &&
                  part.text
                ) {
                  reasoningBuffer += part.text;
                  safeSSEvent(s.res, "reasoning", {
                    type: "reasoning",
                    text: part.text,
                    isThinking: true,
                  });
                }
              }
            }
            continue;
          }

          if (isChatEndEvent(event)) {
            onActivity?.();
            const output = event.data?.output;
            const metadata =
              (output?.response_metadata as
                | Record<string, unknown>
                | undefined) ||
              (output?.additional_kwargs as
                | Record<string, unknown>
                | undefined);

            if (reasoningBuffer && !fullReasoning) {
              fullReasoning = reasoningBuffer;
              safeSSEvent(s.res, "reasoning_complete", {
                type: "reasoning_complete",
                summary: fullReasoning,
              });
            }

            const metaSummary =
              (metadata &&
              Array.isArray(
                (metadata as { reasoning_summary?: unknown }).reasoning_summary
              )
                ? (
                    metadata as {
                      reasoning_summary?: Array<{ text?: string }>;
                    }
                  ).reasoning_summary
                : undefined) ||
              (metadata &&
              isObject(
                (metadata as { reasoning?: unknown }).reasoning
              )
                ? (
                    metadata as {
                      reasoning?: { summary?: Array<{ text?: string }> };
                    }
                  ).reasoning?.summary
                : undefined);

            if (!fullReasoning && Array.isArray(metaSummary)) {
              fullReasoning = metaSummary
                .map((part) =>
                  typeof part?.text === "string" ? part.text : ""
                )
                .filter(Boolean)
                .join("");
              safeSSEvent(s.res, "reasoning_summary", {
                type: "reasoning_summary",
                summary: fullReasoning,
              });
            }

            const usageA =
              metadata &&
              isObject((metadata as { usage?: unknown }).usage)
                ? (metadata as { usage?: { reasoning_tokens?: number } }).usage
                : undefined;
            const usageB = output?.usage_metadata as
              | { reasoning_tokens?: number }
              | undefined;
            const tokens =
              usageA?.reasoning_tokens ?? usageB?.reasoning_tokens;
            if (typeof tokens === "number") {
              reasoningTokens = tokens;
            }
          }
        }
      };

      let usedModelName = this.runtime.primary.modelName;
      try {
        await runAgent(this.runtime.primary, () => {
          primaryActivity = true;
        });
      } catch (primaryError) {
        const aborted =
          (primaryError instanceof Error &&
            (primaryError.name === "AbortError" ||
              primaryError.message === "Abort")) ||
          s.abort?.signal?.aborted;
        if (aborted || primaryActivity) {
          throw primaryError;
        }

        console.warn("Primary LLM failed before streaming; using fallback", {
          error:
            primaryError instanceof Error
              ? primaryError.message
              : String(primaryError),
        });
        usedModelName = this.runtime.fallback.modelName;
        await runAgent(this.runtime.fallback);
      }

      // 채팅 종료시 end 이벤트 발생
      safeSSEvent(s.res, "end", {
        fullResponse,
        reasoningSummary: fullReasoning || "No reasoning summary available",
        reasoningTokens,
        metadata: { model: usedModelName, reasoningEffort: "high" },
      });

      res.json({ ok: true });
    } catch (err: unknown) {
      // 사용자가 연결을 끊은 경우(Abort)는 정상 흐름으로 간주 (로그 미출력)
      const aborted =
        (err instanceof Error &&
          (err.name === "AbortError" || err.message === "Abort")) ||
        s.abort?.signal?.aborted;
      if (aborted) {
        return res.status(200).json({ ok: true, aborted: true });
      }
      safeSSEvent(s.res, "error", {
        message: "응답 생성 중 오류가 발생했습니다.",
        error: err instanceof Error ? err.message : String(err),
      });
      return res.status(500).json({
        error: "failed to generate",
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      // 스트리밍이 끝나면 비활성 타이머를 재설정
      if (this.sessions.has(sessionId)) {
        this.sessions.setIdleTimer(sessionId, SESSION_IDLE_TIMEOUT_MS, () => {
          const cur = this.sessions.get(sessionId);
          cur?.abort?.abort();
          if (cur?.res) {
            safeSSEvent(cur.res, "expired", { reason: "idle_timeout" });
            cur.res.end?.();
          }
          void this.runtime.clearSession(sessionId);
          this.sessions.delete(sessionId);
        });
      }
    }
  };

  // 세션을 유지하고 히스토리를 클리어
  clearHistory = async (req: Request, res: Response) => {
    const { sessionId } = req.body || {};
    const s = sessionId ? this.sessions.get(sessionId) : undefined;

    if (!s) {
      return res.status(400).json({ error: "invalid session" });
    }

    await s.history.clear();
    await this.runtime.clearSession(sessionId);

    safeSSEvent(s.res, "start", {});
    safeSSEvent(s.res, "chunk", { text: "대화를 초기화했습니다." });
    safeSSEvent(s.res, "end", { fullResponse: "대화를 초기화했습니다." });

    res.json({ ok: true });
  };
}
