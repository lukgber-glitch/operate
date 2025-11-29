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
COPY apps/api/package.json ./apps/api/
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
COPY apps/api ./apps/api
COPY packages ./packages
COPY tsconfig.json ./

# Generate Prisma Client
RUN pnpm --filter @operate/database db:generate

# Expose API and debugger ports
EXPOSE 3000 9229

ENV NODE_ENV=development

# Development uses pnpm dev command (hot reload)
CMD ["pnpm", "--filter", "@operate/api", "dev"]

# =============================================================================
# Builder Stage - Build the application
# =============================================================================
FROM dependencies AS builder

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages
COPY tsconfig.json ./

# Generate Prisma Client
RUN pnpm --filter @operate/database db:generate

# Build all packages and the API
RUN pnpm --filter @operate/shared build
RUN pnpm --filter @operate/ai build
RUN pnpm --filter @operate/api build

# =============================================================================
# Production Dependencies Stage - Install only production dependencies
# =============================================================================
FROM base AS prod-dependencies

# Copy package management files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/api/package.json ./apps/api/
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

# Install wget for healthchecks
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from prod-dependencies stage
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/package.json ./package.json

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/ai/dist ./packages/ai/dist

# Copy Prisma generated client
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma

# Switch to non-root user
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
