# Smart Warehouse 배포 가이드

이 문서는 `/home/coder/project/smart-warehouse/docker-compose.yml` 기준의 운영 배포 절차를 정리합니다. 모든 명령은 저장소 루트에서 실행합니다.

```bash
cd ~/smart-warehouse
```

## 1. 배포 구조

루트 `docker-compose.yml`은 다음 컨테이너를 실행합니다.

| 서비스 | 컨테이너 | 내부 포트 | 외부 포트 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `warehouse-frontend` | `warehouse-frontend` | `80` | `3187` | 빌드된 React 앱을 nginx로 서빙하고 `/api`를 백엔드로 프록시 |
| `warehouse-backend` | `warehouse-backend` | `3050` | `3188` | Express API, Prisma, SSE 챗봇 |
| `backend-tools` | 임시 컨테이너 | - | - | Prisma generate/push/seed 실행용 |

외부 도메인(`https://warehouse.jongchoi.com`)은 Nginx Proxy Manager 또는 외부 nginx/openresty에서 `warehouse-frontend:80` 또는 호스트의 `3187` 포트로 프록시합니다.

## 2. 사전 준비

### Docker 네트워크 확인

`docker-compose.yml`은 외부 Docker 네트워크 `npm-network`를 사용합니다. Nginx Proxy Manager도 같은 네트워크에 붙어 있어야 컨테이너 이름으로 접근할 수 있습니다.

```bash
docker network inspect npm-network
```

없다면 먼저 생성합니다.

```bash
docker network create npm-network
```

### 환경 변수 설정

`.env.example`을 복사해서 `.env`를 만듭니다.

```bash
cp .env.example .env
```

운영 환경에서 최소한 아래 값을 확인합니다.

```env
VITE_API_BASE_URL=
FRONTEND_PORT=3187
BACKEND_PORT=3188
DATABASE_URL=file:/app/data/dev.db
CORS_ORIGIN=https://warehouse.jongchoi.com

OLLAMA_API_KEY=...
OLLAMA_BASE_URL=...
OLLAMA_MODEL_NAME=gpt-oss:120b

OPENROUTER_API_KEY=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_NAME=openai/gpt-oss-120b
```

`VITE_API_BASE_URL`은 비워두는 것을 권장합니다. 비워두면 프론트엔드는 같은 도메인의 `/api`를 호출하고, 프론트 nginx가 내부 백엔드로 프록시합니다.

## 3. 데이터베이스 준비

Prisma client 생성, 스키마 반영, seed 데이터 생성은 애플리케이션 배포와 분리해서 실행합니다.

```bash
docker compose --profile tools run --rm backend-tools npm run db:generate
docker compose --profile tools run --rm backend-tools npm run db:push
docker compose --profile tools run --rm backend-tools npm run seed
```

seed 명령은 `Asia/Seoul` 기준으로 실행일 전날까지의 평일 데이터를 생성합니다.

## 4. 배포

이미 실행 중인 컨테이너가 있으면 최신 이미지로 다시 빌드해서 올립니다.

```bash
docker compose up -d --build
```

상태를 확인합니다.

```bash
docker compose ps
```

정상 예시는 다음과 같습니다.

```text
NAME                 SERVICE              STATUS                    PORTS
warehouse-backend    warehouse-backend    Up ... (healthy)          0.0.0.0:3188->3050/tcp
warehouse-frontend   warehouse-frontend   Up ...                    0.0.0.0:3187->80/tcp
```

로그는 아래처럼 확인합니다.

```bash
docker logs warehouse-backend --since 10m
docker logs warehouse-frontend --since 10m
```

## 5. 외부 nginx / Nginx Proxy Manager 설정

기본 프록시는 `warehouse.jongchoi.com`을 프론트엔드로 연결합니다.

Nginx Proxy Manager가 `npm-network`에 붙어 있고 컨테이너 이름을 해석할 수 있다면:

```text
Forward Hostname/IP: warehouse-frontend
Forward Port: 80
Scheme: http
```

컨테이너 이름 해석이 안 되면 호스트 포트로 연결합니다.

```text
Forward Hostname/IP: 127.0.0.1
Forward Port: 3187
Scheme: http
```

프론트 컨테이너 내부 nginx는 `/api/` 요청을 `warehouse-backend:3050`으로 넘기도록 이미 설정되어 있습니다.

## 6. 챗봇 SSE 스트리밍 설정

챗봇은 `EventSource` 기반 SSE를 사용합니다.

브라우저는 다음 순서로 연결합니다.

```text
POST /api/chat/session
GET  /api/chat/stream?sessionId=...
POST /api/chat/send
```

일반 API는 정상인데 챗봇 패널이 계속 `챗봇에 연결 중...` 상태라면, 대부분 외부 nginx/openresty/Nginx Proxy Manager가 SSE 응답을 버퍼링하고 있는 상태입니다.

이 경우 외부 nginx에 `/api/chat/stream` 전용 location을 추가합니다.

```nginx
location /api/chat/stream {
  proxy_pass http://warehouse-backend:3050;
  proxy_http_version 1.1;
  proxy_set_header Connection "";
  proxy_buffering off;
  proxy_cache off;
  gzip off;
  add_header X-Accel-Buffering no always;
  proxy_read_timeout 3600s;
  proxy_send_timeout 3600s;
}
```

Nginx Proxy Manager에서 설정한다면 `Custom Locations`에 `/api/chat/stream`을 추가하고 백엔드로 직접 보냅니다.

```text
Location: /api/chat/stream
Forward Hostname/IP: warehouse-backend
Forward Port: 3050
Scheme: http
```

그리고 해당 custom location의 Advanced 설정에 아래 내용을 넣습니다.

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_buffering off;
proxy_cache off;
gzip off;
add_header X-Accel-Buffering no always;
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;
```

Nginx Proxy Manager가 `warehouse-backend` 이름을 해석하지 못하면 호스트 포트로 연결합니다.

```text
Forward Hostname/IP: 127.0.0.1
Forward Port: 3188
Scheme: http
```

## 7. 방금 겪은 이슈와 확인 방법

### 증상

- 페이지와 일반 API는 정상 동작
- `POST /api/chat/session`은 `200`으로 `sessionId`를 발급
- 챗봇 패널은 계속 `챗봇에 연결 중...`
- 외부에서 SSE 확인 시 헤더/본문이 내려오지 않음

```bash
curl -N --http1.1 --max-time 25 \
  -H "Accept: text/event-stream" \
  "https://warehouse.jongchoi.com/api/chat/stream?sessionId=<SESSION_ID>"
```

문제가 있을 때는 다음처럼 타임아웃이 발생할 수 있습니다.

```text
Operation timed out ... with 0 bytes received
```

### 백엔드 로그에서 보이는 신호

백엔드 로그에는 SSE 요청이 정상 도착하고 즉시 `200`으로 열린 기록이 남습니다.

```text
GET /api/chat/stream?sessionId=... 200 0.168 ms - -
```

여기서 `- -`는 SSE 응답이라 `Content-Length`가 없는 것이므로 이상 징후가 아닙니다.

### 원인

백엔드는 `text/event-stream` 헤더, `X-Accel-Buffering: no`, `flushHeaders()`, 초기 `start/chunk/end` 이벤트를 즉시 보냅니다. 그런데 외부 도메인에서 헤더조차 내려오지 않는다면 백엔드 문제가 아니라 외부 프록시 계층에서 SSE 응답이 flush되지 않는 것입니다.

### 해결

외부 nginx/Nginx Proxy Manager에 `/api/chat/stream` 전용 location을 추가하고 다음을 적용합니다.

- 백엔드로 직접 프록시
- `proxy_buffering off`
- `proxy_cache off`
- `gzip off`
- 긴 `proxy_read_timeout`
- `Connection` 헤더 비우기
- `X-Accel-Buffering no`

적용 후 다시 확인합니다.

```bash
SESSION_ID=$(curl -sS -X POST https://warehouse.jongchoi.com/api/chat/session | sed -n 's/.*"sessionId":"\([^"]*\)".*/\1/p')

curl -N --http1.1 --max-time 10 \
  -H "Accept: text/event-stream" \
  "https://warehouse.jongchoi.com/api/chat/stream?sessionId=${SESSION_ID}"
```

정상이라면 `event: start`, `event: chunk`, `event: end`가 바로 출력됩니다.

## 8. 기본 점검 명령

외부 헬스 체크:

```bash
curl -i https://warehouse.jongchoi.com/health
```

일반 API:

```bash
curl -i "https://warehouse.jongchoi.com/api/waybills?limit=1"
```

챗봇 세션:

```bash
curl -i -X POST https://warehouse.jongchoi.com/api/chat/session
```

컨테이너 상태:

```bash
docker compose ps
```

백엔드 로그:

```bash
docker logs warehouse-backend --since 10m
```
