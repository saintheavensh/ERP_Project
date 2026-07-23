import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';

// P10 — Product Catalog (5.5 / SUP-009). Same "fetch the whole list
// server-side" pattern as the main inventory page (H13) — the browse view
// needs every item to group by category client-side, not one page at a time.
export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let inventory: any[] = [];
  let categories: any[] = [];

  try {
    inventory = await fetchAllPages<any>('http://localhost:3001/v1/inventory', token);

    const catRes = await fetch('http://localhost:3001/v1/categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (catRes.ok) {
      const result = await catRes.json();
      categories = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load catalog data', err);
  }

  return { token, inventory, categories };
};
