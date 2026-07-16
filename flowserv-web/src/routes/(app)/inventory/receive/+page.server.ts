import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let orders = [];
  
  try {
    const res = await fetch('http://localhost:3001/v1/purchasing/orders?status=ordered', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const result = await res.json();
      orders = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load ordered POs', err);
  }

  return { token, orders };
};
