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
