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
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# =============================================================================
# Development Stage - For local development with hot reload
# =============================================================================
FROM dependencies AS development

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

EXPOSE 3000

# Development uses pnpm dev command (hot reload)
CMD ["pnpm", "--filter", "@operate/web", "dev"]

# =============================================================================
# Builder Stage - Build the application
# =============================================================================
FROM dependencies AS builder

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Build shared package first
RUN pnpm --filter @operate/shared build

# Set Next.js environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application with standalone output
RUN pnpm --filter @operate/web build

# =============================================================================
# Production Stage - Minimal production image
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install wget for healthchecks
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy public assets
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
