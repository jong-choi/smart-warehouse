import React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useChatUiStore } from "@/stores/chatUiStore";
import { useChatConnection } from "@/hooks/useChatConnection";

interface ChatbotStatusBarProps {
  currentScreen: string;
  onClearConversation: () => void;
}

export const ChatbotStatusBar: React.FC<ChatbotStatusBarProps> = React.memo(
  ({ currentScreen, onClearConversation }) => {
    const { isConnected, connectionFailed, isLoading } = useChatConnection();
    const { useContext, setUseContext, isDBAllowed, setIsDBAllowed } =
      useChatUiStore([
        "useContext",
        "setUseContext",
        "isDBAllowed",
        "setIsDBAllowed",
      ]);
    const handleToggleContext = () => {
      setUseContext(!useContext);
    };
    const handleToggleDBAllowed = () => {
      setIsDBAllowed(!isDBAllowed);
    };
    return (
      <div className="px-4 py-2 border-t border-sidebar-border bg-sidebar-secondary/5">
        <div className="flex items-center gap-2 mb-2 border-b border-sidebar-border pb-2 justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected
                  ? "bg-green-500"
                  : connectionFailed
                  ? "bg-red-500"
                  : "bg-yellow-500"
              )}
            ></div>
            <span className="text-xs font-medium text-sidebar-foreground/80 py-1 select-none">
              {connectionFailed
                ? "연결 실패"
                : !isConnected
                ? "연결중"
                : "연결됨"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={onClearConversation}
              variant="ghost"
              size="sm"
              className="h-6 px-2 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs"
              title="대화 기록 초기화"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              대화 초기화
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 divide-x divide-sidebar-border">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-medium text-sidebar-foreground/80",
                isLoading && "opacity-50"
              )}
            >
              <Checkbox
                id="use-context"
                checked={useContext}
                disabled={isLoading}
                onCheckedChange={handleToggleContext}
                className="h-3 w-3"
                iconClassName="text-green-700 -translate-y-0.5"
                iconStrokeWidth={4}
              />
              <label
                htmlFor="use-context"
                className={cn(
                  "cursor-pointer hover:text-sidebar-foreground flex items-center gap-1",
                  useContext &&
                    "text-sidebar-foreground hover:text-muted-foreground"
                )}
              >
                <span>화면 기반</span>
                <span
                  className={cn(
                    "text-xs text-muted-foreground/50 select-none",
                    !useContext && "invisible"
                  )}
                >
                  {currentScreen}
                </span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-medium text-sidebar-foreground/80",
                isLoading && "opacity-50"
              )}
            >
              <Checkbox
                id="use-db"
                checked={isDBAllowed}
                disabled={isLoading}
                onCheckedChange={handleToggleDBAllowed}
                className="h-3 w-3"
                iconClassName="text-green-700 -translate-y-0.5"
                iconStrokeWidth={4}
              />
              <label
                htmlFor="use-db"
                className={cn(
                  "cursor-pointer hover:text-sidebar-foreground",
                  isDBAllowed &&
                    "text-sidebar-foreground hover:text-muted-foreground"
                )}
              >
                DB 조회
                <span
                  className={
                    "text-xs text-muted-foreground/50 select-none ml-1"
                  }
                >
                  {isDBAllowed ? "사용" : "사용 안함"}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
