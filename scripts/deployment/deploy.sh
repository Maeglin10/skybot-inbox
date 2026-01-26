#!/bin/bash

# Deploy script for SkyBot on Nexxa server
# Usage: ./deploy.sh [production|staging]

set -e

ENV=${1:-production}

echo "🚀 Deploying SkyBot to ${ENV}..."

# Load environment variables
if [ -f ".env.${ENV}" ]; then
  export $(cat .env.${ENV} | grep -v '^#' | xargs)
else
  echo "❌ .env.${ENV} file not found!"
  exit 1
fi

# Build and deploy with Docker Compose
echo "📦 Building Docker images..."
docker-compose build

echo "🔄 Stopping existing containers..."
docker-compose down

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec -T skybot-inbox-api npx prisma migrate deploy

# Check health
echo "🏥 Checking service health..."
docker-compose ps

echo "✅ Deployment complete!"
echo ""
echo "Services available at:"
echo "  - SkyBot API: https://api.nexxa.com"
echo "  - n8n:        https://n8n.nexxa.com"
echo "  - Traefik:    https://traefik.nexxa.com"
echo ""
echo "📝 View logs with: docker-compose logs -f"
