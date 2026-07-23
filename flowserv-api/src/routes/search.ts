import { Hono } from 'hono';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';
import { searchQuerySchema } from '../modules/search/types';
import { searchAll } from '../modules/search/service';

const searchRouter = new Hono();
searchRouter.use('*', requireAuth);

// GET /v1/search?q= — tenant-scoped substring match across customers,
// tickets (via customer/device), inventory items, and suppliers. No
// permission gate beyond auth: every role that's logged in can look
// something up, same as the sidebar links they can already see.
searchRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  const parsed = searchQuerySchema.safeParse({ q: c.req.query('q') ?? '' });
  if (!parsed.success) {
    return errorResponse(c, 'VALIDATION_ERROR', 'q is required', parsed.error.issues, 400);
  }

  const results = await searchAll(tenantId, parsed.data.q);
  return successResponse(c, { query: parsed.data.q, results });
});

export { searchRouter };
