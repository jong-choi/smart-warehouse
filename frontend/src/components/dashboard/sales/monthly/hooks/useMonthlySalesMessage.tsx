import { useChatUiStore } from "@stores/chatUiStore";
import { useEffect, useState } from "react";

export function useMonthlySalesMessage(currentYear: number) {
  const [tableMessage, setTableMessage] = useState("");

  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (isCollecting && tableMessage) {
      const context = `현재 페이지: 월별 매출 현황 (/dashboard/sales/monthly)
⦁ 시간: ${new Date().toLocaleString()}

⦁ 조회 기간:
- ${currentYear}년

⦁ 월별 매출 테이블:
${tableMessage}

⦁ 사용자가 현재 보고 있는 정보:
- ${currentYear}년의 월별 매출 현황
- 월별 하차물량, 총 운송가액, 평균 운송가액, 정상처리건수, 처리가액, 사고건수, 사고가액 확인 가능
- 월 클릭 시 해당 월의 일별 매출 페이지로 이동 가능
- 하차물량 클릭 시 해당 월의 운송장 목록으로 이동 가능
- 연도별 이동 버튼으로 다른 연도의 데이터 조회 가능`;
      setSystemContext(context);
      setIsMessagePending(false);
      setTableMessage("");
    }
  }, [
    currentYear,
    isCollecting,
    setIsMessagePending,
    setSystemContext,
    tableMessage,
  ]);

  return { setTableMessage, isCollecting };
}
