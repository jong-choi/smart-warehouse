import { create } from "zustand";
import { createStoreWithSelectors } from "@/utils/zustandCreate";

interface ChatUiState {
  isOpen: boolean;
  useContext: boolean;
  systemContext: string;
  isCollecting: boolean;
  isMessagePending: boolean;

  setIsOpen: (isOpen: boolean) => void;
  setUseContext: (useContext: boolean) => void;
  setSystemContext: (ctx: string) => void;
  setIsCollecting: (v: boolean) => void;
  setIsMessagePending: (v: boolean) => void;
}

const _useChatUiStore = create<ChatUiState>((set) => ({
  isOpen: true,
  useContext: true,
  systemContext: "",
  isCollecting: false,
  isMessagePending: false,

  setIsOpen: (isOpen) => set({ isOpen }),
  setUseContext: (useContext) => set({ useContext }),
  setSystemContext: (systemContext) => set({ systemContext }),
  setIsCollecting: (isCollecting) => set({ isCollecting }),
  setIsMessagePending: (isMessagePending) => set({ isMessagePending }),
}));

export const useChatUiStore =
  createStoreWithSelectors<ChatUiState>(_useChatUiStore);
