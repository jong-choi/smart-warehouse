export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  isContext?: boolean;
  // SSE 전용: 모델 reasoning 별도 표기용 (선택적)
  reasoningText?: string;
  isThinking?: boolean;
  // 툴 이벤트 로깅 (선택적)
  toolEvents?: Array<{
    type: "start" | "end";
    name: string;
    input?: unknown;
    at: string;
  }>;
}

export interface ChatbotState {
  isOpen: boolean;
  messages: Message[];
  inputValue: string;
  isConnected: boolean;
  isLoading: boolean;
  connectionFailed: boolean;
  isCollecting: boolean;
  systemContext: string;
  useContext: boolean;
  isMessagePending: boolean;
}
