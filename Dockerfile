FROM node:22-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN corepack enable && pnpm install --frozen-lockfile

COPY backend backend
COPY frontend frontend

RUN pnpm build

FROM node:22-alpine AS backend

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json

RUN corepack enable && pnpm install --filter tew-backend --prod --frozen-lockfile

COPY --from=build /app/backend/dist backend/dist

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]
