import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const token = locals.token;
  if (!token) {
    throw redirect(302, '/login');
  }

  try {
    const res = await fetch(`http://localhost:3001/v1/flows/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      return { 
        template: data.data?.template,
        nodes: data.data?.nodes || [],
        transitions: data.data?.transitions || []
      };
    }
  } catch (e) {
    console.error('Failed to fetch flow template', e);
  }

  return { template: null, nodes: [], transitions: [] };
};
