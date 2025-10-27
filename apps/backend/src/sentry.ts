import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// This MUST be imported before any other modules
// https://docs.sentry.io/platforms/javascript/guides/nestjs/
// Extract environment check to avoid repeated comparisons
// Note: We can't use NestJS ConfigService here because this file must be imported
// before any other modules to properly instrument the application
const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [nodeProfilingIntegration()],
  debug: !isProduction,
  enableLogs: true,
  // Free tier: 10k transactions/month - adjust sampling for production
  // 10% in prod, 100% in dev
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  // Profile 100% of traced transactions for performance insights
  profilesSampleRate: 1.0,
  release: process.env.npm_package_version || '1.0.0',
  beforeSend(event, hint) {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    // Skip certain errors in development
    if (!isProduction) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Skip common development errors
        if (error.message.includes('ECONNREFUSED') ||
            error.message.includes('Cannot connect to the Docker daemon')) {
          return null;
        }
      }
    }
    return event;
  },
});

console.log('✅ Sentry instrumentation initialized');
