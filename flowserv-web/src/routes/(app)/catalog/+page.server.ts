import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';
import { API_BASE } from '$lib/api/config.server';

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
    inventory = await fetchAllPages<any>(`${API_BASE}/inventory`, token);

    const catRes = await fetch(`${API_BASE}/categories`, {
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
