import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

// P5 — Finance dashboard (DAS-004). Simple/Accountant mode selected via
// ?mode=, same validated-query-param-with-fallback idiom as the Kanban
// board's ?flowTemplateId=. Both modes read the same data — see
// plan/P5-finance-dashboard.md "same data source, presentation differs".

const API = `${API_BASE}`;

async function safeGetArray(fetchFn: typeof fetch, path: string, token: string): Promise<any[]> {
  try {
    const res = await fetchFn(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

const EMPTY_SUMMARY = { revenue: 0, cogs: 0, estimatedProfit: 0, entryCount: 0 };

async function safeGetSummary(fetchFn: typeof fetch, path: string, token: string) {
  try {
    const res = await fetchFn(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return EMPTY_SUMMARY;
    const json = await res.json();
    return json.data || EMPTY_SUMMARY;
  } catch {
    return EMPTY_SUMMARY;
  }
}

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const modeParam = url.searchParams.get('mode');
  const mode: 'simple' | 'accountant' = modeParam === 'accountant' ? 'accountant' : 'simple';

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, month, receivables, payables] = await Promise.all([
    safeGetSummary(fetch, `/finance/ledger/summary?from=${startOfToday.toISOString()}&to=${now.toISOString()}`, token),
    safeGetSummary(fetch, `/finance/ledger/summary?from=${startOfMonth.toISOString()}&to=${now.toISOString()}`, token),
    safeGetArray(fetch, '/finance/receivables', token),
    safeGetArray(fetch, '/finance/payables', token),
  ]);

  const arTotal = receivables.reduce(
    (sum, r) => sum + (parseFloat(r.grandTotal) - parseFloat(r.amountPaid || '0')),
    0
  );
  const apTotal = payables.reduce(
    (sum, p) => sum + (parseFloat(p.totalAmount) - parseFloat(p.amountPaid || '0')),
    0
  );

  return {
    mode,
    today,
    month,
    arTotal,
    arCount: receivables.length,
    apTotal,
    apCount: payables.length,
  };
};
