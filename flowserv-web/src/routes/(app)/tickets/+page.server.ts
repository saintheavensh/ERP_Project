import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

const API = `${API_BASE}`;

async function getTickets(token: string, query: string) {
  try {
    const res = await fetch(`${API}/tickets${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  } catch (err) {
    console.error('Failed to load tickets', err);
    return [];
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  // F2 — the sidebar labels this page "Pekerjaan Saya" for a Technician (see
  // (app)/+layout.svelte), but until then the query never actually filtered, so
  // every technician saw the whole tenant's tickets. ?assignedTo=me fixed that.
  //
  // R1 (2026-07-31) — filter itu benar untuk daftar "punya saya", tapi ia jadi
  // SATU-SATUNYA daftar yang teknisi punya: tiket yang belum ditugaskan tak
  // muncul di mana pun, jadi halaman detailnya tak terjangkau dan tombol "Ambil
  // Pekerjaan" (yang sudah ada dan sudah benar sejak Tahap B) tak pernah bisa
  // ditekan. Teknisi kini mendapat dua kelompok.
  //
  // `status=open` pada antrian: tiket yang sudah ditutup atau dibatalkan dan
  // kebetulan tak bertuan bukan pekerjaan yang menunggu siapa pun.
  const isTechnician = locals.user?.roleName === 'Technician';

  if (isTechnician) {
    const [tickets, unassigned] = await Promise.all([
      getTickets(token, '?assignedTo=me'),
      getTickets(token, '?assignedTo=none&status=open')
    ]);
    return { token, tickets, unassigned, isTechnician: true };
  }

  return { token, tickets: await getTickets(token, ''), unassigned: [], isTechnician: false };
};
