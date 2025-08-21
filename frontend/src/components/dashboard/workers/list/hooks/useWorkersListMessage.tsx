import { useChatUiStore } from "@stores/chatUiStore";
import { useEffect, useState } from "react";

export function useWorkersListMessage() {
  const [tableMessage, setTableMessage] = useState("");

  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (isCollecting && tableMessage) {
      const context = `현재 페이지: 작업자 목록 (/dashboard/workers)
⦁ 시간: ${new Date().toLocaleString()}

⦁ 작업자 목록 테이블:
${tableMessage}

⦁ 사용자가 현재 보고 있는 정보:
- 등록된 모든 작업자 정보 조회 및 관리
- 작업자 코드, 이름, 정상 처리 건수, 사고 건수 정보 확인 가능
- 검색 기능으로 작업자 코드, 이름으로 필터링 가능
- 정렬 기능으로 작업자별 성과 비교 가능
- 작업자 클릭 시 상세 페이지로 이동 가능`;
      setSystemContext(context);
      setIsMessagePending(false);
      setTableMessage("");
    }
  }, [isCollecting, setIsMessagePending, setSystemContext, tableMessage]);

  return { setTableMessage, isCollecting };
}
