import { injectable } from 'inversify';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
    level: LogLevel;
    context: string;
    message: string;
    timestamp: string;
    data?: any;
    error?: {
        code?: string;
        stack?: string;
    };
    requestId?: string;
    userId?: string;
    duration?: number;
}

@injectable()
export class Logger {
    private context: string;
    private requestId?: string;
    private userId?: string;

    constructor(context: string) {
        this.context = context;
    }

    /**
     * Create a child logger with additional context
     */
    child(additionalContext: Partial<{ requestId: string; userId: string }>): Logger {
        const logger = new Logger(this.context);
        logger.requestId = additionalContext.requestId || this.requestId;
        logger.userId = additionalContext.userId || this.userId;
        return logger;
    }

    /**
     * Log debug message (development only)
     */
    debug(message: string, data?: any): void {
        if (process.env.NODE_ENV === 'development') {
            this.log('DEBUG', message, data);
        }
    }

    /**
     * Log info message
     */
    info(message: string, data?: any): void {
        this.log('INFO', message, data);
    }

    /**
     * Log warning message
     */
    warn(message: string, data?: any): void {
        this.log('WARN', message, data);
    }

    /**
     * Log error message
     */
    error(message: string, error?: any, data?: any): void {
        const errorData = error instanceof Error ? {
            message: error.message,
            code: (error as any).code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : error;

        this.log('ERROR', message, { ...data, error: errorData });
    }

    /**
     * Log with execution time measurement
     */
    async time<T>(operation: string, fn: () => Promise<T>, data?: any): Promise<T> {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.info(`${operation} completed`, { ...data, duration });
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            this.error(`${operation} failed`, error, { ...data, duration });
            throw error;
        }
    }

    private log(level: LogLevel, message: string, data?: any): void {
        const entry: LogEntry = {
            level,
            context: this.context,
            message,
            timestamp: new Date().toISOString(),
            data,
            requestId: this.requestId,
            userId: this.userId
        };

        // In production, you might send this to a logging service
        // For now, we'll use console with appropriate level
        const logFn = level === 'ERROR' ? console.error :
            level === 'WARN' ? console.warn :
                level === 'DEBUG' ? console.debug :
                    console.log;

        logFn(JSON.stringify(entry));
    }
}

// Factory to create loggers (for DI)
@injectable()
export class LoggerFactory {
    createLogger(context: string): Logger {
        return new Logger(context);
    }
}
