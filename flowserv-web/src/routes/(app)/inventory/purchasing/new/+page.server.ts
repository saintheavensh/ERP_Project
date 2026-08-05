import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let suppliers = [];
  let branches = [];
  let inventoryItems = [];
  let categories = [];

  try {
    const [supRes, branchRes, itemsResult, catRes] = await Promise.all([
      fetch(`${API_BASE}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/branches`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetchAllPages<any>(`${API_BASE}/inventory`, token),
      fetch(`${API_BASE}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (supRes.ok) suppliers = (await supRes.json()).data || [];
    if (branchRes.ok) branches = (await branchRes.json()).data || [];
    inventoryItems = itemsResult;
    if (catRes.ok) categories = (await catRes.json()).data || [];
  } catch (err) {
    console.error('Failed to load form data', err);
  }

  return { token, suppliers, branches, inventoryItems, categories };
};
