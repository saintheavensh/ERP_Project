import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let categories = [];
  
  try {
    const res = await fetch('http://localhost:3001/v1/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const result = await res.json();
      categories = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }

  return { token, categories };
};
