import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { invoicesRouter } from './invoices';
import { draftsRouter } from './drafts';

const posRouter = new Hono();
posRouter.use('*', requireAuth);

posRouter.route('/', invoicesRouter);
posRouter.route('/', draftsRouter);

export { posRouter };
