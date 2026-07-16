import { redirect, error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const { id } = params;

  let supplier = null;
  let allBrands = [];
  
  try {
    const [supplierRes, brandsRes] = await Promise.all([
      fetch(`http://localhost:3001/v1/suppliers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('http://localhost:3001/v1/brands', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    if (supplierRes.ok) {
      const result = await supplierRes.json();
      supplier = result.data;
    } else if (supplierRes.status === 404) {
      throw error(404, 'Supplier not found');
    }

    if (brandsRes.ok) {
      const result = await brandsRes.json();
      allBrands = result.data || [];
    }
  } catch (err: any) {
    console.error('Failed to load data', err);
    if (err.status === 404) throw err;
  }

  return { token, supplier, allBrands };
};
