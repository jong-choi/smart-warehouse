import express, { type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";

// GPT-5 nano 모델 사용
const MODEL_NAME = "gpt-5-nano-2025-08-07";

// GPT-5용 LLM 설정
export const createLLMModel = () => {
  return new ChatOpenAI({
    model: MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    streaming: true,
    useResponsesApi: true, // LangChain이 Responses API 경로 사용
    reasoning: { effort: "high", summary: "auto" }, // 요약 생성 요청
    // 사용량을 스트림에 포함 (필요 시)
    streamUsage: true, // JS OpenAI 입력 타입에 존재
  });
};

const SYSTEM_PROMPT = `당신은 물류 관리 시스템을 위한 전문 챗봇입니다. 항상 한국어로 친절하고 정확하게 답변해주세요.`;

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

  req.on("close", () => {
    clearInterval(ping);
    s.abort?.abort();
    s.res = undefined;
  });
});

// 대화 전송 - 수정된 버전
router.post("/send", async (req: Request, res: Response) => {
  const { sessionId, message, systemContext } = req.body || {};

  if (!sessionId || typeof message !== "string") {
    return res.status(400).json({ error: "invalid payload" });
  }

  const s = sessions.get(sessionId);
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

    if (systemContext) {
      await s.history.deleteMessages(
        (m: BaseMessage) => m.getType() === "system"
      );
      const sys = new SystemMessage({
        content: `화면 정보 기반으로 답변하세요. 항상 한국어로 답변합니다.\nuser message: ${message}\nscreen context: ${systemContext}`,
      });
      await s.history.addMessage(sys);
    }

    // 스트리밍 시작
    s.res.write(`event: start\ndata: {}\n\n`);

    let fullResponse = "";
    let fullReasoning = "";
    let reasoningTokens = 0;
    let reasoningBuffer = ""; // reasoning 텍스트 버퍼

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
        const chunk = event?.data?.chunk;

        if (!chunk) continue;

        // 1) 평문 델타(string)
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

        // 2) 콘텐츠 블록 델타(array)
        if (Array.isArray(chunk.content)) {
          for (const block of chunk.content) {
            // 본문 텍스트 조각
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

        // 3) additional_kwargs.reasoning.summary 델타 처리
        const reasoningKw = chunk?.additional_kwargs?.reasoning;
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

      // 모델 종료 이벤트에서 메타데이터 추출
      if (event?.event === "on_chat_model_end") {
        const output = event?.data?.output;
        const md = output?.response_metadata || output?.additional_kwargs;

        // 스트리밍 중 수집한 reasoning이 있으면 완료 이벤트 전송 (중복방지)
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

        // 메타데이터에 reasoning summary가 별도로 담기는 케이스 보완
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

        // 토큰 사용량
        const usage = md?.usage || output?.usage_metadata;
        if (usage && typeof usage?.reasoning_tokens === "number") {
          reasoningTokens = usage.reasoning_tokens;
        }
      }
    }

    // 최종 응답 전송
    s.res.write(`event: end\n`);
    s.res.write(
      `data: ${JSON.stringify({
        fullResponse: fullResponse,
        reasoningSummary: fullReasoning || "No reasoning summary available",
        reasoningTokens: reasoningTokens,
        metadata: {
          model: MODEL_NAME,
          reasoningEffort: "high",
        },
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

    return res.status(500).json({
      error: "failed to generate",
      details: e?.message,
    });
  }
});

// 히스토리 초기화
router.post("/clear", async (req: Request, res: Response) => {
  const { sessionId } = req.body || {};
  const s = sessionId ? sessions.get(sessionId) : undefined;

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
      `data: ${JSON.stringify({ fullResponse: "대화를 초기화했습니다." })}\n\n`
  );

  res.json({ ok: true });
});

export default router;

// (불필요한 툴/임포트 제거)
