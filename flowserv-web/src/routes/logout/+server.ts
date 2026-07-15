import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete('flowserv_token', { path: '/' });
  throw redirect(302, '/login');
};
