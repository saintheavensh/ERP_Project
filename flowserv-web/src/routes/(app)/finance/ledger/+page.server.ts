import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  try {
    const [entriesRes, reconcileRes] = await Promise.all([
      fetch(`${API_BASE}/finance/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/finance/ledger/reconcile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const entries = entriesRes.ok ? (await entriesRes.json()).data || [] : [];
    const reconcile = reconcileRes.ok
      ? (await reconcileRes.json()).data
      : { isClean: true, gaps: [] };

    return { token, entries, reconcile };
  } catch (err) {
    console.error('Failed to load ledger', err);
  }

  return { token, entries: [], reconcile: { isClean: true, gaps: [] } };
};
