FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

# Copy entire monorepo
COPY . .

# Install all deps
RUN pnpm install --frozen-lockfile

# Build shared first, then the service
RUN pnpm --filter @trovestak/shared build
RUN pnpm --filter agent-service build

# ── Production runner ─────────────────────────────────────────────────────────
# We deliberately use a single-stage approach here: copy the full pnpm
# virtual store (.pnpm folder) plus the agent-service's shallow node_modules
# (which has symlinks INTO the .pnpm store). This is the only correct way to
# run a pnpm monorepo service without rebuilding the lockfile.
FROM node:22-slim AS runner
WORKDIR /app

# 1. Bring the pnpm virtual store (all real package files + their transitive deps)
COPY --from=base /app/node_modules/.pnpm ./node_modules/.pnpm

# 2. Bring the agent-service shallow node_modules (symlinks into .pnpm store)
COPY --from=base /app/apps/agent-service/node_modules ./node_modules

# 3. Bring the shared package — replace any symlink with the real built dist
RUN rm -rf ./node_modules/@trovestak/shared
COPY --from=base /app/packages/shared/package.json ./node_modules/@trovestak/shared/package.json
COPY --from=base /app/packages/shared/dist ./node_modules/@trovestak/shared/dist

# 4. Bring the compiled agent-service JS
COPY --from=base /app/apps/agent-service/dist ./dist
COPY --from=base /app/apps/agent-service/package.json ./package.json

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
