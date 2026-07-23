import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  // F2 — the sidebar labels this page "My Jobs" for a Technician (see
  // (app)/+layout.svelte), but until now the query never actually filtered,
  // so every technician saw the whole tenant's tickets. The backend has
  // supported ?assignedTo=me since H8; this was the missing call site.
  const isTechnician = locals.user?.roleName === 'Technician';
  const url = isTechnician
    ? 'http://localhost:3001/v1/tickets?assignedTo=me'
    : 'http://localhost:3001/v1/tickets';

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const result = await res.json();
      return { token, tickets: result.data || [] };
    }
  } catch (err) {
    console.error('Failed to load tickets', err);
  }

  return { token, tickets: [] };
};
