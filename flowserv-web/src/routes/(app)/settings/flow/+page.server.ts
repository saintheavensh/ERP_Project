import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Tahap B / Phase 7.1 — editor alur servis.
 *
 * Memuat daftar template + rancangan salah satunya. Template yang dibuka
 * ditentukan `?template=`; tanpa itu dipilih template default tenant — alur
 * yang benar-benar dipakai tiket baru, jadi itulah yang paling mungkin ingin
 * disunting owner.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const headers = { Authorization: `Bearer ${token}` };

  const listRes = await fetch('http://localhost:3001/v1/flows', { headers });
  const templates = listRes.ok ? (await listRes.json()).data : [];

  const requested = url.searchParams.get('template');
  const selected =
    templates.find((t: any) => t.id === requested) ??
    templates.find((t: any) => t.isDefault) ??
    templates[0];

  let design: { template: any; nodes: any[]; transitions: any[] } | null = null;
  if (selected) {
    const res = await fetch(`http://localhost:3001/v1/flows/${selected.id}`, { headers });
    if (res.ok) design = (await res.json()).data;
  }

  return { token, templates, design };
};
