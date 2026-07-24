import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler, requestIdMiddleware } from './middleware/error-handler';
import { successResponse } from './lib/response';
import { db } from './db/connection';
import { sql } from 'drizzle-orm';
import { authRouter } from './routes/auth';
import { flowRouter } from './routes/flow';
import { branchesRouter } from './routes/branches';
import { usersRouter } from './routes/users';
import { rolesRouter } from './routes/roles';
import { customersRouter } from './routes/customers';
import { ticketsRouter } from './routes/tickets';
import { inventoryRouter } from './routes/inventory';
import { categoriesRouter } from './routes/categories';
import { suppliersRouter } from './routes/suppliers';
import { brandsRouter } from './routes/brands';
import { purchasingRouter } from './routes/purchasing';
import { opnameRouter } from './routes/opname';
import { posRouter } from './routes/pos';
import { settingsRouter } from './routes/settings';
import { financeRouter } from './routes/finance';
import { auditLogsRouter } from './routes/audit-logs';
import { searchRouter } from './routes/search';
import { printerRouter } from './routes/printer';
import { printRouter } from './routes/print';
import { subscribeLedger } from './modules/finance/ledger';

// Split out of index.ts (H15) so the e2e suite can call the app directly via
// Hono's app.request()/app.fetch(), without a real listening socket — index.ts
// stays the only place that actually binds a port.
export const app = new Hono();

app.use('*', logger());
app.use('*', cors());
app.use('*', requestIdMiddleware);
app.use('*', errorHandler);

app.route('/v1/auth', authRouter);
app.route('/v1/flows', flowRouter);
app.route('/v1/branches', branchesRouter);
app.route('/v1/users', usersRouter);
app.route('/v1/roles', rolesRouter);
app.route('/v1/customers', customersRouter);
app.route('/v1/tickets', ticketsRouter);
app.route('/v1/inventory', inventoryRouter);
app.route('/v1/categories', categoriesRouter);
app.route('/v1/suppliers', suppliersRouter);
app.route('/v1/brands', brandsRouter);
app.route('/v1/purchasing', purchasingRouter);
app.route('/v1/opname', opnameRouter);
app.route('/v1/pos', posRouter);
app.route('/v1/settings', settingsRouter);
app.route('/v1/finance', financeRouter);
app.route('/v1/audit-logs', auditLogsRouter);
app.route('/v1/search', searchRouter);
app.route('/v1/printer', printerRouter);
app.route('/v1/print', printRouter);

// H11 — subscribe the finance ledger to the event bus once, at import time.
subscribeLedger();

app.get('/v1/health', async (c) => {
  let dbStatus = 'disconnected';
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';
  } catch (error) {
    console.error('DB Health Check Failed:', error);
  }

  return successResponse(c, {
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});
