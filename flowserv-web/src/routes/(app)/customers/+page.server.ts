import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  try {
    const res = await fetch('http://localhost:3001/v1/customers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const result = await res.json();
      return { token, customers: result.data || [] };
    }
  } catch (err) {
    console.error('Failed to load customers', err);
  }

  return { token, customers: [] };
};
