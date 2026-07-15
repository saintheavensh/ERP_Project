import { Hono } from 'hono';
import { SupplierService } from './supplier.service.js';

const supplierRoute = new Hono();

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

supplierRoute.get('/', async (c) => {
  try {
    const data = await SupplierService.getAll();
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

supplierRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = await SupplierService.create(body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

supplierRoute.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await SupplierService.update(id, body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

supplierRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await SupplierService.delete(id);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

export default supplierRoute;
