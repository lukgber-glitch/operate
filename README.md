# Operate/CoachOS

Enterprise SaaS platform built with Turborepo monorepo architecture.

## Project Structure

```
operate/
├── apps/
│   ├── api/           # NestJS Backend API
│   ├── web/           # Next.js 14 Frontend
│   └── workers/       # Background Workers
├── packages/
│   ├── database/      # Prisma Schema & Client
│   ├── shared/        # Shared Types & Utilities
│   └── ai/            # AI Integrations (OpenAI, Anthropic)
├── infrastructure/
│   ├── docker/        # Dockerfiles
│   ├── kubernetes/    # K8s manifests
│   └── terraform/     # Infrastructure as Code
└── docs/              # Documentation
```

## Tech Stack

- **Monorepo**: Turborepo
- **Backend**: NestJS
- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Database**: PostgreSQL + Prisma
- **Cache/Queue**: Redis + Bull
- **AI**: OpenAI, Anthropic Claude
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Local Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- PgAdmin (port 5050)
- Redis Commander (port 8081)

### 3. Setup Database

```bash
# Generate Prisma Client
pnpm --filter @operate/database db:generate

# Run migrations
pnpm --filter @operate/database db:migrate

# Seed database (optional)
pnpm --filter @operate/database db:seed
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Start Development

```bash
# Start all apps in dev mode
pnpm dev

# Or start specific apps
pnpm --filter @operate/api dev
pnpm --filter @operate/web dev
pnpm --filter @operate/workers dev
```

## Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm test` - Run tests
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean all build artifacts

## Services

- **API**: http://localhost:3001
- **Web**: http://localhost:3000
- **PgAdmin**: http://localhost:5050 (admin@operate.com / admin)
- **Redis Commander**: http://localhost:8081

## Development Workflow

1. Create feature branch
2. Make changes
3. Run `pnpm lint` and `pnpm typecheck`
4. Run tests `pnpm test`
5. Commit with conventional commits
6. Create PR

## Building for Production

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @operate/api build
pnpm --filter @operate/web build
```

## Docker

Build and run with Docker:

```bash
# Build API
docker build -f infrastructure/docker/api.Dockerfile -t operate-api .

# Build Web
docker build -f infrastructure/docker/web.Dockerfile -t operate-web .

# Run
docker run -p 3001:3001 operate-api
docker run -p 3000:3000 operate-web
```

## License

Proprietary - All Rights Reserved
