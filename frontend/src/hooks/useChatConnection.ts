import { useCallback } from "react";
import { useChatConnectionStore } from "@/stores/chatConnectionStore";

export function useChatConnection() {
  const { isConnected, isLoading, connectionFailed, triggerReconnect } =
    useChatConnectionStore([
      "isConnected",
      "isLoading",
      "connectionFailed",
      "triggerReconnect",
    ]);

  const resetConnection = useCallback(() => {
    triggerReconnect();
  }, [triggerReconnect]);

  return { isConnected, isLoading, connectionFailed, resetConnection };
}
