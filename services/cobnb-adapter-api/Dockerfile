FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/cobnb-adapter-api/package.json services/cobnb-adapter-api/
RUN pnpm install --frozen-lockfile --filter @mk/cobnb-adapter-api... 2>/dev/null || pnpm install --filter @mk/cobnb-adapter-api...
COPY packages/ packages/
COPY services/cobnb-adapter-api/ services/cobnb-adapter-api/
ENV NODE_ENV=production
EXPOSE 4001
CMD ["node", "--loader", "tsx/esm", "services/cobnb-adapter-api/src/index.ts"]
