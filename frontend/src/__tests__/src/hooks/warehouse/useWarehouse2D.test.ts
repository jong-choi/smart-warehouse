import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWarehouse2D } from "@/hooks/warehouse/useWarehouse2D";

// 외부 훅/유틸 모킹: 결정적 테스트 보장
vi.mock("@/hooks/useWaybills", () => ({
  useUnloadingParcels: () => ({ data: { parcels: [], total: 0 } }),
}));
vi.mock("@/utils", () => ({
  createChannelInterface: () => ({ send: vi.fn() }),
}));

describe("useWarehouse2D", () => {
  it("초기 값 구조를 반환한다", () => {
    const { result } = renderHook(() => useWarehouse2D());
    expect(Array.isArray(result.current.loadedParcels)).toBe(true);
    expect(Array.isArray(result.current.workerCatchTimes)).toBe(true);
    expect(Array.isArray(result.current.workerBrokenUntil)).toBe(true);
  });
});
