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
    setSessionId,
    reconnectTrigger,
  } = useChatConnectionStore([
    "setIsConnected",
    "setIsLoading",
    "setConnectionFailed",
    "setSessionId",
    "reconnectTrigger",
  ]);

  const sourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    sessionIdRef.current = null;

    const connect = async () => {
      try {
        if (sourceRef.current) {
          sourceRef.current.close();
          sourceRef.current = null;
        }

        setConnectionFailed(false);
        setIsConnected(false);
        setSessionId(null);

        let sid = sessionIdRef.current;
        if (!sid) {
          const r = await fetch(`${apiBase}/api/chat/session`, {
            method: "POST",
          });
          if (!r.ok) throw new Error("failed to create session");
          const j = await r.json();
          sid = j.sessionId as string;
          sessionIdRef.current = sid;
          setSessionId(sid);
        }
        if (cancelled) return;

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
          } catch (e) {
            console.log(e);
            /* ignore */
          }
        });

        // tool_start 이벤트 수신
        src.addEventListener("tool_start", (evt) => {
          try {
            const parsed = JSON.parse((evt as MessageEvent).data) as {
              name: string;
              input?: unknown;
            };
            console.log("[tool-start]", parsed.name, parsed.input);
            updateLastMessage((m) => ({
              ...m,
              toolEvents: [
                ...(m.toolEvents ?? []),
                {
                  type: "start",
                  name: parsed.name,
                  input: parsed.input,
                  at: new Date().toISOString(),
                },
              ],
            }));
          } catch (e) {
            console.log(e);
            /* ignore */
          }
        });

        // tool_end 이벤트 수신
        src.addEventListener("tool_end", (evt) => {
          try {
            const parsed = JSON.parse((evt as MessageEvent).data) as {
              name: string;
            };
            console.log("[tool-end]", parsed.name);
            updateLastMessage((m) => ({
              ...m,
              toolEvents: [
                ...(m.toolEvents ?? []),
                {
                  type: "end",
                  name: parsed.name,
                  at: new Date().toISOString(),
                },
              ],
            }));
          } catch (e) {
            console.log(e);
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
          } catch (e) {
            console.log(e);
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
          } catch (e) {
            console.log(e);
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
          setSessionId(null);
          sessionIdRef.current = null;
        });
      } catch {
        sessionIdRef.current = null;
        setSessionId(null);
        setConnectionFailed(true);
        setIsConnected(false);
      }
    };

    connect();
    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [
    apiBase,
    clearMessages,
    setConnectionFailed,
    setIsConnected,
    setIsLoading,
    setSessionId,
    addMessage,
    updateLastMessage,
    reconnectTrigger,
  ]);
}
