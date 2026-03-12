FROM node:22-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/mpesa-service/package.json ./apps/mpesa-service/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY apps/mpesa-service/ ./apps/mpesa-service/

WORKDIR /app/apps/mpesa-service
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=base /app/apps/mpesa-service/dist ./dist
COPY --from=base /app/apps/mpesa-service/node_modules ./node_modules
COPY --from=base /app/apps/mpesa-service/package.json ./

EXPOSE 8081
CMD ["node", "dist/index.js"]
