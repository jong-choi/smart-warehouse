import { useEffect, useState } from "react";
import { useWorkersStore } from "@/stores/workersStore";
import { useChatUiStore } from "@stores/chatUiStore";

export function useDashboardWorkerMessage() {
  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  // 작업자 데이터 가져오기
  const { workers, stats } = useWorkersStore();
  const [tableContextMessage, setTableContextMessage] = useState<string>("");

  // chatbot에 사용할 컨텍스트
  useEffect(() => {
    // isCollecting이 true일 때만 systemContext 업데이트
    if (workers && stats && isCollecting) {
      const context = `현재 페이지: 실시간 작업자 현황 (/dashboard/realtime/workers)

${tableContextMessage}

⦁ 사용자가 현재 보고 있는 정보:
- 작업자들의 실시간 상태와 성과를 모니터링하는 페이지
- 작업 시작 시간이 있는 작업자들의 현재 상태, 처리 건수, 사고 건수, 사고율 확인 가능
- 작업자별 처리시간과 가동률 정보 제공
- 실시간으로 업데이트되는 작업자 현황과 통계 정보`;

      setSystemContext(context);
      setIsMessagePending(false);
    }
  }, [
    isCollecting,
    setIsMessagePending,
    setSystemContext,
    stats,
    tableContextMessage,
    workers,
  ]);

  return {
    setTableContextMessage,
    isCollecting,
  };
}
