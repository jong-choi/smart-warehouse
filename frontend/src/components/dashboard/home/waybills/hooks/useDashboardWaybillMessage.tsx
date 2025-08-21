import { useEffect, useState } from "react";
import { useChatUiStore } from "@stores/chatUiStore";

export function useDashboardWaybillMessage() {
  const [tableContextMessage, setTableContextMessage] = useState<string>("");
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (!isCollecting || !tableContextMessage) return;

    const context = `현재 페이지: 실시간 운송장 현황 (/dashboard/realtime/waybill)
⦁ 시간: ${new Date().toLocaleString()}

${tableContextMessage}

⦁ 사용자가 현재 보고 있는 정보:
- 운송장의 실시간 처리 현황과 상태를 상세히 확인할 수 있는 페이지
- 운송장 번호, 상태, 등록일시, 하차일시, 처리일시, 처리 작업자, 운송가액 정보 확인 가능
- 검색, 상태 필터, 페이지네이션으로 원하는 운송장 조회 가능
- 실시간으로 업데이트되는 운송장 현황과 통계 정보`;

    setSystemContext(context);
    setTableContextMessage("");
    setIsMessagePending(false);
  }, [
    isCollecting,
    setIsMessagePending,
    setSystemContext,
    tableContextMessage,
  ]);

  return { isCollecting, setTableContextMessage };
}
