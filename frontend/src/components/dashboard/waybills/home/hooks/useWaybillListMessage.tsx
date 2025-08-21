import { useChatUiStore } from "@stores/chatUiStore";
import { useEffect, useState } from "react";

export function useWaybillListMessage() {
  const [tableMessage, setTableMessage] = useState("");

  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (isCollecting && tableMessage) {
      const context = `현재 페이지: 운송장 목록 (/dashboard/waybills)
⦁ 시간: ${new Date().toLocaleString()}

⦁ 운송장 목록 테이블:
${tableMessage}

⦁ 사용자가 현재 보고 있는 정보:
- 등록된 모든 운송장 정보 조회 및 관리
- 운송장 번호, 상태, 하차 예정일, 처리 일시, 작업자, 배송지, 운송 가액 정보 확인 가능
- 검색, 상태 필터, 날짜 범위 필터로 원하는 운송장 검색 가능
- 운송장 클릭 시 상세 페이지로 이동 가능
- 페이지네이션으로 대량 데이터 탐색 가능`;
      setSystemContext(context);
      setIsMessagePending(false);
      setTableMessage("");
    }
  }, [isCollecting, setIsMessagePending, setSystemContext, tableMessage]);

  return { setTableMessage, isCollecting };
}
