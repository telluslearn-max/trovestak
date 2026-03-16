FROM node:22-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.0 --activate

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/order-service/package.json ./apps/order-service/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY apps/order-service/ ./apps/order-service/

WORKDIR /app
RUN pnpm --filter @trovestak/shared build

WORKDIR /app/apps/order-service
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=base /app/apps/order-service/dist ./dist
COPY --from=base /app/apps/order-service/node_modules ./node_modules
COPY --from=base /app/apps/order-service/package.json ./

EXPOSE 8082
CMD ["node", "dist/index.js"]
