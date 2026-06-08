# Smart Warehouse deployment

Run all commands from the repository root.

## 1. Environment

Create `.env` from `.env.example` and set the production secrets. Keep
`VITE_API_BASE_URL` empty when the frontend nginx should proxy `/api`.

The VPS must already provide the external Docker network used by Nginx Proxy
Manager:

```bash
docker network inspect npm-network
```

## 2. Database preparation

Prisma generation, schema creation, and seed loading are intentionally separate
from application deployment.

```bash
docker compose --profile tools run --rm backend-tools npm run db:generate
docker compose --profile tools run --rm backend-tools npm run db:push
docker compose --profile tools run --rm backend-tools npm run seed
```

The seed command creates six months of weekday data through the day before it
is executed, using the `Asia/Seoul` calendar.

## 3. Deploy

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f warehouse-backend warehouse-frontend
```

The frontend is published on `FRONTEND_PORT` and proxies `/api` to the backend.
The backend is also published on `BACKEND_PORT` for direct health checks.
