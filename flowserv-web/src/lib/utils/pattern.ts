// Sandi/pola HP disimpan di satu field teks `devicePasscode`. Pola (pattern
// kunci Android) disimpan dengan penanda "pola:" + urutan titik 1-9
// (mis. "pola:1-2-3-6-9"), supaya tercatat PASTI — bukan teks samar seperti
// "L terbalik". PIN/sandi biasa disimpan apa adanya ("1234").

export const PATTERN_PREFIX = 'pola:';

export function isPattern(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PATTERN_PREFIX);
}

/** "pola:1-2-3" -> [1,2,3]; null kalau bukan pola atau formatnya rusak. */
export function parsePattern(value: string | null | undefined): number[] | null {
  if (!isPattern(value)) return null;
  const seq = (value as string).slice(PATTERN_PREFIX.length);
  if (!seq) return [];
  const dots = seq.split('-').map((s) => parseInt(s, 10));
  if (dots.some((d) => !Number.isInteger(d) || d < 1 || d > 9)) return null;
  return dots;
}

export function dotsToValue(dots: number[]): string {
  return dots.length ? `${PATTERN_PREFIX}${dots.join('-')}` : '';
}

/** Teks manusiawi untuk ditampilkan/dicetak: pola -> "Pola 1-2-3", PIN -> apa adanya. */
export function passcodeText(value: string | null | undefined): string {
  const dots = parsePattern(value);
  if (dots) return `Pola ${dots.join('-')}`;
  return value || '';
}
