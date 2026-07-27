import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tenants, permissions } from './core';


export const flowTemplates = pgTable('flow_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  domain: varchar('domain', { length: 20 }).notNull(), // "service" | "inventory"
  name: text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('flow_templates_tenant_idx').on(table.tenantId),
}));

export const flowNodes = pgTable('flow_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  flowTemplateId: uuid('flow_template_id').notNull().references(() => flowTemplates.id),
  name: text('name').notNull(),
  // Tahap B — keterangan "tahap ini untuk apa", ditulis owner saat menyusun
  // alur dan ditampilkan ke staf di halaman tiket, supaya tak ada tebak-tebakan
  // soal apa yang harus dikerjakan di sebuah tahap.
  //
  // Catatan: TicketWorkspace.svelte SUDAH merender `currentNode.description`
  // sejak Phase 3, padahal kolomnya tak pernah ada — jadi selama ini selalu
  // kosong. Kolom ini menutup binding mati itu, bukan menambah tampilan baru.
  description: text('description'),
  sequenceOrder: integer('sequence_order').notNull(),
  nodeType: varchar('node_type', { length: 20 }).notNull(), // "action" | "approval" | "system"
  requiredPermissionId: uuid('required_permission_id').references(() => permissions.id),

  // ---------------------------------------------------------------------------
  // Tahap B (2026-07-27) — KAPABILITAS PER TAHAP.
  //
  // Keputusan pemilik: "template flow service ini inti dari semua alur
  // servicenya ... bisa diatur sesuai dengan keputusan toko atau kebijakan
  // owner". Jadi aturan seperti "sparepart baru boleh diisi setelah diagnosis"
  // atau "nota keluar saat unit ditinggal" TIDAK BOLEH hidup di dalam kode —
  // itu kebijakan toko, dan tiap toko bisa berbeda.
  //
  // Empat kolom di bawah memindahkan aturan-aturan itu ke data, tempatnya
  // seharusnya. Ini juga yang membuat Flow Template Builder (Phase 7.1) punya
  // sesuatu yang benar-benar bisa diatur — sebelum ini builder hanya bisa
  // menyusun kotak dan panah tanpa mengubah perilaku apa pun.
  // ---------------------------------------------------------------------------

  /** Sparepart & biaya boleh diinput saat tiket berada di tahap ini. */
  allowsCharges: boolean('allows_charges').notNull().default(false),
  /** Form hasil diagnosa + estimasi waktu ditampilkan di tahap ini. */
  requiresDiagnosis: boolean('requires_diagnosis').notNull().default(false),
  /** Faktur & pembayaran boleh dibuat saat tiket berada di tahap ini. */
  allowsInvoicing: boolean('allows_invoicing').notNull().default(false),
  /**
   * Dokumen yang otomatis dicetak begitu tiket MASUK tahap ini, mis.
   * `["label"]` di Intake atau `["tanda_terima","label"]` saat unit ditinggal.
   * Array kosong = tahap ini tidak mencetak apa pun. Nilainya memakai
   * documentType yang sama dengan modul printer (label / tanda_terima /
   * receipt / invoice_a4), jadi tak ada kamus kedua yang bisa berselisih.
   */
  autoPrintDocuments: jsonb('auto_print_documents').notNull().default([]),

  /**
   * Tahap INTI alur — tidak boleh dihapus, dan urutannya relatif terhadap tahap
   * inti lain tidak boleh diubah dari editor.
   *
   * Keputusan pemilik (2026-07-27): "untuk alur intinya urutannya tidak bisa
   * diubah, konfigurasinya hanya menambahkan QC kemudian melewati tahap print
   * awal". Tulang punggung Intake -> Diagnosis -> (Ditunggu | Disimpan) ->
   * Pengerjaan -> Selesai adalah cara toko bekerja; yang boleh diatur adalah
   * tahap TAMBAHAN (QC, tunggu sparepart) dan dokumen apa yang tercetak di
   * tiap tahap.
   *
   * Nilai ini dikendalikan server, BUKAN dikirim klien: tahap yang dibuat lewat
   * editor selalu non-inti, sehingga owner tak bisa (sengaja atau tidak)
   * mengunci tahap buatannya sendiri lalu terjebak.
   */
  isCore: boolean('is_core').notNull().default(true),
}, (table) => ({
  templateIdx: index('flow_nodes_template_idx').on(table.flowTemplateId),
}));

export const flowTransitions = pgTable('flow_transitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromNodeId: uuid('from_node_id').notNull().references(() => flowNodes.id),
  toNodeId: uuid('to_node_id').notNull().references(() => flowNodes.id),
  conditionExpression: text('condition_expression'),
});
