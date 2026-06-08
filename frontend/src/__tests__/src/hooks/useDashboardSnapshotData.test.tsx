import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardSnapshotData } from "@/components/dashboard/home/waybills/hooks/useDashboardSnapshotData";
import type { UnloadingParcel } from "@/components/dashboard/home/waybills/types";

// unloadingParcelsStore 모킹
vi.mock("@/stores/unloadingParcelsStore", () => {
  const mockParcels: UnloadingParcel[] = [
    {
      id: 1,
      waybillId: "WB-001",
      status: "PENDING_UNLOAD",
      createdAt: "2024-01-01T00:00:00.000Z",
      declaredValue: 1000,
    },
    {
      id: 2,
      waybillId: "WB-002",
      status: "UNLOADED",
      createdAt: "2024-01-01T01:00:00.000Z",
      declaredValue: 2000,
    },
  ];
  const state = { parcels: mockParcels };

  return {
    useUnloadingParcelsStore: Object.assign(
      (selector: (value: typeof state) => unknown) => selector(state),
      {
        getState: () => state,
      }
    ),
  };
});

describe("useDashboardSnapshotData", () => {
  it("초기 상태를 올바르게 설정한다", () => {
    const { result } = renderHook(() => useDashboardSnapshotData());

    expect(result.current.tableData).not.toBeNull();
    expect(typeof result.current.handleRefresh).toBe("function");
  });

  it("handleRefresh가 정상적으로 동작한다", () => {
    const { result } = renderHook(() => useDashboardSnapshotData());

    act(() => {
      result.current.handleRefresh();
    });

    // 함수 호출이 에러 없이 완료되었는지 확인
    expect(typeof result.current.handleRefresh).toBe("function");
  });

  it("tableData가 배열 형태로 반환된다", () => {
    const { result } = renderHook(() => useDashboardSnapshotData());

    expect(Array.isArray(result.current.tableData)).toBe(true);
  });
});
