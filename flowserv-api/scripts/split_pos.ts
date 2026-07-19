import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const posFile = path.join(__dirname, '../src/routes/pos.ts');
const posDir = path.join(__dirname, '../src/routes/pos');

if (!fs.existsSync(posDir)) {
  fs.mkdirSync(posDir, { recursive: true });
}

const content = fs.readFileSync(posFile, 'utf8');

const topImports = `import { Hono } from 'hono';
import { db } from '../../db/connection';
import { posInvoices, posInvoiceLines, stockBatches, stockMovements, stockLevels, inventoryItems, posDrafts } from '../../db/schema/index';
import { eq, and, sql, asc, gt, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { successResponse, errorResponse } from '../../lib/response';
import { requireAuth, getAuthContext } from '../../middleware/auth';\n\n`;

const extractRoute = (commentMarker: string, endMarker: string) => {
  const startIdx = content.indexOf(commentMarker);
  if (startIdx === -1) return '';
  const endIdx = endMarker ? content.indexOf(endMarker, startIdx) : content.indexOf(`// ==========================================`, startIdx + commentMarker.length);
  return content.slice(startIdx, endIdx !== -1 ? endIdx : undefined).trim() + '\n\n';
};

const extractFromTo = (startMarker: string, endMarker?: string) => {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return '';
  const endIdx = endMarker ? content.indexOf(endMarker, startIdx + startMarker.length) : content.length;
  return content.slice(startIdx, endIdx).trim() + '\n\n';
}

const invoicesContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractFromTo('// Skema validasi untuk checkout POS', '// ==========================================') +
  extractFromTo('// DELETE /v1/pos/invoices/:id (Void)') +
  `export { router as invoicesRouter };\n`;

const draftsContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractFromTo('const draftSchema = z.object({', '// ==========================================') +
  `export { router as draftsRouter };\n`;

// Fix router name
const fixRouter = (c: string) => c.replace(/posRouter\./g, 'router.');

const indexContent = `import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { invoicesRouter } from './invoices';
import { draftsRouter } from './drafts';

const posRouter = new Hono();
posRouter.use('*', requireAuth);

posRouter.route('/', invoicesRouter);
posRouter.route('/', draftsRouter);

export { posRouter };
`;

fs.writeFileSync(path.join(posDir, 'invoices.ts'), fixRouter(invoicesContent));
fs.writeFileSync(path.join(posDir, 'drafts.ts'), fixRouter(draftsContent));
fs.writeFileSync(path.join(posDir, 'index.ts'), indexContent);

console.log('POS routes split successfully!');
