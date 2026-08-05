import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  try {
    const res = await fetch(`${API_BASE}/finance/receivables`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const result = await res.json();
      return { token, receivables: result.data || [] };
    }
  } catch (err) {
    console.error('Failed to load receivables', err);
  }

  return { token, receivables: [] };
};
