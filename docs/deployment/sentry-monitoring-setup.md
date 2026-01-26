# Sentry Monitoring Setup

## Vue d'ensemble

Sentry est configuré pour monitorer les erreurs et la performance en production.

## Configuration

### 1. Créer un compte Sentry

1. Aller sur https://sentry.io
2. Créer un nouveau projet
3. Sélectionner "Node.js" pour le backend
4. Sélectionner "Next.js" pour le frontend
5. Copier le DSN (Data Source Name)

### 2. Installation Backend

```bash
cd /path/to/skybot-inbox
npm install @sentry/node @sentry/profiling-node
```

### 3. Configuration Backend

Créer `src/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  console.log('✅ Sentry initialized');
}
```

Mettre à jour `src/main.ts`:

```typescript
import { initSentry } from './sentry';

async function bootstrap() {
  // Initialize Sentry FIRST
  initSentry();

  const app = await NestFactory.create(AppModule);

  // ... rest of bootstrap

  await app.listen(3001);
}
```

Créer un global exception filter `src/common/filters/sentry-exception.filter.ts`:

```typescript
import {
  Catch,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    // Log to Sentry if it's a server error
    if (status >= 500) {
      Sentry.captureException(exception, {
        contexts: {
          http: {
            method: request.method,
            url: request.url,
            status_code: status,
          },
        },
        user: {
          id: (request as any).user?.id,
          username: (request as any).user?.username,
        },
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
    });
  }
}
```

Appliquer le filter dans `src/app.module.ts`:

```typescript
import { APP_FILTER } from '@nestjs/core';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### 4. Installation Frontend

```bash
cd /path/to/skybot-inbox/skybot-inbox-ui
npm install @sentry/nextjs
```

### 5. Configuration Frontend

Créer `skybot-inbox-ui/sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

Créer `skybot-inbox-ui/sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

Créer `skybot-inbox-ui/sentry.edge.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

### 6. Environment Variables

**Backend (.env)**:
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Render Dashboard**:
- Backend service → Environment → Add `SENTRY_DSN`
- Frontend service → Environment → Add `NEXT_PUBLIC_SENTRY_DSN`

### 7. Test Configuration

**Backend test**:

```typescript
// src/app.controller.ts
@Get('sentry-test')
@Public()
testSentry() {
  throw new Error('Sentry test error');
}
```

Appeler: `curl http://localhost:3001/sentry-test`

Vérifier sur Sentry Dashboard → Issues

**Frontend test**:

```typescript
// pages/test-sentry.tsx
export default function TestSentry() {
  return (
    <button onClick={() => { throw new Error('Frontend Sentry test') }}>
      Trigger Error
    </button>
  );
}
```

### 8. Monitoring Dashboard

Une fois configuré, Sentry Dashboard montrera:

- **Issues**: Erreurs captées avec stack traces
- **Performance**: Requêtes lentes, transactions
- **Releases**: Tracking des déploiements
- **Alerts**: Notifications email/Slack sur erreurs critiques

### 9. Alerts Configuration

Dans Sentry Dashboard:

1. **Alerts** → **Create Alert Rule**
2. Conditions:
   - When: "An issue is first seen"
   - Filter: "Environment equals production"
   - Then: "Send notification to team"
3. Actions:
   - Email notification
   - Slack webhook (optionnel)

### 10. Release Tracking (Optionnel)

Ajouter dans CI/CD:

```bash
# .github/workflows/deploy.yml
- name: Create Sentry Release
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: your-org
    SENTRY_PROJECT: skybot-inbox
  run: |
    npx @sentry/cli releases new "skybot-inbox@$(git rev-parse HEAD)"
    npx @sentry/cli releases set-commits "skybot-inbox@$(git rev-parse HEAD)" --auto
    npx @sentry/cli releases finalize "skybot-inbox@$(git rev-parse HEAD)"
```

## Alternative: Autres Solutions de Monitoring

Si Sentry ne convient pas, alternatives:

### DataDog APM

```bash
npm install dd-trace
```

```typescript
// src/main.ts (first line)
import 'dd-trace/init';
```

### LogRocket

```bash
npm install logrocket
```

```typescript
import LogRocket from 'logrocket';
LogRocket.init('your-app-id');
```

### Rollbar

```bash
npm install rollbar
```

```typescript
import Rollbar from 'rollbar';
const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  environment: 'production',
});
```

## Checklist

- [ ] Créer compte Sentry
- [ ] Installer @sentry/node dans backend
- [ ] Installer @sentry/nextjs dans frontend
- [ ] Configurer DSN dans .env
- [ ] Ajouter initSentry() dans main.ts
- [ ] Ajouter SentryExceptionFilter
- [ ] Configurer sentry.*.config.ts frontend
- [ ] Ajouter SENTRY_DSN sur Render
- [ ] Tester avec endpoint /sentry-test
- [ ] Vérifier erreurs dans Sentry Dashboard
- [ ] Configurer alerts email

## Coût

- **Free tier**: 5,000 errors/month
- **Team plan**: $26/month pour 50,000 errors
- **Business**: $80/month pour 100,000 errors

Pour un MVP, le free tier suffit largement.

## Notes de Production

- Ne jamais logger de données sensibles (passwords, tokens)
- Utiliser `beforeSend` pour sanitizer les données
- Configurer sample rates pour limiter le volume
- Activer Session Replay uniquement si nécessaire (GDPR)

Exemple de sanitization:

```typescript
Sentry.init({
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.passwordHash;
    }
    return event;
  },
});
```
