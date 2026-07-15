import * as Sentry from '@sentry/sveltekit';

if (import.meta.env.PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
        environment: import.meta.env.PUBLIC_APP_ENV || 'development'
    });
}

export const handleError = Sentry.handleErrorWithSentry();
