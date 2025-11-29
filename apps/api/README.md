# Operate/CoachOS API

Enterprise SaaS Platform Backend - NestJS REST API

## Features

- **NestJS Framework** - Scalable, enterprise-grade backend
- **API Versioning** - URI-based versioning (v1)
- **Swagger Documentation** - Auto-generated API docs at `/api/docs`
- **Health Checks** - Comprehensive health monitoring
- **Rate Limiting** - Multi-tier throttling protection
- **Global Validation** - Request validation with class-validator
- **Exception Handling** - Structured error responses
- **Response Transformation** - Consistent response format
- **Database Integration** - Prisma ORM with PostgreSQL
- **Type Safety** - Strict TypeScript configuration

## Project Structure

```
src/
├── main.ts                     # Application bootstrap
├── app.module.ts               # Root module
├── modules/                    # Feature modules
│   ├── health/                 # Health check module
│   └── database/               # Global Prisma module
├── common/                     # Shared utilities
│   ├── filters/                # Exception filters
│   ├── interceptors/           # Request/response interceptors
│   └── decorators/             # Custom decorators
└── config/                     # Configuration
    └── configuration.ts        # Config factory
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm (recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update DATABASE_URL and other configs in .env
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:cov

# Run e2e tests
pnpm test:e2e
```

## API Documentation

When running in development mode, Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

## Health Check

The health check endpoint monitors:
- Memory usage (heap and RSS)
- Disk space availability
- Application status

```bash
curl http://localhost:3000/api/v1/health
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "Invoice with ID xyz not found",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid",
    "path": "/api/v1/invoices/xyz"
  }
}
```

## Configuration

Environment variables are defined in `.env`:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- See `.env.example` for full list

## Rate Limiting

Three-tier rate limiting:
- **Short**: 10 requests per second
- **Medium**: 100 requests per minute
- **Long**: 1000 requests per 15 minutes

## Security Features

- Helmet.js security headers
- CORS configuration
- JWT authentication (ready for implementation)
- Input validation and sanitization
- Request rate limiting
- Error message sanitization (no sensitive data leakage)

## Standards Compliance

This API follows all standards defined in `/agents/RULES.md`:

- Strict TypeScript mode
- RESTful API design
- Security best practices
- Code structure conventions
- Error handling patterns
- Testing requirements

## License

UNLICENSED - Private/Proprietary
