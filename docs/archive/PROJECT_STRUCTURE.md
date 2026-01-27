# SkyBot Inbox - Project Structure

## 📁 Root Directory Organization

```
skybot-inbox/
├── src/                          # Backend source code (NestJS)
├── skybot-inbox-ui/             # Frontend source code (Next.js 16)
├── prisma/                      # Database schema and migrations
├── scripts/                     # Utility scripts (organized by purpose)
│   ├── deployment/             # Deployment and startup scripts
│   ├── testing/                # Test scripts and smoke tests
│   ├── maintenance/            # Database backup, migrations, fixes
│   ├── development/            # Development utilities (seed, test data)
│   └── archive/                # Old/deprecated scripts
├── docs/                        # Project documentation
│   ├── deployment/             # Deployment guides
│   ├── development/            # Development setup docs
│   ├── auth/                   # Authentication documentation
│   ├── integrations/           # Integration guides (Airtable, etc.)
│   ├── maintenance/            # Maintenance procedures
│   └── archive/                # Archived documentation
├── logs/                        # Application logs (not in git)
├── mcp-server-airtable/        # Airtable MCP server
├── .github/                     # GitHub Actions workflows
├── dist/                        # Build output (backend)
├── node_modules/               # Dependencies (not in git)
└── public/                      # Static assets

## 🛠️ Key Scripts

### Deployment
- `scripts/deployment/deploy.sh` - Deploy to Render (production)
- `scripts/deployment/START_INBOX.sh` - Start backend locally

### Testing
- `scripts/testing/smoke-tests.ts` - Automated smoke tests (10 tests)
- `scripts/testing/test-backend-complete.sh` - Full backend test suite
- `scripts/testing/test-multi-tenant-isolation.ts` - Multi-tenancy tests
- `scripts/testing/test-auth-endpoints.sh` - Auth endpoint tests

### Maintenance
- `scripts/maintenance/backup-database.sh` - Automated database backup
- `scripts/maintenance/fix-migration.js` - Migration repair utility

### Development
- `scripts/development/create-default-account.ts` - Create test accounts
- `scripts/development/list-airtable-tables.ts` - List Airtable tables
- `scripts/development/sign-whatsapp.ts` - WhatsApp signature utility

## 🚀 Quick Start Commands

```bash
# Backend
npm run start:dev           # Start backend in development mode
npm run build               # Build backend for production
npm run db:seed             # Seed database with test data

# Frontend
cd skybot-inbox-ui
npm run dev                 # Start frontend in development mode
npm run build               # Build frontend for production

# Testing
npm run test                # Run backend tests
npm run test:e2e            # Run end-to-end tests
ts-node scripts/testing/smoke-tests.ts  # Run smoke tests

# Database
npx prisma migrate dev      # Create and run migrations
npx prisma studio           # Open Prisma Studio
npm run db:seed             # Seed database

# Deployment
./scripts/deployment/deploy.sh      # Deploy to production
./scripts/deployment/START_INBOX.sh # Start locally
```

## 📝 Environment Variables

- `.env` - Local development (never commit)
- `.env.example` - Template for local development
- `.env.production` - Production variables (never commit)
- `.env.production.example` - Template for production

## 🗂️ Important Files

- `README.md` - Main project documentation
- `PROJECT_STRUCTURE.md` - This file (project organization)
- `package.json` - Backend dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `nest-cli.json` - NestJS CLI configuration
- `docker-compose.yml` - Docker services (PostgreSQL)
- `render.yaml` - Render deployment configuration

## 🔒 Security Notes

- Never commit `.env` or `.env.production` files
- `PRODUCTION_CREDENTIALS.md` is archived in `docs/archive/` (sensitive!)
- All logs are excluded from git via `.gitignore`
- JWT secrets and API keys must be kept secure

## 📚 Documentation

All detailed documentation is organized in the `docs/` folder:
- **Deployment**: How to deploy to Render, environment setup
- **Development**: Local development setup, architecture
- **Authentication**: SSO, JWT, OAuth, Magic Links
- **Integrations**: Airtable MCP server, external APIs
- **Maintenance**: Database backups, monitoring, troubleshooting

## 🎯 Project Status

- ✅ Backend (NestJS) - Multi-tenant SaaS with JWT auth
- ✅ Frontend (Next.js 16) - Spanish UI with dark mode themes
- ✅ Database (PostgreSQL + Prisma) - Full schema with migrations
- ✅ Authentication - JWT + Google OAuth + Magic Links + Remember Me
- ✅ Deployed on Render (backend + frontend)
- ⏳ RBAC Admin endpoints (in progress)
- ⏳ Complete smoke test coverage (5/10 passing)
