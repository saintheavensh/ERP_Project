import { Hono } from 'hono';
import { db } from '../db/connection';
import { flowTemplates, flowNodes, flowTransitions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';
import { BusinessError } from '../lib/errors';
import { flowDesignSchema, createFlowTemplateSchema } from '../modules/flow/types';
import { saveFlowDesign, createFlowTemplate, deleteFlowTemplate } from '../modules/flow/service';
import { STAGE_KINDS, STAGE_KIND_DEFINITIONS } from '../modules/flow/stage-kinds';

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
    transitions,
    // S5 — daftar jenis tahap ikut dikirim, bukan disalin ke frontend. Label &
    // penjelasnya hanya hidup di `modules/flow/stage-kinds.ts`, jadi tak ada
    // kamus kedua yang bisa berselisih dengan kapabilitas yang ditegakkan.
    stageKinds: STAGE_KINDS.map((kind) => STAGE_KIND_DEFINITIONS[kind]),
  });
});

// ============================================================================
// Tahap B / Phase 7.1 — Flow Template Builder.
//
// Membaca alur boleh siapa saja yang login (halaman tiket & papan Kanban
// butuh), tapi MENYUNTINGnya admin-only: sejak kapabilitas per-tahap ada,
// mengubah template berarti mengubah cara seluruh toko bekerja.
// ============================================================================

flowRouter.post('/', requirePermission('flow.manage'), zValidator('json', createFlowTemplateSchema), auditMiddleware({ action: 'flow_template.create', entityType: 'flow_template', bodyFields: ['name', 'domain'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  try {
    const template = await createFlowTemplate(tenantId, c.req.valid('json'));
    return successResponse(c, template, undefined, 201);
  } catch (err) {
    if (err instanceof BusinessError) return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    console.error('Failed to create flow template:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create flow template', undefined, 500);
  }
});

// Seluruh rancangan disimpan sekaligus (PUT, bukan PATCH per-node) — lihat
// alasan atomiknya di modules/flow/types.ts.
flowRouter.put('/:id/design', requirePermission('flow.manage'), zValidator('json', flowDesignSchema), auditMiddleware({ action: 'flow_template.save_design', entityType: 'flow_template', entityIdParam: 'id', bodyFields: ['name'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  try {
    const result = await saveFlowDesign(tenantId, c.req.param('id'), c.req.valid('json'));
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    console.error('Failed to save flow design:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to save flow design', undefined, 500);
  }
});

flowRouter.delete('/:id', requirePermission('flow.manage'), auditMiddleware({ action: 'flow_template.delete', entityType: 'flow_template', entityIdParam: 'id' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  try {
    await deleteFlowTemplate(tenantId, c.req.param('id'));
    return c.body(null, 204);
  } catch (err) {
    if (err instanceof BusinessError) return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    console.error('Failed to delete flow template:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete flow template', undefined, 500);
  }
});

export { flowRouter };
