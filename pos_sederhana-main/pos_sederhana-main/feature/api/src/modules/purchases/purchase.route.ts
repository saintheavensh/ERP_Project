import { Hono } from 'hono';
import { PurchaseService } from './purchase.service.js';

const purchaseRoute = new Hono();

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

purchaseRoute.get('/', async (c) => {
  try {
    const data = await PurchaseService.getAll();
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

purchaseRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = await PurchaseService.create(body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

export default purchaseRoute;
