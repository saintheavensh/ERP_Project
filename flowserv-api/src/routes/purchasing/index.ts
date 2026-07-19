import { Hono } from 'hono';
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
