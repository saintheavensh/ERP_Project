import { redirect } from '@sveltejs/kit';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals, params }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let item = null;
  let allModels = [];
  let categories = [];
  let branches = [];

  try {
    const res = await fetch(`${API_BASE}/inventory/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const result = await res.json();
      item = result.data;
    }

    const modelsRes = await fetch(`${API_BASE}/device-models`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (modelsRes.ok) {
      const result = await modelsRes.json();
      allModels = result.data || [];
    }

    // F4 — categories list, for the item edit form's category dropdown.
    const categoriesRes = await fetch(`${API_BASE}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (categoriesRes.ok) {
      const result = await categoriesRes.json();
      categories = result.data || [];
    }

    // P6 — batch history shows which branch each batch was received into.
    // stockBatches has no `branch` relation (only a raw branchId), and with
    // just 2 branches in practice a lookup list is simpler than a schema change.
    const branchesRes = await fetch(`${API_BASE}/branches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (branchesRes.ok) {
      const result = await branchesRes.json();
      branches = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load product details', err);
  }

  return { token, item, allModels, categories, branches };
};
