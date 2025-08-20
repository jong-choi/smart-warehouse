import { describe, it, expect } from "vitest";
import { useUnloadingParcelsStore } from "@/stores/unloadingParcelsStore";

describe("useUnloadingParcelsStore", () => {
  it("setParcels/updateParcel/clearParcels 동작", () => {
    const initial = [
      {
        id: 1,
        waybillId: "WB-1",
        status: "PENDING_UNLOAD",
        createdAt: "2024",
        declaredValue: 1000,
      },
    ];

    useUnloadingParcelsStore.getState().setParcels(initial as never);
    expect(useUnloadingParcelsStore.getState().parcels.length).toBe(1);

    useUnloadingParcelsStore
      .getState()
      .updateParcel("WB-1", { status: "UNLOADED" } as never);
    expect(useUnloadingParcelsStore.getState().parcels[0].status).toBe(
      "UNLOADED"
    );

    useUnloadingParcelsStore.getState().clearParcels();
    expect(useUnloadingParcelsStore.getState().parcels.length).toBe(0);
  });
});
