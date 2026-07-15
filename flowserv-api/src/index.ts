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
