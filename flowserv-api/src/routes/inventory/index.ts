import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { itemsRouter } from './items';
import { compatibilityRouter } from './compatibility';
import { pricingRouter } from './pricing';
import { receiptsRouter } from './receipts';
import { reconciliationRouter } from './reconciliation';

const inventoryRouter = new Hono();
inventoryRouter.use('*', requireAuth);

// Mounted before itemsRouter: itemsRouter defines GET /:id, which would
// otherwise swallow GET /reconciliation as if "reconciliation" were an item id.
inventoryRouter.route('/', reconciliationRouter);
inventoryRouter.route('/', itemsRouter);
inventoryRouter.route('/', compatibilityRouter);
inventoryRouter.route('/', pricingRouter);
inventoryRouter.route('/', receiptsRouter);

export { inventoryRouter };
