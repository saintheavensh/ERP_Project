import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals, url }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  // P6 — deep-link from the dashboard's "Stok Menipis" tile.
  const initialLowStockOnly = url.searchParams.get('lowStock') === 'true';

  let inventory = [];
  let categories = [];
  let brands = [];

  try {
    inventory = await fetchAllPages<any>(`${API_BASE}/inventory`, token);

    const catRes = await fetch(`${API_BASE}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (catRes.ok) {
      const result = await catRes.json();
      categories = result.data || [];
    }
    
    const brandRes = await fetch(`${API_BASE}/brands`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (brandRes.ok) {
      const result = await brandRes.json();
      brands = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load inventory data', err);
  }

  return { token, inventory, categories, brands, initialLowStockOnly };
};
