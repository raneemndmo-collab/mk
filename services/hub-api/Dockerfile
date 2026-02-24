FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/beds24-sdk/package.json packages/beds24-sdk/
COPY services/hub-api/package.json services/hub-api/
RUN pnpm install --frozen-lockfile --filter @mk/hub-api...

# Build
FROM deps AS build
COPY packages/ packages/
COPY services/hub-api/ services/hub-api/
RUN pnpm --filter @mk/shared build 2>/dev/null || true
RUN pnpm --filter @mk/beds24-sdk build 2>/dev/null || true
RUN pnpm --filter @mk/hub-api build 2>/dev/null || true

# Production
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY --from=build /app/ ./
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "--loader", "tsx/esm", "services/hub-api/src/index.ts"]
