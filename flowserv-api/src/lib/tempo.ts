// D1 (go-live tahap-B) — aturan kelayakan pembayaran tempo (utang) per pelanggan.
// Fungsi murni (tanpa DB/HTTP) supaya bisa diuji langsung, mengikuti pola
// evaluateRbac()/evaluateTransition() di codebase ini. Keputusan sengaja
// sederhana: tempo hanya untuk pelanggan yang diizinkan owner/manager.

export interface TempoEligibilityInput {
  paymentMethod: string;
  /** `customers.allowTempo`. null/undefined diperlakukan sama dengan false. */
  customerAllowTempo: boolean | null | undefined;
}

export interface TempoEligibilityResult {
  allowed: boolean;
  code?: string;
  message?: string;
}

/**
 * Hanya metode 'tempo' yang dibatasi — cash/transfer/qris/ewallet/split selalu
 * lolos. Untuk tempo, pelanggan wajib punya `allowTempo === true`. (Kewajiban
 * "tempo harus punya customerId" sudah dijaga di lapisan lain: Zod refine +
 * CHECK constraint Postgres — di sini kita hanya menilai kelayakannya.)
 */
export function evaluateTempoEligibility(input: TempoEligibilityInput): TempoEligibilityResult {
  if (input.paymentMethod !== 'tempo') return { allowed: true };
  if (input.customerAllowTempo === true) return { allowed: true };
  return {
    allowed: false,
    code: 'TEMPO_NOT_ALLOWED',
    message: 'Pelanggan ini belum diizinkan pembayaran tempo (utang)',
  };
}
