import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let inventoryItems = [];
  let partBrands = [];

  try {
    inventoryItems = await fetchAllPages<any>('http://localhost:3001/v1/inventory', token, { uninitialized: 'true' });

    const brandRes = await fetch('http://localhost:3001/v1/brands', {
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
