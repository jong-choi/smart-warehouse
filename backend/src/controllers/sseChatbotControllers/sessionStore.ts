import type { Response } from "express";
import { ChatMessageHistoryWithDeletion } from "@/utils/chatHistory";

export type Session = {
  id: string;
  res?: Response;
  abort?: AbortController;
  history: ChatMessageHistoryWithDeletion;
  idleTimer?: ReturnType<typeof setTimeout>;
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

  delete(id: string) {
    const s = this.sessions.get(id);
    if (s?.idleTimer) {
      clearTimeout(s.idleTimer);
      s.idleTimer = undefined;
    }
    this.sessions.delete(id);
  }

  clearIdleTimer(id: string) {
    const s = this.sessions.get(id);
    if (s?.idleTimer) {
      clearTimeout(s.idleTimer);
      s.idleTimer = undefined;
    }
  }

  setIdleTimer(id: string, ms: number, onTimeout: () => void) {
    const s = this.sessions.get(id);
    if (!s) return;
    if (s.idleTimer) {
      clearTimeout(s.idleTimer);
    }
    s.idleTimer = setTimeout(onTimeout, ms);
  }
}

export const sessionStore = new SessionStore();
