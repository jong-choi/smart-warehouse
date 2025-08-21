import { useEffect, useState, useCallback } from "react";
import { useChatUiStore } from "@stores/chatUiStore";

export function useDashboardHomeMessage() {
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  const [dashaboardStatsMessage, setDashaboardStatsMessage] = useState("");
  const [waybillStatsMessage, setWaybillStatsMessage] = useState("");
  const [workerStatsMessage, setWorkerStatsMessage] = useState("");
  const [workerTableMessage, setWorkerTableMessage] = useState("");

  const resetMessages = useCallback(() => {
    setDashaboardStatsMessage("");
    setWaybillStatsMessage("");
    setWorkerStatsMessage("");
    setWorkerTableMessage("");
  }, []);

  const isContextMessages =
    dashaboardStatsMessage &&
    waybillStatsMessage &&
    workerStatsMessage &&
    workerTableMessage;

  useEffect(() => {
    if (!isCollecting || !isContextMessages) return;

    const context = `현재 페이지: 실시간 개요 (/dashboard/realtime/overview)
⦁ 시간: ${new Date().toLocaleString()}

⦁ 전체 현황:
${dashaboardStatsMessage}

⦁ 운송장 상태별 분포:
${waybillStatsMessage}

⦁ 작업자 현황:
${workerStatsMessage}

⦁ 작업자 상세 현황 테이블:
${workerTableMessage}

⦁ 사용자가 현재 보고 있는 정보:
- 물류센터의 실시간 현황과 핵심 지표를 한눈에 확인할 수 있는 대시보드
- 작업 진척도, 처리율, 누적 매출, 사고 금액 등 주요 지표 확인 가능
- 운송장 상태별 분포와 작업자별 성과 지표 확인 가능
- 실시간으로 업데이트되는 통계 정보와 차트`;

    setSystemContext(context);
    setIsMessagePending(false);
    resetMessages();
  }, [
    isCollecting,
    isContextMessages,
    dashaboardStatsMessage,
    waybillStatsMessage,
    workerStatsMessage,
    workerTableMessage,
    resetMessages,
    setSystemContext,
    setIsMessagePending,
  ]);

  return {
    setDashaboardStatsMessage,
    setWaybillStatsMessage,
    setWorkerStatsMessage,
    setWorkerTableMessage,
    isCollecting,
  };
}
