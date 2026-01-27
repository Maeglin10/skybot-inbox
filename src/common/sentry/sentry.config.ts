import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry() {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.log('Sentry DSN not configured - skipping initialization');
    return;
  }

  const tracesSampleRate = parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'
  );
  const profilesSampleRate = parseFloat(
    process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'
  );

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: 'skybot-inbox@1.0.0',
    tracesSampleRate,
    profilesSampleRate,
    integrations: [
      new ProfilingIntegration(),
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-api-key'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
    ignoreErrors: [
      'NetworkError',
      'AbortError',
      'UnauthorizedException',
      'ForbiddenException',
    ],
  });

  console.log('Sentry initialized');
}
