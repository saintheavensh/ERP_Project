import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { canAccessRoute } from '$lib/auth/route-access';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  // R1.5A — until now this checked only "is logged in", never "is allowed
  // here", so a cashier typing /settings or /finance got the page (uji-R1
  // C7/C8). The backend is the real gate; this turns a misleading blank page
  // into an honest bounce. See lib/auth/route-access.ts.
  if (!canAccessRoute(locals.user.roleName, url.pathname)) {
    throw redirect(302, '/?ditolak=' + encodeURIComponent(url.pathname));
  }

  return {
    user: locals.user,
    token: locals.token
  };
};
