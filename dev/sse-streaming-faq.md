## SSE 스트리밍 FAQ 및 아키텍처/워크플로 설명

### Q1. 스트리밍이 실시간으로 안 들어오고, 일정 주기마다 툭툭 끊겨서 들어오는 이유는?

다음 최적화/환경 요인들이 결합되어 청크가 모여서 도착할 수 있습니다.

- 서버측 버퍼링/플러시 정책
  - 해결: SSE 헤더 설정(`text/event-stream`, `no-cache`, `X-Accel-Buffering: no`)과 `flushHeaders()` 호출로 즉시 전송 유도.
  - 이벤트 포맷을 `event:`/`data:` + `\n\n`으로 정확히 맞춰 프록시/브라우저가 조기에 파싱할 수 있게 함.
- 리버스 프록시 버퍼링(Nginx 등)
  - 해결: `proxy_buffering off`, `proxy_cache off`, `proxy_read_timeout` 상향.
- LLM 청크 생성 주기 자체가 불균일
  - 모델/호스트 성능에 따라 청크 생성 간격이 들쭉날쭉할 수 있음.
- 프론트 처리 큐(렌더링 부하 완화)
  - 기존 WebSocket 구현에서는 UI 급격한 리렌더를 막기 위해 "청크 큐 + 30~100ms 간격 처리"를 적용했으며, SSE 훅에서도 유사한 처리(마지막 메시지 업데이트 단위)를 적용할 경우 체감상 덩어리로 보일 수 있음.
  - 필요 시 즉시 반영(큐 제거) 또는 간격 축소로 조정 가능.

참고: React에서 SSE 수신 패턴은 [Softgrade 글](https://www.softgrade.org/sse-with-fastapi-react-langgraph/?utm_source=chatgpt.com)의 `fetch-event-source` 예시처럼 메시지 단위로 즉시 append 하는 방식으로 구현할 수 있습니다.

### Q2. 전체적인 아키텍처와 워크플로는 어떻게 되나?

#### 현재(또는 본 구현)의 흐름

1. 클라이언트가 `POST /api/chat/session`으로 세션을 생성하여 `sessionId`를 취득
2. `GET /api/chat/stream?sessionId=...`로 EventSource 연결 → 서버는 `start/chunk/end`를 송신
3. 사용자가 메시지를 입력하면 `POST /api/chat/send`로 전송
4. 서버는 LangChain 스트리밍을 for-await 루프로 읽어 `chunk` 이벤트로 밀어주고, 완료 시 `end` 이벤트를 보냄
5. 필요 시 `POST /api/chat/clear`로 해당 세션의 히스토리 초기화

#### 구성요소

- 백엔드: Express + LangChain + SSE 라우트(`backend/src/routes/sseChatgotRoutes.ts`)
- 프론트: React + EventSource 훅(`frontend/src/pages/sse-chatbot/hooks/useSSEChatbot.tsx`) + 페이지(`/sse-chatbot`)
- DB/서비스: 기존 Prisma/서비스 레이어 재사용(툴콜링 확장 시 활용)
- 프록시: Nginx 설정으로 버퍼링/타임아웃 제어

#### 워크플로(시퀀스)

```
User input
  -> POST /api/chat/send { sessionId, message }
  -> Backend LangChain stream for-await
  -> SSE: event:start → event:chunk* → event:end
  -> Frontend updates UI per chunk
```

#### 장점

- 단방향 스트리밍에 단순/안정적, 프록시 친화적
- 기존 WebSocket 대비 운영/설정 복잡도가 낮음

#### 주의점

- 단방향(S→C). C→S는 별도 POST 분리
- 프록시/브라우저의 버퍼링/파싱 특성에 맞춰 이벤트 포맷과 헤더를 정확히 설정해야 함

### 참고 자료

- React에서 SSE 수신: [Softgrade - SSE with FastAPI, React, Langgraph](https://www.softgrade.org/sse-with-fastapi-react-langgraph/?utm_source=chatgpt.com)
- Node에서 SSE 전송: [StackOverflow - Server-Sent Events in Node.js](https://stackoverflow.com/questions/36249684/simple-way-to-implement-server-sent-events-in-node-js?utm_source=chatgpt.com)
