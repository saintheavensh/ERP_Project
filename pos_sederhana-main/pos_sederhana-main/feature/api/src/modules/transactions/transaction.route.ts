import { Hono } from 'hono';
import { TransactionService } from './transaction.service.js';

export const transactionRoute = new Hono();

/** Mengekstrak pesan error dari unknown error type secara aman */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

transactionRoute.get('/report', async (c) => {
  try {
    const data = await TransactionService.getReport();
    return c.json({ success: true, data });
  } catch (error: unknown) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

transactionRoute.get('/history', async (c) => {
  try {
    const history = await TransactionService.getHistory();
    return c.json({ success: true, data: history });
  } catch (error: unknown) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

transactionRoute.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const transaction = await TransactionService.getTransactionById(id);
    if (!transaction) {
      return c.json({ success: false, message: 'Transaksi tidak ditemukan' }, 404);
    }
    return c.json({ success: true, data: transaction });
  } catch (error: unknown) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

transactionRoute.post('/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const result = await TransactionService.checkout(body);
    return c.json(result);
  } catch (error: unknown) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});

transactionRoute.post('/pay-tempo', async (c) => {
  try {
    const body = await c.req.json();
    const result = await TransactionService.payTempo(body.transactionId, body.amount);
    return c.json(result);
  } catch (error: unknown) {
    return c.json({ success: false, message: getErrorMessage(error) }, 500);
  }
});
