import React from "react";
import { Send } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useSSEChatbot } from "@hooks/useSSEChatbot";

export const ChatbotInput: React.FC = () => {
  const { inputValue, isLoading, sendMessage, setInputValue } = useSSEChatbot();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/50  rounded-b-lg min-h-[60px]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="메시지..."
          className="flex-1 border-sidebar-border focus:border-sidebar-primary text-xs h-8 bg-sidebar text-sidebar-foreground rounded-md"
        />
        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 bg-sidebar-primary disabled:bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground rounded-md"
          disabled={!inputValue.trim() || isLoading}
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
};
