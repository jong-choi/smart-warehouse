import { useState, useEffect, useCallback } from "react";
import { useUnloadingParcelsStore } from "@/stores/unloadingParcelsStore";
import type { UnloadingParcel } from "@components/dashboard/home/waybills/types";
import { useShallow } from "zustand/shallow";

export function useDashboardSnapshotData() {
  const hasData = useUnloadingParcelsStore(
    (state) => state.parcels && state.parcels.length > 0
  );

  const [tableData, setTableData] = useState<UnloadingParcel[] | null>(null);
  const currentParcels = useUnloadingParcelsStore(useShallow((s) => s.parcels));
  const createSnapshot = useCallback(() => {
    if (!currentParcels || currentParcels.length === 0) {
      setTableData(null);
      return;
    }
    setTableData([...currentParcels]); // 깊은 복사
  }, [currentParcels]);

  useEffect(() => {
    if (hasData && tableData === null) {
      createSnapshot();
    }
  }, [hasData, tableData, createSnapshot]);

  const handleRefresh = useCallback(() => {
    createSnapshot();
  }, [createSnapshot]);

  return {
    tableData,
    handleRefresh,
  };
}
