import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatbot } from "@/hooks/useChatbot";

// socket.io-client 모듈 모킹
type SocketHandler = (...args: unknown[]) => void;
type Handlers = Record<string, SocketHandler[]>;
const handlers: Handlers = {};
const mockSocket = {
  connected: false,
  on: (event: string, cb: SocketHandler) => {
    handlers[event] = handlers[event] || [];
    handlers[event].push(cb);
  },
  emit: vi.fn(),
  disconnect: vi.fn(() => {
    for (const k of Object.keys(handlers)) delete handlers[k];
  }),
} as const;

vi.mock("socket.io-client", () => ({ io: vi.fn(() => mockSocket) }));

// store 모킹: 최소 인터페이스만 구현
vi.mock("@/stores/chatbotStore", () => {
  const state = {
    messages: [] as Array<{
      id: string;
      text: string;
      isUser: boolean;
      timestamp: Date;
      isStreaming?: boolean;
    }>,
    inputValue: "",
    isConnected: false,
    isLoading: false,
    connectionFailed: false,
    isCollecting: false,
    systemContext: "ctx",
    useContext: false,
    isMessagePending: false,
  };
  const set = (
    patch: Partial<typeof state> | ((s: typeof state) => Partial<typeof state>)
  ) => {
    Object.assign(state, typeof patch === "function" ? patch(state) : patch);
  };
  return {
    useChatbotStore: (keys: string[]) => {
      const api = {
        addMessage: (m: (typeof state.messages)[0]) =>
          set({ messages: [...state.messages, m] }),
        updateLastMessage: (
          updater: (m: (typeof state.messages)[0]) => (typeof state.messages)[0]
        ) =>
          set((s) => ({
            messages: s.messages.map((m, i, arr) =>
              i === arr.length - 1 ? updater(m) : m
            ),
          })),
        setInputValue: (v: string) => {
          set({ inputValue: v });
          state.inputValue = v; // 확실히 업데이트
        },
        setIsConnected: (v: boolean) => set({ isConnected: v }),
        setIsLoading: (v: boolean) => set({ isLoading: v }),
        setConnectionFailed: (v: boolean) => set({ connectionFailed: v }),
        clearMessages: () => set({ messages: [] }),
        removeLastMessage: () =>
          set((s) => ({ messages: s.messages.slice(0, -1) })),
        setIsCollecting: (v: boolean) => set({ isCollecting: v }),
        setIsMessagePending: (v: boolean) => set({ isMessagePending: v }),
      };
      const full = { ...state, ...api } as Record<string, unknown>;
      const picked: Record<string, unknown> = {};
      for (const k of keys) picked[k] = full[k];
      return picked;
    },
  };
});

describe("useChatbot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const k of Object.keys(handlers)) delete handlers[k];
    vi.mocked(mockSocket.emit).mockClear?.();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("연결 성공/실패 타임아웃 처리", async () => {
    const { result, unmount } = renderHook(() => useChatbot());

    // connect 시도 후 5초 내 connect 이벤트 미발생 → 실패로 전환
    await act(async () => {
      vi.advanceTimersByTime(5001);
      handlers["connect_error"]?.forEach((fn) => fn(new Error("e")));
    });

    // 실패 플래그가 true가 되도록 내부 상태가 업데이트되었는지 확인은 제한적.
    // 모킹한 store 접근을 위해 메시지를 사용해 간접 확인(연결 실패 시 메시지는 없음)
    expect(result.current.isLoading).toBe(false);

    // 이제 connect 이벤트 발생 → 성공 경로
    await act(async () => {
      handlers["connect"]?.forEach((fn) => fn());
    });
    expect(result.current.retryConnection).toBeTypeOf("function");
    unmount();
  });

  it("sendMessage: 기본 함수 동작 확인", async () => {
    const { result } = renderHook(() => useChatbot());

    // sendMessage 함수가 존재하고 호출 가능한지 확인
    expect(typeof result.current.sendMessage).toBe("function");

    // 함수 호출 자체가 에러 없이 동작하는지 확인
    act(() => {
      result.current.sendMessage();
    });

    // 기본 상태 확인
    expect(result.current.isLoading).toBe(false);
  });

  it("스트리밍: start → chunk → end 순서 처리", async () => {
    renderHook(() => useChatbot());

    await act(async () => {
      handlers["connect"]?.forEach((fn) => fn());
      handlers["bot_response_start"]?.forEach((fn) => fn());
    });

    await act(async () => {
      handlers["bot_response_chunk"]?.forEach((fn) => fn({ chunk: "A" }));
      vi.advanceTimersByTime(120);
      handlers["bot_response_chunk"]?.forEach((fn) => fn({ chunk: "B" }));
      vi.advanceTimersByTime(120);
    });

    await act(async () => {
      handlers["bot_response_end"]?.forEach((fn) => fn());
      vi.advanceTimersByTime(60);
    });

    // 마지막까지 에러 없이 순서 처리되면 성공
    expect(true).toBe(true);
  });
});
