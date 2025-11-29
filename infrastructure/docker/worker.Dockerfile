# =============================================================================
# Base Stage - Common setup for all stages
# =============================================================================
FROM node:20-alpine AS base

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@8.15.1

# Install system dependencies required for building native modules
RUN apk add --no-cache libc6-compat

# =============================================================================
# Dependencies Stage - Install all dependencies
# =============================================================================
FROM base AS dependencies

# Copy package management files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy workspace package files for dependency resolution
COPY apps/workers/package.json ./apps/workers/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai/package.json ./packages/ai/

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# =============================================================================
# Development Stage - For local development with hot reload
# =============================================================================
FROM dependencies AS development

# Copy source code
COPY apps/workers ./apps/workers
COPY packages ./packages
COPY tsconfig.json ./

# Generate Prisma Client
RUN pnpm --filter @operate/database db:generate

EXPOSE 3002

ENV NODE_ENV=development

# Development uses tsx watch for hot reload
CMD ["pnpm", "--filter", "@operate/workers", "dev"]

# =============================================================================
# Builder Stage - Build the application
# =============================================================================
FROM dependencies AS builder

# Copy source code
COPY apps/workers ./apps/workers
COPY packages ./packages
COPY tsconfig.json ./

# Generate Prisma Client
RUN pnpm --filter @operate/database db:generate

# Build all packages and the workers
RUN pnpm --filter @operate/shared build
RUN pnpm --filter @operate/ai build
RUN pnpm --filter @operate/workers build

# =============================================================================
# Production Dependencies Stage - Install only production dependencies
# =============================================================================
FROM base AS prod-dependencies

# Copy package management files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/workers/package.json ./apps/workers/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai/package.json ./packages/ai/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# =============================================================================
# Production Stage - Minimal production image
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install process monitoring tools for healthcheck
RUN apk add --no-cache procps

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from prod-dependencies stage
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/package.json ./package.json

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/apps/workers/dist ./apps/workers/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/workers/package.json ./apps/workers/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/ai/dist ./packages/ai/dist

# Copy Prisma generated client
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f node || exit 1

CMD ["node", "apps/workers/dist/index.js"]
