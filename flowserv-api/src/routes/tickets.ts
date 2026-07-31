import { Hono } from 'hono';
import { z } from 'zod';
import { checkPasscode } from '../lib/passcode';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection';
import { customers, customerAssets, serviceTickets, flowTemplates, flowNodes, flowTransitions, ticketStageHistory, branches, users, deviceModels, deviceBrands } from '../db/schema';
import { ticketStatusEnum } from '../db/schema/enums';
import { eq, and, desc, inArray, isNull, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission, enforcePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse, getRequestId } from '../lib/response';
import { cursorCondition, decodeCursor, parseLimit, buildPage, orderByCursor } from '../lib/pagination';
import { findIdempotentResponse, isIdempotencyKeyConflict, replayIdempotentResponse } from '../lib/idempotency';
import { FlowEngine } from '../flow-engine/engine';
import { BusinessError } from '../lib/errors';
import { createChargeInput, updateChargeInput, assignTechnicianInput, generateTicketInvoiceInput, cancelTicketInput, updateIntakeDetailsInput, saveChecklistInput } from '../modules/tickets/types';
import { addCharge, updateCharge, deleteCharge, listCharges, generateQuotation, assignTechnician, consumeCharge, returnCharge, cancelCharge, generateTicketInvoice, cancelTicket, updateIntakeDetails, findActiveInvoiceForTicket } from '../modules/tickets/service';
import { getTicketChecklist, getTicketChecklistHistory, saveTicketChecklist } from '../modules/tickets/checklist-service';

const ticketsRouter = new Hono();
ticketsRouter.use('*', requireAuth);

// Get all tickets
ticketsRouter.get('/', async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  // Ideally filter by branchId too, but for MVP we return all tenant tickets
  // To keep it simple, we join with customers and assets

  // H8 — "My Jobs" (?assignedTo=me) and manager filtering (?assignedTo=<userId>)
  //
  // R1 (2026-07-31) — `?assignedTo=none` ditambahkan: antrian tiket yang BELUM
  // bertuan. Tanpa ini teknisi tak punya cara melihat pekerjaan yang menunggu —
  // daftarnya selalu difilter `assignedTo=me`, jadi tiket tak bertuan tidak
  // muncul di mana pun, halaman detailnya tak terjangkau, dan tombol "Ambil
  // Pekerjaan" (yang sudah ada dan sudah benar) tak pernah bisa ditekan.
  //
  // Tetap permisif seperti filter lain di handler ini: nilai asing diabaikan,
  // bukan 400 — endpoint ini juga dipakai papan Kanban dan beranda per peran.
  const assignedToParam = c.req.query('assignedTo');
  const filters = [eq(serviceTickets.tenantId, tenantId)];
  if (assignedToParam === 'none') {
    filters.push(isNull(serviceTickets.assignedTechnicianId));
  } else if (assignedToParam) {
    const assignedToId = assignedToParam === 'me' ? userId : assignedToParam;
    filters.push(eq(serviceTickets.assignedTechnicianId, assignedToId));
  }

  // P2 — Kanban board filters. Lenient like ?assignedTo=: an unrecognized status is
  // ignored rather than erroring, an unmatched flowTemplateId just yields zero rows.
  const statusParam = c.req.query('status');
  if (statusParam && (ticketStatusEnum.enumValues as readonly string[]).includes(statusParam)) {
    filters.push(eq(serviceTickets.status, statusParam as typeof serviceTickets.status.enumValues[number]));
  }
  const flowTemplateIdParam = c.req.query('flowTemplateId');
  if (flowTemplateIdParam) {
    filters.push(eq(serviceTickets.flowTemplateId, flowTemplateIdParam));
  }

  // H13 — cursor pagination. Previously an unbounded, un-paginated list.
  const limit = parseLimit(c.req.query('limit'));
  const cursorParam = c.req.query('cursor');
  if (cursorParam) {
    const cursor = decodeCursor(cursorParam);
    if (!cursor) return errorResponse(c, 'INVALID_CURSOR', 'Malformed cursor', undefined, 400);
    filters.push(cursorCondition(serviceTickets.createdAt, serviceTickets.id, cursor));
  }

  const rows = await db
    .select({
      id: serviceTickets.id,
      status: serviceTickets.status,
      createdAt: serviceTickets.createdAt,
      customerName: customers.name,
      assetType: customerAssets.assetType,
      brand: customerAssets.brand,
      model: customerAssets.model,
      flowTemplateId: serviceTickets.flowTemplateId,
      flowTemplateName: flowTemplates.name,
      currentNodeId: serviceTickets.currentNodeId,
      nodeName: flowNodes.name,
      assignedTechnicianId: serviceTickets.assignedTechnicianId,
      assignedTechnicianName: users.name,
    })
    .from(serviceTickets)
    .innerJoin(customers, eq(serviceTickets.customerId, customers.id))
    .innerJoin(customerAssets, eq(serviceTickets.customerAssetId, customerAssets.id))
    .innerJoin(flowTemplates, eq(serviceTickets.flowTemplateId, flowTemplates.id))
    .leftJoin(flowNodes, eq(serviceTickets.currentNodeId, flowNodes.id))
    .leftJoin(users, eq(serviceTickets.assignedTechnicianId, users.id))
    .where(and(...filters))
    .orderBy(...orderByCursor(serviceTickets.createdAt, serviceTickets.id))
    .limit(limit + 1);

  const { page, hasMore, nextCursor } = buildPage(rows, limit);

  return successResponse(c, page, { has_more: hasMore, next_cursor: nextCursor });
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
      node: flowNodes,
      assignedTechnician: { id: users.id, name: users.name },
      // Tahap A — device catalog. Null when the asset isn't linked to a
      // catalog entry (freeform brand/model text, the common case until the
      // catalog is populated).
      deviceModel: { id: deviceModels.id, imageUrl: deviceModels.imageUrl, specs: deviceModels.specs },
    })
    .from(serviceTickets)
    .innerJoin(customers, eq(serviceTickets.customerId, customers.id))
    .innerJoin(customerAssets, eq(serviceTickets.customerAssetId, customerAssets.id))
    .innerJoin(flowTemplates, eq(serviceTickets.flowTemplateId, flowTemplates.id))
    .leftJoin(flowNodes, eq(serviceTickets.currentNodeId, flowNodes.id))
    .leftJoin(users, eq(serviceTickets.assignedTechnicianId, users.id))
    .leftJoin(deviceModels, eq(customerAssets.deviceModelId, deviceModels.id))
    .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    
  if (ticketQuery.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Ticket not found', [], 404);
  }
  
  // Get stage history. actorId is nullable (system-driven entries carry
  // none) so this must stay a leftJoin — an innerJoin would silently drop
  // those rows from the timeline entirely.
  const history = await db
    .select({
      id: ticketStageHistory.id,
      nodeName: flowNodes.name,
      enteredAt: ticketStageHistory.enteredAt,
      notes: ticketStageHistory.notes,
      actorName: users.name,
    })
    .from(ticketStageHistory)
    .innerJoin(flowNodes, eq(ticketStageHistory.nodeId, flowNodes.id))
    .leftJoin(users, eq(ticketStageHistory.actorId, users.id))
    .where(eq(ticketStageHistory.ticketId, ticketId))
    .orderBy(desc(ticketStageHistory.enteredAt));
    
  // Tahap A — go-live gap Tier-1 #3 ("nota selesai"). Surfaces the ticket's
  // linked invoice (if H17's generateTicketInvoice already created one) so
  // the detail page can offer a print button without the frontend having to
  // remember the id past a page reload.
  const invoice = await findActiveInvoiceForTicket(tenantId, ticketId);

  // Daftar periksa (QC): yang aktif untuk tahap saat ini, plus semua yang pernah
  // diisi di tahap-tahap sebelumnya — bagian kedua itulah buktinya, dan bukti
  // tidak boleh hilang begitu tiket pindah tahap.
  const currentNodeId = ticketQuery[0].ticket.currentNodeId;
  const [checklist, checklistHistory] = await Promise.all([
    currentNodeId ? getTicketChecklist(tenantId, ticketId, currentNodeId) : Promise.resolve(null),
    getTicketChecklistHistory(tenantId, ticketId),
  ]);

  const data = {
    ...ticketQuery[0],
    history,
    invoice,
    checklist,
    checklistHistory: checklistHistory.filter((h) => h.nodeId !== currentNodeId),
  };

  return successResponse(c, data);
});

// UNIFIED INTAKE ENDPOINT
// The intake form sends every field, including '' for the id it isn't using
// (customerId '' when registering a NEW customer, assetId '' for a new asset).
// z.string().uuid().optional() rejects '' because '' is neither undefined nor a
// valid UUID — which 400'd every new-customer intake from the UI. Normalize ''
// -> undefined first so the handler's "no id -> create it" path runs. (Found by
// the H15-gap-(b) Playwright walk — exactly the UI dead end an API test misses.)
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

// R1.5C — satu definisi dipakai kedua jalur tulis (intake + PATCH
// intake-details), supaya aturannya tak bisa berbeda di antara keduanya.
// Boleh kosong; yang ditolak hanya yang diisi tapi terlalu pendek.
const passcodeField = z.preprocess(
  emptyToUndefined,
  z.string().optional().superRefine((val, ctx) => {
    const check = checkPasscode(val);
    if (!check.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: check.message });
    }
  })
);

const intakeSchema = z.object({
  customerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()), // if existing customer
  customerName: z.string().min(2).optional(), // if new customer
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),

  assetId: z.preprocess(emptyToUndefined, z.string().uuid().optional()), // if existing asset
  assetType: z.string().optional(), // if new asset
  assetBrand: z.string().optional(),
  assetModel: z.string().optional(),
  assetSn: z.string().optional(),
  // Tahap A — device catalog (image/specs/suggested services). Set only when
  // the intake form's autocomplete matched an existing device_models row;
  // left undefined for freeform brand/model text (no catalog entry required).
  deviceModelId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),

  // Tahap A — go-live gap Tier-1 #2. Recorded at intake, given back at
  // handover (QC Akhir); editable later via PATCH /:id/intake-details.
  // R1.5C — panjang minimumnya ditegakkan di sini (dan di PATCH), bukan hanya
  // di form: mengunci form saja adalah kunci semu, satu panggilan API langsung
  // menembusnya (pelajaran S5).
  devicePasscode: passcodeField,
  // Tahap A — go-live gap Tier-1 #3. Feeds the label/tanda-terima print
  // documents ("kerusakan"); editable later via the same PATCH endpoint.
  reportedComplaint: z.preprocess(emptyToUndefined, z.string().optional()),

  // Tahap B — OPSIONAL sekarang. Alur nyata toko tidak memilih "ditunggu atau
  // disimpan" di intake: kasir baru tahu setelah teknisi mendiagnosis. Form
  // intake karena itu tak lagi menanyakannya, dan tiket memakai template
  // default tenant (satu template bercabang). Tetap diterima bila dikirim
  // eksplisit — fixture e2e & tiket yang sengaja memakai template lain.
  flowTemplateId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  branchId: z.string().uuid() // for this MVP we'll need to pass branchId from frontend (or default it)
});

ticketsRouter.post('/intake', requirePermission('ticket.create'), zValidator('json', intakeSchema), auditMiddleware({ action: 'ticket.create', entityType: 'service_ticket', bodyFields: ['flowTemplateId', 'branchId', 'customerId', 'assetId', 'assetType'] }), async (c) => {
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

        // Tahap A — verify a supplied deviceModelId actually belongs to this
        // tenant (via its brand) before trusting it; silently drop it rather
        // than 400ing the whole intake for a client-side matching mistake.
        let resolvedDeviceModelId: string | null = null;
        if (data.deviceModelId) {
          const match = await tx
            .select({ id: deviceModels.id })
            .from(deviceModels)
            .innerJoin(deviceBrands, eq(deviceModels.deviceBrandId, deviceBrands.id))
            .where(and(eq(deviceModels.id, data.deviceModelId), eq(deviceBrands.tenantId, tenantId)));
          resolvedDeviceModelId = match.length > 0 ? data.deviceModelId : null;
        }

        const [newAsset] = await tx.insert(customerAssets).values({
          customerId: finalCustomerId,
          assetType: data.assetType,
          brand: data.assetBrand || null,
          model: data.assetModel || null,
          serialNumber: data.assetSn || null,
          deviceModelId: resolvedDeviceModelId,
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

      // 4. Resolve the flow template — explicit one if given, else the tenant's
      // default (Tahap B: the intake form no longer asks).
      let finalFlowTemplateId = data.flowTemplateId;
      if (!finalFlowTemplateId) {
        const [defaultTemplate] = await tx
          .select({ id: flowTemplates.id })
          .from(flowTemplates)
          .where(and(eq(flowTemplates.tenantId, tenantId), eq(flowTemplates.isDefault, true)))
          .orderBy(flowTemplates.createdAt)
          .limit(1);
        if (!defaultTemplate) throw new Error('No default flow template configured for this tenant');
        finalFlowTemplateId = defaultTemplate.id;
      }

      // 5. Find first node of the selected flow template. Structural, not by
      // name: the intake node is the one nothing transitions INTO.
      const nodes = await tx.select().from(flowNodes)
        .where(eq(flowNodes.flowTemplateId, finalFlowTemplateId))
        .orderBy(flowNodes.sequenceOrder);

      if (nodes.length === 0) throw new Error('Flow template has no nodes');

      const incoming = await tx
        .select({ toNodeId: flowTransitions.toNodeId })
        .from(flowTransitions)
        .where(inArray(flowTransitions.fromNodeId, nodes.map((n) => n.id)));
      const hasIncoming = new Set(incoming.map((t) => t.toNodeId));
      const firstNode = nodes.find((n) => !hasIncoming.has(n.id)) ?? nodes[0];

      // 6. Nomor antrian harian per cabang (Tahap B). Dihitung di dalam
      // transaksi yang sama supaya dua intake bersamaan tak berbagi nomor;
      // di-reset otomatis tiap hari karena difilter queue_date = hari ini.
      const today = new Date().toISOString().slice(0, 10);
      const [{ maxQueue }] = await tx
        .select({ maxQueue: sql<number | null>`max(${serviceTickets.queueNumber})` })
        .from(serviceTickets)
        .where(and(
          eq(serviceTickets.tenantId, tenantId),
          eq(serviceTickets.branchId, finalBranchId),
          eq(serviceTickets.queueDate, today)
        ));

      // 7. Create Ticket
      const [ticket] = await tx.insert(serviceTickets).values({
        tenantId,
        branchId: finalBranchId,
        customerId: finalCustomerId,
        customerAssetId: finalAssetId,
        flowTemplateId: finalFlowTemplateId,
        currentNodeId: firstNode.id,
        status: 'open',
        devicePasscode: data.devicePasscode || null,
        reportedComplaint: data.reportedComplaint || null,
        queueNumber: (maxQueue ?? 0) + 1,
        queueDate: today,
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

// Tahap A — go-live gap Tier-1 #2/#3. Edit sandi/pola and/or the reported
// complaint at any point in the ticket's life (not just at intake — lets a
// mis-keyed value be corrected, and lets staff clear sandi/pola once
// returned to the customer at handover). Reuses `ticket.create` (the same
// actors who do intake) rather than adding a new permission. Deliberately
// NOT in auditMiddleware's bodyFields — a lock code/pattern is exactly the
// kind of value that shouldn't sit in cleartext in a second place (the audit
// log); the complaint text is excluded too, for consistency with one
// endpoint covering both fields.
ticketsRouter.patch('/:id/intake-details', requirePermission('ticket.create'), zValidator('json', updateIntakeDetailsInput), auditMiddleware({ action: 'ticket.update_intake_details', entityType: 'service_ticket', entityIdParam: 'id' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const input = c.req.valid('json');
  try {
    const result = await updateIntakeDetails(tenantId, ticketId, input);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to update intake details:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update intake details', undefined, 500);
  }
});

// DAFTAR PERIKSA TAHAP (QC)
//
// PUT, bukan POST: menyimpan ulang daftar yang sama harus menghasilkan keadaan
// yang sama, bukan menumpuk baris centang kedua.
ticketsRouter.put('/:id/checklist', requirePermission('ticket.qc'), zValidator('json', saveChecklistInput), auditMiddleware({ action: 'ticket.save_checklist', entityType: 'service_ticket', entityIdParam: 'id', bodyFields: ['nodeId'] }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  try {
    const result = await saveTicketChecklist(tenantId, ticketId, userId ?? null, c.req.valid('json'));
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to save ticket checklist:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to save ticket checklist', undefined, 500);
  }
});

// TRANSITION ENDPOINT
const transitionSchema = z.object({
  targetNodeId: z.string().uuid(),
  notes: z.string().optional()
});

// No requirePermission here on purpose: FlowEngine.executeTransition already gates
// on the *target node's* requiredPermissionId (flow-engine/engine.ts), which varies
// per node — a route-level static permission code can't express that. See H12.
const TRANSITION_ENDPOINT = 'POST /v1/tickets/:id/transition';

ticketsRouter.post('/:id/transition', zValidator('json', transitionSchema), auditMiddleware({ action: 'ticket.transition', entityType: 'service_ticket', entityIdParam: 'id', bodyFields: ['targetNodeId', 'notes'] }), async (c) => {
  const { tenantId, userId, roleId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const { targetNodeId, notes } = c.req.valid('json');

  // H13 — idempotency pre-check, before touching the ticket at all.
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey) {
    const replay = await findIdempotentResponse(tenantId, TRANSITION_ENDPOINT, idempotencyKey);
    if (replay) return replayIdempotentResponse(c, replay);
  }

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
      notes,
      idempotencyKey ? { key: idempotencyKey, endpoint: TRANSITION_ENDPOINT } : undefined,
      getRequestId(c)
    );

    if (!result.valid) {
      // 403 = you are not allowed; 409 = the flow does not permit this move at all
      const status = result.code === 'PERMISSION_DENIED' ? 403 : 409;
      return errorResponse(c, result.code, result.reason, [], status);
    }

    return successResponse(c, { success: true });
  } catch (err: any) {
    // H13 — a losing race on the idempotency key aborts executeTransition's
    // transaction; replay the winner's committed response instead of a 500.
    if (idempotencyKey && isIdempotencyKeyConflict(err)) {
      const replay = await findIdempotentResponse(tenantId, TRANSITION_ENDPOINT, idempotencyKey);
      if (replay) return replayIdempotentResponse(c, replay);
    }
    return errorResponse(c, 'TRANSITION_FAILED', err.message, [], 500);
  }
});

// F3 — SVC-013: cancel a ticket. Releases any reserved parts (approved charges);
// leaves already-consumed parts alone (that's a physical return, not implied by
// cancelling the job) and reports how many so the caller can warn.
ticketsRouter.post('/:id/cancel', requirePermission('ticket.cancel'), zValidator('json', cancelTicketInput), auditMiddleware({ action: 'ticket.cancel', entityType: 'service_ticket', entityIdParam: 'id', bodyFields: ['reason'] }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const { reason } = c.req.valid('json');
  try {
    const result = await cancelTicket(tenantId, ticketId, reason, userId);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to cancel ticket:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel ticket', undefined, 500);
  }
});

// ============================================================================
// H8 — Technician assignment. Logic lives in modules/tickets/service.ts.
// ============================================================================

ticketsRouter.post('/:id/assign', requirePermission('ticket.assign_technician'), zValidator('json', assignTechnicianInput), auditMiddleware({ action: 'ticket.assign_technician', entityType: 'service_ticket', entityIdParam: 'id', bodyFields: ['technicianId'] }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const input = c.req.valid('json');
  try {
    const result = await assignTechnician(tenantId, ticketId, input, userId);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to assign technician:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to assign technician', undefined, 500);
  }
});

// Tahap B — teknisi mengambil sendiri pekerjaan dari antrian ("teknisi bisa
// mengambil pekerjaan dari yang menunggu antrian tersebut"). Sengaja TIDAK
// memakai `ticket.assign_technician` (izin manajer untuk menugaskan orang
// lain): ini menugaskan DIRI SENDIRI, jadi cukup izin teknisi biasa. userId
// diambil dari JWT, bukan body — teknisi tak bisa menugaskan orang lain lewat
// endpoint ini meski mencoba.
ticketsRouter.post('/:id/claim', requirePermission('ticket.diagnose'), auditMiddleware({ action: 'ticket.claim', entityType: 'service_ticket', entityIdParam: 'id' }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  try {
    const result = await assignTechnician(tenantId, ticketId, { technicianId: userId }, userId);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to claim ticket:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to claim ticket', undefined, 500);
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
ticketsRouter.post('/:id/charges', requirePermission('ticket.manage_charges'), zValidator('json', createChargeInput), auditMiddleware({ action: 'ticket.add_charge', entityType: 'ticket_charge', bodyFields: ['sourceType', 'description', 'quantity', 'unitPrice', 'inventoryItemId'] }), async (c) => {
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
ticketsRouter.patch('/:id/charges/:chargeId', requirePermission('ticket.manage_charges'), zValidator('json', updateChargeInput), auditMiddleware({ action: 'ticket.update_charge', entityType: 'ticket_charge', entityIdParam: 'chargeId', bodyFields: ['description', 'quantity', 'unitPrice'] }), async (c) => {
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
ticketsRouter.delete('/:id/charges/:chargeId', requirePermission('ticket.manage_charges'), auditMiddleware({ action: 'ticket.delete_charge', entityType: 'ticket_charge', entityIdParam: 'chargeId' }), async (c) => {
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

// H9 — physically deduct an approved part charge from FIFO stock
const CONSUME_CHARGE_ENDPOINT = 'POST /v1/tickets/:id/charges/:chargeId/consume';

ticketsRouter.post('/:id/charges/:chargeId/consume', requirePermission('ticket.manage_charges'), auditMiddleware({ action: 'ticket.consume_charge', entityType: 'ticket_charge', entityIdParam: 'chargeId' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const chargeId = c.req.param('chargeId');

  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey) {
    const replay = await findIdempotentResponse(tenantId, CONSUME_CHARGE_ENDPOINT, idempotencyKey);
    if (replay) return replayIdempotentResponse(c, replay);
  }

  try {
    const result = await consumeCharge(
      tenantId,
      ticketId,
      chargeId,
      idempotencyKey ? { key: idempotencyKey, endpoint: CONSUME_CHARGE_ENDPOINT } : undefined,
      getRequestId(c)
    );
    return successResponse(c, result);
  } catch (err) {
    if (idempotencyKey && isIdempotencyKeyConflict(err)) {
      const replay = await findIdempotentResponse(tenantId, CONSUME_CHARGE_ENDPOINT, idempotencyKey);
      if (replay) return replayIdempotentResponse(c, replay);
    }
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to consume charge:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to consume charge', undefined, 500);
  }
});

// H9 — undo a consumption: restore stock, flip the charge back to 'approved'
ticketsRouter.post('/:id/charges/:chargeId/return', requirePermission('ticket.manage_charges'), auditMiddleware({ action: 'ticket.return_charge', entityType: 'ticket_charge', entityIdParam: 'chargeId' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const chargeId = c.req.param('chargeId');
  try {
    const result = await returnCharge(tenantId, ticketId, chargeId);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to return charge:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to return charge', undefined, 500);
  }
});

// H10 — cancel an approved charge before it's consumed, releasing its stock reservation
ticketsRouter.post('/:id/charges/:chargeId/cancel', requirePermission('ticket.manage_charges'), auditMiddleware({ action: 'ticket.cancel_charge', entityType: 'ticket_charge', entityIdParam: 'chargeId' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const chargeId = c.req.param('chargeId');
  try {
    const result = await cancelCharge(tenantId, ticketId, chargeId);
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to cancel charge:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel charge', undefined, 500);
  }
});

// Freeze estimates into a quote → writes approval_requests.amount
ticketsRouter.post('/:id/quotation', requirePermission('ticket.approve_quote'), auditMiddleware({ action: 'ticket.generate_quotation', entityType: 'service_ticket', entityIdParam: 'id' }), async (c) => {
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

// H17 — SBL-003: generate a customer invoice from the ticket's billable charges
// (consumed parts + approved labor). Creates a pos_invoices row WITHOUT re-running
// FIFO — the fix for the double-deduct gap H15 discovered. Gated by
// `pos.process_payment` (same as POS checkout — both create a pos_invoices row).
const TICKET_INVOICE_ENDPOINT = 'POST /v1/tickets/:id/invoice';

ticketsRouter.post('/:id/invoice', requirePermission('pos.process_payment'), zValidator('json', generateTicketInvoiceInput), auditMiddleware({ action: 'ticket.generate_invoice', entityType: 'pos_invoice', entityIdParam: 'id', bodyFields: ['paymentMethod', 'discountAmount'] }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const ticketId = c.req.param('id');
  const input = c.req.valid('json');

  // D2 — same discount gate as POS checkout: only pos.apply_discount may bill a
  // non-zero discount on a service invoice.
  if (input.discountAmount > 0) {
    const blocked = await enforcePermission(c, 'pos.apply_discount');
    if (blocked) return blocked;
  }

  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey) {
    const replay = await findIdempotentResponse(tenantId, TICKET_INVOICE_ENDPOINT, idempotencyKey);
    if (replay) return replayIdempotentResponse(c, replay);
  }

  try {
    const invoice = await generateTicketInvoice(
      tenantId,
      ticketId,
      input,
      userId,
      idempotencyKey ? { key: idempotencyKey, endpoint: TICKET_INVOICE_ENDPOINT } : undefined,
      getRequestId(c)
    );
    return successResponse(c, invoice, undefined, 201);
  } catch (err) {
    if (idempotencyKey && isIdempotencyKeyConflict(err)) {
      const replay = await findIdempotentResponse(tenantId, TICKET_INVOICE_ENDPOINT, idempotencyKey);
      if (replay) return replayIdempotentResponse(c, replay);
    }
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to generate ticket invoice:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to generate ticket invoice', undefined, 500);
  }
});

export { ticketsRouter };
