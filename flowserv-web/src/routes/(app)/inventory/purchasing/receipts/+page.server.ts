import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  try {
    const res = await fetch('http://localhost:3001/v1/purchasing/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const result = await res.json();
      const orders = (result.data || []).filter((o: any) => o.status === 'ordered');
      return { token, orders };
    }
  } catch (err) {
    console.error('Failed to load receipts', err);
  }

  return { token, orders: [] };
};
