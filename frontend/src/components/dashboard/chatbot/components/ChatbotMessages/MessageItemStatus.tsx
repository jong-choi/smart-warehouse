import React, { useMemo } from "react";
import { type Message } from "@/types/chatbot";
import { useChatConnection } from "@/hooks/useChatConnection";
import { useChatUiStore } from "@/stores/chatUiStore";

interface MessageItemStatusProps {
  message: Message;
}

export const MessageItemStatus: React.FC<MessageItemStatusProps> = ({
  message,
}) => {
  const { isLoading } = useChatConnection();
  const { systemContext, useContext } = useChatUiStore([
    "systemContext",
    "useContext",
  ]);

  const { shouldShowLoading, displayText } = useMemo(() => {
    const isUsingSSEMode = message.reasoningText !== undefined;
    const text = message.text ?? "";

    let regularChunks = "";
    if (isUsingSSEMode) {
      regularChunks = text;
    } else {
      const thinkEndIndex = text.indexOf("</think>");
      if (thinkEndIndex >= 0) {
        regularChunks = text.slice(thinkEndIndex + 8).trim();
      } else {
        const thinkStartIndex = text.indexOf("<think>");
        if (thinkStartIndex >= 0) {
          regularChunks = "";
        } else {
          regularChunks = text;
        }
      }
    }

    const loading = !regularChunks && !message.isUser && isLoading;

    const label = isUsingSSEMode
      ? message.isThinking
        ? "생각하는 중"
        : useContext && systemContext
        ? "화면을 살펴보는 중"
        : "준비중"
      : text.includes("<think>") && !text.includes("</think>")
      ? "생각하는 중"
      : useContext && systemContext
      ? "화면을 살펴보는 중"
      : "준비중";

    return { shouldShowLoading: loading, displayText: label };
  }, [
    isLoading,
    message.isThinking,
    message.isUser,
    message.reasoningText,
    message.text,
    systemContext,
    useContext,
  ]);

  if (!shouldShowLoading) return null;

  return (
    <span className="inline-block ml-1 text-xs mt-auto text-sidebar-muted-foreground/60 animate-pulse">
      {displayText}
    </span>
  );
};
