import type { Handle } from '@sveltejs/kit';
// Definisi lokal `const API_URL = env.API_URL ?? 'http://localhost:3001'` dihapus
// di Phase 11: berkas inilah yang dulu punya polanya dengan benar, lalu 33 berkas
// lain menyalin alamatnya secara harfiah. Sekarang semuanya membaca satu sumber.
import { API_URL } from '$lib/api/config.server';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('flowserv_token');

  if (token) {
    try {
      const response = await fetch(`${API_URL}/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          event.locals.user = result.data;
          event.locals.token = token;
        }
      } else {
        // Token is invalid or expired. Same Secure caveat as logout: over plain-
        // HTTP LAN a Secure delete-cookie is ignored, so scope Secure to HTTPS.
        event.cookies.delete('flowserv_token', { path: '/', secure: event.url.protocol === 'https:' });
      }
    } catch (err) {
      console.error('Auth verification failed', err);
    }
  }

  return resolve(event);
};
