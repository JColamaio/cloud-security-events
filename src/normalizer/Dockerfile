FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY src/shared/package.json ./src/shared/
COPY src/normalizer/package.json ./src/normalizer/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared/node_modules ./src/shared/node_modules
COPY --from=deps /app/src/normalizer/node_modules ./src/normalizer/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY src/shared ./src/shared
COPY src/normalizer ./src/normalizer
RUN pnpm --filter @cse/shared build && pnpm --filter @cse/normalizer build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared/node_modules ./src/shared/node_modules
COPY --from=deps /app/src/normalizer/node_modules ./src/normalizer/node_modules
COPY --from=build /app/src/shared/dist ./src/shared/dist
COPY --from=build /app/src/normalizer/dist ./src/normalizer/dist
COPY src/shared/package.json ./src/shared/
COPY src/normalizer/package.json ./src/normalizer/
COPY package.json ./

EXPOSE 3001
CMD ["node", "src/normalizer/dist/index.js"]
