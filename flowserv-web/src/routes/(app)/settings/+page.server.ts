import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// P9 — Settings shell (5.10). One tab's data is fetched per request (the
// same `?tab=` URL-param-driven pattern as the finance dashboard's
// `?mode=simple|accountant`) rather than all four up front — branches/users/
// payment-methods lists are small, but there's no reason to fetch three of
// them on every load when only one tab is visible at a time.
const VALID_TABS = ['company', 'branches', 'users', 'payment-methods', 'printers'] as const;
type Tab = (typeof VALID_TABS)[number];

const API = 'http://localhost:3001/v1';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const requested = url.searchParams.get('tab');
  const tab: Tab = (VALID_TABS as readonly string[]).includes(requested ?? '') ? (requested as Tab) : 'company';

  const headers = { Authorization: `Bearer ${token}` };
  let company: any = null;
  let branches: any[] = [];
  let users: any[] = [];
  let roles: any[] = [];
  let paymentMethods: any[] = [];
  let printerDevices: any[] = [];
  let printerTemplates: any[] = [];
  let printerAssignments: any[] = [];

  try {
    if (tab === 'company') {
      const res = await fetch(`${API}/settings/company`, { headers });
      if (res.ok) company = (await res.json()).data;
    } else if (tab === 'branches') {
      const res = await fetch(`${API}/branches`, { headers });
      if (res.ok) branches = (await res.json()).data || [];
    } else if (tab === 'users') {
      // Branches too — the create-user form's optional "scope to one branch"
      // selector needs the list, same data the branches tab uses.
      const [uRes, rRes, bRes] = await Promise.all([
        fetch(`${API}/users/list`, { headers }),
        fetch(`${API}/roles`, { headers }),
        fetch(`${API}/branches`, { headers }),
      ]);
      if (uRes.ok) users = (await uRes.json()).data || [];
      if (rRes.ok) roles = (await rRes.json()).data || [];
      if (bRes.ok) branches = (await bRes.json()).data || [];
    } else if (tab === 'payment-methods') {
      const res = await fetch(`${API}/settings/payment-methods`, { headers });
      if (res.ok) paymentMethods = (await res.json()).data || [];
    } else if (tab === 'printers') {
      // Branches too — device create needs a branch picker, same as users' does.
      const [dRes, tRes, aRes, bRes] = await Promise.all([
        fetch(`${API}/printer/devices`, { headers }),
        fetch(`${API}/printer/templates`, { headers }),
        fetch(`${API}/printer/assignments`, { headers }),
        fetch(`${API}/branches`, { headers }),
      ]);
      if (dRes.ok) printerDevices = (await dRes.json()).data || [];
      if (tRes.ok) printerTemplates = (await tRes.json()).data || [];
      if (aRes.ok) printerAssignments = (await aRes.json()).data || [];
      if (bRes.ok) branches = (await bRes.json()).data || [];
    }
  } catch (err) {
    console.error('Failed to load settings tab data', err);
  }

  return { token, tab, company, branches, users, roles, paymentMethods, printerDevices, printerTemplates, printerAssignments };
};
