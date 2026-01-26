# Scripts Directory

All utility scripts organized by purpose.

## 📁 Folder Structure

### 🚀 deployment/
Scripts for deploying and starting the application.

**Files:**
- `deploy.sh` - Deploy to Render (production)
- `START_INBOX.sh` - Start backend locally with logging

**Usage:**
```bash
./scripts/deployment/START_INBOX.sh  # Start local backend
./scripts/deployment/deploy.sh        # Deploy to production
```

### 🧪 testing/
All testing scripts including smoke tests, integration tests, and E2E tests.

**Files:**
- `smoke-tests.ts` - Automated smoke tests (10 endpoints)
- `test-backend-complete.sh` - Full backend test suite
- `test-multi-tenant-isolation.ts` - Multi-tenancy validation
- `test-auth-endpoints.sh` - Auth flow testing
- `test-backend-audit.ts` - Backend audit and validation
- `test-whatsapp.sh` - WhatsApp integration tests
- `guard-no-direct-api-fetch.sh` - Pre-commit hook for API calls
- `smoke.sh` - Quick smoke test runner

**Usage:**
```bash
ts-node scripts/testing/smoke-tests.ts           # Run smoke tests
./scripts/testing/test-backend-complete.sh       # Full backend tests
ts-node scripts/testing/test-multi-tenant-isolation.ts  # Tenant isolation
```

### 🔧 maintenance/
Database backups, migration fixes, and maintenance utilities.

**Files:**
- `backup-database.sh` - Automated PostgreSQL backup with compression
- `fix-migration.js` - Repair broken Prisma migrations

**Usage:**
```bash
./scripts/maintenance/backup-database.sh  # Backup database
node scripts/maintenance/fix-migration.js # Fix migrations
```

### 💻 development/
Development utilities for creating test data, exploring APIs, etc.

**Files:**
- `create-default-account.ts` - Create test user accounts
- `list-airtable-tables.ts` - List all Airtable tables
- `test-airtable-detailed.ts` - Detailed Airtable API testing
- `sign-whatsapp.ts` - Generate WhatsApp signature

**Usage:**
```bash
ts-node scripts/development/create-default-account.ts  # Create test account
ts-node scripts/development/list-airtable-tables.ts   # List Airtable tables
```

### 📦 archive/
Old and deprecated scripts kept for reference.

## 🎯 Common Patterns

### Running TypeScript Scripts
```bash
ts-node scripts/<folder>/<script-name>.ts
```

### Running Shell Scripts
```bash
./scripts/<folder>/<script-name>.sh
```

### Making Scripts Executable
```bash
chmod +x scripts/<folder>/<script-name>.sh
```

## 📝 Adding New Scripts

1. Place in appropriate folder (deployment/testing/maintenance/development)
2. Add shebang line for shell scripts: `#!/bin/bash`
3. Make executable: `chmod +x script-name.sh`
4. Document in this README
5. Add error handling with `set -e` for shell scripts
6. Use `set -x` for debug mode if needed

## 🔒 Security Notes

- Never commit credentials or API keys in scripts
- Use environment variables for sensitive data
- Test scripts locally before running in production
- Always backup database before running maintenance scripts
