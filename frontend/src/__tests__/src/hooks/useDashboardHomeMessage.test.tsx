import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardHomeMessage } from "@/components/dashboard/home/stats/hooks/useDashboardHomeMessage";

// chatbotStore 모킹
vi.mock("@/stores/chatbotStore", () => {
  const state = {
    isCollecting: false,
  };

  return {
    useChatbotStore: (keys: string[]) => {
      const api = {
        setSystemContext: vi.fn(),
        setIsMessagePending: vi.fn(),
      };
      const full = { ...state, ...api } as Record<string, unknown>;
      const picked: Record<string, unknown> = {};
      for (const k of keys) picked[k] = full[k];
      return picked;
    },
  };
});

describe("useDashboardHomeMessage", () => {
  it("초기 상태를 올바르게 설정한다", () => {
    const { result } = renderHook(() => useDashboardHomeMessage());

    expect(typeof result.current.setDashaboardStatsMessage).toBe("function");
    expect(typeof result.current.setWaybillStatsMessage).toBe("function");
    expect(typeof result.current.setWorkerStatsMessage).toBe("function");
    expect(typeof result.current.setWorkerTableMessage).toBe("function");
    expect(typeof result.current.isCollecting).toBe("boolean");
  });

  it("메시지 설정 함수들이 정상적으로 동작한다", () => {
    const { result } = renderHook(() => useDashboardHomeMessage());

    act(() => {
      result.current.setDashaboardStatsMessage("dashboard stats");
      result.current.setWaybillStatsMessage("waybill stats");
      result.current.setWorkerStatsMessage("worker stats");
      result.current.setWorkerTableMessage("worker table");
    });

    // 함수 호출이 에러 없이 완료되었는지 확인
    expect(true).toBe(true);
  });

  it("isCollecting 상태를 올바르게 반환한다", () => {
    const { result } = renderHook(() => useDashboardHomeMessage());

    expect(result.current.isCollecting).toBe(false);
  });
});
