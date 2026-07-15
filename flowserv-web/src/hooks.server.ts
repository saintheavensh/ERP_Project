import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('flowserv_token');

  if (token) {
    try {
      const response = await fetch('http://localhost:3001/v1/auth/me', {
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
        // Token is invalid or expired
        event.cookies.delete('flowserv_token', { path: '/' });
      }
    } catch (err) {
      console.error('Auth verification failed', err);
    }
  }

  return resolve(event);
};
