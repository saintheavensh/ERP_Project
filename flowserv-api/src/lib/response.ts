import { Context } from 'hono';

export interface ApiResponse<T> {
  data: T | null;
  meta: {
    request_id: string;
    timestamp: string;
    next_cursor?: string;
    has_more?: boolean;
  };
  error: {
    code: string;
    message: string;
    details?: unknown[];
  } | null;
}

export function successResponse<T>(
  c: Context,
  data: T,
  meta?: { next_cursor?: string; has_more?: boolean },
  statusCode = 200
) {
  const reqId = c.get('requestId') || crypto.randomUUID();
  
  const response: ApiResponse<T> = {
    data,
    meta: {
      request_id: reqId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: null,
  };
  
  return c.json(response, statusCode as any);
}

export function errorResponse(
  c: Context,
  code: string,
  message: string,
  details?: unknown[],
  statusCode = 400
) {
  const reqId = c.get('requestId') || crypto.randomUUID();
  
  const response: ApiResponse<null> = {
    data: null,
    meta: {
      request_id: reqId,
      timestamp: new Date().toISOString(),
    },
    error: {
      code,
      message,
      details,
    },
  };
  
  return c.json(response, statusCode as any);
}
