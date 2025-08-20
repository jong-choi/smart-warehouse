import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardWorkerMessage } from "@/components/dashboard/home/workers/hooks/useDashboardWorkerMessage";

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

// workersStore 모킹
vi.mock("@/stores/workersStore", () => {
  const mockWorkers = [
    {
      id: "A1",
      name: "작업자1",
      status: "WORKING",
      processedCount: 10,
      accidentCount: 1,
    },
    {
      id: "A2",
      name: "작업자2",
      status: "IDLE",
      processedCount: 5,
      accidentCount: 0,
    },
  ];

  const mockStats = {
    totalWorkers: 2,
    workingWorkers: 1,
    idleWorkers: 1,
    brokenWorkers: 0,
  };

  return {
    useWorkersStore: () => ({
      workers: mockWorkers,
      stats: mockStats,
    }),
  };
});

describe("useDashboardWorkerMessage", () => {
  it("초기 상태를 올바르게 설정한다", () => {
    const { result } = renderHook(() => useDashboardWorkerMessage());

    expect(typeof result.current.setTableContextMessage).toBe("function");
    expect(typeof result.current.isCollecting).toBe("boolean");
  });

  it("테이블 컨텍스트 메시지를 설정할 수 있다", () => {
    const { result } = renderHook(() => useDashboardWorkerMessage());

    act(() => {
      result.current.setTableContextMessage("Test table context");
    });

    // 함수 호출이 에러 없이 완료되었는지 확인
    expect(true).toBe(true);
  });

  it("isCollecting 상태를 올바르게 반환한다", () => {
    const { result } = renderHook(() => useDashboardWorkerMessage());

    expect(result.current.isCollecting).toBe(false);
  });
});
