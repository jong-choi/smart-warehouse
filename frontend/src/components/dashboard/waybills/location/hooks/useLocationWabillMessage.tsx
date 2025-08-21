import { useChatUiStore } from "@stores/chatUiStore";
import { useEffect, useState } from "react";

export function useLocationWaybillMessage() {
  const [tableMessage, setTableMessage] = useState("");

  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (isCollecting && tableMessage) {
      const context = `현재 페이지: 지역별 운송장 통계 (/dashboard/location/waybills)
⦁ 시간: ${new Date().toLocaleString()}

⦁ 지역별 운송장 통계 테이블:
${tableMessage}

⦁ 사용자가 현재 보고 있는 정보:
- 각 지역별 운송장 수량과 상태별 분포 확인
- 지역명, 주소, 총 운송장 수, 상태별 분포 정보 제공
- 배송 상태 필터와 날짜 범위 필터로 데이터 필터링 가능`;
      setSystemContext(context);
      setIsMessagePending(false);
      setTableMessage("");
    }
  }, [isCollecting, setIsMessagePending, setSystemContext, tableMessage]);

  return { setTableMessage, isCollecting };
}
