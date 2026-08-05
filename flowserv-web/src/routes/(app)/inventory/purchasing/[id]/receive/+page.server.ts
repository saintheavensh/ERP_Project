import { error, redirect } from '@sveltejs/kit';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ params, locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');
  
  const { id } = params;

  let order = null;
  let partBrands = [];
  
  try {
    const [orderRes, brandsRes] = await Promise.all([
      fetch(`${API_BASE}/purchasing/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/brands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    if (orderRes.ok) {
      const result = await orderRes.json();
      order = result.data;
      // 'partial' must stay accessible here — otherwise a second delivery can
      // never be recorded, which defeats the entire point of partial receiving.
      if (order.status !== 'ordered' && order.status !== 'partial') {
        throw error(400, 'Order is not in a receivable status');
      }
    } else if (orderRes.status === 404) {
      throw error(404, 'Order not found');
    }
    
    if (brandsRes.ok) {
      partBrands = (await brandsRes.json()).data || [];
    }
  } catch (err: any) {
    console.error('Failed to load order for receiving', err);
    if (err.status) throw err;
  }

  return { token, order, partBrands };
};
