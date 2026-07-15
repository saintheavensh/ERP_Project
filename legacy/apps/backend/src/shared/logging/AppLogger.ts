/**
 * Standard interface for structured application logging.
 */
export interface AppLogger {
    info(message: string, context: LogContext, meta?: Record<string, unknown>): void;
    warn(message: string, context: LogContext, meta?: Record<string, unknown>): void;
    error(message: string, context: LogContext, meta?: Record<string, unknown>): void;
}

export type AppService = "inventory" | "api-global" | "http" | "shared" | "purchases" | "sales" | "finance";

export interface LogContext {
    service: AppService;
    tenantId: string;
    requestId: string;
}

/**
 * Console-based implementation that outputs structured JSON.
 * Guarantees a consistent shape for all log entries.
 * Strictly enforces context and provides comprehensive error normalization.
 */
export class JsonConsoleLogger implements AppLogger {
    private baseLog(
        level: "info" | "warn" | "error",
        message: string,
        context: LogContext,
        meta?: Record<string, unknown>
    ) {
        const payload = {
            timestamp: new Date().toISOString(),
            level,
            service: context.service,
            tenantId: context.tenantId,
            requestId: context.requestId,
            message,
            ...meta,
        };
        console.log(JSON.stringify(payload));
    }

    info(message: string, context: LogContext, meta?: Record<string, unknown>) {
        this.baseLog("info", message, context, meta);
    }

    warn(message: string, context: LogContext, meta?: Record<string, unknown>) {
        this.baseLog("warn", message, context, meta);
    }

    error(message: string, context: LogContext, meta?: Record<string, unknown>) {
        let errorDetails: { message: string; stack?: string } | undefined;

        if (meta?.error) {
            const err = meta.error;
            if (err instanceof Error) {
                errorDetails = {
                    message: err.message,
                    stack: err.stack
                };
            } else if (typeof err === 'string') {
                errorDetails = { message: err };
            } else {
                errorDetails = { message: String(err) };
            }
        }

        const normalizedMeta = errorDetails ? { ...meta, error: errorDetails } : meta;
        this.baseLog("error", message, context, normalizedMeta);
    }
}

// Export a singleton instance for general use
export const logger = new JsonConsoleLogger();
