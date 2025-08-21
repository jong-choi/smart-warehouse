import React, { Suspense, lazy, useMemo } from "react";
import { type Message } from "@/types/chatbot";

const ReactMarkdownApp = lazy(() =>
  import("@components/markdown/react-markdown-app").then((mod) => ({
    default: mod.default,
  }))
);

interface MessageItemContentProps {
  message: Message;
}

export const MessageItemContent: React.FC<MessageItemContentProps> = ({
  message,
}) => {
  const { regularChunks } = useMemo(() => {
    const isUsingSSEMode = message.reasoningText !== undefined;
    const text = message.text ?? "";

    if (isUsingSSEMode) {
      return { regularChunks: text };
    }

    const thinkStartIndex = text.indexOf("<think>");
    const thinkEndIndex = text.indexOf("</think>");

    if (thinkStartIndex >= 0 && thinkEndIndex >= 0) {
      const regular = text.slice(thinkEndIndex + 8).trim();
      return { regularChunks: regular };
    }

    if (thinkStartIndex >= 0 && thinkEndIndex < 0) {
      return { regularChunks: "" };
    }

    return { regularChunks: text };
  }, [message.reasoningText, message.text]);

  const shouldRenderMarkdown = !message.isStreaming;
  if (!shouldRenderMarkdown) {
    return <div className="text-sm leading-none">{regularChunks}</div>;
  }
  return (
    <Suspense
      fallback={<div className="text-sm leading-none">{regularChunks}</div>}
    >
      <ReactMarkdownApp>{regularChunks}</ReactMarkdownApp>
    </Suspense>
  );
};
