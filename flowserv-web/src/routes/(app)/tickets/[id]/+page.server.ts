import { redirect } from '@sveltejs/kit';
import { fetchAllPages } from '$lib/api/pagination';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const ticketId = params.id;
  
  try {
    const res = await fetch(`http://localhost:3001/v1/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const result = await res.json();
      const ticketData = result.data;
      
      // Fetch flow template for this ticket
      const tmplRes = await fetch(`http://localhost:3001/v1/flows/${ticketData.ticket.flowTemplateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let templateData = null;
      if (tmplRes.ok) {
        const tmplJson = await tmplRes.json();
        templateData = tmplJson.data;
      }

      // H7 — charges (parts/labor/fees + totals + margin) and the inventory list used
      // to pick a part when adding a charge. F1 — the tenant's technicians for the
      // assignee picker (H8's POST /:id/assign was orphaned with no UI until now).
      // Fetched in parallel.
      const [chargesRes, inventoryItems, techniciansRes] = await Promise.all([
        fetch(`http://localhost:3001/v1/tickets/${ticketId}/charges`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetchAllPages(`http://localhost:3001/v1/inventory`, token),
        fetch(`http://localhost:3001/v1/users?role=Technician`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const chargesData = chargesRes.ok ? (await chargesRes.json()).data : { charges: [], totals: { estimated: 0, approved: 0, consumed: 0 }, margin: { revenue: 0, cost: 0, margin: 0 } };
      const technicians = techniciansRes.ok ? (await techniciansRes.json()).data : [];

      return { token, data: ticketData, template: templateData, charges: chargesData, inventoryItems, technicians };
    }
  } catch (err) {
    console.error('Failed to load ticket details', err);
  }

  // Also fetch full flow template nodes for the dropdown in transitions
  // Wait, the backend already knows the transitions. We just need the ticket data.
  
  return { token, data: null };
};
