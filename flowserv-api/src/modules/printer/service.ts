import { db } from '../../db/connection';
import { printerDevices, printerTemplates, printerAssignments, branches } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import type {
  CreateDeviceInput,
  UpdateDeviceInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  UpsertAssignmentInput,
} from './types';

export async function listDevices(tenantId: string) {
  return db.query.printerDevices.findMany({
    where: eq(printerDevices.tenantId, tenantId),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function createDevice(tenantId: string, input: CreateDeviceInput) {
  const branch = await db.query.branches.findFirst({
    where: and(eq(branches.id, input.branchId), eq(branches.tenantId, tenantId)),
  });
  if (!branch) throw new BusinessError('NOT_FOUND', 'Branch not found', 404);

  const [device] = await db.insert(printerDevices).values({
    tenantId,
    branchId: input.branchId,
    name: input.name,
    connectionType: input.connectionType,
    connectionAddress: input.connectionAddress ?? null,
    paperSize: input.paperSize,
  }).returning();

  return device;
}

export async function updateDevice(tenantId: string, id: string, input: UpdateDeviceInput) {
  const existing = await db.query.printerDevices.findFirst({
    where: and(eq(printerDevices.id, id), eq(printerDevices.tenantId, tenantId)),
  });
  if (!existing) throw new BusinessError('NOT_FOUND', 'Printer device not found', 404);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.connectionType !== undefined) patch.connectionType = input.connectionType;
  if (input.connectionAddress !== undefined) patch.connectionAddress = input.connectionAddress;
  if (input.paperSize !== undefined) patch.paperSize = input.paperSize;

  if (Object.keys(patch).length === 0) return existing;

  const [updated] = await db.update(printerDevices)
    .set(patch)
    .where(and(eq(printerDevices.id, id), eq(printerDevices.tenantId, tenantId)))
    .returning();

  return updated;
}

export async function listTemplates(tenantId: string) {
  return db.query.printerTemplates.findMany({
    where: eq(printerTemplates.tenantId, tenantId),
    orderBy: (t, { asc }) => [asc(t.documentType), asc(t.paperSize)],
  });
}

export async function createTemplate(tenantId: string, input: CreateTemplateInput) {
  const [template] = await db.insert(printerTemplates).values({
    tenantId,
    name: input.name,
    documentType: input.documentType,
    paperSize: input.paperSize,
    layoutConfig: input.layoutConfig,
    isDefault: input.isDefault ?? false,
  }).returning();

  return template;
}

export async function updateTemplate(tenantId: string, id: string, input: UpdateTemplateInput) {
  const existing = await db.query.printerTemplates.findFirst({
    where: and(eq(printerTemplates.id, id), eq(printerTemplates.tenantId, tenantId)),
  });
  if (!existing) throw new BusinessError('NOT_FOUND', 'Printer template not found', 404);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.layoutConfig !== undefined) patch.layoutConfig = input.layoutConfig;
  if (input.isDefault !== undefined) patch.isDefault = input.isDefault;

  if (Object.keys(patch).length === 0) return existing;

  const [updated] = await db.update(printerTemplates)
    .set(patch)
    .where(and(eq(printerTemplates.id, id), eq(printerTemplates.tenantId, tenantId)))
    .returning();

  return updated;
}

export async function listAssignments(tenantId: string) {
  return db.query.printerAssignments.findMany({
    where: eq(printerAssignments.tenantId, tenantId),
    with: {
      branch: { columns: { name: true } },
      device: { columns: { name: true, connectionType: true, paperSize: true } },
      template: { columns: { name: true, paperSize: true } },
    },
  });
}

/**
 * Upsert on (branchId, documentType) — the natural UI action is "set what
 * Receipt prints to for this branch", not separately create-then-update.
 *
 * Validates device/template belong to the tenant AND to each other: a
 * device physically sits at one branch (assigning another branch's printer
 * makes no sense), a template's documentType must match the slot it's being
 * assigned to, and — the one that actually matters on real hardware — the
 * device's paperSize must match the template's paperSize, or the layout an
 * 80mm template assumes will overflow a 58mm printer (or under-use an 80mm
 * one assigned a 58mm template).
 */
export async function upsertAssignment(tenantId: string, input: UpsertAssignmentInput) {
  const [branch, device, template] = await Promise.all([
    db.query.branches.findFirst({ where: and(eq(branches.id, input.branchId), eq(branches.tenantId, tenantId)) }),
    db.query.printerDevices.findFirst({ where: and(eq(printerDevices.id, input.printerDeviceId), eq(printerDevices.tenantId, tenantId)) }),
    db.query.printerTemplates.findFirst({ where: and(eq(printerTemplates.id, input.printerTemplateId), eq(printerTemplates.tenantId, tenantId)) }),
  ]);

  if (!branch) throw new BusinessError('NOT_FOUND', 'Branch not found', 404);
  if (!device) throw new BusinessError('NOT_FOUND', 'Printer device not found', 404);
  if (!template) throw new BusinessError('NOT_FOUND', 'Printer template not found', 404);

  if (device.branchId !== input.branchId) {
    throw new BusinessError('DEVICE_BRANCH_MISMATCH', 'This printer device belongs to a different branch', 422);
  }
  if (template.documentType !== input.documentType) {
    throw new BusinessError('TEMPLATE_DOCUMENT_TYPE_MISMATCH', 'This template is not for the given document type', 422);
  }
  if (device.paperSize !== template.paperSize) {
    throw new BusinessError('PAPER_SIZE_MISMATCH', `Device paper size (${device.paperSize}) does not match the template's (${template.paperSize})`, 422);
  }

  const existing = await db.query.printerAssignments.findFirst({
    where: and(
      eq(printerAssignments.tenantId, tenantId),
      eq(printerAssignments.branchId, input.branchId),
      eq(printerAssignments.documentType, input.documentType)
    ),
  });

  if (existing) {
    const [updated] = await db.update(printerAssignments)
      .set({ printerDeviceId: input.printerDeviceId, printerTemplateId: input.printerTemplateId })
      .where(eq(printerAssignments.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(printerAssignments).values({
    tenantId,
    branchId: input.branchId,
    documentType: input.documentType,
    printerDeviceId: input.printerDeviceId,
    printerTemplateId: input.printerTemplateId,
  }).returning();

  return created;
}
