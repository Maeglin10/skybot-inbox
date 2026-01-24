#!/bin/bash
set -e

echo "🔧 Checking for failed migrations..."

# Resolve the failed migration if it exists (ignore errors if it doesn't exist)
npx prisma migrate resolve --rolled-back 20260124063500_remove_legacy_themes 2>/dev/null || echo "  ℹ️  Migration already resolved or doesn't exist"

echo "🚀 Deploying migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Starting application..."
node dist/src/main
