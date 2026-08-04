// R1.9-T2 — mengelompokkan daftar piutang per PELANGGAN.
//
// Pemilik (uji R1.8 B1): "misalnya pelanggan itu mempunyai dua nota yang belum
// di bayar jadi rinciannya lebih jelas di bagian tagihan di lihat sub totalnya
// nanti bisa di klik lagi untuk melihat detail per notanya".
//
// Murni frontend: `/finance/receivables` sudah mengembalikan seluruh faktur
// beserta `customer`-nya, jadi tidak ada endpoint baru dan tidak ada izin baru.
// Batas R1.5A tetap utuh — /finance, /finance/ledger, /finance/payables tetap
// tertutup untuk kasir.
//
// Ditulis sebagai fungsi murni (pola `evaluateRbac`, `mergeChecklist`) karena
// bagian yang bisa SALAH DIAM-DIAM di sini bukan tampilannya, melainkan
// pengelompokannya: menggabungkan dua orang berbeda jadi satu baris berarti
// menagih orang yang salah, dan itu tidak akan terlihat sebagai error apa pun.

/** Bentuk minimum yang dibutuhkan; baris asli membawa jauh lebih banyak kolom. */
export interface ReceivableInvoice {
  id: string;
  grandTotal: number | string;
  amountPaid: number | string;
  customerId?: string | null;
  customerName?: string | null;
  customer?: { id?: string | null; name?: string | null } | null;
  [key: string]: unknown;
}

export interface ReceivableGroup {
  /** Kunci baris — id pelanggan, atau `walk-in:<idFaktur>` bila tak ada. */
  key: string;
  customerId: string | null;
  customerName: string;
  invoices: ReceivableInvoice[];
  /** Jumlah SISA piutang seluruh nota di grup ini. */
  totalOutstanding: number;
  /** Jumlah nilai tagihan (bukan sisa) seluruh nota di grup ini. */
  totalBilled: number;
}

export function outstandingOf(inv: ReceivableInvoice): number {
  return Number(inv.grandTotal) - Number(inv.amountPaid);
}

/**
 * Kelompokkan faktur per pelanggan.
 *
 * Tiga keputusan yang tampak sepele tapi menentukan benar/salahnya:
 *
 * 1. **Dikelompokkan berdasarkan `id`, bukan nama.** Dua pelanggan berbeda yang
 *    sama-sama bernama "Budi" adalah dua baris. Mengelompokkan berdasarkan nama
 *    akan menjumlahkan utang orang lain ke tagihan seseorang — kesalahan yang
 *    tidak menimbulkan error apa pun, hanya angka yang salah.
 * 2. **Faktur tanpa pelanggan (POS walk-in) TIDAK digabungkan.** Semuanya
 *    "tanpa nama", tapi mereka bukan orang yang sama; masing-masing berdiri
 *    sendiri lewat kunci `walk-in:<idFaktur>`.
 * 3. **Urutan mengikuti kemunculan pertama**, jadi urutan dari server (terbaru
 *    dulu) tidak diacak — tanpa ini daftar berubah-ubah tiap muat ulang.
 */
export function groupReceivablesByCustomer(invoices: ReceivableInvoice[]): ReceivableGroup[] {
  const groups = new Map<string, ReceivableGroup>();

  for (const inv of invoices ?? []) {
    const customerId = inv.customer?.id ?? inv.customerId ?? null;
    const key = customerId ? `cust:${customerId}` : `walk-in:${inv.id}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        customerId,
        // Nama boleh kosong (pelanggan lama tanpa nama, atau walk-in). Yang
        // penting barisnya tetap ada dan tetap bisa ditagih.
        customerName: (inv.customer?.name || inv.customerName || '').trim() || 'Tanpa Nama',
        invoices: [],
        totalOutstanding: 0,
        totalBilled: 0,
      };
      groups.set(key, group);
    }

    group.invoices.push(inv);
    group.totalOutstanding += outstandingOf(inv);
    group.totalBilled += Number(inv.grandTotal);
  }

  return [...groups.values()];
}
