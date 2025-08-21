## SSE 챗봇 구현 개요

본 문서는 WebSocket 기반 챗봇을 대체/보완하기 위한 SSE(Server-Sent Events) 챗봇 구현 내용을 정리합니다. 백엔드는 `Express + LangChain`으로 스트리밍 응답을 SSE 이벤트로 브릿지하며, 프론트는 `EventSource`로 수신합니다.

### 백엔드 엔드포인트

- `POST /api/chat/session`: 세션 생성 → `{ sessionId }` 반환
- `GET /api/chat/stream?sessionId=...`: SSE 연결. 이벤트: `start`, `chunk`, `end`, `error`, `ping`
- `POST /api/chat/send`: `{ sessionId, message, systemContext? }` → LangChain 실행, 청크를 스트리밍
- `POST /api/chat/clear`: 세션 히스토리 초기화(옵션)

구현 파일: `backend/src/routes/sseChatgotRoutes.ts`

핵심 포인트

- SSE 헤더: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`
- Heartbeat: `event: ping` 20초 간격 송신
- LangChain 스트림을 for-await로 소비하여 `event: chunk`로 전송
- 세션 상태: `Map<sessionId, { res, abort, history }>`에 저장, `close` 시 정리

### 프론트 훅/페이지

- 훅: `frontend/src/pages/sse-chatbot/hooks/useSSEChatbot.tsx`
  - 세션 생성 → `EventSource` 연결 → `start/chunk/end` 처리
  - API: `sendMessage`, `clearConversation`, `retryConnection`
  - 상태: `messages`, `inputValue`, `isConnected`, `isLoading`, `connectionFailed`
- 페이지: `frontend/src/pages/sse-chatbot/SSEChatbot.tsx`
  - 간단한 메시지 리스트/입력창/버튼 UI
  - 라우팅: `frontend/src/App.tsx` → `/sse-chatbot`

### 운영 고려사항

- Nginx/프록시: `proxy_buffering off`, `add_header X-Accel-Buffering no`, `proxy_read_timeout 3600s`
- 재연결: 브라우저 기본 재시도 사용. 세션 유지로 이어받기 가능
- 메트릭: 활성 연결 수, first_chunk_ms, complete_ms, 오류율, LLM/툴 지연 등

### 참고 자료

- React에서 SSE 수신 예제: [Softgrade - SSE with FastAPI, React, Langgraph](https://www.softgrade.org/sse-with-fastapi-react-langgraph/?utm_source=chatgpt.com)
- Node에서 SSE 전송 형태 참고: [StackOverflow - Server-Sent Events in Node.js](https://stackoverflow.com/questions/36249684/simple-way-to-implement-server-sent-events-in-node-js?utm_source=chatgpt.com)
