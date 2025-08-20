import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { useWarehouseStats } from "@/hooks/useWarehouseStats";

// TanStack Query Provider 래퍼
function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}

// BroadcastChannel 대역: utils.createChannelInterface를 모킹
vi.mock("@/utils", () => {
  type Subscriber = (message: { msg: string; ts: number }) => void;
  const subscribers: Subscriber[] = [];
  const bus = {
    subscribe: (fn: Subscriber) => {
      subscribers.push(fn);
      return () => {
        const i = subscribers.indexOf(fn);
        if (i >= 0) subscribers.splice(i, 1);
      };
    },
    __emit: (message: { msg: string; ts: number }) => {
      subscribers.forEach((s) => s(message));
    },
  };
  return {
    createChannelInterface: () => bus,
    __testBus: bus,
  };
});

// useUnloadingParcels 훅 모킹 (TanStack Query를 통해 total 제공)
vi.mock("@/hooks/useWaybills", () => ({
  useUnloadingParcels: () => ({
    data: { total: 2000 },
    isLoading: false,
    error: null,
  }),
}));

describe("useWarehouseStats", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("초기 상태와 메시지 집계 동작을 계산한다", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useWarehouseStats(), { wrapper });

    // 초기값 검증
    await waitFor(() => {
      expect(result.current.unloadExpected).toBe(2000);
      expect(result.current.unloadCompleted).toBe(0);
      expect(result.current.processedCount).toBe(0);
      expect(result.current.accidentRate).toBe("0.00%");
    });

    const utils = (await import("@/utils")) as unknown as {
      __testBus: { __emit: (m: { msg: string; ts: number }) => void };
    };

    // 메시지 주입
    act(() => {
      utils.__testBus.__emit({ msg: "하차된 물건", ts: Date.now() });
      utils.__testBus.__emit({ msg: "하차된 물건", ts: Date.now() });
      utils.__testBus.__emit({ msg: "작업자 처리", ts: Date.now() });
      utils.__testBus.__emit({ msg: "작업자 처리", ts: Date.now() });
      utils.__testBus.__emit({ msg: "작업자 처리", ts: Date.now() });
      utils.__testBus.__emit({ msg: "물건 파손", ts: Date.now() });
    });

    // 총 처리수 5건 중 1건 사고 → 20%
    await waitFor(() => {
      expect(result.current.unloadCompleted).toBe(2);
      expect(result.current.processedCount).toBe(3);
      expect(result.current.accidentRate).toBe("20.00%");
    });
  });
});
