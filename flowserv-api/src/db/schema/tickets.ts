import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tenants, branches, users } from './core';
import { flowTemplates, flowNodes } from './flow';
import { ticketStatusEnum } from './enums';
import { money } from './columns';
import { deviceModels } from './product_catalog';


export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  // D1 (go-live tahap-B) — kelayakan tempo per pelanggan. Default false: pelanggan
  // baru TIDAK boleh utang sampai owner/manager mengizinkannya secara eksplisit.
  // Gerbang ini dicek saat checkout POS metode 'tempo' (422 TEMPO_NOT_ALLOWED).
  allowTempo: boolean('allow_tempo').notNull().default(false),
  // Tahap-B — kategori pelanggan: 'service' (bawa unit servis) vs 'sparepart'
  // (beli sparepart/eceran). LABEL LUNAK, bukan pembatas: pelanggan 'sparepart'
  // tetap bisa dipilih untuk tiket servis (picker intake filter by nama, bukan
  // tipe). Dipakai untuk pengelompokan & filter daftar pelanggan.
  customerType: text('customer_type').notNull().default('service'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('customers_tenant_idx').on(table.tenantId),
}));

export const customerAssets = pgTable('customer_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  assetType: text('asset_type').notNull(), // "HP", "Motor", "Kulkas", dst — bebas per tenant
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
  // Tahap A — katalog device (gambar/spesifikasi/saran servis). Nullable: device
  // yang belum ada di katalog tetap bisa diinput bebas (brand/model text di atas),
  // sama semangatnya dengan unresolvedCompatibility yang sudah ada untuk sparepart.
  deviceModelId: uuid('device_model_id').references(() => deviceModels.id),
});

export const serviceTickets = pgTable('service_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  customerAssetId: uuid('customer_asset_id').notNull().references(() => customerAssets.id),
  flowTemplateId: uuid('flow_template_id').notNull().references(() => flowTemplates.id),
  currentNodeId: uuid('current_node_id').references(() => flowNodes.id),
  status: ticketStatusEnum('status').notNull().default('open'),
  // H7 — denormalized totals for list views that must not aggregate ticket_charges.
  // Kept in sync by the tickets service inside the same transaction as every charge write.
  estimatedTotal: money('estimated_total').notNull().default('0'),
  approvedTotal: money('approved_total'),
  // H8 — a technician is a user with a role, not a separate identity. Nullable:
  // a ticket at intake has no technician yet.
  assignedTechnicianId: uuid('assigned_technician_id').references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  // Tahap A — go-live gap Tier-1 #2. Recorded at intake, given back at handover
  // (QC Akhir). Lives on the ticket, not customer_assets: a device's lock code
  // can change between visits, so it isn't a permanent asset property.
  devicePasscode: text('device_passcode'),
  // Tahap A — go-live gap Tier-1 #3 (print triggers). SVC-001 always named
  // "complaint" as part of intake, but no column for it ever existed until
  // now. Feeds the label/tanda-terima print documents ("kerusakan").
  reportedComplaint: text('reported_complaint'),
  // Tahap B (2026-07-27) — alur nyata pemilik: "teknisi menginput diagnosa dan
  // juga estimasi harga dan waktu". `reportedComplaint` di atas adalah keluhan
  // PELANGGAN; ini temuan TEKNISI — dua hal berbeda yang sering tidak sama
  // ("mati total" vs "IC power short"). Estimasi harga sudah punya rumahnya
  // sendiri (ticket_charges), jadi hanya dua kolom ini yang benar-benar baru.
  diagnosis: text('diagnosis'),
  // Menit, bukan timestamp target: yang disepakati dengan pelanggan adalah
  // durasi ("2 jam", "3 hari"), dan durasi tak ikut bergeser bila pengerjaan
  // baru mulai besok. Tampilan mengubahnya jadi "2 jam" / "1 hari".
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  // R1.8-T7 — perkiraan biaya yang DISEBUT KASIR DI KONTER saat menerima unit.
  //
  // Kolom sendiri, bukan menumpang estimasi teknisi, dan itu disengaja: estimasi
  // teknisi hidup sebagai baris `ticket_charges` (lihat catatan `diagnosis` di
  // atas), sementara tahap Penerimaan justru MELARANG baris biaya (S5). Jadi
  // angka kasir memang tidak punya tempat tinggal sampai sekarang.
  //
  // Dipisah juga karena keduanya berbeda arti: "tadi dijanjikan berapa di
  // konter" tidak boleh hilang ketika teknisi memasukkan angka sebenarnya
  // setelah memeriksa. Selisih keduanya itulah yang jadi percakapan dengan
  // pelanggan.
  intakeEstimatedCost: money('intake_estimated_cost'),
  // Nomor antrian harian per cabang, dicetak di label supaya pelanggan bisa
  // dipanggil. Direset tiap hari lewat queue_date di bawah.
  queueNumber: integer('queue_number'),
  queueDate: date('queue_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => ({
  tenantBranchIdx: index('service_tickets_tenant_branch_idx').on(table.tenantId, table.branchId),
  assignedTechnicianIdx: index('service_tickets_assigned_technician_idx').on(table.assignedTechnicianId),
}));

export const ticketStageHistory = pgTable('ticket_stage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),
  nodeId: uuid('node_id').notNull().references(() => flowNodes.id),
  actorId: uuid('actor_id'),
  notes: text('notes'),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ticketIdx: index('ticket_stage_history_ticket_idx').on(table.ticketId),
}));

/**
 * Jawaban teknisi atas daftar periksa sebuah tahap (mis. QC), per tiket.
 *
 * `label` sengaja DISALIN dari definisi tahap saat jawaban disimpan, bukan
 * dibaca ulang belakangan: ini bukti yang ditunjukkan ke pelanggan, jadi
 * mengganti kalimat item di template tidak boleh mengubah bunyi bukti tiket
 * yang sudah lewat.
 */
export const ticketChecklistResults = pgTable('ticket_checklist_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),
  nodeId: uuid('node_id').notNull().references(() => flowNodes.id),
  /** id item di dalam `flow_nodes.checklist_items` (jsonb, jadi bukan FK). */
  itemId: uuid('item_id').notNull(),
  label: text('label').notNull(),
  checked: boolean('checked').notNull().default(false),
  note: text('note'),
  checkedBy: uuid('checked_by').references(() => users.id),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ticketIdx: index('ticket_checklist_results_ticket_idx').on(table.ticketId),
  // Satu jawaban per item per tahap per tiket — menyimpan ulang memperbarui
  // baris yang sama, bukan menumpuk riwayat centang.
  uniqueAnswer: unique('ticket_checklist_results_unique').on(table.ticketId, table.nodeId, table.itemId),
}));

export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  amount: money('amount'),
  magicToken: text('magic_token').unique(), // dipakai untuk link approval customer
});

