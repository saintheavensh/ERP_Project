import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.token;
  if (!token) {
    throw redirect(302, '/login');
  }

  try {
    const res = await fetch(`${API_BASE}/flows`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      return { token, flows: data.data || [] };
    }
  } catch (e) {
    console.error('Failed to fetch flows', e);
  }

  return { token, flows: [] };
};
