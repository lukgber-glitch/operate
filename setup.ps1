# Operate/CoachOS Setup Script
# Run this in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Operate/CoachOS Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  Node.js: NOT FOUND - Please install Node.js 20+" -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Gray
    exit 1
}

# Check pnpm
$pnpmVersion = pnpm --version 2>$null
if ($pnpmVersion) {
    Write-Host "  pnpm: $pnpmVersion" -ForegroundColor Green
} else {
    Write-Host "  pnpm: NOT FOUND - Installing..." -ForegroundColor Yellow
    npm install -g pnpm@8.15.1
    $pnpmVersion = pnpm --version
    Write-Host "  pnpm: $pnpmVersion installed" -ForegroundColor Green
}

# Check Docker
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "  Docker: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "  Docker: NOT FOUND - Please install Docker Desktop" -ForegroundColor Red
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[2/6] Starting database services (PostgreSQL + Redis)..." -ForegroundColor Yellow
Set-Location $PSScriptRoot

# Start only database services
docker compose up -d postgres redis
Start-Sleep -Seconds 5

# Wait for PostgreSQL to be healthy
Write-Host "  Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
$retries = 30
while ($retries -gt 0) {
    $pgReady = docker compose exec -T postgres pg_isready -U operate 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PostgreSQL: Ready" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $retries--
}

# Check Redis
$redisReady = docker compose exec -T redis redis-cli ping 2>$null
if ($redisReady -eq "PONG") {
    Write-Host "  Redis: Ready" -ForegroundColor Green
} else {
    Write-Host "  Redis: Starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/6] Installing dependencies..." -ForegroundColor Yellow
pnpm install

Write-Host ""
Write-Host "[4/6] Setting up environment..." -ForegroundColor Yellow

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host "  .env already exists" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[5/6] Running database migrations..." -ForegroundColor Yellow
Set-Location "packages/database"
pnpm prisma generate
pnpm prisma migrate dev --name init
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "[6/6] Running tests..." -ForegroundColor Yellow
pnpm test

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Cyan
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  - PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "  - Redis: localhost:6379" -ForegroundColor White
Write-Host "  - API: http://localhost:3000 (after pnpm dev)" -ForegroundColor White
Write-Host "  - Web: http://localhost:3001 (after pnpm dev)" -ForegroundColor White
Write-Host ""
