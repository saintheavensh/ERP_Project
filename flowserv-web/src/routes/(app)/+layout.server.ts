import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { canAccessRoute, DITOLAK_COOKIE } from '$lib/auth/route-access';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  // R1.5A — until now this checked only "is logged in", never "is allowed
  // here", so a cashier typing /settings or /finance got the page (uji-R1
  // C7/C8). The backend is the real gate; this turns a misleading blank page
  // into an honest bounce. See lib/auth/route-access.ts.
  if (!canAccessRoute(locals.user.roleName, url.pathname)) {
    cookies.set(DITOLAK_COOKIE, url.pathname, {
      path: '/',
      maxAge: 30, // cukup untuk satu pentalan; bukan penyimpanan
      httpOnly: true,
      sameSite: 'lax',
    });
    throw redirect(302, '/');
  }

  return {
    user: locals.user,
    token: locals.token
  };
};
