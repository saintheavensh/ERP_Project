import { error, redirect } from '@sveltejs/kit';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ params, locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');
  
  const { id } = params;

  let order = null;
  
  try {
    const res = await fetch(`${API_BASE}/purchasing/orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const result = await res.json();
      order = result.data;
      if (order.status !== 'received' && order.status !== 'completed') {
        throw error(400, 'Order must be received before costing');
      }
    } else if (res.status === 404) {
      throw error(404, 'Order not found');
    }
  } catch (err: any) {
    console.error('Failed to load order for invoicing', err);
    if (err.status) throw err;
  }

  return { token, order };
};
