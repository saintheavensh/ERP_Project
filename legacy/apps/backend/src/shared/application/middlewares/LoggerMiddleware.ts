import { Context, Next } from 'hono';
import { randomUUID } from 'crypto';
import fs from "fs";
import { logger as appLogger } from '../../logging/AppLogger';

export async function loggerMiddleware(c: Context, next: Next) {
    const requestId = randomUUID();
    const start = Date.now();

    // Add requestId to context for child logic/handlers
    c.set('requestId', requestId);

    const path = c.req.path;
    try {
        fs.appendFileSync("request_paths.log", `\n[${new Date().toISOString()}] ${c.req.method} ${path}`);
    } catch (e) { }

    const logContext = {
        service: "http" as const,
        tenantId: "system", // HTTP requests don't have a tenantId yet at this stage
        requestId
    };

    // Log request
    appLogger.info('Incoming request', logContext, {
        method: c.req.method,
        path: c.req.path,
        query: c.req.query(),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
    });

    try {
        await next();

        // Log response
        const duration = Date.now() - start;
        appLogger.info('Request completed', logContext, {
            status: c.res.status,
            durationMs: duration
        });
    } catch (error) {
        const duration = Date.now() - start;
        appLogger.error('Request failed', logContext, {
            error,
            durationMs: duration
        });
        throw error;
    }
}
