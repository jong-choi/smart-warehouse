import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStreamEffect } from "@/hooks/useChatStreamEffect";

type EventHandler = (event: Event) => void;

const connectionState = {
  setIsConnected: vi.fn(),
  setIsLoading: vi.fn(),
  setConnectionFailed: vi.fn(),
  setSessionId: vi.fn(),
  reconnectTrigger: 0,
};

const messageState = {
  addMessage: vi.fn(),
  updateLastMessage: vi.fn(),
  clearMessages: vi.fn(),
};

vi.mock("@/stores/chatConnectionStore", () => ({
  useChatConnectionStore: (keys: string[]) =>
    Object.fromEntries(
      keys.map((key) => [
        key,
        connectionState[key as keyof typeof connectionState],
      ])
    ),
}));

vi.mock("@/stores/chatMessagesStore", () => ({
  useChatMessagesStore: (
    selector: (state: typeof messageState) => unknown
  ) => selector(messageState),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly handlers = new Map<string, EventHandler[]>();
  readonly url: string;
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(name: string, handler: EventHandler) {
    const handlers = this.handlers.get(name) ?? [];
    handlers.push(handler);
    this.handlers.set(name, handlers);
  }

  emit(name: string, data?: unknown) {
    const event =
      typeof data === "undefined"
        ? new Event(name)
        : new MessageEvent(name, { data: JSON.stringify(data) });
    this.handlers.get(name)?.forEach((handler) => handler(event));
  }
}

describe("useChatStreamEffect contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ sessionId: "session-1" }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the existing same-origin session and SSE endpoints", async () => {
    const { unmount } = renderHook(() => useChatStreamEffect());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/chat/session", {
        method: "POST",
      });
      expect(MockEventSource.instances).toHaveLength(1);
    });

    const source = MockEventSource.instances[0];
    expect(source.url).toBe("/api/chat/stream?sessionId=session-1");

    act(() => {
      source.emit("open");
      source.emit("start");
      source.emit("chunk", { type: "response", text: "응답" });
      source.emit("end", { fullResponse: "응답" });
    });

    expect(messageState.clearMessages).toHaveBeenCalled();
    expect(messageState.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ isStreaming: true, isUser: false })
    );
    expect(messageState.updateLastMessage).toHaveBeenCalled();
    expect(connectionState.setIsLoading).toHaveBeenLastCalledWith(false);

    unmount();
    expect(source.close).toHaveBeenCalled();
  });
});
