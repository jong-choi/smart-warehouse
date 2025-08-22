import { create } from "zustand";
import { createStoreWithSelectors } from "@/utils/zustandCreate";

interface ChatConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  connectionFailed: boolean;
  sessionId: string | null;
  reconnectTrigger: number; // 재연결 트리거용

  setIsConnected: (isConnected: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setConnectionFailed: (failed: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  resetConnection: () => void;
}

const _useChatConnectionStore = create<ChatConnectionState>((set) => ({
  isConnected: false,
  isLoading: false,
  connectionFailed: false,
  sessionId: null,
  reconnectTrigger: 0,

  setIsConnected: (isConnected) => set({ isConnected }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setConnectionFailed: (connectionFailed) => set({ connectionFailed }),
  setSessionId: (sessionId) => set({ sessionId }),
  resetConnection: () =>
    set((state) => ({
      isConnected: false,
      isLoading: false,
      connectionFailed: false,
      sessionId: null,
      reconnectTrigger: state.reconnectTrigger + 1, // 트리거 증가로 useEffect 재실행
    })),
}));

export const useChatConnectionStore =
  createStoreWithSelectors<ChatConnectionState>(_useChatConnectionStore);
