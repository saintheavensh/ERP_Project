import { Hono } from 'hono';
import { db } from '../../db/connection';
import { posInvoices, posInvoiceLines, stockBatches, stockMovements, stockLevels, inventoryItems, posDrafts } from '../../db/schema/index';
import { eq, and, sql, asc, gt, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { successResponse, errorResponse } from '../../lib/response';
import { requireAuth, getAuthContext } from '../../middleware/auth';

const router = new Hono();

const draftSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1),
  cartItems: z.array(z.any())
});

// GET /v1/pos/drafts
router.get('/drafts', async (c) => {
  const { tenantId } = getAuthContext(c);
  const branchId = c.req.query('branchId');

  const filters = [eq(posDrafts.tenantId, tenantId)];
  if (branchId) filters.push(eq(posDrafts.branchId, branchId));

  const drafts = await db.query.posDrafts.findMany({
    where: and(...filters),
    orderBy: [desc(posDrafts.createdAt)]
  });

  return successResponse(c, drafts);
});

// POST /v1/pos/drafts
router.post('/drafts', zValidator('json', draftSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  const [draft] = await db.insert(posDrafts).values({
    tenantId,
    branchId: data.branchId,
    name: data.name,
    cartItems: data.cartItems
  }).returning();

  return successResponse(c, draft, undefined, 201);
});

// DELETE /v1/pos/drafts/:id
router.delete('/drafts/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  await db.delete(posDrafts).where(and(eq(posDrafts.id, id), eq(posDrafts.tenantId, tenantId)));
  return successResponse(c, { deleted: true });
});

export { router as draftsRouter };
