import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { type Message } from "@/types/chatbot";
import { useChatConnection } from "@/hooks/useChatConnection";
import { useChatUiStore } from "@/stores/chatUiStore";
import ReactMarkdown from "react-markdown";
import remarkParse from "remark-parse";

interface MessageItemReasoningProps {
  message: Message;
}

export const MessageItemReasoning: React.FC<MessageItemReasoningProps> = ({
  message,
}) => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(true);
  const [toolMessage, setToolMessage] = useState("");
  const { isLoading } = useChatConnection();
  const { systemContext, useContext } = useChatUiStore([
    "systemContext",
    "useContext",
  ]);

  const isUsingSSEMode = message.reasoningText !== undefined;

  const { thinkChunks, regularChunks } = useMemo(() => {
    const text = message.text ?? "";

    if (isUsingSSEMode) {
      return { thinkChunks: "", regularChunks: text };
    }

    const thinkStartIndex = text.indexOf("<think>");
    const thinkEndIndex = text.indexOf("</think>");

    if (thinkStartIndex >= 0 && thinkEndIndex < 0) {
      return {
        thinkChunks: text.slice(thinkStartIndex + 8),
        regularChunks: "",
      };
    }

    if (thinkStartIndex >= 0 && thinkEndIndex >= 0) {
      return {
        thinkChunks: text.slice(thinkStartIndex + 8, thinkEndIndex),
        regularChunks: text.slice(thinkEndIndex + 8).trim(),
      };
    }

    return { thinkChunks: "", regularChunks: text };
  }, [isUsingSSEMode, message.text]);

  const shouldShowLoading = !regularChunks && !message.isUser && isLoading;
  const shouldShowSystemContext = shouldShowLoading && !!systemContext;

  const systemContextLines = useMemo(
    () =>
      systemContext ? systemContext.split("\n").filter((l) => l.trim()) : [],
    [systemContext]
  );
  const [systemContextIndex, setSystemContextIndex] = useState(0);

  useEffect(() => {
    if (!shouldShowSystemContext || systemContextLines.length === 0) return;
    const interval = setInterval(() => {
      setSystemContextIndex((prev) => (prev + 1) % systemContextLines.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [shouldShowSystemContext, systemContextLines.length]);

  const hasReasoningContent =
    (isUsingSSEMode && !!message.reasoningText) ||
    (!!thinkChunks && thinkChunks.length > 0) ||
    (shouldShowSystemContext && systemContextLines.length > 0);

  const reasoningDisplayText = isUsingSSEMode
    ? message.reasoningText ||
      (useContext && systemContextLines[systemContextIndex])
    : thinkChunks || (useContext && systemContextLines[systemContextIndex]);

  // 툴 이벤트 UI/로그: 서버 콘솔과 동일하게 프론트에서도 표출
  useEffect(() => {
    if (!message.toolEvents || message.toolEvents.length === 0) return;
    const last = message.toolEvents[message.toolEvents.length - 1];
    if (last.type === "start") {
      setToolMessage(last.name + "...");
    } else if (last.type === "end") {
      setToolMessage(last.name + " 완료");
    }
  }, [message.toolEvents]);

  return (
    <>
      {shouldShowLoading && (
        <span className="ml-1 flex gap-2 items-center">
          <svg
            className="w-4 h-4 animate-spin opacity-60"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-muted-foreground/30">{toolMessage}</span>
        </span>
      )}

      {!hasReasoningContent ? null : shouldShowLoading ? (
        <div
          ref={(el) => {
            if (el && reasoningDisplayText) {
              el.scrollTop = el.scrollHeight;
            }
          }}
          className={cn(
            "ml-1 text-xs text-sidebar-muted-foreground opacity-20 break-words",
            reasoningDisplayText
              ? "max-h-20 overflow-y-auto whitespace-pre-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              : "inline-block w-[100px] overflow-hidden whitespace-nowrap"
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkParse]}>
            {reasoningDisplayText || ""}
          </ReactMarkdown>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
            className="h-4 ml-1 text-xs text-sidebar-muted-foreground hover:text-sidebar-muted-foreground/80 cursor-pointer hover:underline opacity-50 hover:opacity-70 transition-opacity"
          >
            {isReasoningExpanded ? "생각 접기" : "생각함"}
          </button>
          {isReasoningExpanded && (
            <div className="ml-1 mt-1 text-xs text-sidebar-muted-foreground opacity-20 max-h-20 overflow-y-auto whitespace-normal break-words [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <ReactMarkdown remarkPlugins={[remarkParse]}>
                {reasoningDisplayText || ""}
              </ReactMarkdown>
            </div>
          )}
        </>
      )}
    </>
  );
};
