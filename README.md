# Operate API

Enterprise SaaS platform for SME business operations, tax automation, and HR management.

## Live Deployment

**Production URL:** https://operate.guru

| Component | Details |
|-----------|---------|
| **API** | https://operate.guru/api/v1 |
| **Server** | Cloudways (164.90.202.153) |
| **Database** | Neon PostgreSQL (serverless) |
| **Process** | PM2 (operate-api) |

## Tech Stack

- **Backend:** NestJS 10 + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis
- **AI:** Anthropic Claude

## Configured Integrations

- Anthropic Claude AI
- Google OAuth
- TrueLayer (EU/UK Open Banking - Sandbox)

## Project Structure

```
operate-live/
├── apps/api/           # NestJS Backend API
├── packages/database/  # Prisma schema & client
├── packages/shared/    # Shared types & utilities
├── packages/ai/        # AI service integrations
├── index.php           # Apache → Node.js proxy
└── .htaccess           # URL routing
```

## Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
cd packages/database && npx prisma generate

# Build API
cd apps/api && npm run build

# Start API
npm start
```

## Environment Variables

Copy `.env.example` to `.env` in `apps/api/` and configure:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - Auth secrets
- `REDIS_*` - Redis configuration
- `ANTHROPIC_API_KEY` - Claude AI API key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth

## Deployment

The API runs on Cloudways with PM2 process manager.

```bash
# SSH to server
ssh cloudways

# Restart API
pm2 restart operate-api

# View logs
pm2 logs operate-api
```

## Next Phase

Implementing **Chat-First Frontend** - see development branch for progress.
