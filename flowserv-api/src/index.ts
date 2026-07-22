import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import { app } from './app';

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log(`FlowServ API starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port
});
