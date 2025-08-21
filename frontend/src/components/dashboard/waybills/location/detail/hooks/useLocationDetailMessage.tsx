import { useChatUiStore } from "@stores/chatUiStore";
import { useEffect, useState } from "react";

export function useLocationDetailMessage(locationName: string) {
  const [tableMessage, setTableMessage] = useState("");

  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (isCollecting && tableMessage) {
      const context = `현재 페이지: 지역별 운송장 상세 목록 (/dashboard/location/waybills/{locationId})
⦁ 시간: ${new Date().toLocaleString()}

⦁ 현재 지역: ${locationName}

⦁ 지역별 운송장 상세 목록 테이블:
${tableMessage}

⦁ 사용자가 현재 보고 있는 정보:
- ${locationName} 지역으로 배송되는 운송장 목록
- 운송장 번호, 상태, 하차 예정일, 처리 일시, 소포 가격 정보 확인 가능
- 운송장 번호 검색, 배송 상태 필터, 발송 날짜 범위 필터로 데이터 필터링 가능
- 운송장 클릭 시 상세 페이지로 이동 가능
- 페이지네이션으로 대량 데이터 탐색 가능`;
      setSystemContext(context);
      setIsMessagePending(false);
      setTableMessage("");
    }
  }, [
    isCollecting,
    setIsMessagePending,
    setSystemContext,
    tableMessage,
    locationName,
  ]);

  return { setTableMessage, isCollecting };
}
