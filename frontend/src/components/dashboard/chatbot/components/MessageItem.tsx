import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  useChatMessagesStore,
  selectMessageById,
} from "@/stores/chatMessagesStore";
import { MessageItemBubble } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemBubble";
import { MessageItemContent } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemContent";
import { MessageItemReasoning } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemReasoning";
import { MessageItemTimestamp } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemTimestamp";
import { MessageItemError } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemError";
import { MessageItemStatus } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemStatus";
import { useChatConnection } from "@hooks/useChatConnection";

interface MessageItemProps {
  id: string;
  onClearConversation?: () => void;
}

export const MessageItem = React.memo<MessageItemProps>(
  ({ id, onClearConversation }) => {
    const { isLoading } = useChatConnection();
    const message = useChatMessagesStore(selectMessageById(id));
    const messageRef = useRef<HTMLDivElement>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<ResizeObserver>(null);

    // 메시지의 높이가 변경될 때 가장 아래로 스크롤
    useEffect(() => {
      const content = messageRef.current;
      if (!content || !messageRef.current) return;

      observerRef.current = new ResizeObserver(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "instant" });
      });
      observerRef.current.observe(content);
      return () => observerRef.current?.disconnect();
    }, []);

    useEffect(() => {
      if (!isLoading) {
        observerRef.current?.disconnect();
        observerRef.current = null;
      }
    }, [isLoading]);

    if (!message) return null;
    return (
      <div
        ref={messageRef}
        data-message-id={message.id}
        className={cn("flex", message.isUser ? "justify-end" : "justify-start")}
      >
        <MessageItemBubble message={message}>
          <div className="text-xs whitespace-pre-wrap break-words">
            {/* 로딩/생각/컨텍스트 상태 */}
            <MessageItemReasoning message={message} />

            {/* 본문 */}
            <div>
              <MessageItemContent message={message} />
            </div>
          </div>
          {/* 타임스탬프 */}
          <MessageItemTimestamp message={message} />
          <div ref={messageEndRef} />
        </MessageItemBubble>

        {/* 우측 상태 및 에러 버튼 */}
        <MessageItemStatus message={message} />
        <MessageItemError
          message={message}
          onClearConversation={onClearConversation}
        />
      </div>
    );
  }
);

MessageItem.displayName = "MessageItem";
