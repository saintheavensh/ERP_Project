import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  try {
    // Fetch only draft and ordered POs, or just fetch all and filter in frontend.
    // Our API doesn't support array of statuses yet, so let's fetch all and filter in Svelte, 
    // or we can fetch only 'draft' and 'ordered' by doing two requests if we had to, 
    // but the API supports `?status=...`. 
    // To be safe and simple, let's fetch all and filter in frontend for now to avoid multiple requests.
    const res = await fetch('http://localhost:3001/v1/purchasing/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const result = await res.json();
      // 'partial' belongs here too — this list is "orders not yet fully arrived",
      // and a partially-received order still has quantity outstanding.
      const orders = (result.data || []).filter((o: any) => o.status === 'draft' || o.status === 'ordered' || o.status === 'partial');
      return { token, orders };
    }
  } catch (err) {
    console.error('Failed to load orders', err);
  }

  return { token, orders: [] };
};
