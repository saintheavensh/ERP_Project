import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

export const load: PageServerLoad = async ({ params, locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const customerId = params.id;
  let customer = null;
  let assets = [];

  try {
    const custRes = await fetch(`${API_BASE}/customers/${customerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (custRes.ok) {
      const data = await custRes.json();
      customer = data.data;
    }

    const assetRes = await fetch(`${API_BASE}/customers/${customerId}/assets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (assetRes.ok) {
      const data = await assetRes.json();
      assets = data.data || [];
    }
  } catch (err) {
    console.error('Failed to load customer details', err);
  }

  return { token, customer, assets };
};
