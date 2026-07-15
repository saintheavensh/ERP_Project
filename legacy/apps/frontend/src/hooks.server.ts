import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

// Server-side initialization
if (env.PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: env.PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
        environment: env.PUBLIC_APP_ENV || 'development'
    });
}

export const handleError = Sentry.handleErrorWithSentry();
