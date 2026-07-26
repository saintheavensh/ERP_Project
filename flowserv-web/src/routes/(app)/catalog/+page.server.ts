import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';

// Tahap-B — read-only product catalog for cashier & technician (and any role).
// Same data source as the admin catalog (/inventory/catalog): GET /v1/inventory
// + /v1/categories, both open to any authenticated user. The difference is the
// view (read-only, no drill-down, no edit) — cashier/tech only need to look up
// a part's price and stock, and must not change the owner-set price.
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
