import type { Response } from "express";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";

export type Session = {
  id: string;
  res?: Response;
  abort?: AbortController;
  history: ChatMessageHistoryWithDeletion;
};

export class SessionStore {
  private sessions = new Map<string, Session>();

  get(id: string) {
    return this.sessions.get(id);
  }

  set(session: Session) {
    this.sessions.set(session.id, session);
  }

  has(id: string) {
    return this.sessions.has(id);
  }
}

export const sessionStore = new SessionStore();
