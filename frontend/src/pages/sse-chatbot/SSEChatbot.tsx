import useSSEChatbot from "@pages/sse-chatbot/hooks/useSSEChatbot";
import { useCallback } from "react";

function SSEChatbot() {
  const {
    messages,
    inputValue,
    isConnected,
    isLoading,
    connectionFailed,
    setInputValue,
    sendMessage,
    clearConversation,
    retryConnection,
  } = useSSEChatbot();

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      console.log(messages);
      sendMessage();
    },
    [messages, sendMessage]
  );

  return (
    <main className="p-4 max-w-3xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">SSE Chatbot</h1>
        <div className="text-sm">
          <span className={isConnected ? "text-green-600" : "text-gray-400"}>
            {isConnected ? "connected" : "disconnected"}
          </span>
          {connectionFailed && (
            <button className="ml-2 underline" onClick={retryConnection}>
              retry
            </button>
          )}
        </div>
      </header>

      <section className="border rounded p-3 h-[50vh] overflow-y-auto bg-sidebar/50">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <div
              className={`text-xs ${
                m.isUser ? "text-blue-600" : "text-emerald-700"
              }`}
            >
              {m.isUser ? "You" : "Bot"} · {m.timestamp.toLocaleTimeString()}
              {m.isStreaming ? " · streaming" : ""}
            </div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </section>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="border rounded px-3 py-2"
          disabled={!isConnected || isLoading}
        >
          보내기
        </button>
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={clearConversation}
        >
          초기화
        </button>
      </form>
    </main>
  );
}

export default SSEChatbot;
