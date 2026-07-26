import { Hono, type Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';
import { BusinessError } from '../lib/errors';
import {
  createDeviceSchema,
  updateDeviceSchema,
  createTemplateSchema,
  updateTemplateSchema,
  upsertAssignmentSchema,
} from '../modules/printer/types';
import * as printerService from '../modules/printer/service';

// 6A.3 — config CRUD only (devices/templates/assignments). All admin-only
// (printer.manage), same pattern as branch.manage/settings.manage_company —
// the separate, non-admin-gated render endpoint lives in routes/print.ts (6A.4).
const printerRouter = new Hono();
printerRouter.use('*', requireAuth);

function handleError(c: Context, err: unknown, fallbackMessage: string) {
  if (err instanceof BusinessError) {
    return errorResponse(c, err.code, err.message, err.details, err.statusCode);
  }
  console.error(fallbackMessage, err);
  return errorResponse(c, 'INTERNAL_ERROR', fallbackMessage, undefined, 500);
}

// ---- Devices ----

printerRouter.get('/devices', requirePermission('printer.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);
  try {
    const devices = await printerService.listDevices(tenantId);
    return successResponse(c, devices);
  } catch (err) {
    return handleError(c, err, 'Failed to fetch printer devices');
  }
});

printerRouter.post(
  '/devices',
  requirePermission('printer.manage'),
  zValidator('json', createDeviceSchema),
  auditMiddleware({ action: 'printer_device.create', entityType: 'printer_device', bodyFields: ['branchId', 'name', 'connectionType', 'paperSize'] }),
  async (c) => {
    const { tenantId } = getAuthContext(c);
    const input = c.req.valid('json');
    try {
      const device = await printerService.createDevice(tenantId, input);
      return successResponse(c, device, undefined, 201);
    } catch (err) {
      return handleError(c, err, 'Failed to create printer device');
    }
  }
);

printerRouter.patch(
  '/devices/:id',
  requirePermission('printer.manage'),
  zValidator('json', updateDeviceSchema),
  auditMiddleware({ action: 'printer_device.update', entityType: 'printer_device', entityIdParam: 'id', bodyFields: ['name', 'connectionType', 'connectionAddress', 'paperSize'] }),
  async (c) => {
    const { tenantId } = getAuthContext(c);
    const id = c.req.param('id');
    const input = c.req.valid('json');
    try {
      const device = await printerService.updateDevice(tenantId, id, input);
      return successResponse(c, device);
    } catch (err) {
      return handleError(c, err, 'Failed to update printer device');
    }
  }
);

// ---- Templates ----

printerRouter.get('/templates', requirePermission('printer.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);
  try {
    const templates = await printerService.listTemplates(tenantId);
    return successResponse(c, templates);
  } catch (err) {
    return handleError(c, err, 'Failed to fetch printer templates');
  }
});

printerRouter.post(
  '/templates',
  requirePermission('printer.manage'),
  zValidator('json', createTemplateSchema),
  auditMiddleware({ action: 'printer_template.create', entityType: 'printer_template', bodyFields: ['name', 'documentType', 'paperSize', 'isDefault'] }),
  async (c) => {
    const { tenantId } = getAuthContext(c);
    const input = c.req.valid('json');
    try {
      const template = await printerService.createTemplate(tenantId, input);
      return successResponse(c, template, undefined, 201);
    } catch (err) {
      return handleError(c, err, 'Failed to create printer template');
    }
  }
);

printerRouter.patch(
  '/templates/:id',
  requirePermission('printer.manage'),
  zValidator('json', updateTemplateSchema),
  auditMiddleware({ action: 'printer_template.update', entityType: 'printer_template', entityIdParam: 'id', bodyFields: ['name', 'layoutConfig', 'isDefault'] }),
  async (c) => {
    const { tenantId } = getAuthContext(c);
    const id = c.req.param('id');
    const input = c.req.valid('json');
    try {
      const template = await printerService.updateTemplate(tenantId, id, input);
      return successResponse(c, template);
    } catch (err) {
      return handleError(c, err, 'Failed to update printer template');
    }
  }
);

// ---- Assignments ----

printerRouter.get('/assignments', requirePermission('printer.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);
  try {
    const assignments = await printerService.listAssignments(tenantId);
    return successResponse(c, assignments);
  } catch (err) {
    return handleError(c, err, 'Failed to fetch printer assignments');
  }
});

printerRouter.put(
  '/assignments',
  requirePermission('printer.manage'),
  zValidator('json', upsertAssignmentSchema),
  auditMiddleware({ action: 'printer_assignment.upsert', entityType: 'printer_assignment', bodyFields: ['branchId', 'documentType', 'printerDeviceId', 'printerTemplateId'] }),
  async (c) => {
    const { tenantId } = getAuthContext(c);
    const input = c.req.valid('json');
    try {
      const assignment = await printerService.upsertAssignment(tenantId, input);
      return successResponse(c, assignment, undefined, 200);
    } catch (err) {
      return handleError(c, err, 'Failed to set printer assignment');
    }
  }
);

export { printerRouter };
