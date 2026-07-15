import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { transactionRoute } from './modules/transactions/transaction.route.js';
import { productRoute } from './modules/products/product.route.js';
import supplierRoute from './modules/suppliers/supplier.route.js';
import purchaseRoute from './modules/purchases/purchase.route.js';

const app = new Hono();

// Global Middleware
app.use('*', cors());

// Routes
app.route('/api/transactions', transactionRoute);
app.route('/api/products', productRoute);
app.route('/api/suppliers', supplierRoute);
app.route('/api/purchases', purchaseRoute);

app.get('/', (c) => {
  return c.text('Hello POS Server Version 2 (Hono + Svelte + Drizzle)');
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
