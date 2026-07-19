import { Hono } from 'hono';
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
