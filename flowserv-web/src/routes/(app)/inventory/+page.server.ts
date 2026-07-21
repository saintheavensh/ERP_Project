import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let inventory = [];
  let categories = [];
  let brands = [];

  try {
    inventory = await fetchAllPages<any>('http://localhost:3001/v1/inventory', token);

    const catRes = await fetch('http://localhost:3001/v1/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (catRes.ok) {
      const result = await catRes.json();
      categories = result.data || [];
    }
    
    const brandRes = await fetch('http://localhost:3001/v1/brands', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (brandRes.ok) {
      const result = await brandRes.json();
      brands = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load inventory data', err);
  }

  return { token, inventory, categories, brands };
};
