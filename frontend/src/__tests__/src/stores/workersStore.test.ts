import { describe, it, expect } from "vitest";
import { useWorkersStore } from "@/stores/workersStore";

describe("useWorkersStore", () => {
  it("updateWorker로 상태가 갱신되고 통계가 재계산된다", () => {
    const { workers, stats } = useWorkersStore.getState();
    expect(workers.length).toBe(20);
    expect(stats.totalWorkers).toBe(20);

    useWorkersStore
      .getState()
      .updateWorker("A1", {
        status: "WORKING",
        processedCount: 1,
        workStartedAt: new Date().toISOString(),
      });

    const st = useWorkersStore.getState();
    expect(st.workers.find((w) => w.id === "A1")?.status).toBe("WORKING");
    expect(st.stats.workingWorkers).toBeGreaterThan(0);
  });

  it("resetWorkers로 초기화된다", () => {
    useWorkersStore.getState().updateWorker("A2", { status: "BROKEN" });
    useWorkersStore.getState().resetWorkers();
    const s = useWorkersStore.getState();
    expect(s.stats.brokenWorkers).toBe(0);
    expect(s.stats.idleWorkers).toBe(20);
  });
});

