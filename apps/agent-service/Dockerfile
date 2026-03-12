FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

# Copy entire monorepo
COPY . .

# Install all deps (needed for build)
RUN pnpm install --frozen-lockfile

# Build everything
RUN pnpm --filter @trovestak/shared build
RUN pnpm --filter agent-service build

# ── Production bundle creation ───────────────────────────────────────────────
# We use pnpm deploy to get the production node_modules
RUN pnpm --filter agent-service deploy --prod --legacy /prod/agent-service

# CRITICAL: pnpm deploy often creates symlinks for workspace packages. 
# We must replace the @trovestak/shared symlink with the real built package.
RUN rm -rf /prod/agent-service/node_modules/@trovestak/shared
RUN mkdir -p /prod/agent-service/node_modules/@trovestak/shared
RUN cp -a /app/packages/shared/package.json /prod/agent-service/node_modules/@trovestak/shared/
RUN cp -a /app/packages/shared/dist /prod/agent-service/node_modules/@trovestak/shared/

# Copy axios — it's in shared's deps but not in agent-service's direct deps.
# pnpm deploy only bundles direct deps, so we must copy it manually.
RUN mkdir -p /prod/agent-service/node_modules/axios
RUN cp -rfa /app/node_modules/axios /prod/agent-service/node_modules/ 2>/dev/null || \
    find /app/node_modules/.pnpm -maxdepth 4 -type d -name 'axios' | head -1 | xargs -I{} cp -rfa {} /prod/agent-service/node_modules/

# ── Production runner ─────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Copy the self-contained bundle (node_modules + package.json)
COPY --from=base /prod/agent-service ./

# Copy the agent-service's own built JS
COPY --from=base /app/apps/agent-service/dist ./dist

EXPOSE 8080
ENV NODE_ENV=production
# Force ES modules if needed, though package.json type:module should handle it
CMD ["node", "dist/index.js"]
