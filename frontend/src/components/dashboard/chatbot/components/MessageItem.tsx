import React from "react";
import { cn } from "@/lib/utils";
import { type Message } from "@/types/chatbot";
import { MessageItemBubble } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemBubble";
import { MessageItemContent } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemContent";
import { MessageItemReasoning } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemReasoning";
import { MessageItemTimestamp } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemTimestamp";
import { MessageItemError } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemError";
import { MessageItemStatus } from "@components/dashboard/chatbot/components/ChatbotMessages/MessageItemStatus";

interface MessageItemProps {
  message: Message;
  onClearConversation?: () => void;
}

export const MessageItem = React.memo<MessageItemProps>(
  ({ message, onClearConversation }) => {
    return (
      <div
        data-message-id={message.id}
        className={cn("flex", message.isUser ? "justify-end" : "justify-start")}
      >
        <MessageItemBubble message={message}>
          <div className="text-xs whitespace-pre-wrap">
            {/* 로딩/생각/컨텍스트 상태 */}
            <MessageItemReasoning message={message} />

            {/* 본문 */}
            <div>
              <MessageItemContent message={message} />
            </div>
          </div>
          {/* 타임스탬프 */}
          <MessageItemTimestamp message={message} />
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
