import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let inventoryItems = [];
  let partBrands = [];

  try {
    inventoryItems = await fetchAllPages<any>(`${API_BASE}/inventory`, token, { uninitialized: 'true' });

    const brandRes = await fetch(`${API_BASE}/brands`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (brandRes.ok) {
      const brandResult = await brandRes.json();
      partBrands = brandResult.data || [];
    }
  } catch (err) {
    console.error('Failed to load data for opname', err);
  }

  return { token, inventoryItems, partBrands };
};
