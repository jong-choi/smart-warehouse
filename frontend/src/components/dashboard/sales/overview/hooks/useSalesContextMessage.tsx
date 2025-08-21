import { useChatUiStore } from "@stores/chatUiStore";
import { useEffect, useState } from "react";

export function useSalesContextMessage(currentYear: number) {
  const [statsMessage, setStatsMessage] = useState("");
  const [tableMessage, setTableMessage] = useState("");

  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (isCollecting && statsMessage && tableMessage) {
      const context = `현재 페이지: 매출 개요 (/dashboard/sales/overview)
  ⦁ 시간: ${new Date().toLocaleString()}
  
  ⦁ 조회 기간:
  - ${currentYear}년
  
  ${statsMessage}
  
  ⦁ 지역별 매출 테이블:
  ${tableMessage}
  
  ⦁ 사용자가 현재 보고 있는 정보:
  - ${currentYear}년의 전체 매출 현황과 핵심 지표
  - 총 매출, 평균 운송가액, 사고 손실률, 월별 성장률 등 주요 지표 확인 가능
  - 지역별 매출 현황과 처리 건수 확인 가능
  - 지역 클릭 시 해당 지역의 운송장 목록으로 이동 가능
  - 연도별 이동 버튼으로 다른 연도의 데이터 조회 가능`;
      setSystemContext(context);
      setIsMessagePending(false);
      setStatsMessage("");
      setTableMessage("");
    }
  }, [
    currentYear,
    isCollecting,
    setIsMessagePending,
    setSystemContext,
    statsMessage,
    tableMessage,
  ]);

  return { setStatsMessage, setTableMessage, isCollecting };
}
