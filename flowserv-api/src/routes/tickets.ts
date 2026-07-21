import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection';
import { customers, customerAssets, serviceTickets, flowTemplates, flowNodes, ticketStageHistory, branches } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';
import { FlowEngine } from '../services/flow-engine';
import { BusinessError } from '../lib/errors';
import { createChargeInput, updateChargeInput } from '../modules/tickets/types';
import { addCharge, updateCharge, deleteCharge, listCharges, generateQuotation } from '../modules/tickets/service';

const ticketsRouter = new Hono();
ticketsRouter.use('*', requireAuth);

// Get all tickets
ticketsRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  // Ideally filter by branchId too, but for MVP we return all tenant tickets
  // To keep it simple, we join with customers and assets
  
  const results = await db
    .select({
      id: serviceTickets.id,
      status: serviceTickets.status,
      createdAt: serviceTickets.createdAt,
      customerName: customers.name,
      assetType: customerAssets.assetType,
      brand: customerAssets.brand,
      model: customerAssets.model,
      flowTemplateName: flowTemplates.name,
      nodeName: flowNodes.name
    })
    .from(serviceTickets)
    .innerJoin(customers, eq(serviceTickets.customerId, customers.id))
    .innerJoin(customerAssets, eq(serviceTickets.customerAssetId, customerAssets.id))
    .innerJoin(flowTemplates, eq(serviceTickets.flowTemplateId, flowTemplates.id))
    .leftJoin(flowNodes, eq(serviceTickets.currentNodeId, flowNodes.id))
    .where(eq(serviceTickets.tenantId, tenantId))
    .orderBy(desc(serviceTickets.createdAt));
    
  return successResponse(c, results);
});

// Get single ticket details
ticketsRouter.get('/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  
  const ticketQuery = await db
    .select({
      ticket: serviceTickets,
      customer: customers,
      asset: customerAssets,
      template: flowTemplates,
      node: flowNodes
    })
    .from(serviceTickets)
    .innerJoin(customers, eq(serviceTickets.customerId, customers.id))
    .innerJoin(customerAssets, eq(serviceTickets.customerAssetId, customerAssets.id))
    .innerJoin(flowTemplates, eq(serviceTickets.flowTemplateId, flowTemplates.id))
    .leftJoin(flowNodes, eq(serviceTickets.currentNodeId, flowNodes.id))
    .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    
  if (ticketQuery.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Ticket not found', [], 404);
  }
  
  // Get stage history
  const history = await db
    .select({
      id: ticketStageHistory.id,
      nodeName: flowNodes.name,
      enteredAt: ticketStageHistory.enteredAt,
      notes: ticketStageHistory.notes
    })
    .from(ticketStageHistory)
    .innerJoin(flowNodes, eq(ticketStageHistory.nodeId, flowNodes.id))
    .where(eq(ticketStageHistory.ticketId, ticketId))
    .orderBy(desc(ticketStageHistory.enteredAt));
    
  const data = {
    ...ticketQuery[0],
    history
  };
  
  return successResponse(c, data);
});

// UNIFIED INTAKE ENDPOINT
const intakeSchema = z.object({
  customerId: z.string().uuid().optional(), // if existing customer
  customerName: z.string().min(2).optional(), // if new customer
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  
  assetId: z.string().uuid().optional(), // if existing asset
  assetType: z.string().optional(), // if new asset
  assetBrand: z.string().optional(),
  assetModel: z.string().optional(),
  assetSn: z.string().optional(),
  
  flowTemplateId: z.string().uuid(),
  branchId: z.string().uuid() // for this MVP we'll need to pass branchId from frontend (or default it)
});

ticketsRouter.post('/intake', zValidator('json', intakeSchema), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  try {
    const result = await db.transaction(async (tx) => {
      let finalCustomerId = data.customerId;
      
      // 1. Resolve Customer
      if (!finalCustomerId) {
        if (!data.customerName) throw new Error('Customer name required for new customer');
        const [newCust] = await tx.insert(customers).values({
          tenantId,
          name: data.customerName,
          phone: data.customerPhone || null,
          email: data.customerEmail || null
        }).returning();
        finalCustomerId = newCust.id;
      }
      
      // 2. Resolve Asset
      let finalAssetId = data.assetId;
      if (!finalAssetId) {
        if (!data.assetType) throw new Error('Asset type required for new asset');
        const [newAsset] = await tx.insert(customerAssets).values({
          customerId: finalCustomerId,
          assetType: data.assetType,
          brand: data.assetBrand || null,
          model: data.assetModel || null,
          serialNumber: data.assetSn || null
        }).returning();
        finalAssetId = newAsset.id;
      }
      
      // 3. Resolve Branch
      let finalBranchId = data.branchId;
      // If it's a dummy branch, just get the first branch of the tenant
      if (finalBranchId === '00000000-0000-0000-0000-000000000000') {
        const branchResult = await tx.select({ id: branches.id }).from(branches).where(eq(branches.tenantId, tenantId)).limit(1);
        if (branchResult.length === 0) throw new Error('No branch found for tenant');
        finalBranchId = branchResult[0].id;
      }

      // 4. Find first node of the selected flow template
      const nodes = await tx.select().from(flowNodes)
        .where(eq(flowNodes.flowTemplateId, data.flowTemplateId))
        .orderBy(flowNodes.name); 
      
      const firstNode = nodes.find(n => n.name.toLowerCase().includes('intake')) || nodes[0];
      
      if (!firstNode) {
        throw new Error('Flow template has no nodes');
      }
      
      // 5. Create Ticket
      const [ticket] = await tx.insert(serviceTickets).values({
        tenantId,
        branchId: finalBranchId,
        customerId: finalCustomerId,
        customerAssetId: finalAssetId,
        flowTemplateId: data.flowTemplateId,
        currentNodeId: firstNode.id,
        status: 'open'
      }).returning();
      
      // 5. Create History Entry
      await tx.insert(ticketStageHistory).values({
        ticketId: ticket.id,
        nodeId: firstNode.id,
        actorId: userId,
        notes: 'Ticket intake created via Unified Form'
      });
      
      return ticket;
    });
    
    return successResponse(c, result, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTAKE_FAILED', err.message, [], 400);
  }
});

// TRANSITION ENDPOINT
const transitionSchema = z.object({
  targetNodeId: z.string().uuid(),
  notes: z.string().optional()
});

ticketsRouter.post('/:id/transition', zValidator('json', transitionSchema), async (c) => {
  const { tenantId, userId, roleId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const { targetNodeId, notes } = c.req.valid('json');
  
  // Get ticket
  const t = await db.select().from(serviceTickets).where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
  if (t.length === 0) return errorResponse(c, 'NOT_FOUND', 'Ticket not found', [], 404);
  
  const ticket = t[0];
  if (!ticket.currentNodeId) return errorResponse(c, 'INVALID_STATE', 'Ticket has no current node', [], 400);

  try {
    const result = await FlowEngine.executeTransition(
      tenantId,
      ticket.flowTemplateId,
      ticket.id,
      ticket.currentNodeId,
      targetNodeId,
      roleId,
      userId,
      notes
    );

    if (!result.valid) {
      // 403 = you are not allowed; 409 = the flow does not permit this move at all
      const status = result.code === 'PERMISSION_DENIED' ? 403 : 409;
      return errorResponse(c, result.code, result.reason, [], status);
    }

    return successResponse(c, { success: true });
  } catch (err: any) {
    return errorResponse(c, 'TRANSITION_FAILED', err.message, [], 500);
  }
});

// ============================================================================
// H7 — Ticket charges (parts, labor, fees). Logic lives in modules/tickets/service.ts;
// these handlers stay thin and translate BusinessError → the standard error envelope.
// ============================================================================

// List a ticket's charges with computed totals + margin
ticketsRouter.get('/:id/charges', async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  try {
    const result = await listCharges(tenantId, ticketId);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to list charges:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list charges', undefined, 500);
  }
});

// Add an estimated charge
ticketsRouter.post('/:id/charges', zValidator('json', createChargeInput), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const input = c.req.valid('json');
  try {
    const charge = await addCharge(tenantId, ticketId, input, userId);
    return successResponse(c, charge, undefined, 201);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to add charge:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to add charge', undefined, 500);
  }
});

// Edit a charge (only while estimated)
ticketsRouter.patch('/:id/charges/:chargeId', zValidator('json', updateChargeInput), async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const chargeId = c.req.param('chargeId');
  const input = c.req.valid('json');
  try {
    const charge = await updateCharge(tenantId, ticketId, chargeId, input);
    return successResponse(c, charge);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to update charge:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update charge', undefined, 500);
  }
});

// Delete a charge (only while estimated)
ticketsRouter.delete('/:id/charges/:chargeId', async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const chargeId = c.req.param('chargeId');
  try {
    const result = await deleteCharge(tenantId, ticketId, chargeId);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to delete charge:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete charge', undefined, 500);
  }
});

// Freeze estimates into a quote → writes approval_requests.amount
ticketsRouter.post('/:id/quotation', async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  try {
    const result = await generateQuotation(tenantId, ticketId);
    return successResponse(c, result, undefined, 201);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to generate quotation:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to generate quotation', undefined, 500);
  }
});

export { ticketsRouter };
