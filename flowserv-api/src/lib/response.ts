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

/**
 * Reads the request id set by requestIdMiddleware. A bare `Context` param
 * (rather than the route handler's own narrower inferred Context type) is
 * what lets this be called from any route file without each call site
 * fighting Hono's per-registration Env inference — see H13.
 */
export function getRequestId(c: Context): string {
  return (c.get('requestId') as string | undefined) || crypto.randomUUID();
}

/**
 * Builds the envelope without a Context — used by lib/idempotency.ts to
 * record the exact response body inside a transaction (before it has been
 * sent to anyone), so a replayed request gets byte-identical `data`.
 */
export function buildSuccessEnvelope<T>(
  data: T,
  meta?: { next_cursor?: string; has_more?: boolean },
  requestId: string = crypto.randomUUID()
): ApiResponse<T> {
  return {
    data,
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: null,
  };
}

export function successResponse<T>(
  c: Context,
  data: T,
  meta?: { next_cursor?: string; has_more?: boolean },
  statusCode = 200
) {
  const response = buildSuccessEnvelope(data, meta, getRequestId(c));
  return c.json(response, statusCode as any);
}

export function errorResponse(
  c: Context,
  code: string,
  message: string,
  details?: unknown[],
  statusCode = 400
) {
  const response: ApiResponse<null> = {
    data: null,
    meta: {
      request_id: getRequestId(c),
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
