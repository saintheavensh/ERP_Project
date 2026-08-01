import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { humanizeZodError } from '../validator';
import { checkPasscode } from '../passcode';

/**
 * R1.6 — tes ini menjaga temuan uji manual pemilik (uji-R1.5 C1/C3): pesan
 * validasi yang sampai ke layar kasir harus kalimat, bukan JSON.
 *
 * Yang paling penting adalah tes pertama: ia memakai skema sandi/pola yang
 * SUNGGUHAN dari modules/tickets/types.ts, bukan tiruan. Tiruan akan tetap
 * hijau seandainya `checkPasscode` berhenti dipanggil di sana.
 */
function failureOf(schema: z.ZodType, value: unknown) {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('Skema seharusnya menolak nilai ini.');
  return humanizeZodError(result.error);
}

// Salinan bentuk yang dipakai updateIntakeDetailsInput / createIntakeInput.
const passcodeSchema = z.object({
  devicePasscode: z.string().nullable().optional().superRefine((val, ctx) => {
    if (val === null || val === undefined) return;
    const check = checkPasscode(val);
    if (!check.valid) ctx.addIssue({ code: z.ZodIssueCode.custom, message: check.message });
  }),
});

describe('humanizeZodError', () => {
  it('pesan pola terlalu pendek muncul apa adanya, bukan JSON', () => {
    const { message } = failureOf(passcodeSchema, { devicePasscode: 'pola:1-2' });

    expect(message).toBe('Pola minimal 4 titik.');
    // Inti temuan pemilik: tidak boleh ada jejak bentuk JSON di pesan.
    expect(message).not.toContain('[');
    expect(message).not.toContain('"code"');
    expect(message).not.toContain('"path"');
  });

  it('pesan sandi terlalu pendek juga kalimat utuh', () => {
    const { message } = failureOf(passcodeSchema, { devicePasscode: '12' });
    expect(message).toBe('Sandi/PIN minimal 4 karakter.');
  });

  it('issue lengkap tetap disimpan di details supaya tidak ada info hilang', () => {
    const { details } = failureOf(passcodeSchema, { devicePasscode: '12' });
    expect(details).toHaveLength(1);
    expect((details[0] as { path: unknown[] }).path).toEqual(['devicePasscode']);
  });

  it('kolom wajib yang kosong disebut namanya, dalam bahasa Indonesia', () => {
    const schema = z.object({ customerName: z.string() });
    const { message } = failureOf(schema, {});

    expect(message).toBe('Kolom "customerName" wajib diisi.');
    expect(message).not.toMatch(/expected|received|invalid_type/i);
  });

  it('beberapa masalah sekaligus digabung jadi satu paragraf, bukan array', () => {
    const schema = z.object({ a: z.string(), b: z.string() });
    const { message, details } = failureOf(schema, {});

    expect(details).toHaveLength(2);
    expect(message).toContain('"a"');
    expect(message).toContain('"b"');
    expect(message.startsWith('[')).toBe(false);
  });

  it('batas panjang menyebut satuan yang benar: karakter untuk teks, angka untuk angka', () => {
    // Satu kalimat serba-guna ("terlalu pendek atau terlalu kecil") benar tapi
    // tidak menolong siapa pun di konter — jadi `origin` dari Zod v4 dipakai.
    expect(failureOf(z.object({ sku: z.string().min(3) }), { sku: 'ab' }).message)
      .toBe('Kolom "sku" minimal 3 karakter.');
    expect(failureOf(z.object({ qty: z.number().min(5) }), { qty: 2 }).message)
      .toBe('Kolom "qty" minimal 5.');
    expect(failureOf(z.object({ nama: z.string().max(3) }), { nama: 'abcdef' }).message)
      .toBe('Kolom "nama" maksimal 3 karakter.');
  });

  it('minimal 1 diterjemahkan jadi "wajib diisi", bukan "minimal 1 karakter"', () => {
    // Benar secara harfiah, tapi tidak berguna. Ini kasus paling sering:
    // z.string().min(1) di hampir setiap form.
    const { message } = failureOf(z.object({ nama: z.string().min(1) }), { nama: '' });
    expect(message).toBe('Kolom "nama" wajib diisi.');
  });

  it('email yang salah disebut sebagai email, bukan "format tidak sesuai"', () => {
    const { message } = failureOf(z.object({ email: z.string().email() }), { email: 'bukan-email' });
    expect(message).toBe('Kolom "email" bukan alamat email yang benar.');
  });

  it('pilihan enum yang tidak dikenal tidak membocorkan istilah teknis Zod', () => {
    const schema = z.object({ paperSize: z.enum(['58mm', '80mm']) });
    const { message } = failureOf(schema, { paperSize: 'A3' });

    expect(message).toBe('Kolom "paperSize" berisi pilihan yang tidak dikenal.');
  });

  it('ZodError tanpa issue tetap menghasilkan kalimat, bukan string kosong', () => {
    const { message } = humanizeZodError({ issues: [] } as unknown as z.ZodError);
    expect(message).toBe('Data yang dikirim tidak valid.');
  });
});
