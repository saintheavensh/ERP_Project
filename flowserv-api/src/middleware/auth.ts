import { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';
import { errorResponse } from '../lib/response';

export type JwtPayload = {
  userId: string;
  tenantId: string;
  roleId: string;
  exp: number;
};

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key-do-not-use-in-prod';

// Auth middleware to verify JWT
import { HTTPException } from 'hono/http-exception';

export const requireAuth = async (c: Context, next: Next) => {
  const jwtMiddleware = jwt({
    secret: JWT_SECRET,
    alg: 'HS256' 
  });

  return jwtMiddleware(c, async () => {
    const payload = c.get('jwtPayload') as JwtPayload;
    if (!payload || !payload.userId || !payload.tenantId) {
      throw new HTTPException(401, { message: 'Invalid token payload' });
    }
    await next();
  });
};

// Helper to get typed context
export const getAuthContext = (c: Context): JwtPayload => {
  return c.get('jwtPayload') as JwtPayload;
};
