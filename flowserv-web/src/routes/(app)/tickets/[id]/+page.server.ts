import { redirect } from '@sveltejs/kit';
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
      
      return { token, data: ticketData, template: templateData };
    }
  } catch (err) {
    console.error('Failed to load ticket details', err);
  }

  // Also fetch full flow template nodes for the dropdown in transitions
  // Wait, the backend already knows the transitions. We just need the ticket data.
  
  return { token, data: null };
};
