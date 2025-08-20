import { describe, it, expect } from "vitest";
import { _useWarehouseStore } from "@/stores/warehouseStore";

describe("useWarehouseStore", () => {
  it("start/stop/reset 및 한계치 제약", () => {
    _useWarehouseStore.getState().startUnload();
    expect(_useWarehouseStore.getState().isRunning).toBe(true);
    expect(_useWarehouseStore.getState().isPaused).toBe(false);

    _useWarehouseStore.getState().setWorkerCount(999);
    _useWarehouseStore.getState().setBeltSpeed(999);
    expect(_useWarehouseStore.getState().workerCount).toBeLessThanOrEqual(20);
    expect(_useWarehouseStore.getState().beltSpeed).toBeLessThanOrEqual(5);

    _useWarehouseStore.getState().reset();
    expect(_useWarehouseStore.getState().workerSpeeds.length).toBe(20);
  });
});
