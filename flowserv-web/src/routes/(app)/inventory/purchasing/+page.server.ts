import { redirect } from '@sveltejs/kit';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let orders = [];
  
  try {
    const res = await fetch(`${API_BASE}/purchasing/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const result = await res.json();
      orders = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load orders', err);
  }

  return { token, orders };
};
