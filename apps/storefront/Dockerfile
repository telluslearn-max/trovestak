FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.0 --activate

# Copy all files
COPY . .

# Build arguments for Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared library
RUN pnpm --filter @trovestak/shared build

# Build storefront
WORKDIR /app/apps/storefront
RUN pnpm run build

# Production runner stage
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Security
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs

# Copy standalone output
COPY --from=base --chown=nextjs:nodejs /app/apps/storefront/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=base /app/apps/storefront/public ./apps/storefront/public

USER nextjs
EXPOSE 8080
CMD ["node", "apps/storefront/server.js"]
