import { useChatUiStore } from "@stores/chatUiStore";
import { useEffect, useState } from "react";

export function useWaybillDetailMessage() {
  const [waybillMessage, setWaybillMessage] = useState("");

  // 챗봇 관련 훅
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);

  useEffect(() => {
    if (isCollecting && waybillMessage) {
      const context = `현재 페이지: 운송장 상세 정보 (/dashboard/waybills/:id)
⦁ 시간: ${new Date().toLocaleString()}

⦁ 운송장 상세 정보:
${waybillMessage}

⦁ 사용자가 현재 보고 있는 정보:
- 특정 운송장의 상세 정보 조회
- 운송장 번호, 상태, 하차 예정일, 처리 일시 확인
- 작업자 정보 및 배송지 정보 확인
- 물건 정보 (가격, 소포 ID) 확인
- 사고 여부 확인
- 운송장 상태에 따른 시각적 표시 (상태 배지, 사고 여부 배지)`;
      setSystemContext(context);
      setIsMessagePending(false);
      setWaybillMessage("");
    }
  }, [isCollecting, setIsMessagePending, setSystemContext, waybillMessage]);

  return { setWaybillMessage, isCollecting };
}
