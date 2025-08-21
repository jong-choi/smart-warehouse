import React from "react";
import { cn } from "@/lib/utils";
import { type Message } from "@/types/chatbot";

interface MessageItemBubbleProps {
  message: Message;
  children: React.ReactNode;
}

export const MessageItemBubble: React.FC<MessageItemBubbleProps> = ({
  message,
  children,
}) => {
  return (
    <div
      className={cn(
        "max-w-[200px] px-3 py-2 rounded-lg shadow-sm",
        message.isUser
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "bg-white/90 text-sidebar-foreground"
      )}
    >
      {children}
    </div>
  );
};
