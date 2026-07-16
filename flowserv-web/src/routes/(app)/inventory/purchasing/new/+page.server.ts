import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let suppliers = [];
  let branches = [];
  let inventoryItems = [];
  let categories = [];
  
  try {
    const [supRes, branchRes, itemsRes, catRes] = await Promise.all([
      fetch('http://localhost:3001/v1/suppliers', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('http://localhost:3001/v1/branches', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('http://localhost:3001/v1/inventory?limit=500', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('http://localhost:3001/v1/categories', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    
    if (supRes.ok) suppliers = (await supRes.json()).data || [];
    if (branchRes.ok) branches = (await branchRes.json()).data || [];
    if (itemsRes.ok) inventoryItems = (await itemsRes.json()).data || [];
    if (catRes.ok) categories = (await catRes.json()).data || [];
  } catch (err) {
    console.error('Failed to load form data', err);
  }

  return { token, suppliers, branches, inventoryItems, categories };
};
