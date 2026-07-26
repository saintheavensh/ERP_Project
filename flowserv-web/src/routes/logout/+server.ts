import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, url }) => {
  // Match the login cookie's flags. SvelteKit defaults Secure=true for non-
  // localhost, and a Secure delete-cookie is ignored over plain HTTP — so over
  // the pilot LAN the token would never actually clear and logout would fail.
  cookies.delete('flowserv_token', { path: '/', secure: url.protocol === 'https:' });
  throw redirect(302, '/login');
};
