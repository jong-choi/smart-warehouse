import { useCallback } from "react";
import { useChatConnectionStore } from "@/stores/chatConnectionStore";

export function useChatConnection() {
  const { isConnected, isLoading, connectionFailed, resetConnection } =
    useChatConnectionStore([
      "isConnected",
      "isLoading",
      "connectionFailed",
      "resetConnection",
    ]);

  // resetConnection은 store의 초기화 함수 그대로 노출
  const reset = useCallback(() => {
    resetConnection();
  }, [resetConnection]);

  return { isConnected, isLoading, connectionFailed, resetConnection: reset };
}
