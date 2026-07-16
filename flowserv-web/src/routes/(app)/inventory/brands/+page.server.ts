import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let brands = [];
  
  try {
    const res = await fetch('http://localhost:3001/v1/brands', {
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
