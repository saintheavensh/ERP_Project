import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

/**
 * Editor alur servis (Phase 7.1, dipindah ke /flows pada 2026-07-27).
 *
 * Dulu halaman ini hanya menampilkan diagram baca-saja, dan penyuntingannya ada
 * di Setelan. Keputusan pemilik: alur diatur di sini saja — satu tempat, dalam
 * bentuk diagram, supaya tidak membingungkan.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  const headers = { Authorization: `Bearer ${token}` };

  try {
    const res = await fetch(`${API_BASE}/flows/${params.id}`, { headers });
    if (res.ok) {
      const body = await res.json();
      return {
        token,
        template: body.data?.template ?? null,
        nodes: body.data?.nodes ?? [],
        transitions: body.data?.transitions ?? [],
        // S5 — definisi jenis tahap datang dari server, tidak disalin ke FE.
        stageKinds: body.data?.stageKinds ?? [],
      };
    }
  } catch (e) {
    console.error('Failed to fetch flow template', e);
  }

  return { token, template: null, nodes: [], transitions: [], stageKinds: [] };
};
