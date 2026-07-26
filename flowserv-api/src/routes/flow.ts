import { Hono } from 'hono';
import { db } from '../db/connection';
import { flowTemplates, flowNodes, flowTransitions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';

const flowRouter = new Hono();

flowRouter.use('*', requireAuth);

flowRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  
  // Tahap A — deterministic order now that a tenant can have more than one
  // service-domain template. Without this, adding rows made the intake
  // dropdown's order effectively arbitrary (whatever a bare SELECT happened
  // to return), which a Playwright test relied on by position.
  const templates = await db
    .select()
    .from(flowTemplates)
    .where(eq(flowTemplates.tenantId, tenantId))
    .orderBy(flowTemplates.createdAt);

  return successResponse(c, templates);
});

flowRouter.get('/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const templateId = c.req.param('id');
  
  const template = await db
    .select()
    .from(flowTemplates)
    .where(and(
      eq(flowTemplates.id, templateId),
      eq(flowTemplates.tenantId, tenantId)
    ));
    
  if (template.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Flow Template not found', [], 404);
  }
  
  const nodes = await db
    .select()
    .from(flowNodes)
    .where(eq(flowNodes.flowTemplateId, templateId))
    .orderBy(flowNodes.sequenceOrder);
    
  const nodeIds = nodes.map(n => n.id);
  
  let transitions: typeof flowTransitions.$inferSelect[] = [];
  
  if (nodeIds.length > 0) {
    const { inArray } = await import('drizzle-orm');
    transitions = await db
      .select()
      .from(flowTransitions)
      .where(inArray(flowTransitions.fromNodeId, nodeIds));
  }
  
  return successResponse(c, {
    template: template[0],
    nodes,
    transitions
  });
});

export { flowRouter };
