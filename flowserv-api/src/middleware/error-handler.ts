import { Context, Next } from 'hono';
import { errorResponse } from '../lib/response';
import { BusinessError } from '../lib/errors';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    // A BusinessError already carries the correct code/message/status —
    // check it before the generic HTTP-error branch below.
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }

    console.error('Unhandled Error:', err);

    // Check if it's a known HTTP error
    if (err.status) {
      return errorResponse(c, 'HTTP_ERROR', err.message, undefined, err.status);
    }

    // Default 500 error
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', undefined, 500);
  }
}

export async function requestIdMiddleware(c: Context, next: Next) {
  const reqId = c.req.header('x-request-id') || crypto.randomUUID();
  c.set('requestId', reqId);
  await next();
}
