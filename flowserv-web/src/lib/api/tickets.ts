import { API_BASE } from './config';

/**
 * R1.6 — satu jalur "ambil pekerjaan", dipakai dua tempat.
 *
 * Sebelumnya tombol Ambil hanya ada di halaman detail tiket, dan pemilik
 * menemukannya bertele-tele saat menguji (uji-R1.5 poin B3): "harus ke halaman
 * pekerjaan saya kemudian lihat detail terus ambil pekerjaan". Sekarang
 * tombolnya juga ada langsung di baris antrian.
 *
 * Fungsinya ditaruh di sini, bukan disalin ke halaman daftar, supaya tidak ada
 * dua jalur klaim yang bisa berbeda perilaku — `Idempotency-Key` khususnya:
 * tanpa itu, dua ketukan cepat di layar sentuh bisa terkirim dua kali.
 */
export async function claimTicket(
  token: string,
  ticketId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': crypto.randomUUID(),
      },
    });
    if (res.ok) return { ok: true };
    const result = await res.json().catch(() => null);
    return { ok: false, message: result?.error?.message || 'Gagal mengambil pekerjaan' };
  } catch {
    return { ok: false, message: 'Tidak bisa menghubungi server.' };
  }
}
