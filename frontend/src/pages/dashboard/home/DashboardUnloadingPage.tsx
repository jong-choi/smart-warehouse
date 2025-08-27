import { PageHeader } from "@components/dashboard/home/waybills";
import {
  useDashboardWaybillMessage,
  useDashboardSnapshotData,
} from "@components/dashboard/home/waybills/hooks";
import { UnloadingTable } from "@components/dashboard/home/waybills/table/UnloadingTable";
import { UnloadingInfo } from "@components/dashboard/home/waybills/UnloadingInfo";
import { TableSkeleton } from "@components/dashboard/workers/components/TableSkeleton";
import { PageLayout } from "@ui/page-layout";

export default function DashboardUnloadingPage() {
  // 챗봇 메시지 훅
  const { setTableContextMessage, isCollecting } = useDashboardWaybillMessage();

  // 스냅샷 데이터 훅
  const { tableData, handleRefresh } = useDashboardSnapshotData();

  return (
    <PageLayout>
      <PageHeader />
      {!tableData ? (
        <TableSkeleton rows={50} />
      ) : (
        <UnloadingTable
          parcels={tableData}
          onRefresh={handleRefresh}
          isCollecting={isCollecting}
          setTableContextMessage={setTableContextMessage}
        />
      )}
      <UnloadingInfo />
    </PageLayout>
  );
}
