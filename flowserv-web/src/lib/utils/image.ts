import { API_URL } from '$lib/api/config';

/**
 * Device catalog images are stored as either a full external URL (the two
 * hand-seeded demo entries, e.g. samsung.com/apple.com) or a path returned by
 * the local upload endpoint / the bulk device-catalog import (relative,
 * "/uploads/..."). A relative path must be resolved against the API's origin,
 * not the frontend's own -- they run on different ports/hosts (LAN access
 * makes this matter beyond just localhost).
 */
export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}
