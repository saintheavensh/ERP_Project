import { Hono } from 'hono';
import { ProductService } from './product.service.js';

export const productRoute = new Hono();

/** Mengekstrak pesan error */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Get all products
 */
productRoute.get('/', async (c) => {
  try {
    const products = await ProductService.getAll();
    return c.json({ success: true, data: products });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Search products for Cashier Autocomplete
 */
productRoute.get('/search', async (c) => {
  try {
    const q = c.req.query('q') || '';
    const results = await ProductService.search(q);
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Add product master
 */
productRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = await ProductService.createProduct(body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Add stock (New Batch)
 */
productRoute.post('/add-stock', async (c) => {
  try {
    const body = await c.req.json();
    const result = await ProductService.addStock(body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Get Categories
 */
productRoute.get('/categories', async (c) => {
  try {
    const categories = await ProductService.getCategories();
    return c.json({ success: true, data: categories });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Add Category
 */
productRoute.post('/categories', async (c) => {
  try {
    const body = await c.req.json();
    const result = await ProductService.createCategory(body.name);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Update Product
 */
productRoute.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await ProductService.updateProduct(id, body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Delete Product
 */
productRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await ProductService.deleteProduct(id);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Update Category
 */
productRoute.put('/categories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await ProductService.updateCategory(id, body.name);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Delete Category
 */
productRoute.delete('/categories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await ProductService.deleteCategory(id);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

/**
 * Get Stock In History (Purchases)
 */
productRoute.get('/purchases', async (c) => {
  try {
    const history = await ProductService.getStockInHistory();
    return c.json({ success: true, data: history });
  } catch (error) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});
