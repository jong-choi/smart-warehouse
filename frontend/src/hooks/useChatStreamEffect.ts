import { useEffect, useRef } from "react";
import { useChatMessagesStore } from "@/stores/chatMessagesStore";
import { useChatConnectionStore } from "@/stores/chatConnectionStore";

type Options = { apiBase?: string };

export function useChatStreamEffect(options: Options = {}) {
  const apiBase = options.apiBase || import.meta.env.VITE_API_BASE_URL || "";

  const addMessage = useChatMessagesStore((s) => s.addMessage);
  const updateLastMessage = useChatMessagesStore((s) => s.updateLastMessage);
  const clearMessages = useChatMessagesStore((s) => s.clearMessages);

  const {
    setIsConnected,
    setIsLoading,
    setConnectionFailed,
    sessionId,
    setSessionId,
    reconnectNonce,
  } = useChatConnectionStore([
    "setIsConnected",
    "setIsLoading",
    "setConnectionFailed",
    "sessionId",
    "setSessionId",
    "reconnectNonce",
  ]);

  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let aborted = false;

    const connect = async () => {
      try {
        if (sourceRef.current) {
          sourceRef.current.close();
          sourceRef.current = null;
        }

        setConnectionFailed(false);
        setIsConnected(false);

        let sid = sessionId;
        if (!sid) {
          const r = await fetch(`${apiBase}/api/chat/session`, {
            method: "POST",
          });
          if (!r.ok) throw new Error("failed to create session");
          const j = await r.json();
          sid = j.sessionId as string;
          setSessionId(sid);
        }
        if (aborted) return;

        const src = new EventSource(
          `${apiBase}/api/chat/stream?sessionId=${sid}`
        );
        sourceRef.current = src;

        src.addEventListener("open", () => {
          clearMessages();
          setIsConnected(true);
          setConnectionFailed(false);
        });

        src.addEventListener("start", () => {
          setIsLoading(true);
          addMessage({
            id: `${Date.now()}`,
            text: "",
            isUser: false,
            timestamp: new Date(),
            isStreaming: true,
            isThinking: false,
            reasoningText: "",
          });
        });

        src.addEventListener("chunk", (evt) => {
          try {
            const parsed = JSON.parse((evt as MessageEvent).data);
            const text: string = parsed.text ?? "";
            if (!text) return;
            updateLastMessage((m) => ({ ...m, text: (m.text || "") + text }));
          } catch {
            /* ignore */
          }
        });

        src.addEventListener("reasoning", (evt) => {
          try {
            const parsed = JSON.parse((evt as MessageEvent).data);
            const text: string = parsed.text ?? "";
            const thinking = Boolean(parsed.isThinking);
            if (!text && !thinking) return;
            updateLastMessage((m) => ({
              ...m,
              reasoningText: (m.reasoningText || "") + (text || ""),
              isThinking: thinking || m.isThinking,
            }));
          } catch {
            /* ignore */
          }
        });

        const handleReasoningSummary = (evt: Event) => {
          try {
            const parsed = JSON.parse((evt as MessageEvent).data);
            const summary: string = parsed.summary ?? "";
            updateLastMessage((m) => ({
              ...m,
              reasoningText: summary || m.reasoningText,
              isThinking: false,
            }));
          } catch {
            /* ignore */
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
        });

        src.addEventListener("error", () => {
          setConnectionFailed(true);
          setIsConnected(false);
        });
      } catch {
        setConnectionFailed(true);
        setIsConnected(false);
      }
    };

    connect();
    return () => {
      aborted = true;
      sourceRef.current?.close();
    };
  }, [
    apiBase,
    clearMessages,
    reconnectNonce,
    sessionId,
    setConnectionFailed,
    setIsConnected,
    setIsLoading,
    setSessionId,
    addMessage,
    updateLastMessage,
  ]);
}
