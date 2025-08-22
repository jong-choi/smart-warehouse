import { create } from "zustand";
import { createStoreWithSelectors } from "@/utils/zustandCreate";

interface ChatConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  connectionFailed: boolean;
  sessionId: string | null;

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

  setIsConnected: (isConnected) => set({ isConnected }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setConnectionFailed: (connectionFailed) => set({ connectionFailed }),
  setSessionId: (sessionId) => set({ sessionId }),
  resetConnection: () =>
    set({
      isConnected: false,
      isLoading: false,
      connectionFailed: false,
      sessionId: null,
    }),
}));

export const useChatConnectionStore =
  createStoreWithSelectors<ChatConnectionState>(_useChatConnectionStore);
