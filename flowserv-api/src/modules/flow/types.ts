import { z } from 'zod';
import { DOCUMENT_TYPES } from '../printer/types';
import { STAGE_KINDS } from './stage-kinds';

/**
 * Tahap B — payload editor alur servis (Phase 7.1).
 *
 * Editor mengirim SELURUH rancangan sekaligus, bukan perubahan per-node.
 * Alasannya: satu simpanan alur harus atomik. Menyusun ulang tahap sambil
 * mengubah percabangan lewat beberapa request kecil bisa meninggalkan alur
 * dalam keadaan setengah jadi (mis. tahap awal ganda) yang langsung dipakai
 * tiket berjalan.
 *
 * `key` adalah identitas node DI DALAM payload — untuk node yang sudah ada
 * nilainya sama dengan `id`-nya, untuk node baru sembarang string unik dari
 * klien. Transisi menunjuk `key`, sehingga node baru bisa langsung dirangkai
 * tanpa perlu round-trip menyimpan node dulu lalu transisinya kemudian.
 */
export const flowDesignNodeSchema = z.object({
  key: z.string().min(1),
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nama tahap wajib diisi').max(80),
  description: z.string().max(500).nullable().optional(),
  nodeType: z.string().max(20).default('action'),
  requiredPermissionId: z.string().uuid().nullable().optional(),
  /**
   * S5 — SATU pilihan menggantikan tiga sakelar bebas. Kapabilitasnya
   * diturunkan server-side lewat `capabilitiesFor()`; klien tak lagi bisa
   * mengirim kombinasi sendiri, jadi bentuk alur yang mungkin tinggal
   * sebanyak jenis tahap yang ada — dan tiap jenis punya tesnya.
   */
  stageKind: z.enum(STAGE_KINDS).default('pengerjaan'),
  autoPrintDocuments: z.array(z.enum(DOCUMENT_TYPES)).default([]),
  // Daftar periksa tahap (QC). `id` dibuat klien dan HARUS tetap saat kalimatnya
  // diubah — jawaban tiket lama menunjuk id ini.
  checklistItems: z.array(z.object({
    id: z.string().uuid(),
    label: z.string().min(1, 'Item periksa tidak boleh kosong').max(200),
  })).default([]),
});

export const flowDesignSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  // Urutan array = urutan tahap (hasil drag-and-drop). sequenceOrder diturunkan
  // dari indeks, jadi klien tak perlu mengelola penomoran sendiri.
  nodes: z.array(flowDesignNodeSchema).min(2, 'Alur minimal punya 2 tahap'),
  transitions: z.array(z.object({ from: z.string().min(1), to: z.string().min(1) })),
});

export const createFlowTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  domain: z.string().max(50).default('service'),
});

export type FlowDesignInput = z.infer<typeof flowDesignSchema>;
export type FlowDesignNodeInput = z.infer<typeof flowDesignNodeSchema>;
export type CreateFlowTemplateInput = z.infer<typeof createFlowTemplateSchema>;
