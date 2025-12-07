#!/bin/bash

# Performance Optimization Dependencies Installation Script
# Sprint 7 - Task 6
# Date: December 7, 2025

set -e

echo "========================================="
echo "Installing Performance Optimization Deps"
echo "========================================="
echo ""

# Navigate to API directory
cd "$(dirname "$0")/../apps/api"

echo "📦 Installing compression package..."
pnpm add compression
pnpm add -D @types/compression

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Build the API: pnpm build"
echo "2. Test locally: pnpm start"
echo "3. Check performance endpoints:"
echo "   - GET /api/admin/performance/metrics"
echo "   - GET /api/admin/performance/cache"
echo "   - GET /api/admin/performance/database"
echo "   - GET /api/admin/performance/health"
echo ""
echo "See PERFORMANCE_OPTIMIZATION.md for full documentation"
echo ""
