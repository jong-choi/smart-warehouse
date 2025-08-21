import { useCallback, useEffect, useRef, useState } from "react";

export type StreamMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  // 모델의 reasoning 요약 스트림 표시용
  reasoningText?: string;
  isThinking?: boolean;
};

type UseSSEChatbotOptions = {
  apiBase?: string;
};

function useSSEChatbot(options: UseSSEChatbotOptions = {}) {
  const apiBase = options.apiBase || import.meta.env.VITE_API_BASE_URL || "";

  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);

  const sourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);

  const addMessage = useCallback((msg: StreamMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateLastMessage = useCallback(
    (updater: (m: StreamMessage) => StreamMessage) => {
      setMessages((prev) =>
        prev.length === 0
          ? prev
          : [...prev.slice(0, -1), updater(prev[prev.length - 1])]
      );
    },
    []
  );

  const connect = useCallback(async () => {
    try {
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
  }, [addMessage, apiBase, updateLastMessage]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !sessionIdRef.current || isLoading) return;
    addMessage({
      id: `${Date.now()}`,
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    });
    setInputValue("");
    await fetch(`${apiBase}/api/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        message: inputValue,
      }),
    });
  }, [addMessage, apiBase, inputValue, isLoading]);

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
      setMessages([]);
    } catch {
      // 네트워크 오류 시에도 로컬 초기화 및 세션 리셋
      sessionIdRef.current = null;
      setMessages([]);
    }
  }, [apiBase]);

  const retryConnection = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    // 기존 세션이 서버에 없을 수 있으므로 세션을 재발급하도록 리셋
    sessionIdRef.current = null;
    connect();
  }, [connect]);

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

export default useSSEChatbot;
