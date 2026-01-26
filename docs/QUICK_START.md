# Quick Start Guide - Next Steps

> After completing Phase 2: SkyBot Integration

## Immediate Actions

### 1. Configure Production Environment Variables

Add these to your Render environment:

```bash
# SkyBot Integration
SKYBOT_API_URL=https://your-skybot-api.com
SKYBOT_API_KEY=sk_prod_your_actual_api_key_here
SKYBOT_WEBHOOK_SECRET=your_webhook_secret_32_chars_min

# Monitoring (Optional but Recommended)
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Billing SSO
BILLING_PORTAL_URL=https://billing.yourdomain.com
BILLING_SSO_SECRET=your_billing_sso_secret_32_chars_min
```

### 2. Test SkyBot Integration

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Readiness check (tests DB connection)
curl https://your-app.onrender.com/api/ready

# Create an agent (requires authentication)
curl -X POST https://your-app.onrender.com/api/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "Test Lead Scorer",
    "agentType": "SALES",
    "templatePath": "templates/sales/lead-scorer.json",
    "configJson": {}
  }'

# Check deployment status
curl https://your-app.onrender.com/api/agents/{agentId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Monitor Agent Deployments

WebSocket connection for real-time updates:

```javascript
import io from 'socket.io-client';

const socket = io('wss://your-app.onrender.com/agents', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('agent:created', (data) => {
  console.log('Agent created:', data);
});

socket.on('agent:status-changed', (data) => {
  console.log('Agent status changed:', data);
});

socket.on('execution:completed', (data) => {
  console.log('Execution completed:', data);
});
```

### 4. Setup Database Backups

Schedule daily backups on your production server:

```bash
# Add to crontab (run at 2 AM daily)
0 2 * * * /path/to/skybot-inbox/scripts/backup-database.sh

# Or use Render cron jobs
# Create a new cron job in Render dashboard:
# Schedule: 0 2 * * *
# Command: ./scripts/backup-database.sh
```

Environment variables for backups:
```bash
DATABASE_URL=postgresql://user:pass@host/db
BACKUP_DIR=/app/backups
CLEANUP_OLD_BACKUPS=true
```

## Next Development Phase: Monitoring

### Recommended Order:

1. **Winston Logging** (1-2 days)
   - Install: `npm install winston nest-winston`
   - Configure structured logging
   - Replace all console.log statements
   - See: [ROADMAP.md#31-structured-logging-with-winston](./ROADMAP.md#31-structured-logging-with-winston)

2. **Sentry Integration** (1 day)
   - Install: `npm install @sentry/node @sentry/profiling-node`
   - Configure error tracking
   - Set up performance monitoring
   - See: [ROADMAP.md#32-application-performance-monitoring](./ROADMAP.md#32-application-performance-monitoring)

3. **Input Validation** (2-3 days)
   - Enhance existing DTOs with stricter validation
   - Add sanitization for user inputs
   - Test with malicious payloads
   - See: [ROADMAP.md#53-input-validation--sanitization](./ROADMAP.md#53-input-validation--sanitization)

4. **Database Optimization** (3-5 days)
   - Enable query logging
   - Identify slow queries
   - Add missing indexes
   - Implement caching for stats
   - See: [ROADMAP.md#41-database-query-optimization](./ROADMAP.md#41-database-query-optimization)

## Testing Checklist

Before deploying to production:

- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] Unit tests pass: `npm run test`
- [ ] Linter passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual testing:
  - [ ] Create agent successfully
  - [ ] Deploy agent to SkyBot
  - [ ] Activate/deactivate agent
  - [ ] View agent statistics
  - [ ] Receive webhook from SkyBot
  - [ ] WebSocket real-time updates working
  - [ ] Admin endpoints (user management)
  - [ ] Billing SSO redirect

## Troubleshooting

### Agent Deployment Fails

**Symptom:** Agent status stays "DEPLOYING" or becomes "ERROR"

**Check:**
```bash
# 1. Verify SkyBot API is accessible
curl -H "x-api-key: YOUR_SKYBOT_API_KEY" \
  https://your-skybot-api.com/health

# 2. Check application logs
heroku logs --tail  # or check Render logs

# 3. Manually trigger deployment
curl -X POST https://your-app.onrender.com/api/agents/{agentId}/deploy-to-skybot \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Common causes:**
- Wrong SKYBOT_API_URL or SKYBOT_API_KEY
- SkyBot API is down
- Network connectivity issues
- Invalid template path

### WebSocket Connection Fails

**Symptom:** Real-time updates not working

**Check:**
```bash
# 1. Test WebSocket endpoint
wscat -c wss://your-app.onrender.com/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Check CORS configuration
# Ensure your frontend domain is allowed in src/main.ts
```

**Common causes:**
- JWT token expired or invalid
- CORS not configured for frontend domain
- WebSocket proxy misconfigured

### Database Connection Issues

**Symptom:** `/api/ready` returns 503

**Check:**
```bash
# 1. Test DATABASE_URL manually
psql $DATABASE_URL -c "SELECT 1"

# 2. Check connection pool
# Look for "Too many connections" errors in logs
```

**Fix:**
- Verify DATABASE_URL is correct
- Check database server is running
- Increase connection pool size in Prisma

## Performance Tips

### 1. Enable Query Caching

For frequently accessed data (agent stats):

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const cacheKey = `agent-stats:${agentId}`;
const cached = await this.cacheManager.get(cacheKey);
if (cached) return cached;

const stats = await this.computeStats(agentId);
await this.cacheManager.set(cacheKey, stats, 300); // 5 min TTL
return stats;
```

### 2. Optimize Database Queries

Add indexes for frequently queried columns:

```prisma
model AgentLog {
  // ...
  
  @@index([agentId, timestamp]) // Composite index
  @@index([executionStatus])
}
```

### 3. Use Database Aggregations

Instead of fetching all records and computing in memory:

```typescript
// Bad
const logs = await prisma.agentLog.findMany({ where: { agentId } });
const avgTime = logs.reduce((sum, l) => sum + l.processingTimeMs, 0) / logs.length;

// Good (already implemented)
const result = await prisma.agentLog.aggregate({
  where: { agentId },
  _avg: { processingTimeMs: true },
});
const avgTime = result._avg.processingTimeMs;
```

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] JWT secret is strong (min 32 random characters)
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Database credentials rotated regularly
- [ ] API keys have expiration dates
- [ ] Audit logging enabled
- [ ] Input validation on all endpoints

## Support Resources

- **Documentation:** [ROADMAP.md](./ROADMAP.md)
- **API Reference:** `/api-docs` (Swagger)
- **Health Check:** `/api/health`
- **Readiness Probe:** `/api/ready`
- **Metrics:** `/metrics` (if Prometheus enabled)

## Common Commands

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
npm run db:seed

# Testing
npm run test
npm run test:e2e
npm run test:cov

# Linting
npm run lint
npm run format

# Backup
./scripts/backup-database.sh
```

## Next Steps After Phase 3

1. **Background Jobs (Phase 4.3)**
   - Setup Redis
   - Implement Bull queues
   - Offload heavy tasks (agent deployment, analytics)

2. **API Key Management (Phase 5.1)**
   - Add ApiKey model to Prisma
   - Implement rotation mechanism
   - Update API key guard

3. **Plugin Ecosystem (Optional)**
   - Create plugin SDK
   - Build marketplace
   - Integrate with Zapier/Make.com

---

**Need Help?**
- Review [ROADMAP.md](./ROADMAP.md) for detailed implementation guides
- Check application logs for errors
- Test each component individually
- Use health checks to verify system status

Good luck with your deployment! 🚀
