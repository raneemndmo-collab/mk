FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/worker/package.json services/worker/
RUN pnpm install --frozen-lockfile --filter @mk/worker... 2>/dev/null || pnpm install --filter @mk/worker...
COPY packages/ packages/
COPY services/worker/ services/worker/
ENV NODE_ENV=production
CMD ["node", "--loader", "tsx/esm", "services/worker/src/index.ts"]
