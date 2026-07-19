import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inventoryFile = path.join(__dirname, '../src/routes/inventory.ts');
const inventoryDir = path.join(__dirname, '../src/routes/inventory');

if (!fs.existsSync(inventoryDir)) {
  fs.mkdirSync(inventoryDir, { recursive: true });
}

const content = fs.readFileSync(inventoryFile, 'utf8');

const topImports = `import { Hono } from 'hono';
import { db } from '../../db/connection';
import { inventoryItems, stockLevels, stockBatches, stockMovements, partBrands, deviceBrands, productCompatibility, deviceModels, purchaseOrderLines, itemBrandPricing } from '../../db/schema/index';
import { eq, desc, and, gt } from 'drizzle-orm';
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

const itemsContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractRoute('GET /v1/inventory (List all SKUs)', 'POST /v1/inventory (Create New SKU)') +
  extractRoute('POST /v1/inventory (Create New SKU)', 'GET /v1/inventory/:id (Get single item with details)') +
  extractRoute('GET /v1/inventory/:id (Get single item with details)', 'PUT /v1/inventory/:id/compatibility (Update resolved/unresolved compatibility)') +
  extractRoute('DELETE /v1/inventory/:id', 'export {') +
  `export { router as itemsRouter };\n`;

const compatibilityContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractRoute('PUT /v1/inventory/:id/compatibility (Update resolved/unresolved compatibility)', 'PUT /v1/inventory/:id/brands/:brandId (Update Selling Price for a Brand)') +
  `export { router as compatibilityRouter };\n`;

const pricingContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractRoute('PUT /v1/inventory/:id/brands/:brandId (Update Selling Price for a Brand)', 'POST /v1/inventory/:id/receive (Goods Receipt)') +
  `export { router as pricingRouter };\n`;
  
const receiptsContent = 
  topImports + 
  `const router = new Hono();\n\n` + 
  extractRoute('POST /v1/inventory/:id/receive (Goods Receipt)', 'DELETE /v1/inventory/:id') +
  `export { router as receiptsRouter };\n`;

const indexContent = `import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { itemsRouter } from './items';
import { compatibilityRouter } from './compatibility';
import { pricingRouter } from './pricing';
import { receiptsRouter } from './receipts';

const inventoryRouter = new Hono();
inventoryRouter.use('*', requireAuth);

inventoryRouter.route('/', itemsRouter);
inventoryRouter.route('/', compatibilityRouter);
inventoryRouter.route('/', pricingRouter);
inventoryRouter.route('/', receiptsRouter);

export { inventoryRouter };
`;

fs.writeFileSync(path.join(inventoryDir, 'items.ts'), itemsContent.replace(/inventoryRouter\./g, 'router.'));
fs.writeFileSync(path.join(inventoryDir, 'compatibility.ts'), compatibilityContent.replace(/inventoryRouter\./g, 'router.'));
fs.writeFileSync(path.join(inventoryDir, 'pricing.ts'), pricingContent.replace(/inventoryRouter\./g, 'router.'));
fs.writeFileSync(path.join(inventoryDir, 'receipts.ts'), receiptsContent.replace(/inventoryRouter\./g, 'router.'));
fs.writeFileSync(path.join(inventoryDir, 'index.ts'), indexContent);

console.log('Inventory routes split successfully!');
