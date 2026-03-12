FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

# Copy entire monorepo
COPY . .

# Install all deps (needed for build)
RUN pnpm install --frozen-lockfile

# Build the shared library first
RUN pnpm --filter @trovestak/shared build

# Build the agent service
RUN pnpm --filter agent-service build

# Use pnpm deploy to create a self-contained production bundle
# This resolves all pnpm symlinks into real node_modules — no symlinks in the runner
RUN pnpm --filter agent-service deploy --prod /prod/agent-service

# Copy the shared dist into the deployed bundle so @trovestak/shared resolves at runtime
RUN mkdir -p /prod/agent-service/node_modules/@trovestak/shared
RUN cp -r /app/packages/shared/dist /prod/agent-service/node_modules/@trovestak/shared/dist
RUN cp /app/packages/shared/package.json /prod/agent-service/node_modules/@trovestak/shared/package.json

# ── Production runner ─────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Copy the self-contained bundle from the base stage
COPY --from=base /prod/agent-service ./

# Copy built JS output (pnpm deploy doesn't copy dist)
COPY --from=base /app/apps/agent-service/dist ./dist

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
