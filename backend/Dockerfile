FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

FROM dependencies AS builder

COPY tsconfig.json tsup.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN test -f src/generated/prisma/index.js || \
  (echo "Prisma client is missing. Run: docker compose --profile tools run --rm backend-tools npm run db:generate" && exit 1)
RUN npm run build

FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3050

CMD ["node", "dist/index.js"]
