import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let item = null;
  let allModels = [];
  let categories = [];

  try {
    const res = await fetch(`http://localhost:3001/v1/inventory/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const result = await res.json();
      item = result.data;
    }

    const modelsRes = await fetch('http://localhost:3001/v1/device-models', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (modelsRes.ok) {
      const result = await modelsRes.json();
      allModels = result.data || [];
    }

    // F4 — categories list, for the item edit form's category dropdown.
    const categoriesRes = await fetch('http://localhost:3001/v1/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (categoriesRes.ok) {
      const result = await categoriesRes.json();
      categories = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load product details', err);
  }

  return { token, item, allModels, categories };
};
