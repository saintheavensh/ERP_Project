// R1.6 — satu-satunya tempat input divalidasi.
//
// ⚠️ JANGAN impor `@hono/zod-validator` langsung di route mana pun. Impor
// `zValidator` dari berkas ini.
//
// Kenapa: `zValidator` bawaan Hono, ketika validasi gagal, membalas dengan
// bentuknya sendiri — `{ success: false, error: <ZodError> }` — bukan amplop
// `{ data, meta, error }` yang coding-guidelines §3.2 sebut "no exceptions".
// Akibatnya nyata dan ketahuan dari uji manual pemilik (uji-R1.5 poin C1/C3),
// bukan dari membaca kode: `ZodError.message` isinya JSON mentah daftar issue,
// jadi frontend yang membaca `error.message` menampilkan
//
//     [ { "code": "custom", "message": "Pola minimal 4 titik.", "path": [...] } ]
//
// ke wajah kasir. Pesan Indonesianya SUDAH ADA di dalam sana — hanya terkubur.
//
// Berkas ini membungkusnya sekali supaya 78 pemakaian di 24 berkas route ikut
// benar sekaligus, dan supaya tidak ada jalur validasi kedua yang bisa berbeda
// perilaku (bentuk cacat yang sama dengan `calculateWac` yang dulu ditulis tiga
// kali — lihat PHASES.md Architecture Debt).

import { zValidator as honoZValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import type { ZodError, ZodIssue } from 'zod';
import { errorResponse } from './response';

/**
 * Nama kolom untuk ditempel di depan pesan.
 *
 * Sengaja TIDAK ada kamus terjemahan nama kolom di sini. Kamus seperti itu
 * akan jadi sumber kebenaran kedua yang diam-diam melenceng dari skema (persis
 * yang S5 hindari dengan mengirim daftar jenis tahap dari server). Yang dipakai
 * adalah nama kolom apa adanya, dan hanya ketika benar-benar membantu — lihat
 * `humanizeZodError` di bawah.
 */
function fieldPath(issue: ZodIssue): string {
  return issue.path.filter((p) => typeof p === 'string').join('.');
}

/**
 * Satu issue Zod → satu kalimat.
 *
 * Aturannya: pesan yang KITA tulis sendiri (issue `custom`, mis. dari
 * `checkPasscode`) dipakai apa adanya — ia sudah berbahasa toko dan menyebut
 * hal yang benar. Sisanya pesan bawaan Zod yang berbahasa Inggris dan
 * berbicara soal tipe data, jadi diterjemahkan ke kalimat yang berguna bagi
 * orang di konter.
 */
function describeIssue(issue: ZodIssue): string {
  if (issue.code === 'custom') return issue.message;

  const field = fieldPath(issue);
  const subject = field ? `Kolom "${field}"` : 'Data yang dikirim';

  // Zod v4 membawa `origin` ('string' | 'number' | 'array' | …) dan batas
  // angkanya di dalam issue. Dipakai supaya pesannya menyebut hal yang benar
  // ("minimal 3 karakter" vs "minimal 3") alih-alih satu kalimat serba-guna
  // yang tidak menolong siapa pun.
  const { origin, minimum, maximum, format } = issue as unknown as {
    origin?: string;
    minimum?: number;
    maximum?: number;
    format?: string;
  };

  switch (issue.code) {
    case 'invalid_type':
      // Zod v4 menyatukan "hilang" dan "salah tipe" di satu kode; yang
      // membedakan hanya nilai yang diterima.
      return `${subject} wajib diisi.`;
    case 'too_small':
      // Batas 1 pada teks/daftar artinya "tidak boleh kosong" — mengatakan
      // "minimal 1 karakter" ke kasir itu benar tapi tidak membantu.
      if (minimum === 1) return `${subject} wajib diisi.`;
      if (origin === 'number') return `${subject} minimal ${minimum}.`;
      if (origin === 'array') return `${subject} harus berisi minimal ${minimum} pilihan.`;
      return `${subject} minimal ${minimum} karakter.`;
    case 'too_big':
      if (origin === 'number') return `${subject} maksimal ${maximum}.`;
      if (origin === 'array') return `${subject} maksimal ${maximum} pilihan.`;
      return `${subject} maksimal ${maximum} karakter.`;
    case 'invalid_format':
      if (format === 'email') return `${subject} bukan alamat email yang benar.`;
      return `${subject} formatnya tidak sesuai.`;
    case 'invalid_value':
      return `${subject} berisi pilihan yang tidak dikenal.`;
    case 'unrecognized_keys':
      return 'Ada data tambahan yang tidak dikenali.';
    default:
      // Jangan mengarang: kalau Zod punya pesan, tampilkan pesannya.
      return field ? `${subject}: ${issue.message}` : issue.message;
  }
}

/**
 * ZodError → pesan yang bisa dibaca + daftar issue lengkap untuk `details`.
 *
 * `details` tetap membawa issue aslinya supaya tidak ada informasi yang hilang
 * untuk penelusuran bug; yang berubah hanya apa yang muncul di layar.
 */
export function humanizeZodError(error: ZodError): { message: string; details: unknown[] } {
  const issues = error.issues ?? [];
  if (issues.length === 0) {
    return { message: 'Data yang dikirim tidak valid.', details: [] };
  }

  // Satu masalah → satu kalimat utuh, tanpa penomoran yang membuatnya terasa
  // seperti laporan sistem. Ini kasus yang paling sering dilihat kasir.
  const message =
    issues.length === 1
      ? describeIssue(issues[0])
      : issues.map(describeIssue).join(' ');

  return { message, details: issues };
}

/** Hook bawaan: dipakai kalau route tidak membawa hook-nya sendiri. */
function envelopeHook(result: { success: boolean; error?: unknown }, c: Context) {
  if (!result.success) {
    const { message, details } = humanizeZodError(result.error as ZodError);
    return errorResponse(c, 'VALIDATION_ERROR', message, details, 400);
  }
}

/**
 * Pengganti `zValidator` dari `@hono/zod-validator`.
 *
 * ⚠️ Cast `as typeof honoZValidator` di bawah BUKAN kemalasan — ia yang menjaga
 * seluruh generic Hono tetap utuh. Percobaan pertama menulis ulang tanda
 * tangannya sendiri (`<Target, Schema>(target, schema)`), dan itu diam-diam
 * meruntuhkan inferensi: `c.req.valid('json')` berubah jadi `unknown` di
 * SEMUA route sekaligus, memunculkan ratusan galat `TS18046` di berkas yang
 * tak disentuh. Bentuk cacat yang sama persis dengan H12 (lihat PHASES.md
 * 4.5B.1). Bungkus perilakunya, jangan tulis ulang tipenya.
 *
 * Hook milik route sendiri tetap dihormati bila ada; kalau tidak ada, barulah
 * amplop standar dipasang.
 */
export const zValidator = ((target: any, schema: any, hook?: any, options?: any) =>
  honoZValidator(target, schema, hook ?? envelopeHook, options)) as typeof honoZValidator;
