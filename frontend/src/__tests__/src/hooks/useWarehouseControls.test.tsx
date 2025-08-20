import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWarehouseControls } from "@/hooks/useWarehouseControls";

describe("useWarehouseControls", () => {
  it("상태와 액션을 제공하고 제약 조건을 적용한다", () => {
    const { result } = renderHook(() => useWarehouseControls());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.workerCount).toBeGreaterThan(0);

    act(() => {
      result.current.setWorkerCount(999);
      result.current.setBeltSpeed(999);
      result.current.startUnload();
    });

    expect(result.current.workerCount).toBeLessThanOrEqual(
      result.current.maxWorkers
    );
    expect(result.current.beltSpeed).toBeLessThanOrEqual(
      result.current.maxBeltSpeed
    );
    expect(result.current.isRunning).toBe(true);
  });
});
