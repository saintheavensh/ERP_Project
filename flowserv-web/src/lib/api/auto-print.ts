/**
 * Tahap B — auto-cetak: kirim dokumen ke printer agent lokal TANPA dialog,
 * begitu aksinya selesai (checkout POS, intake tiket, faktur servis).
 *
 * Membalik keputusan `plan/tahap-a-print-triggers.md` §4 ("auto-print sengaja
 * tidak dibangun"). Alasan pembalikan: sejak Phase 6C.5, printer per cabang
 * benar-benar bisa dipilih di Settings, jadi "printer yang mana" bukan lagi
 * pertanyaan terbuka — dan pemilik meminta struk langsung keluar (2026-07-27).
 *
 * Aturan penting: fungsi ini TIDAK PERNAH melempar. Mencetak adalah efek
 * samping setelah transaksi ter-commit; kegagalan printer tidak boleh terlihat
 * seperti kegagalan transaksi. Pemanggil membaca `status` dan menampilkan
 * jalur cetak manual (PrintButton) bila perlu.
 */

import { API_BASE } from './config';
import { PRINTER_AGENT_URL } from './printer-agent';

export type AutoPrintStatus =
  /** Terkirim ke printer agent. */
  | 'printed'
  /** Cabang ini belum punya printer ter-assign untuk dokumen tsb. */
  | 'no-printer'
  /** Dokumen A4 — hanya bisa lewat dialog cetak browser, bukan agent. */
  | 'manual-required'
  /** Agent tidak berjalan / menolak. */
  | 'agent-offline'
  /** Render server gagal (dokumen tak ditemukan, template belum diatur, dll). */
  | 'error';

export interface AutoPrintResult {
  status: AutoPrintStatus;
  /** Pesan siap-tampil untuk kasir; undefined saat berhasil. */
  message?: string;
}

export type AutoPrintDocumentType = 'receipt' | 'invoice_a4' | 'label' | 'tanda_terima';

export async function autoPrint(
  token: string,
  documentType: AutoPrintDocumentType,
  id: string
): Promise<AutoPrintResult> {
  let rendered: any;
  try {
    const res = await fetch(`${API_BASE}/print/documents/${documentType}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!res.ok) {
      return { status: 'error', message: result.error?.message || 'Gagal menyiapkan dokumen cetak' };
    }
    rendered = result.data;
  } catch {
    return { status: 'error', message: 'Gagal menghubungi server untuk menyiapkan cetak' };
  }

  // Spec rule 2 — A4 tidak pernah menyentuh agent; jalurnya window.print().
  if (rendered.paperSize === 'A4') {
    return { status: 'manual-required', message: 'Dokumen A4 perlu dicetak lewat dialog cetak.' };
  }

  if (!rendered.assignment) {
    return {
      status: 'no-printer',
      message: 'Belum ada printer diatur untuk cabang ini — atur di Setelan → Printer.',
    };
  }

  try {
    const res = await fetch(`${PRINTER_AGENT_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paperSize: rendered.paperSize,
        blocks: rendered.blocks,
        device: rendered.assignment,
      }),
    });
    if (!res.ok) {
      return { status: 'agent-offline', message: 'Printer agent menolak permintaan cetak.' };
    }
    return { status: 'printed' };
  } catch {
    return {
      status: 'agent-offline',
      message: 'Printer agent tidak berjalan di komputer ini — dokumen belum tercetak.',
    };
  }
}

/** Ringkas beberapa hasil auto-cetak jadi satu pesan untuk kasir. */
export function summarizeAutoPrint(
  results: Array<{ label: string; result: AutoPrintResult }>
): string | null {
  const failed = results.filter((r) => r.result.status !== 'printed');
  if (failed.length === 0) return null;
  // Semua gagal karena sebab yang sama → satu pesan, bukan daftar berulang.
  const uniqueMessages = [...new Set(failed.map((f) => f.result.message).filter(Boolean))];
  const names = failed.map((f) => f.label).join(' & ');
  return `${names} belum tercetak. ${uniqueMessages.join(' ')}`;
}
