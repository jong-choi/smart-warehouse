// 웹소켓과 랭체인을 사용한 서비스입니다.
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Ollama } from "ollama";
import { ChatOllama } from "@langchain/ollama";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";

const MODEL_NAME_MAP = {
  hyperclova05:
    "hf.co/mradermacher/HyperCLOVAX-SEED-Text-Instruct-0.5B-hf-i1-GGUF:Q4_K_M",
  hyperclova15:
    "hf.co/mradermacher/HyperCLOVAX-SEED-Text-Instruct-1.5B-hf-i1-GGUF:Q4_K_M",
  hyperclova30:
    "hf.co/cherryDavid/HyperCLOVA-X-SEED-Vision-Instruct-3B-Llamafied-Q4_K_M-GGUF:Q4_K_M",
  qwen306: "qwen3:0.6b",
  exaone3524b: "exaone3.5:2.4b",
  qwen317b: "qwen3:1.7b",
};

// Ollama 모델 설정
const MODEL_NAME = MODEL_NAME_MAP.qwen306;

const createUserMessage = ({
  message,
  systemContext,
}: {
  message: string;
  systemContext: string;
}) => {
  return `
The user is viewing a screen and has provided the current visible information. Based on this screen context, give a detailed and context-aware response that explains or helps the user. 
Give a detailed and precise response. Be especially careful not to make mistakes in names, places, or any proper nouns.
Always respond only in Korean. Never use Chinese. Never use Chinese. Never use Chinese.
user message : ${message} 
this screen context : ${systemContext}`;
};

export const fetchWithSecretKey = (
  url: Request | string | URL,
  options: RequestInit | undefined = {}
) => {
  options.headers = {
    ...options.headers,
    "LLM-SECRET-KEY": process.env.LLM_SECRET_KEY!,
  };
  return fetch(url, options);
};

// 모델이 설치되어 있는지 확인하는 함수
export async function ensureModelExists(modelName: string) {
  try {
    const ollama = new Ollama({
      host: `${process.env.ORACLE_OLLAMA_HOST}`,
      fetch: fetchWithSecretKey,
    });
    const models = await ollama.list();
    const modelExists = models.models.some(
      (model: { name: string }) => model.name === modelName
    );

    if (!modelExists) {
      await ollama.pull({ model: modelName });
    }
  } catch (error) {
    console.error("모델 확인/다운로드 중 에러:", error);
    throw new Error("모델을 준비할 수 없습니다.");
  }
}
// 연결별 함수들을 connection 핸들러 안으로 이동
export const createLLMModel = () => {
  return new ChatOllama({
    model: MODEL_NAME,
    baseUrl: process.env.ORACLE_OLLAMA_HOST,
    fetch: fetchWithSecretKey,
    streaming: true,
  });
};

const SYSTEM_PROMPT = `당신은 물류 관리 시스템을 위한 전문 챗봇입니다. 항상 한국어로 친절하고 정확하게 답변해주세요. 물류, 운송, 창고 관리, 배송 등과 관련하여 특히 전문적이고 실용적인 면모를 발휘해주세요.`;

export const setupChatbotSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        process.env.CORS_ORIGIN || "http://localhost:3000",
        "http://localhost:5173", // Vite 개발 서버
        "http://localhost:4173", // Vite 프리뷰 서버
        "http://localhost:3050", // 팩토리 도커
        "https://factory.jongchoi.com", // 프로덕션 도메인
        "http://factory.jongchoi.com", // HTTP 프로덕션 도메인
        "https://smartfactory.jongchoi.com", // 스마트팩토리 도메인
        "http://smartfactory.jongchoi.com", // HTTP 스마트팩토리 도메인
        "https://warehouse.jongchoi.com", // 창고 도메인
        "http://warehouse.jongchoi.com", // HTTP 창고 도메인
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // 서버 시작 시 한 번만 모델 확인
  let modelChecked = false;

  io.on("connection", (socket) => {
    // 모델 확인을 한 번만 실행
    if (!modelChecked) {
      ensureModelExists(MODEL_NAME)
        .then(() => {
          modelChecked = true;
        })
        .catch((error) => {
          console.error("모델 확인 실패:", error);
        });
    }

    // ChatPromptTemplate 생성
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);

    // RunnableWithMessageHistory 체인 생성
    const createChatChain = () => {
      const llm = createLLMModel();
      return prompt.pipe(llm);
    };

    // 초기 인사 메시지 전송 함수
    const sendWelcomeMessage = async (socket: any) => {
      const welcomeMessage =
        "안녕하세요! 스마트 창고 챗봇입니다. 무엇을 도와드릴까요?";

      // 초기 인사 메시지 전송
      socket.emit("bot_response_start", {
        timestamp: new Date().toISOString(),
        type: "bot_response_start",
      });

      // 메시지 즉시 전송
      socket.emit("bot_response_chunk", {
        chunk: welcomeMessage,
        timestamp: new Date().toISOString(),
        type: "bot_response_chunk",
      });

      // 초기 메시지 완료 신호
      socket.emit("bot_response_end", {
        fullResponse: welcomeMessage,
        timestamp: new Date().toISOString(),
        type: "bot_response_end",
      });
    };

    // 이 소켓 연결만 사용하는 히스토리 인스턴스
    const chatMessageHistoryWithDeletion = new ChatMessageHistoryWithDeletion();

    // 이 소켓 전용 RunnableWithMessageHistory 생성
    const chatChain = new RunnableWithMessageHistory({
      runnable: createChatChain(),
      getMessageHistory: async () => chatMessageHistoryWithDeletion,
      inputMessagesKey: "input",
      historyMessagesKey: "history",
    });

    // 연결 시 초기 인사 메시지 전송
    sendWelcomeMessage(socket).catch((error) => {
      console.error("초기 메시지 전송 중 에러:", error);
    });

    // 사용자 메시지 수신 및 LLM 응답
    socket.on(
      "chat_message",
      async (data: {
        message: string;
        userId?: string;
        systemContext?: string;
      }) => {
        const userId = data.userId || socket.id;

        try {
          // 스트리밍 응답 시작
          socket.emit("bot_response_start", {
            timestamp: new Date().toISOString(),
            type: "bot_response_start",
          });

          let fullResponse = "";
          if (data.systemContext) {
            await chatMessageHistoryWithDeletion.deleteMessages(
              (message: BaseMessage) => {
                const messageType = message.getType();
                return messageType === "system";
              }
            );
            const systemMessage = createUserMessage({
              message: data.message,
              systemContext: data.systemContext,
            });
            await chatMessageHistoryWithDeletion.addMessage(
              new SystemMessage({
                content: systemMessage,
              })
            );
          }

          // RunnableWithMessageHistory의 stream 사용
          const stream = await chatChain.stream(
            { input: data.message },
            { configurable: { sessionId: userId } }
          );

          for await (const chunk of stream) {
            // chunk에서 content 추출
            let content = "";

            if (chunk && typeof chunk === "object") {
              // AIMessage 형태로 응답이 오는 경우
              if (chunk.content) {
                content =
                  typeof chunk.content === "string"
                    ? chunk.content
                    : JSON.stringify(chunk.content);
              }
              // 직접 문자열인 경우
              else if (typeof chunk === "string") {
                content = chunk;
              }
            }

            // content가 있으면 즉시 전송
            if (content) {
              fullResponse += content;
              socket.emit("bot_response_chunk", {
                chunk: content,
                timestamp: new Date().toISOString(),
                type: "bot_response_chunk",
              });
            }
          }

          // 스트리밍 완료 신호
          socket.emit("bot_response_end", {
            fullResponse,
            timestamp: new Date().toISOString(),
            type: "bot_response_end",
          });

          // 메시지 히스토리 처리 완료
        } catch (error) {
          console.error("LLM 응답 생성 중 에러:", error);

          // 에러 응답 전송
          socket.emit("bot_response_error", {
            error: "응답을 생성하는 중 오류가 발생했습니다.",
            timestamp: new Date().toISOString(),
            type: "bot_response_error",
          });
        }
      }
    );

    // 대화 기록 초기화
    socket.on("clear_conversation", (data: { userId?: string }) => {
      const userId = data.userId || socket.id;

      // 이 소켓의 메시지 히스토리 초기화
      chatMessageHistoryWithDeletion.clear();

      socket.emit("conversation_cleared", {
        timestamp: new Date().toISOString(),
        type: "conversation_cleared",
      });
    });

    // 초기 인사 메시지 요청 처리
    socket.on("request_welcome_message", async (data: { userId?: string }) => {
      const userId = data.userId || socket.id;
      try {
        await sendWelcomeMessage(socket);
      } catch (error) {
        console.error("초기 메시지 요청 처리 중 에러:", error);
      }
    });

    // 연결 해제
    socket.on("disconnect", () => {
      // 연결 해제 처리
    });

    // 연결 상태 확인
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() });
    });
  });

  return io;
};
