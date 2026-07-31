// Sandi/pola HP disimpan di satu field teks `service_tickets.device_passcode`.
// Pola kunci Android disimpan dengan penanda "pola:" + urutan titik 1-9
// (mis. "pola:1-2-3-6-9"); PIN/sandi biasa disimpan apa adanya ("1234").
// Konvensi ini HARUS sama dengan flowserv-web/src/lib/utils/pattern.ts.
// (Dua paket terpisah, jadi tidak bisa saling impor — sengaja diduplikasi kecil.)

const PATTERN_PREFIX = 'pola:';

/**
 * Label cetak manusiawi untuk sandi/pola, dipakai di label stoker (bukan nota).
 * Pola -> "Pola: 1-2-3-6-9", PIN -> "Sandi: 1234", kosong -> "".
 */
export function passcodePrintLabel(value: string | null | undefined): string {
  if (!value) return '';
  if (value.startsWith(PATTERN_PREFIX)) {
    const seq = value.slice(PATTERN_PREFIX.length);
    return seq ? `Pola: ${seq}` : '';
  }
  return `Sandi: ${value}`;
}

// ---------------------------------------------------------------------------
// R1.5C — panjang minimum sandi/pola
//
// Pemilik (uji-R1 A5): "tambahkan validasi untuk pin dan polanya minimal 4
// huruf". Alasannya bukan keamanan — sandi ini dicatat supaya unit bisa DIBUKA
// lagi saat diserahkan. Nilai 1-2 karakter hampir selalu salah ketik, dan
// baru ketahuan salah ketika pelanggan sudah menunggu di konter.
//
// Kenapa tidak cukup `value.length >= 4`: satu field menyimpan dua bentuk, jadi
// "panjang" berarti dua hal. "pola:1-2" panjangnya 9 karakter tapi hanya 2
// titik — hitungan mentah akan meloloskannya.
// ---------------------------------------------------------------------------

export const MIN_PASSCODE_LENGTH = 4;

export type PasscodeCheck =
  | { valid: true }
  | { valid: false; code: 'PASSCODE_TOO_SHORT' | 'PASSCODE_MALFORMED'; message: string };

/** Jumlah titik sebuah pola; null bila formatnya rusak. */
function patternDotCount(value: string): number | null {
  const seq = value.slice(PATTERN_PREFIX.length);
  if (!seq) return 0;
  const dots = seq.split('-').map((s) => Number.parseInt(s, 10));
  if (dots.some((d) => !Number.isInteger(d) || d < 1 || d > 9)) return null;
  return dots.length;
}

/**
 * Sandi/pola boleh KOSONG — tidak semua unit terkunci, dan memaksa staf
 * mengarang sandi jauh lebih buruk daripada membiarkannya kosong. Yang ditolak
 * hanya nilai yang diisi tapi terlalu pendek.
 */
export function checkPasscode(value: string | null | undefined): PasscodeCheck {
  if (value === null || value === undefined || value === '') return { valid: true };

  if (value.startsWith(PATTERN_PREFIX)) {
    const dots = patternDotCount(value);
    if (dots === null) {
      return { valid: false, code: 'PASSCODE_MALFORMED', message: 'Pola tidak terbaca. Gambar ulang polanya.' };
    }
    if (dots < MIN_PASSCODE_LENGTH) {
      return { valid: false, code: 'PASSCODE_TOO_SHORT', message: `Pola minimal ${MIN_PASSCODE_LENGTH} titik.` };
    }
    return { valid: true };
  }

  if (value.trim().length < MIN_PASSCODE_LENGTH) {
    return { valid: false, code: 'PASSCODE_TOO_SHORT', message: `Sandi/PIN minimal ${MIN_PASSCODE_LENGTH} karakter.` };
  }

  return { valid: true };
}
