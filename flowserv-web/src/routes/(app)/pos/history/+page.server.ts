import { redirect } from '@sveltejs/kit';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals, url }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let invoices = [];
  let branches = [];
  
  const branchId = url.searchParams.get('branchId') || '';
  const queryParam = branchId ? `?branchId=${branchId}` : '';

  try {
    const brRes = await fetch(`${API_BASE}/branches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (brRes.ok) branches = (await brRes.json()).data || [];

    const invRes = await fetch(`${API_BASE}/pos/invoices${queryParam}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (invRes.ok) invoices = (await invRes.json()).data || [];
    
  } catch (error) {
    console.error('Failed to load POS history data:', error);
  }

  return { invoices, branches, selectedBranch: branchId, token };
};
