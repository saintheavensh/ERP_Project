import { redirect } from '@sveltejs/kit';

// Tahap A — device catalog (image/specs/suggested services), reusing the
// device_brands/device_models tables built for DEV-008 (sparepart
// compatibility) which previously had zero CRUD routes at all — only
// seed-created. See plan/tahap-a-device-catalog-invoice-mode.md.
// Server-side fetch stays hardcoded per 3.5E.1 (server-side deferred to Phase 11).
const API = 'http://localhost:3001/v1';

export const load = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let brands: any[] = [];

  try {
    const res = await fetch(`${API}/device-catalog/brands`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) brands = (await res.json()).data || [];
  } catch (err) {
    console.error('Failed to load device catalog', err);
  }

  return { token, brands };
};
