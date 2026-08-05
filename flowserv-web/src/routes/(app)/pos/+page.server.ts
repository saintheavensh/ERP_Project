import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';
import { API_BASE } from '$lib/api/config.server';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let branches = [];
  let inventory = [];
  let customers = [];
  let paymentMethods = [];

  try {
    const brRes = await fetch(`${API_BASE}/branches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (brRes.ok) branches = (await brRes.json()).data || [];

    const pmRes = await fetch(`${API_BASE}/settings/payment-methods`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (pmRes.ok) paymentMethods = (await pmRes.json()).data || [];

    inventory = await fetchAllPages<any>(`${API_BASE}/inventory`, token);

    const custRes = await fetch(`${API_BASE}/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (custRes.ok) customers = (await custRes.json()).data || [];
    
  } catch (error) {
    console.error('Failed to load POS data:', error);
  }

  // Filter out items that have sellingPrice = 0 (or null)
  // We only show items that are priced and ready for sale.
  const products = inventory.filter((i: any) => {
    // For now we just check if base sellingPrice > 0 OR if any brandPricing > 0
    const basePrice = parseFloat(i.sellingPrice) || 0;
    const hasBrandPrices = i.brandPricing && i.brandPricing.some((bp: any) => parseFloat(bp.sellingPrice) > 0);
    return basePrice > 0 || hasBrandPrices;
  });

  // D2 — the cart hides the discount input for roles without pos.apply_discount
  // (the backend enforces it regardless; this is just so a cashier isn't shown
  // a control that would 403).
  const roleName = locals.user?.roleName ?? null;

  return { branches, products, customers, paymentMethods, token, roleName };
};
