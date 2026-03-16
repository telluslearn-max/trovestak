FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/catalog-service/package.json ./apps/catalog-service/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @trovestak/catalog-service --filter @trovestak/shared

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/catalog-service/node_modules ./apps/catalog-service/node_modules
COPY packages/shared ./packages/shared
COPY apps/catalog-service ./apps/catalog-service
RUN pnpm --filter @trovestak/shared build
RUN pnpm --filter @trovestak/catalog-service build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/catalog-service/dist ./dist
COPY --from=build /app/apps/catalog-service/node_modules ./node_modules
EXPOSE 8083
CMD ["node", "dist/index.js"]
