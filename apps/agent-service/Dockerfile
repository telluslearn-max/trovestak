FROM node:22-slim
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.0 --activate

# Copy entire monorepo — symlinks will resolve correctly since nothing moves
COPY . .

# Install all deps
RUN pnpm install --frozen-lockfile

# Build shared library (creates packages/shared/dist/)
RUN pnpm --filter @trovestak/shared build

# Build agent service (creates apps/agent-service/dist/)
RUN pnpm --filter agent-service build

EXPOSE 8080
ENV NODE_ENV=production

# Run from monorepo root so all pnpm workspace symlinks remain valid
CMD ["node", "apps/agent-service/dist/index.js"]
