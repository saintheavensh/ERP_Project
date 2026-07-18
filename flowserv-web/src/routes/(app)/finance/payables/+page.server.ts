import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  try {
    const res = await fetch('http://localhost:3001/v1/finance/payables', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const result = await res.json();
      return { token, payables: result.data || [] };
    }
  } catch (err) {
    console.error('Failed to load payables', err);
  }

  return { token, payables: [] };
};
