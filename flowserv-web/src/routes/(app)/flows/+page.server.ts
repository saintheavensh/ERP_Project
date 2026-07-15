import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.token;
  if (!token) {
    throw redirect(302, '/login');
  }

  // Fetch flows from backend
  try {
    const res = await fetch('http://localhost:3001/v1/flows', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      return { flows: data.data || [] };
    }
  } catch (e) {
    console.error('Failed to fetch flows', e);
  }

  return { flows: [] };
};
