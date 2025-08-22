// Deprecated: useChatStreamEffect/useChatConnection을 사용하세요.
import { useCallback, useEffect, useRef } from "react";
import { useChatbotStore } from "@/stores/chatbotStore";

type UseSSEChatbotOptions = {
  apiBase?: string;
};

export function useSSEChatbot(options: UseSSEChatbotOptions = {}) {
  const apiBase = options.apiBase || import.meta.env.VITE_API_BASE_URL || "";

  const {
    messages,
    inputValue,
    isConnected,
    isLoading,
    connectionFailed,
    systemContext,
    useContext,
    isCollecting,
    isMessagePending,
    addMessage,
    updateLastMessage,
    setInputValue,
    setIsConnected,
    setIsLoading,
    setConnectionFailed,
    setIsCollecting,
    setIsMessagePending,
    clearMessages,
  } = useChatbotStore([
    "messages",
    "inputValue",
    "isConnected",
    "isLoading",
    "connectionFailed",
    "systemContext",
    "useContext",
    "isCollecting",
    "isMessagePending",
    "addMessage",
    "updateLastMessage",
    "setInputValue",
    "setIsConnected",
    "setIsLoading",
    "setConnectionFailed",
    "setIsCollecting",
    "setIsMessagePending",
    "clearMessages",
  ]);

  const sourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);

  const connect = useCallback(async () => {
    try {
      // 기존 연결 정리 (기존 useChatbot 로직과 동일)
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }

      setConnectionFailed(false);
      setIsConnected(false);

      // 세션 생성
      if (!sessionIdRef.current) {
        const r = await fetch(`${apiBase}/api/chat/session`, {
          method: "POST",
        });
        if (!r.ok) throw new Error("failed to create session");
        const j = await r.json();
        sessionIdRef.current = j.sessionId as string;
      }

      // SSE 연결
      const src = new EventSource(
        `${apiBase}/api/chat/stream?sessionId=${sessionIdRef.current}`
      );
      sourceRef.current = src;

      src.addEventListener("open", () => {
        clearMessages();
        setIsConnected(true);
        setConnectionFailed(false);
      });

      src.addEventListener("start", () => {
        setIsLoading(true);
        const id = `${Date.now()}`;
        streamingMsgIdRef.current = id;
        addMessage({
          id,
          text: "",
          isUser: false,
          timestamp: new Date(),
          isStreaming: true,
          isThinking: false,
          reasoningText: "",
        });
      });

      src.addEventListener("chunk", (evt) => {
        const data = (evt as MessageEvent).data;
        try {
          const parsed = JSON.parse(data);
          const text: string = parsed.text ?? "";
          if (!text) return;
          updateLastMessage((m) => ({ ...m, text: m.text + text }));
        } catch {
          // ignore
        }
      });

      // tool_start 이벤트 수신
      src.addEventListener("tool_start", (evt) => {
        try {
          const parsed = JSON.parse((evt as MessageEvent).data);
          const name = parsed.name as string;
          const input = parsed.input;
          updateLastMessage((m) => ({
            ...m,
            toolEvents: [
              ...(m.toolEvents ?? []),
              { type: "start", name, input, at: new Date().toISOString() },
            ],
          }));
        } catch (err) {
          console.error("tool_start parse error", err);
        }
      });

      // tool_end 이벤트 수신
      src.addEventListener("tool_end", (evt) => {
        try {
          const parsed = JSON.parse((evt as MessageEvent).data);
          const name = parsed.name as string;
          updateLastMessage((m) => ({
            ...m,
            toolEvents: [
              ...(m.toolEvents ?? []),
              { type: "end", name, at: new Date().toISOString() },
            ],
          }));
        } catch (err) {
          console.error("tool_end parse error", err);
        }
      });

      // reasoning 토큰 조각 수신
      src.addEventListener("reasoning", (evt) => {
        const data = (evt as MessageEvent).data;
        try {
          const parsed = JSON.parse(data);
          const text: string = parsed.text ?? "";
          const thinking = Boolean(parsed.isThinking);
          if (!text && !thinking) return;
          updateLastMessage((m) => ({
            ...m,
            reasoningText: (m.reasoningText || "") + (text || ""),
            isThinking: thinking || m.isThinking,
          }));
        } catch {
          // ignore
        }
      });

      // reasoning 최종 요약 수신 (두 이벤트 모두 처리)
      const handleReasoningSummary = (evt: Event) => {
        const data = (evt as MessageEvent).data;
        try {
          const parsed = JSON.parse(data);
          const summary: string = parsed.summary ?? "";
          updateLastMessage((m) => ({
            ...m,
            reasoningText: summary || m.reasoningText,
            isThinking: false,
          }));
        } catch {
          // ignore
        }
      };
      src.addEventListener("reasoning_complete", handleReasoningSummary);
      src.addEventListener("reasoning_summary", handleReasoningSummary);

      src.addEventListener("end", () => {
        setIsLoading(false);
        updateLastMessage((m) => ({
          ...m,
          isStreaming: false,
          isThinking: false,
        }));
        streamingMsgIdRef.current = null;
      });

      src.addEventListener("error", () => {
        setConnectionFailed(true);
        setIsConnected(false);
      });
    } catch {
      setConnectionFailed(true);
      setIsConnected(false);
    }
  }, [
    addMessage,
    apiBase,
    updateLastMessage,
    setIsConnected,
    setConnectionFailed,
    setIsLoading,
    clearMessages,
  ]);

  const sendMessage = useCallback(async () => {
    if (
      !inputValue.trim() ||
      !sessionIdRef.current ||
      isLoading ||
      isMessagePending
    )
      return;

    addMessage({
      id: `${Date.now()}`,
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    });

    if (useContext) {
      // 컨텍스트 수집 모드
      setIsMessagePending(true);
      setIsCollecting(true);
    } else {
      // 바로 전송
      const messageToSend = inputValue;
      setInputValue("");
      await fetch(`${apiBase}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: messageToSend,
        }),
      });
    }
  }, [
    addMessage,
    apiBase,
    inputValue,
    isLoading,
    isMessagePending,
    useContext,
    setIsMessagePending,
    setIsCollecting,
    setInputValue,
  ]);

  // 컨텍스트 수집 완료 시 메시지 전송 (기존 useChatbot 로직과 동일)
  useEffect(() => {
    if (isCollecting && !isMessagePending) {
      const timeout = setTimeout(() => {
        const sendWithContext = async () => {
          const messageToSend = inputValue;
          await fetch(`${apiBase}/api/chat/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              message: messageToSend,
              systemContext: systemContext,
            }),
          });
        };
        sendWithContext();
        setIsCollecting(false);
        setInputValue("");
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [
    inputValue,
    isCollecting,
    isMessagePending,
    setInputValue,
    setIsCollecting,
    systemContext,
    apiBase,
  ]);

  const clearConversation = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      const r = await fetch(`${apiBase}/api/chat/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      });
      // 세션이 유효하지 않으면(400) 로컬도 초기화하고 세션 리셋
      if (!r.ok) {
        sessionIdRef.current = null;
      }
      clearMessages();
    } catch {
      // 네트워크 오류 시에도 로컬 초기화 및 세션 리셋
      sessionIdRef.current = null;
      clearMessages();
    }
  }, [apiBase, clearMessages]);

  const retryConnection = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    // 기존 세션이 서버에 없을 수 있으므로 세션을 재발급하도록 리셋
    sessionIdRef.current = null;
    clearMessages();
    connect();
  }, [connect, clearMessages]);

  useEffect(() => {
    connect();
    return () => sourceRef.current?.close();
  }, [connect]);

  return {
    messages,
    inputValue,
    isConnected,
    isLoading,
    connectionFailed,
    setInputValue,
    sendMessage,
    clearConversation,
    retryConnection,
  };
}
