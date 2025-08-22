import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { MessageContent } from "@langchain/core/messages";
import type { GraphState, AgentConfig } from "@src/typings/sseChatbot";
import {
  isObject,
  isToolStartEvent,
  isToolEndEvent,
  isChatStreamEvent,
  isChatEndEvent,
} from "@src/typings/sseChatbot";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";
import { sessionStore } from "./sessionStore";
import { createLLMModel, createSystemPrompt } from "./model";
import {
  MODEL_NAME,
  SYSTEM_PROMPT,
  SESSION_IDLE_TIMEOUT_MS,
} from "./constants";
import { safeSSEvent } from "@src/utils/safeSSE";
import { allDbTools, googleSearchTool, mathTool } from "@src/utils/tools";

// LangGraph 메모리 체크포인터 및 에이전트를 모듈 스코프로 1회 생성해 세션별(thread_id) 히스토리를 유지
const checkpointer = new MemorySaver();

const extractText = (content: string | MessageContent[]): string => {
  if (typeof content === "string") return content;
  const parts: string[] = [];
  for (const block of content) {
    if (
      typeof block === "object" &&
      block !== null &&
      "text" in block &&
      typeof (block as { text: unknown }).text === "string"
    ) {
      parts.push((block as { text: string }).text);
    }
  }
  return parts.join("");
};

// ReAct 에이전트 생성 (싱글톤)
const agent = createReactAgent({
  llm: createLLMModel(),
  tools: [googleSearchTool, mathTool, ...allDbTools],
  checkpointer,
  // 요청 시 config.configurable에 전달된 systemContext/isDBAllowed를 이용해
  // 해당 턴의 LLM 입력에만 SystemMessage를 prepend (영구 히스토리 오염 방지)
  prompt: (state: GraphState, config: AgentConfig) => {
    const cfg = config?.configurable ?? {};

    const messages = state?.messages ?? [];
    const baseline = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      ...messages,
    ];

    let userText = "";
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.getType() === "human") {
        const c = m.content as string | MessageContent[];
        userText = extractText(c);
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

// 챗봇 로직
export default class SSEChatbotController {
  createSession = (req: Request, res: Response) => {
    const id = randomUUID();
    sessionStore.set({ id, history: new ChatMessageHistoryWithDeletion() });
    //일정 시간 비활성화시 세션 종료
    sessionStore.setIdleTimer(id, SESSION_IDLE_TIMEOUT_MS, () => {
      const cur = sessionStore.get(id);
      cur?.abort?.abort();
      if (cur?.res) {
        safeSSEvent(cur.res, "expired", { reason: "idle_timeout" });
        cur.res.end?.();
      }
      checkpointer.deleteThread(id);
      sessionStore.delete(id);
    });
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

    sessionStore.setIdleTimer(id, SESSION_IDLE_TIMEOUT_MS, () => {
      const cur = sessionStore.get(id);
      cur?.abort?.abort();
      if (cur?.res) {
        safeSSEvent(cur.res, "expired", { reason: "idle_timeout" });
        cur.res.end?.();
      }
      checkpointer.deleteThread(id);
      sessionStore.delete(id);
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
      sessionStore.delete(id);
      checkpointer.deleteThread(id);
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
      // 요청이 시작될 때는 타임아웃을 일시 해제하여 스트리밍 중 만료를 방지
      sessionStore.clearIdleTimer(sessionId);
      safeSSEvent(s.res, "start", {});

      let fullResponse = "";
      let fullReasoning = "";
      let reasoningTokens = 0;
      let reasoningBuffer = "";

      // 스트림 이벤트로 에이전트 호출. 응답 버전은 v2.
      const eventStream = agent.streamEvents(
        {
          messages: [
            new HumanMessage(
              message + `(DBTools : ${isDBAllowed ? "Allowed" : "Prohibited"})`
            ),
          ],
        },
        {
          version: "v2",
          signal: s.abort?.signal,
          configurable: { thread_id: sessionId, systemContext, isDBAllowed },
        }
      );

      for await (const event of eventStream as AsyncIterable<unknown>) {
        // 툴 관련 이벤트 로깅(바인딩/호출 가시화) + SSE 브로드캐스트
        if (isToolStartEvent(event)) {
          const { name, data } = event;
          const input = data?.input;
          safeSSEvent(s.res, "tool_start", { name, input });
          continue;
        }
        if (isToolEndEvent(event)) {
          const { name } = event;
          safeSSEvent(s.res, "tool_end", { name });
          continue;
        }

        // 채팅 응답 이벤트
        if (isChatStreamEvent(event)) {
          const chunk = event.data?.chunk;
          if (!chunk) continue;

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
              } else {
                console.log("on_chat_model_stream");
              }
            }
          }

          // gpt-5 계열의 reasoning 요약이 담기는 부분
          const kw = isObject(chunk.additional_kwargs)
            ? (chunk.additional_kwargs as Record<string, unknown>)
            : undefined;
          const reasoning = kw?.reasoning as
            | { summary?: Array<{ type?: string; text?: string }> }
            | undefined;
          if (reasoning?.summary && Array.isArray(reasoning.summary)) {
            for (const part of reasoning.summary) {
              if (
                part?.type === "summary_text" &&
                typeof part?.text === "string" &&
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
          const output = event.data?.output;
          const md =
            (output?.response_metadata as
              | Record<string, unknown>
              | undefined) ||
            (output?.additional_kwargs as Record<string, unknown> | undefined);

          if (reasoningBuffer && !fullReasoning) {
            fullReasoning = reasoningBuffer;
            safeSSEvent(s.res, "reasoning_complete", {
              type: "reasoning_complete",
              summary: fullReasoning,
            });
          }

          // reasoning 요약 추출하여 완성본 재송신
          const metaSummary =
            (md &&
            Array.isArray(
              (md as { reasoning_summary?: unknown }).reasoning_summary
            )
              ? (md as { reasoning_summary?: Array<{ text?: string }> })
                  .reasoning_summary
              : undefined) ||
            (md && isObject((md as { reasoning?: unknown }).reasoning)
              ? (md as { reasoning?: { summary?: Array<{ text?: string }> } })
                  .reasoning?.summary
              : undefined);
          if (!fullReasoning && Array.isArray(metaSummary)) {
            fullReasoning = metaSummary
              .map((p) => (typeof p?.text === "string" ? p.text : ""))
              .filter(Boolean)
              .join("");
            safeSSEvent(s.res, "reasoning_summary", {
              type: "reasoning_summary",
              summary: fullReasoning,
            });
          }

          const usageA =
            md && isObject((md as { usage?: unknown }).usage)
              ? (md as { usage?: { reasoning_tokens?: number } }).usage
              : undefined;
          const usageB = output?.usage_metadata as
            | { reasoning_tokens?: number }
            | undefined;
          const rt = usageA?.reasoning_tokens ?? usageB?.reasoning_tokens;
          if (typeof rt === "number") {
            reasoningTokens = rt;
          }
          continue;
        }
      }

      // 채팅 종료시 end 이벤트 발생
      safeSSEvent(s.res, "end", {
        fullResponse,
        reasoningSummary: fullReasoning || "No reasoning summary available",
        reasoningTokens,
        metadata: { model: MODEL_NAME, reasoningEffort: "high" },
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
      if (sessionStore.has(sessionId)) {
        sessionStore.setIdleTimer(sessionId, SESSION_IDLE_TIMEOUT_MS, () => {
          const cur = sessionStore.get(sessionId);
          cur?.abort?.abort();
          if (cur?.res) {
            safeSSEvent(cur.res, "expired", { reason: "idle_timeout" });
            cur.res.end?.();
          }
          void checkpointer.deleteThread(sessionId);
          sessionStore.delete(sessionId);
        });
      }
    }
  };

  // 세션을 유지하고 히스토리를 클리어
  clearHistory = async (req: Request, res: Response) => {
    const { sessionId } = req.body || {};
    const s = sessionId ? sessionStore.get(sessionId) : undefined;

    if (!s) {
      return res.status(400).json({ error: "invalid session" });
    }

    await s.history.clear();
    await checkpointer.deleteThread(sessionId);

    safeSSEvent(s.res, "start", {});
    safeSSEvent(s.res, "chunk", { text: "대화를 초기화했습니다." });
    safeSSEvent(s.res, "end", { fullResponse: "대화를 초기화했습니다." });

    res.json({ ok: true });
  };
}
