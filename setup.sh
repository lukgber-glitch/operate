#!/bin/bash
# Operate/CoachOS Setup Script
# Run this in Git Bash or WSL

set -e

echo "========================================"
echo "  Operate/CoachOS Setup Script"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  Node.js: ${GREEN}$NODE_VERSION${NC}"
else
    echo -e "  Node.js: ${RED}NOT FOUND${NC}"
    echo "  Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "  pnpm: ${GREEN}$PNPM_VERSION${NC}"
else
    echo -e "  pnpm: ${YELLOW}NOT FOUND - Installing...${NC}"
    npm install -g pnpm@8.15.1
    echo -e "  pnpm: ${GREEN}$(pnpm --version) installed${NC}"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "  Docker: ${GREEN}$DOCKER_VERSION${NC}"
else
    echo -e "  Docker: ${RED}NOT FOUND${NC}"
    echo "  Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    exit 1
fi

echo ""
echo -e "${YELLOW}[2/6] Starting database services (PostgreSQL + Redis)...${NC}"

# Start only database services
docker compose up -d postgres redis
sleep 5

# Wait for PostgreSQL to be healthy
echo "  Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U operate &> /dev/null; then
        echo -e "  PostgreSQL: ${GREEN}Ready${NC}"
        break
    fi
    sleep 1
done

# Check Redis
if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "  Redis: ${GREEN}Ready${NC}"
else
    echo -e "  Redis: ${YELLOW}Starting...${NC}"
fi

echo ""
echo -e "${YELLOW}[3/6] Installing dependencies...${NC}"
pnpm install

echo ""
echo -e "${YELLOW}[4/6] Setting up environment...${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "  Created .env from .env.example"
else
    echo "  .env already exists"
fi

echo ""
echo -e "${YELLOW}[5/6] Running database migrations...${NC}"
cd packages/database
pnpm prisma generate
pnpm prisma migrate dev --name init
cd ../..

echo ""
echo -e "${YELLOW}[6/6] Running tests...${NC}"
pnpm test || true

echo ""
echo -e "${GREEN}========================================"
echo "  Setup Complete!"
echo "========================================${NC}"
echo ""
echo -e "${CYAN}To start the development server:${NC}"
echo "  pnpm dev"
echo ""
echo -e "${CYAN}Services running:${NC}"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - API: http://localhost:3000 (after pnpm dev)"
echo "  - Web: http://localhost:3001 (after pnpm dev)"
echo ""
