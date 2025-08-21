import React from "react";
import { type Message } from "@/types/chatbot";

interface MessageItemTimestampProps {
  message: Message;
}

export const MessageItemTimestamp: React.FC<MessageItemTimestampProps> = ({
  message,
}) => {
  return (
    <div className="text-xs opacity-70 mt-1">
      {message.timestamp.toLocaleTimeString()}
    </div>
  );
};
