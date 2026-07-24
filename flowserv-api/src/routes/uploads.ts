import { Hono } from 'hono';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { successResponse, errorResponse } from '../lib/response';

// Local file storage for device photos, adapted from the owner's previous
// (legacy) project's LocalStorageAdapter -- same shape (multipart 'file' +
// optional 'folder', returns a relative /uploads/... URL the FE resolves
// against API_URL), rewritten for Node (fs.promises) instead of Bun.write,
// since flowserv-api runs on @hono/node-server, not Bun. The scraping/
// external-fetch parts of that project are deliberately NOT carried over --
// this only ever accepts a file the user picked locally.
export const uploadsRouter = new Hono();
uploadsRouter.use('*', requireAuth);

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

uploadsRouter.post('/', requirePermission('inventory.manage_items'), async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];
  const folder = typeof body['folder'] === 'string' ? body['folder'] : 'devices';

  if (!(file instanceof File)) {
    return errorResponse(c, 'VALIDATION_ERROR', "Request must include a 'file' field", [], 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return errorResponse(c, 'VALIDATION_ERROR', 'Invalid file type. Only JPEG, PNG, and WebP are allowed.', [], 400);
  }

  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'devices';
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `${crypto.randomUUID()}.${extension}`;
  const uploadDir = join('public', 'uploads', sanitizedFolder);
  const relativeUrl = `/uploads/${sanitizedFolder}/${filename}`;

  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(join(uploadDir, filename), buffer);
    return successResponse(c, { url: relativeUrl }, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to save uploaded file', [err.message], 500);
  }
});
