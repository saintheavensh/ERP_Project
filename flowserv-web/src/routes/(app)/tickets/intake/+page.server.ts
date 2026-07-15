import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let templates = [];
  let customers = [];
  
  try {
    const res = await fetch('http://localhost:3001/v1/flows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const result = await res.json();
      templates = result.data || [];
    }

    const custRes = await fetch('http://localhost:3001/v1/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (custRes.ok) {
      const custResult = await custRes.json();
      customers = custResult.data || [];
    }
  } catch (err) {
    console.error('Failed to load data for intake', err);
  }

  return { token, templates, customers };
};
