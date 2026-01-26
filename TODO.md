# TODO List - SkyBot-Inbox

> Last Updated: 2026-01-26

## ✅ Completed

### Phase 1: DevOps Core
- [x] GitHub Actions CI workflow
- [x] GitHub Actions security workflow (npm audit, gitleaks)
- [x] GitHub Actions deploy workflow
- [x] Helmet.js security headers
- [x] Enhanced health checks (/api/health, /api/ready)
- [x] Database backup script
- [x] Audit logging system

### Phase 2: RBAC & User Management
- [x] RolesGuard implementation
- [x] @Roles decorator
- [x] Admin module (user CRUD)
- [x] Tenant isolation
- [x] SSO billing integration

### Phase 2B: SkyBot Integration
- [x] SkyBot API HTTP client
- [x] Agent deployment integration
- [x] Lifecycle management (activate/deactivate)
- [x] Manual deployment endpoint
- [x] Analytics query optimization
- [x] WebSocket real-time updates
- [x] Inbound webhooks from SkyBot

---

## 🔲 Immediate Priorities (This Week)

### Production Deployment
- [ ] Configure production environment variables in Render
  - [ ] SKYBOT_API_URL
  - [ ] SKYBOT_API_KEY
  - [ ] SKYBOT_WEBHOOK_SECRET
  - [ ] BILLING_PORTAL_URL
  - [ ] BILLING_SSO_SECRET
  - [ ] SENTRY_DSN (optional but recommended)
- [ ] Test agent deployment flow end-to-end
- [ ] Setup daily database backups via cron
- [ ] Verify health checks work in production
- [ ] Test WebSocket connections from frontend

### Code Quality
- [ ] Run E2E tests and verify all pass
- [ ] Fix any linting warnings
- [ ] Review and enhance DTOs with stricter validation
- [ ] Add more unit tests for critical paths

---

## 🔥 Next Sprint (Next 2 Weeks)

### Phase 3: Monitoring & Observability
- [ ] **Winston Structured Logging** (P0)
  - [ ] Install winston + nest-winston
  - [ ] Configure winston.config.ts
  - [ ] Replace all console.log with logger
  - [ ] Add request ID tracking
  - [ ] Test log output in production

- [ ] **Sentry Integration** (P0)
  - [ ] Install @sentry/node + @sentry/profiling-node
  - [ ] Configure sentry.config.ts
  - [ ] Add to main.ts bootstrap
  - [ ] Test error tracking
  - [ ] Setup performance monitoring

- [ ] **Enhanced Input Validation** (P1)
  - [ ] Review all DTOs
  - [ ] Add sanitization for text inputs
  - [ ] Test with malicious payloads
  - [ ] Document validation rules

---

## 📋 Backlog (Next Month)

### Phase 4: Performance & Scalability
- [ ] **Database Optimization**
  - [ ] Enable Prisma query logging
  - [ ] Identify slow queries (>100ms)
  - [ ] Add missing indexes
  - [ ] Implement query result caching
  - [ ] Test with realistic data volume

- [ ] **Enhanced Rate Limiting**
  - [ ] Configure per-endpoint throttling
  - [ ] Implement different limits for different user roles
  - [ ] Add rate limit headers to responses
  - [ ] Monitor rate limit violations

- [ ] **Background Jobs** (requires Redis)
  - [ ] Setup Redis (Render add-on or separate service)
  - [ ] Install Bull queue
  - [ ] Move agent deployment to background queue
  - [ ] Move analytics generation to background queue
  - [ ] Add job monitoring dashboard

### Phase 5: Security Hardening
- [ ] **API Key Management**
  - [ ] Add ApiKey model to Prisma schema
  - [ ] Implement API key generation
  - [ ] Implement API key rotation
  - [ ] Add expiration dates
  - [ ] Update ApiKeyGuard

- [ ] **Secrets Management**
  - [ ] Create encryption service
  - [ ] Generate ENCRYPTION_KEY
  - [ ] Encrypt sensitive data at rest
  - [ ] Document encryption process

- [ ] **Security Audit**
  - [ ] Review OWASP Top 10
  - [ ] Test for SQL injection
  - [ ] Test for XSS
  - [ ] Test for CSRF
  - [ ] Penetration testing (external)

---

## 🌟 Future Enhancements (Optional)

### Plugin Ecosystem (6-8 weeks)
- [ ] **Week 1-2: Plugin SDK**
  - [ ] Create @skybot/plugin-sdk package
  - [ ] Define plugin manifest schema
  - [ ] Implement plugin loader
  - [ ] Create CLI tool
  - [ ] Write SDK documentation

- [ ] **Week 3-4: Marketplace**
  - [ ] Add Plugin + PluginInstallation models
  - [ ] Create marketplace API
  - [ ] Build marketplace UI
  - [ ] Implement plugin installation flow
  - [ ] Add ratings and reviews

- [ ] **Week 5-6: Third-Party Integrations**
  - [ ] Zapier app development
  - [ ] Make.com integration (OpenAPI)
  - [ ] n8n community node
  - [ ] Test integrations end-to-end

- [ ] **Week 7-8: Developer Portal**
  - [ ] Setup Docusaurus
  - [ ] Write API documentation
  - [ ] Create plugin development guides
  - [ ] Add interactive API playground
  - [ ] Publish to developers.skybot.com

### Advanced Features
- [ ] Multi-language support for agents
- [ ] Advanced analytics dashboards
- [ ] A/B testing for agent responses
- [ ] Agent performance auto-optimization
- [ ] Custom webhook destinations
- [ ] Workflow builder UI
- [ ] Agent templates marketplace
- [ ] Team collaboration features
- [ ] Advanced RBAC with custom roles

---

## 🐛 Known Issues

> None at the moment

---

## 📝 Notes

### Environment Setup
```bash
# Required for all environments
DATABASE_URL
JWT_SECRET
API_KEY

# Required for SkyBot integration
SKYBOT_API_URL
SKYBOT_API_KEY
SKYBOT_WEBHOOK_SECRET

# Required for OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL

# Required for billing
BILLING_PORTAL_URL
BILLING_SSO_SECRET

# Optional but recommended
LOG_LEVEL
SENTRY_DSN
SENTRY_TRACES_SAMPLE_RATE
```

### Testing Commands
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov

# Lint
npm run lint

# Build
npm run build
```

### Deployment Process
1. Push to `main` branch
2. GitHub Actions runs CI (test, lint, build)
3. GitHub Actions triggers Render deployment
4. Render deploys new version
5. Health check verifies deployment
6. Monitor Sentry for errors

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name description

# Deploy to production
npx prisma migrate deploy

# Reset database (DANGER - dev only)
npx prisma migrate reset
```

---

## 📚 Documentation Links

- [ROADMAP.md](./docs/ROADMAP.md) - Full development roadmap
- [QUICK_START.md](./docs/QUICK_START.md) - Quick start guide
- [README.md](./README.md) - Project overview
- API Docs: `/api-docs` (Swagger)

---

**Questions or Issues?**
- Check [ROADMAP.md](./docs/ROADMAP.md) for implementation details
- Review logs for errors
- Test components individually
- Verify environment variables are set correctly
