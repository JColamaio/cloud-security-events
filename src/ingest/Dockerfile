FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY src/shared/package.json ./src/shared/
COPY src/ingest/package.json ./src/ingest/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared/node_modules ./src/shared/node_modules
COPY --from=deps /app/src/ingest/node_modules ./src/ingest/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY src/shared ./src/shared
COPY src/ingest ./src/ingest
RUN pnpm --filter @cse/shared build && pnpm --filter @cse/ingest build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared/node_modules ./src/shared/node_modules
COPY --from=deps /app/src/ingest/node_modules ./src/ingest/node_modules
COPY --from=build /app/src/shared/dist ./src/shared/dist
COPY --from=build /app/src/ingest/dist ./src/ingest/dist
COPY src/shared/package.json ./src/shared/
COPY src/ingest/package.json ./src/ingest/
COPY package.json ./

EXPOSE 3000
CMD ["node", "src/ingest/dist/index.js"]
