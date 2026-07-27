// Tahap B — perhitungan uang tunai diterima & kembalian di kasir.
// Fungsi murni (tanpa DB/HTTP) mengikuti pola evaluateTempoEligibility()/
// evaluateRbac() di codebase ini, supaya aturannya bisa diuji langsung dan
// dipakai ulang oleh dua jalur penagihan yang ada: checkout POS
// (routes/pos/invoices.ts) dan faktur dari tiket servis (modules/tickets).

export interface CashTenderInput {
  paymentMethod: string;
  /** Nominal yang diserahkan pelanggan. undefined = kasir tidak mengisinya. */
  amountTendered: number | null | undefined;
  grandTotal: number;
}

export interface CashTenderResult {
  ok: boolean;
  /** Kembalian, dibulatkan ke rupiah penuh. 0 untuk metode non-tunai. */
  changeAmount: number;
  /** Nilai yang layak disimpan ke kolom `amount_tendered` (null bila tak relevan). */
  amountTendered: number | null;
  code?: string;
  message?: string;
}

/**
 * Hanya pembayaran tunai yang punya konsep "uang diserahkan". Untuk metode
 * lain nominal apa pun yang terkirim diabaikan (dikembalikan sebagai null),
 * bukan ditolak — kasir bisa saja berganti metode setelah sempat mengetik
 * nominal, dan itu bukan kesalahan yang perlu menggagalkan transaksi.
 *
 * Tunai TANPA nominal tetap diperbolehkan (ok: true, tersimpan null). Ini
 * disengaja: kasir yang menerima uang pas tidak wajib mengetik apa pun, dan
 * memaksanya akan memperlambat antrean — persis keluhan yang membuat fitur ini
 * dibuat. Yang ditolak hanya nominal yang KURANG dari total, karena itu pasti
 * salah ketik (uangnya tidak cukup untuk melunasi).
 */
export function evaluateCashTender(input: CashTenderInput): CashTenderResult {
  if (input.paymentMethod !== 'cash') {
    return { ok: true, changeAmount: 0, amountTendered: null };
  }
  if (input.amountTendered === null || input.amountTendered === undefined) {
    return { ok: true, changeAmount: 0, amountTendered: null };
  }
  if (input.amountTendered < input.grandTotal) {
    return {
      ok: false,
      changeAmount: 0,
      amountTendered: null,
      code: 'INSUFFICIENT_TENDER',
      message: 'Uang yang diterima kurang dari total tagihan',
    };
  }
  return {
    ok: true,
    changeAmount: Math.round(input.amountTendered - input.grandTotal),
    amountTendered: input.amountTendered,
  };
}
