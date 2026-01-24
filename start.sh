#!/bin/bash
set -e

echo "🔧 Fixing failed migrations..."
# Use Node.js script to remove failed migration entry
node scripts/fix-migration.js || echo "  ℹ️  Migration fix skipped"

echo "🚀 Deploying migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Starting application..."
node dist/src/main
