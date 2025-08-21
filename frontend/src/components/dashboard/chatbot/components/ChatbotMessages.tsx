import React, { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { MessageItem } from "@components/dashboard/chatbot/components/MessageItem";
import { useChatMessagesStore } from "@/stores/chatMessagesStore";
import { useChatConnection } from "@/hooks/useChatConnection";
import { cn } from "@/lib/utils";

export const ChatbotMessages: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIds = useChatMessagesStore((s) => s.messageIds);
  const { connectionFailed } = useChatConnection();

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageIds]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-sidebar/50 min-h-0">
      {messageIds.length === 0 ? (
        <div className="flex items-center justify-center my-auto">
          <div className="text-center text-sidebar-foreground/60">
            <Bot
              className={cn(
                "h-8 w-8 mx-auto mb-2 opacity-50 text-yellow-500",
                connectionFailed && "text-red-500"
              )}
            />
            <p className="text-xs">
              {connectionFailed ? "연결 실패" : "챗봇에 연결 중..."}
            </p>
          </div>
        </div>
      ) : (
        messageIds.map((id) => <MessageItem key={id} id={id} />)
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
