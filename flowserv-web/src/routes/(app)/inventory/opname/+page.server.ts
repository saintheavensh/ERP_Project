import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let inventoryItems = [];
  let partBrands = [];
  
  try {
    const invRes = await fetch('http://localhost:3001/v1/inventory?uninitialized=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (invRes.ok) {
      const invResult = await invRes.json();
      inventoryItems = invResult.data || [];
    }

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
