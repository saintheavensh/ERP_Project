import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

// P2 — Kanban board load: the flow template's node/transition graph (for
// columns + valid-move computation) plus the open tickets for that template,
// grouped client-side by currentNodeId.
export const load: PageServerLoad = async ({ locals, url, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const headers = { Authorization: `Bearer ${token}` };
  const empty = { token, templates: [], selectedTemplateId: '', nodes: [], transitions: [], tickets: [] };

  try {
    const templatesRes = await fetch(`${API_BASE}/flows`, { headers });
    if (!templatesRes.ok) return empty;
    const templatesResult = await templatesRes.json();
    // Board scope = one flow template's node set at a time (see plan/P2-ticket-kanban-board.md
    // Decision 1) — the 'service' domain is what tickets use, per the intake form.
    const templates = (templatesResult.data || []).filter((t: any) => t.domain === 'service');

    const requestedId = url.searchParams.get('flowTemplateId');
    const selectedTemplateId: string =
      (requestedId && templates.some((t: any) => t.id === requestedId) ? requestedId : '') ||
      templates.find((t: any) => t.isDefault)?.id ||
      templates[0]?.id ||
      '';

    let nodes: any[] = [];
    let transitions: any[] = [];
    if (selectedTemplateId) {
      const detailRes = await fetch(`${API_BASE}/flows/${selectedTemplateId}`, { headers });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        nodes = detail.data?.nodes || [];
        transitions = detail.data?.transitions || [];
      }
    }

    // Board only shows active work (status='open') — closed/cancelled tickets
    // already have a home on the unfiltered list page.
    const ticketParams = new URLSearchParams({ status: 'open', limit: '200' });
    if (selectedTemplateId) ticketParams.set('flowTemplateId', selectedTemplateId);
    // Same "My Jobs" scoping as the list page (F2).
    if (locals.user?.roleName === 'Technician') ticketParams.set('assignedTo', 'me');

    const ticketsRes = await fetch(`${API_BASE}/tickets?${ticketParams.toString()}`, { headers });
    const ticketsResult = ticketsRes.ok ? await ticketsRes.json() : { data: [] };

    return {
      token,
      templates,
      selectedTemplateId,
      nodes,
      transitions,
      tickets: ticketsResult.data || [],
    };
  } catch (err) {
    console.error('Failed to load ticket board', err);
    return empty;
  }
};
