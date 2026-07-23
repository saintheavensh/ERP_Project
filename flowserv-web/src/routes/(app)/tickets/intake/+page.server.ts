import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// F7 — the customer-detail "Create Ticket" button links here with
// ?customerId=&assetId=. Both are re-validated against the API (tenant-scoped,
// and the asset must actually belong to that customer) rather than trusted from
// the URL — stale/tampered ids just fall back to a blank form instead of erroring.
async function resolvePrefill(token: string, customerId: string | null, assetId: string | null) {
  if (!customerId) return null;

  try {
    const custRes = await fetch(`http://localhost:3001/v1/customers/${customerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!custRes.ok) return null;
    const customer = (await custRes.json()).data;
    if (!customer) return null;

    const prefill: Record<string, string> = {
      customerId: customer.id,
      customerName: customer.name ?? '',
      customerPhone: customer.phone ?? '',
      customerEmail: customer.email ?? ''
    };

    if (assetId) {
      const assetsRes = await fetch(`http://localhost:3001/v1/customers/${customerId}/assets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assetsRes.ok) {
        const assets = (await assetsRes.json()).data || [];
        const asset = assets.find((a: any) => a.id === assetId);
        if (asset) {
          prefill.assetId = asset.id;
          prefill.assetType = asset.assetType ?? '';
          prefill.assetBrand = asset.brand ?? '';
          prefill.assetModel = asset.model ?? '';
          prefill.assetSn = asset.serialNumber ?? '';
        }
        // else: stale/foreign asset id — ignore it, keep the customer prefill only.
      }
    }

    return prefill;
  } catch (err) {
    console.error('Failed to resolve intake prefill', err);
    return null;
  }
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let templates = [];
  let customers = [];

  try {
    const res = await fetch('http://localhost:3001/v1/flows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const result = await res.json();
      templates = result.data || [];
    }

    const custRes = await fetch('http://localhost:3001/v1/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (custRes.ok) {
      const custResult = await custRes.json();
      customers = custResult.data || [];
    }
  } catch (err) {
    console.error('Failed to load data for intake', err);
  }

  const prefill = await resolvePrefill(token, url.searchParams.get('customerId'), url.searchParams.get('assetId'));

  return { token, templates, customers, prefill };
};
