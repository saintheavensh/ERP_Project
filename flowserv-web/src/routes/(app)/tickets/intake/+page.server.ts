import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api/config.server';

// F7 — the customer-detail "Create Ticket" button links here with
// ?customerId=&assetId=. Both are re-validated against the API (tenant-scoped,
// and the asset must actually belong to that customer) rather than trusted from
// the URL — stale/tampered ids just fall back to a blank form instead of erroring.
async function resolvePrefill(token: string, customerId: string | null, assetId: string | null) {
  if (!customerId) return null;

  try {
    const custRes = await fetch(`${API_BASE}/customers/${customerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!custRes.ok) return null;
    const customer = (await custRes.json()).data;
    if (!customer) return null;

    const prefill: Record<string, string> = {
      customerId: customer.id,
      customerName: customer.name ?? '',
      customerPhone: customer.phone ?? '',
      customerEmail: customer.email ?? ''
    };

    if (assetId) {
      const assetsRes = await fetch(`${API_BASE}/customers/${customerId}/assets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assetsRes.ok) {
        const assets = (await assetsRes.json()).data || [];
        const asset = assets.find((a: any) => a.id === assetId);
        if (asset) {
          prefill.assetId = asset.id;
          prefill.assetType = asset.assetType ?? '';
          prefill.assetBrand = asset.brand ?? '';
          prefill.assetModel = asset.model ?? '';
          prefill.assetSn = asset.serialNumber ?? '';
        }
        // else: stale/foreign asset id — ignore it, keep the customer prefill only.
      }
    }

    return prefill;
  } catch (err) {
    console.error('Failed to resolve intake prefill', err);
    return null;
  }
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const token = locals.token;
  if (!token) throw redirect(302, '/login');

  let templates = [];
  let customers = [];

  try {
    const res = await fetch(`${API_BASE}/flows`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const result = await res.json();
      templates = result.data || [];
    }

    const custRes = await fetch(`${API_BASE}/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (custRes.ok) {
      const custResult = await custRes.json();
      customers = custResult.data || [];
    }
  } catch (err) {
    console.error('Failed to load data for intake', err);
  }

  // R1.7 — pemilik (uji-R1.6 E1): "tinggal tambahkan riwayat input tiket
  // service di bagian kasir untuk memastikannya". Diambil dari server supaya
  // riwayatnya tetap ada setelah halaman di-refresh; daftar di layar juga
  // ditambah dari sisi klien tiap kali tiket baru dibuat, jadi tidak perlu
  // memuat ulang halaman untuk melihatnya.
  //
  // Ini "unit masuk terbaru se-toko", bukan "yang saya input" — `service_tickets`
  // tidak menyimpan siapa pembuatnya, dan menambah kolom itu adalah perubahan
  // skema yang tak dibutuhkan untuk tujuan aslinya: memastikan unit tercatat.
  let recentTickets = [];
  try {
    const recentRes = await fetch(`${API_BASE}/tickets?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (recentRes.ok) recentTickets = (await recentRes.json()).data || [];
  } catch (err) {
    console.error('Failed to load recent tickets for intake', err);
  }

  // R1.8-T6 — daftar teknisi untuk penunjukan OPSIONAL di intake. Endpoint
  // yang sama yang dipakai pemilih teknisi di halaman tiket (F1); auth-only,
  // jadi kasir boleh memanggilnya. Gagal memuat bukan alasan menggagalkan
  // halaman: kalau daftarnya kosong, form tetap jalan dan tiket masuk antrian —
  // persis perilaku sebelum T6 ada.
  let technicians = [];
  try {
    const techRes = await fetch(`${API_BASE}/users?role=Technician`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (techRes.ok) technicians = (await techRes.json()).data || [];
  } catch (err) {
    console.error('Failed to load technicians for intake', err);
  }

  const prefill = await resolvePrefill(token, url.searchParams.get('customerId'), url.searchParams.get('assetId'));

  return { token, templates, customers, prefill, recentTickets, technicians };
};
