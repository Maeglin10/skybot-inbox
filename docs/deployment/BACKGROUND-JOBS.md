# Background Jobs System

## Current Implementation (Phase 1)

SkyBot Inbox uses **@nestjs/schedule** for periodic background jobs without requiring Redis.

### Jobs Configured:

#### Cleanup Tasks
- **Expired Idempotency Keys**: Runs every hour
- **Expired Refresh Tokens**: Runs every hour
- **Used/Expired Magic Links**: Runs daily at 2 AM
- **Old Revoked Tokens**: Runs daily at 3 AM (keeps 90 days for audit)
- **Health Metrics Collection**: Runs every 5 minutes

### Implementation Details

```typescript
// src/jobs/cleanup.service.ts
@Cron(CronExpression.EVERY_HOUR)
async cleanupExpiredIdempotencyKeys() {
  const result = await this.idempotencyService.cleanupExpired();
  this.logger.log(`Cleaned up ${result.deleted} expired idempotency keys`);
}
```

## Future: Bull + Redis (Phase 2)

For more advanced job processing, migrate to Bull queues:

### Why Bull + Redis?
- Distributed job processing
- Job prioritization
- Retry logic with exponential backoff
- Progress tracking
- Job result storage
- Concurrency control

### Installation

```bash
npm install @nestjs/bull bull redis
```

### Redis Setup

**Docker Compose**:
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
```

**Render.com**: Add Redis service in dashboard

### Bull Configuration

```typescript
// app.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue(
      { name: 'emails' },
      { name: 'notifications' },
      { name: 'analytics' },
    ),
  ],
})
```

### Example: Email Queue

```typescript
// src/jobs/queues/email.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('emails')
export class EmailProcessor {
  @Process('send-magic-link')
  async handleSendMagicLink(job: Job<{ email: string; token: string }>) {
    const { email, token } = job.data;
    
    // Send email
    await this.emailService.sendMagicLink(email, token);
    
    // Return result
    return { sent: true, email };
  }
}

// Usage in service:
await this.emailQueue.add('send-magic-link', { email, token });
```

### Queue Dashboard

```bash
npm install @bull-board/api @bull-board/nestjs @bull-board/express
```

Access: `http://localhost:3000/admin/queues`

### Monitoring

```typescript
// Listen to job events
queue.on('completed', (job, result) => {
  logger.log(`Job ${job.id} completed`);
});

queue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed:`, error);
});
```

### Best Practices

1. **Idempotent Jobs**: Jobs should be safely retryable
2. **Small Payloads**: Store large data in DB, pass IDs to jobs
3. **Timeouts**: Set job timeouts to prevent hanging
4. **Rate Limiting**: Control job processing rate
5. **Error Handling**: Log errors, use retry strategies

## Environment Variables

```bash
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password

# Job configuration
JOB_CONCURRENCY=5
JOB_MAX_RETRIES=3
JOB_RETRY_DELAY=5000
```

## Migration Path

1. Keep @nestjs/schedule for critical cleanup jobs
2. Add Bull for new async operations (emails, webhooks, analytics)
3. Gradually migrate heavy operations to Bull queues
4. Monitor performance and adjust concurrency

## Troubleshooting

### Jobs Not Running
- Check `NODE_ENV` - scheduler disabled in test mode
- Verify Redis connection
- Check queue configuration

### Memory Issues
- Limit queue size: `maxStalledCount`, `removeOnComplete`
- Use job priorities
- Process in batches

### Stuck Jobs
- Set job timeouts
- Monitor "stalled" event
- Implement health checks

## Additional Resources

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [NestJS Bull Module](https://docs.nestjs.com/techniques/queues)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
