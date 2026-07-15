import { Context, Next } from 'hono';
import { errorResponse } from '../lib/response';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
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
