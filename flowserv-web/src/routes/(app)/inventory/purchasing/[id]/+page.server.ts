import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');
  
  const { id } = params;

  let order = null;
  
  try {
    const res = await fetch(`http://localhost:3001/v1/purchasing/orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const result = await res.json();
      order = result.data;
    } else if (res.status === 404) {
      throw error(404, 'Order not found');
    }
  } catch (err: any) {
    console.error('Failed to load order', err);
    if (err.status === 404) throw err;
  }

  return { token, order };
};
