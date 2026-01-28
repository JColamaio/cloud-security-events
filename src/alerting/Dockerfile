FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY src/shared/package.json ./src/shared/
COPY src/alerting/package.json ./src/alerting/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared/node_modules ./src/shared/node_modules
COPY --from=deps /app/src/alerting/node_modules ./src/alerting/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY src/shared ./src/shared
COPY src/alerting ./src/alerting
RUN pnpm --filter @cse/shared build && pnpm --filter @cse/alerting build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared/node_modules ./src/shared/node_modules
COPY --from=deps /app/src/alerting/node_modules ./src/alerting/node_modules
COPY --from=build /app/src/shared/dist ./src/shared/dist
COPY --from=build /app/src/alerting/dist ./src/alerting/dist
COPY src/shared/package.json ./src/shared/
COPY src/alerting/package.json ./src/alerting/
COPY src/alerting/src/rules ./src/alerting/dist/rules
COPY package.json ./

EXPOSE 3002
CMD ["node", "src/alerting/dist/index.js"]
