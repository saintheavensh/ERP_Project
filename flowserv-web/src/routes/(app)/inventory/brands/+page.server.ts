import { redirect } from '@sveltejs/kit';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let brands = [];
  
  try {
    const res = await fetch(`${API_BASE}/brands`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const result = await res.json();
      brands = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load brands', err);
  }

  return { token, brands };
};
