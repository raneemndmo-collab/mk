FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/monthlykey-adapter-api/package.json services/monthlykey-adapter-api/
RUN pnpm install --frozen-lockfile --filter @mk/monthlykey-adapter-api... 2>/dev/null || pnpm install --filter @mk/monthlykey-adapter-api...
COPY packages/ packages/
COPY services/monthlykey-adapter-api/ services/monthlykey-adapter-api/
ENV NODE_ENV=production
EXPOSE 4002
CMD ["node", "--loader", "tsx/esm", "services/monthlykey-adapter-api/src/index.ts"]
