# Trovestak

A Turborepo monorepo with Next.js 15 and MedusaJS v2.

## Structure

```
trovestak/
├── apps/
│   └── storefront/          # Next.js 15 App Router
├── packages/
│   └── medusa-backend/      # MedusaJS v2 server
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (Neon recommended)

### Installation

```bash
pnpm install
```

## Medusa Backend Setup

The Medusa backend requires a PostgreSQL database. See [packages/medusa-backend/SETUP.md](packages/medusa-backend/SETUP.md) for detailed instructions.

### Quick Setup:

1. **Update database connection** in `packages/medusa-backend/.env`:
   ```
   DATABASE_URL=postgres://username:password@your-neon-host/dbname?sslmode=require
   ```

2. **Run migrations**:
   ```bash
   cd packages/medusa-backend
   pnpm migrate
   ```

3. **Seed data**:
   ```bash
   pnpm seed
   ```

4. **Start server**:
   ```bash
   pnpm dev
   ```

Server runs on **http://localhost:9000**

## Development

Run all apps in development mode:

```bash
pnpm dev
```

Or run individually:

```bash
# Storefront only (port 3000)
pnpm --filter @trovestak/storefront dev

# Medusa backend only (port 9000)
pnpm --filter @trovestak/medusa-backend dev
```

### Build

```bash
pnpm build
```

### Start Production

```bash
pnpm start
```

## Environment Variables

### Storefront (apps/storefront)

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` - Medusa backend URL

### Medusa Backend (packages/medusa-backend)

See `packages/medusa-backend/.env`:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - JWT signing secret
- `COOKIE_SECRET` - Cookie encryption secret
- `STORE_CORS` - Allowed storefront origins
- `ADMIN_CORS` - Allowed admin origins

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: MedusaJS v2 with PostgreSQL, TypeScript
- **Package Manager**: pnpm

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm start` | Start all apps in production |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type check all packages |

## Architecture

### Turborepo Pipeline

```json
{
  "dev": { "cache": false, "persistent": true },
  "build": { "dependsOn": ["^build"] },
  "start": { "cache": false, "persistent": true }
}
```

### Ports

- Storefront: 3000
- Medusa Backend: 9000
- Medusa Admin: 7001 (when running admin dashboard)
