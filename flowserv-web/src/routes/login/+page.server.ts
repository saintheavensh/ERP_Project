import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/');
  }
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch, url }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    if (!email || !password) {
      return fail(400, { email, missing: true });
    }

    try {
      const response = await fetch('http://localhost:3001/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok || !result.data?.token) {
        return fail(401, { email, incorrect: true, message: result.error?.message || 'Login failed' });
      }

      cookies.set('flowserv_token', result.data.token, {
        path: '/',
        httpOnly: true,
        // 'lax' (not 'strict') so the cookie is sent on the top-level GET after
        // this login redirect — robust across the form-POST → redirect flow.
        sameSite: 'lax',
        // Only mark Secure over HTTPS. SvelteKit defaults Secure=true for any
        // non-localhost request, which silently breaks login over a plain-HTTP
        // LAN (the pilot): a Secure cookie is never sent back over http://, so
        // the phone logs in but bounces straight back to the login page.
        // Phase 11 (HTTPS/VPS) will set url.protocol to 'https:' and re-enable it.
        secure: url.protocol === 'https:',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      throw redirect(302, '/');
    } catch (e) {
      if (isRedirect(e)) {
        throw e;
      }
      return fail(500, { email, incorrect: true, message: 'Server connection failed' });
    }
  }
};
