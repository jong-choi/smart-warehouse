import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useChatConnection } from "@/hooks/useChatConnection";
import { useChatMessagesStore } from "@/stores/chatMessagesStore";
import { useChatConnectionStore } from "@/stores/chatConnectionStore";
import { useChatUiStore } from "@/stores/chatUiStore";

export const ChatbotInput: React.FC = () => {
  const { isLoading } = useChatConnection();
  const addMessage = useChatMessagesStore((s) => s.addMessage);
  const { sessionId } = useChatConnectionStore(["sessionId"]);
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const { useContext, setIsCollecting, setIsMessagePending, isDBAllowed } =
    useChatUiStore([
      "useContext",
      "setIsCollecting",
      "setIsMessagePending",
      "isDBAllowed",
    ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isValue, setIsValue] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || isLoading || !sessionId) return;

    addMessage({
      id: `${Date.now()}`,
      text: value,
      isUser: true,
      timestamp: new Date(),
    });

    if (useContext) {
      setIsMessagePending(true);
      setIsCollecting(true);
    } else {
      fetch(`${apiBase}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: value, isDBAllowed }),
      });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setIsValue(false);
    }
  };

  // 마지막 사용자 메시지 텍스트 추출
  const { isCollecting, isMessagePending, systemContext } = useChatUiStore([
    "isCollecting",
    "isMessagePending",
    "systemContext",
  ]);

  // 컨텍스트 수집 완료 후 실제 전송
  useEffect(() => {
    if (!isCollecting || isMessagePending) return;
    const timeout = setTimeout(() => {
      const sid = sessionId;
      if (!sid) {
        setIsCollecting(false);
        return;
      }
      fetch(`${apiBase}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          message: inputRef.current?.value || "",
          isDBAllowed,
          systemContext,
        }),
      });
      setIsCollecting(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setIsValue(false);
    }, 0);
    return () => clearTimeout(timeout);
  }, [
    apiBase,
    isCollecting,
    isMessagePending,
    setIsCollecting,
    systemContext,
    sessionId,
    isDBAllowed,
  ]);

  return (
    <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/50  rounded-b-lg min-h-[60px]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          onChange={(e) => {
            const value = e.currentTarget?.value.trim();
            setIsValue(!!value);
            if (inputRef.current && value.length > 100) {
              inputRef.current.value = value.slice(0, 100);
            }
          }}
          maxLength={100}
          placeholder="메시지..."
          className="flex-1 border-sidebar-border focus:border-sidebar-primary text-xs h-8 bg-sidebar text-sidebar-foreground rounded-md"
        />
        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 bg-sidebar-primary disabled:bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground rounded-md"
          disabled={!isValue || isLoading}
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
};
