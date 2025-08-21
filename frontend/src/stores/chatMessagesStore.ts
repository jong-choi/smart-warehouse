import { create } from "zustand";
import type { Message } from "@/types/chatbot";

interface ChatMessagesState {
  messageIds: string[];
  messagesById: Record<string, Message>;

  addMessage: (message: Message) => void;
  updateLastMessage: (updater: (message: Message) => Message) => void;
  clearMessages: () => void;
  removeLastMessage: () => void;
}

export const useChatMessagesStore = create<ChatMessagesState>((set) => ({
  messageIds: [],
  messagesById: {},

  addMessage: (message) =>
    set((state) => ({
      messageIds: [...state.messageIds, message.id],
      messagesById: { ...state.messagesById, [message.id]: message },
    })),

  updateLastMessage: (updater) =>
    set((state) => {
      if (state.messageIds.length === 0)
        return {} as Partial<ChatMessagesState>;
      const lastId = state.messageIds[state.messageIds.length - 1];
      const lastMessage = state.messagesById[lastId];
      if (!lastMessage) return {} as Partial<ChatMessagesState>;
      const updated = updater(lastMessage);
      if (updated === lastMessage) return {} as Partial<ChatMessagesState>;
      return {
        messagesById: { ...state.messagesById, [lastId]: updated },
      };
    }),

  clearMessages: () => set({ messageIds: [], messagesById: {} }),

  removeLastMessage: () =>
    set((state) => {
      if (state.messageIds.length === 0)
        return {} as Partial<ChatMessagesState>;
      const newIds = state.messageIds.slice(0, -1);
      const lastId = state.messageIds[state.messageIds.length - 1];
      const newMap = { ...state.messagesById };
      delete newMap[lastId];
      return { messageIds: newIds, messagesById: newMap };
    }),
}));

export const selectMessageById = (id: string) => (state: ChatMessagesState) =>
  state.messagesById[id];
