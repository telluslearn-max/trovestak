FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

# Copy all files (monorepo root)
COPY . .

# Install dependencies - this will use the fresh pnpm-lock.yaml I just generated
RUN pnpm install --frozen-lockfile

# Build the shared library first
RUN pnpm --filter @trovestak/shared build

# Build the agent service
WORKDIR /app/apps/agent-service
RUN pnpm run build

# Production image
FROM node:22-slim AS runner
WORKDIR /app
COPY --from=base /app/apps/agent-service/dist ./dist
COPY --from=base /app/apps/agent-service/node_modules ./node_modules
COPY --from=base /app/apps/agent-service/package.json ./
# We also need the shared library dist for runtime!
COPY --from=base /app/packages/shared/dist /app/packages/shared/dist
COPY --from=base /app/packages/shared/package.json /app/packages/shared/package.json

EXPOSE 8080
CMD ["node", "dist/index.js"]
