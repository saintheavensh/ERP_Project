import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler, requestIdMiddleware } from './middleware/error-handler';
import { successResponse } from './lib/response';
import dotenv from 'dotenv';
import { db } from './db/connection';
import { sql } from 'drizzle-orm';
import { authRouter } from './routes/auth';

dotenv.config();

const app = new Hono();

// Global Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', requestIdMiddleware);
app.use('*', errorHandler);

// Auth Routes
app.route('/v1/auth', authRouter);

// Flow Routes
import { flowRouter } from './routes/flow';
app.route('/v1/flows', flowRouter);

import { branchesRouter } from './routes/branches';
app.route('/v1/branches', branchesRouter);

// Customer Routes
import { customersRouter } from './routes/customers';
app.route('/v1/customers', customersRouter);

import { ticketsRouter } from './routes/tickets';
app.route('/v1/tickets', ticketsRouter);

import { inventoryRouter } from './routes/inventory';
app.route('/v1/inventory', inventoryRouter);

import { categoriesRouter } from './routes/categories';
app.route('/v1/categories', categoriesRouter);

import { suppliersRouter } from './routes/suppliers';
app.route('/v1/suppliers', suppliersRouter);

import { brandsRouter } from './routes/brands';
app.route('/v1/brands', brandsRouter);

import { purchasingRouter } from './routes/purchasing';
app.route('/v1/purchasing', purchasingRouter);

import { opnameRouter } from './routes/opname';
app.route('/v1/opname', opnameRouter);

import { posRouter } from './routes/pos';
app.route('/v1/pos', posRouter);

import { settingsRouter } from './routes/settings';
app.route('/v1/settings', settingsRouter);

import { financeRouter } from './routes/finance';
app.route('/v1/finance', financeRouter);

import { auditLogsRouter } from './routes/audit-logs';
app.route('/v1/audit-logs', auditLogsRouter);

// H11 — subscribe the finance ledger to the event bus once, at startup.
import { subscribeLedger } from './modules/finance/ledger';
subscribeLedger();

// Health Check Endpoint
app.get('/v1/health', async (c) => {
  let dbStatus = 'disconnected';
  try {
    // Simple query to check db connection
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

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log(`FlowServ API starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port
});
