import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const purchasingFile = path.join(__dirname, 'original_purchasing.ts');
const purchasingDir = path.join(__dirname, '../src/routes/purchasing');

if (!fs.existsSync(purchasingDir)) {
  fs.mkdirSync(purchasingDir, { recursive: true });
}

const content = fs.readFileSync(purchasingFile, 'utf8');

// The imports
const topImports = `import { Hono } from 'hono';
import { db } from '../../db/connection';
import { purchaseOrders, purchaseOrderLines, stockBatches, stockMovements, stockLevels, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../../db/schema/index';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';\n\n`;

const extractRoute = (commentMarker: string, endMarker: string) => {
  const startIdx = content.indexOf(`// ${commentMarker}`);
  if (startIdx === -1) return '';
  const endIdx = endMarker ? content.indexOf(`// ${endMarker}`, startIdx) : content.indexOf(`export {`, startIdx);
  return content.slice(startIdx, endIdx !== -1 ? endIdx : undefined).trim() + '\n\n';
};

const ordersContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractRoute('GET /v1/purchasing/orders', 'POST /v1/purchasing/orders/:id/receive') +
  extractRoute('DELETE /v1/purchasing/orders/:id', 'export {') +
  `export { router as ordersRouter };\n`;

const receiptsContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractRoute('POST /v1/purchasing/orders/:id/receive', 'POST /v1/purchasing/orders/:id/invoice') +
  `export { router as receiptsRouter };\n`;

const invoicesContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractRoute('POST /v1/purchasing/orders/:id/invoice', 'DELETE /v1/purchasing/orders/:id') +
  `export { router as invoicesRouter };\n`;

const indexContent = `import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { ordersRouter } from './orders';
import { receiptsRouter } from './receipts';
import { invoicesRouter } from './invoices';

const purchasingRouter = new Hono();
purchasingRouter.use('*', requireAuth);

purchasingRouter.route('/', ordersRouter);
purchasingRouter.route('/', receiptsRouter);
purchasingRouter.route('/', invoicesRouter);

export { purchasingRouter };
`;

fs.writeFileSync(path.join(purchasingDir, 'orders.ts'), ordersContent.replace(/purchasingRouter\./g, 'router.'));
fs.writeFileSync(path.join(purchasingDir, 'receipts.ts'), receiptsContent.replace(/purchasingRouter\./g, 'router.'));
fs.writeFileSync(path.join(purchasingDir, 'invoices.ts'), invoicesContent.replace(/purchasingRouter\./g, 'router.'));
fs.writeFileSync(path.join(purchasingDir, 'index.ts'), indexContent);

console.log('Purchasing routes split successfully!');
