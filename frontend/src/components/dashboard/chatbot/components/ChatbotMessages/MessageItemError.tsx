import React from "react";
import { type Message } from "@/types/chatbot";
import { Button } from "@components/ui/button";
import { RotateCcw } from "lucide-react";

interface MessageItemErrorProps {
  message: Message;
  onClearConversation?: () => void;
}

export const MessageItemError: React.FC<MessageItemErrorProps> = ({
  message,
  onClearConversation,
}) => {
  const isError = !message.isUser && message.text.startsWith("오류:");
  if (!isError || !onClearConversation) return null;

  return (
    <Button
      onClick={onClearConversation}
      variant="ghost"
      size="sm"
      className="h-6 px-2 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs ml-2 self-center whitespace-pre"
      title="대화 기록 초기화"
    >
      <RotateCcw className="h-3 w-3 mr-1" />
      대화 초기화
    </Button>
  );
};
