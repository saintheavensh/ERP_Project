import { eq } from 'drizzle-orm';
import { flowTemplates, flowNodes, flowTransitions } from '../schema';
import { backboneStage } from '../../modules/flow/backbone';
import { capabilitiesFor, stageKindFromCapabilities, type StageKind } from '../../modules/flow/stage-kinds';
import { IDS } from './ids';
import type { SeedTx } from './types';

/**
 * S5 — kapabilitas (allowsCharges/requiresDiagnosis/allowsInvoicing) TIDAK
 * ditulis tangan di seed; ia diturunkan dari `stageKind`. Kalau kelak sebuah
 * jenis tahap diubah artinya, seed ikut berubah sendiri dan tak bisa
 * berselisih dengan alur yang dibuat lewat editor.
 */
function withCapabilities<T extends { stageKind: StageKind }>(node: T) {
  return { ...node, ...capabilitiesFor(node.stageKind) };
}

export async function seedFlows(tx: SeedTx): Promise<void> {
  // Same "Standard Repair" flow as the old seed-flows.ts, now with fixed IDs
  // so re-running this doesn't create a second template (the old script's bug).
  await tx.insert(flowTemplates).values({
    id: IDS.flowTemplate,
    tenantId: IDS.tenantMain,
    name: 'Standard Repair',
    domain: 'service',
    isDefault: true,
  }).onConflictDoNothing();

  await tx.insert(flowNodes).values([
    { id: IDS.nodeIntake, flowTemplateId: IDS.flowTemplate, name: 'Intake', nodeType: 'action', sequenceOrder: 1 },
    // H12 — first node to actually use requiredPermissionId, so
    // evaluateTransition's PERMISSION_DENIED branch (flow-engine/engine.ts)
    // finally runs against real data instead of only unit tests.
    { id: IDS.nodeDiagnosis, flowTemplateId: IDS.flowTemplate, name: 'Diagnosis', nodeType: 'action', sequenceOrder: 2, requiredPermissionId: IDS.permTicketDiagnose },
    { id: IDS.nodeApproval, flowTemplateId: IDS.flowTemplate, name: 'Waiting Approval', nodeType: 'decision', sequenceOrder: 3 },
    { id: IDS.nodeRepair, flowTemplateId: IDS.flowTemplate, name: 'Repair', nodeType: 'action', sequenceOrder: 4 },
    // No outgoing transitions below — the flow engine detects a terminal node
    // structurally (no rows in flow_transitions with this as fromNodeId), and
    // that is what closes a ticket. Keep it that way; do not name-match "Completion".
    { id: IDS.nodeCompletion, flowTemplateId: IDS.flowTemplate, name: 'Completion', nodeType: 'action', sequenceOrder: 5 },
  ]).onConflictDoNothing();

  await tx.insert(flowTransitions).values([
    { id: IDS.transIntakeToDiagnosis, fromNodeId: IDS.nodeIntake, toNodeId: IDS.nodeDiagnosis },
    { id: IDS.transDiagnosisToApproval, fromNodeId: IDS.nodeDiagnosis, toNodeId: IDS.nodeApproval },
    { id: IDS.transDiagnosisToRepair, fromNodeId: IDS.nodeDiagnosis, toNodeId: IDS.nodeRepair },
    { id: IDS.transApprovalToRepair, fromNodeId: IDS.nodeApproval, toNodeId: IDS.nodeRepair },
    { id: IDS.transApprovalToCompletion, fromNodeId: IDS.nodeApproval, toNodeId: IDS.nodeCompletion },
    { id: IDS.transRepairToCompletion, fromNodeId: IDS.nodeRepair, toNodeId: IDS.nodeCompletion },
  ]).onConflictDoNothing();

  // Tahap A (go-live gap Tier-1 #2, plan/tahap-a-flow-templates.md) — two new
  // service flow templates, added alongside "Standard Repair" above WITHOUT
  // touching it (its fixed node/transition IDs are hardcoded across several
  // existing tests). Neither is isDefault, so Standard Repair stays the sole
  // default template.
  await tx.insert(flowTemplates).values([
    { id: IDS.flowTemplateDitunggu, tenantId: IDS.tenantMain, name: 'Servis - Ditunggu', domain: 'service', isDefault: false },
    { id: IDS.flowTemplateDisimpan, tenantId: IDS.tenantMain, name: 'Servis - Disimpan', domain: 'service', isDefault: false },
  ]).onConflictDoNothing();

  await tx.insert(flowNodes).values([
    // Ditunggu — 7 nodes. Only Diagnosis carries requiredPermissionId, mirroring
    // Standard Repair's own pattern exactly (no new gating decisions here).
    { id: IDS.nodeDitungguIntake, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Intake', nodeType: 'action', sequenceOrder: 1 },
    { id: IDS.nodeDitungguDiagnosis, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Diagnosis', nodeType: 'action', sequenceOrder: 2, requiredPermissionId: IDS.permTicketDiagnose },
    { id: IDS.nodeDitungguApproval, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Menunggu Persetujuan', nodeType: 'decision', sequenceOrder: 3 },
    { id: IDS.nodeDitungguQcAwal, flowTemplateId: IDS.flowTemplateDitunggu, name: 'QC Awal', nodeType: 'action', sequenceOrder: 4 },
    { id: IDS.nodeDitungguRepair, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Pengerjaan', nodeType: 'action', sequenceOrder: 5 },
    { id: IDS.nodeDitungguQcAkhir, flowTemplateId: IDS.flowTemplateDitunggu, name: 'QC Akhir', nodeType: 'action', sequenceOrder: 6 },
    // No outgoing transitions — terminal node, closes the ticket structurally (see engine.ts).
    { id: IDS.nodeDitungguSelesai, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Selesai', nodeType: 'action', sequenceOrder: 7 },

    // Disimpan — same 7 nodes + "Unit Disimpan" inserted right after Diagnosis
    // (the plan's structural difference: unit ditinggal, tanda-terima dicetak
    // di sini nanti -- pemicu cetak is a separate task).
    { id: IDS.nodeDisimpanIntake, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Intake', nodeType: 'action', sequenceOrder: 1 },
    { id: IDS.nodeDisimpanDiagnosis, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Diagnosis', nodeType: 'action', sequenceOrder: 2, requiredPermissionId: IDS.permTicketDiagnose },
    { id: IDS.nodeDisimpanUnitDisimpan, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Unit Disimpan', nodeType: 'action', sequenceOrder: 3 },
    { id: IDS.nodeDisimpanApproval, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Menunggu Persetujuan', nodeType: 'decision', sequenceOrder: 4 },
    { id: IDS.nodeDisimpanQcAwal, flowTemplateId: IDS.flowTemplateDisimpan, name: 'QC Awal', nodeType: 'action', sequenceOrder: 5 },
    { id: IDS.nodeDisimpanRepair, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Pengerjaan', nodeType: 'action', sequenceOrder: 6 },
    { id: IDS.nodeDisimpanQcAkhir, flowTemplateId: IDS.flowTemplateDisimpan, name: 'QC Akhir', nodeType: 'action', sequenceOrder: 7 },
    { id: IDS.nodeDisimpanSelesai, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Selesai', nodeType: 'action', sequenceOrder: 8 },
  ]).onConflictDoNothing();

  await tx.insert(flowTransitions).values([
    // Ditunggu — linear chain + a shortcut from Approval straight to Selesai
    // (mirrors Standard Repair's transApprovalToCompletion: "ternyata tidak
    // ada kerusakan", close without repair/QC).
    { id: IDS.transDitungguIntakeToDiagnosis, fromNodeId: IDS.nodeDitungguIntake, toNodeId: IDS.nodeDitungguDiagnosis },
    { id: IDS.transDitungguDiagnosisToApproval, fromNodeId: IDS.nodeDitungguDiagnosis, toNodeId: IDS.nodeDitungguApproval },
    { id: IDS.transDitungguApprovalToQcAwal, fromNodeId: IDS.nodeDitungguApproval, toNodeId: IDS.nodeDitungguQcAwal },
    { id: IDS.transDitungguApprovalToSelesai, fromNodeId: IDS.nodeDitungguApproval, toNodeId: IDS.nodeDitungguSelesai },
    { id: IDS.transDitungguQcAwalToRepair, fromNodeId: IDS.nodeDitungguQcAwal, toNodeId: IDS.nodeDitungguRepair },
    { id: IDS.transDitungguRepairToQcAkhir, fromNodeId: IDS.nodeDitungguRepair, toNodeId: IDS.nodeDitungguQcAkhir },
    { id: IDS.transDitungguQcAkhirToSelesai, fromNodeId: IDS.nodeDitungguQcAkhir, toNodeId: IDS.nodeDitungguSelesai },

    // Disimpan — same shape with Unit Disimpan inserted after Diagnosis.
    { id: IDS.transDisimpanIntakeToDiagnosis, fromNodeId: IDS.nodeDisimpanIntake, toNodeId: IDS.nodeDisimpanDiagnosis },
    { id: IDS.transDisimpanDiagnosisToUnitDisimpan, fromNodeId: IDS.nodeDisimpanDiagnosis, toNodeId: IDS.nodeDisimpanUnitDisimpan },
    { id: IDS.transDisimpanUnitDisimpanToApproval, fromNodeId: IDS.nodeDisimpanUnitDisimpan, toNodeId: IDS.nodeDisimpanApproval },
    { id: IDS.transDisimpanApprovalToQcAwal, fromNodeId: IDS.nodeDisimpanApproval, toNodeId: IDS.nodeDisimpanQcAwal },
    { id: IDS.transDisimpanApprovalToSelesai, fromNodeId: IDS.nodeDisimpanApproval, toNodeId: IDS.nodeDisimpanSelesai },
    { id: IDS.transDisimpanQcAwalToRepair, fromNodeId: IDS.nodeDisimpanQcAwal, toNodeId: IDS.nodeDisimpanRepair },
    { id: IDS.transDisimpanRepairToQcAkhir, fromNodeId: IDS.nodeDisimpanRepair, toNodeId: IDS.nodeDisimpanQcAkhir },
    { id: IDS.transDisimpanQcAkhirToSelesai, fromNodeId: IDS.nodeDisimpanQcAkhir, toNodeId: IDS.nodeDisimpanSelesai },
  ]).onConflictDoNothing();

  // ---------------------------------------------------------------------------
  // Tahap B (2026-07-27) — template servis TUNGGAL yang bercabang.
  //
  // Alur nyata toko: kasir mencatat keluhan -> teknisi mendiagnosis dan menyebut
  // harga + lama pengerjaan -> BARU diputuskan unitnya ditunggu atau ditinggal.
  // Dua template terpisah (Ditunggu/Disimpan) memaksa keputusan itu diambil di
  // form intake, sebelum siapa pun tahu jawabannya. Template ini memindahkannya
  // ke tempat yang benar: percabangan setelah Diagnosis.
  //
  // Ini menjadi isDefault BARU; Standard Repair diturunkan (lihat catatan di
  // bawah) supaya resolusi "template default tenant" tetap tunggal & deterministik.
  // ---------------------------------------------------------------------------
  await tx.insert(flowTemplates).values([
    { id: IDS.flowTemplateServis, tenantId: IDS.tenantMain, name: 'Servis', domain: 'service', isDefault: true },
  ]).onConflictDoNothing();

  // Standard Repair tetap ada (tiket lama + test lama mengunci ID node-nya),
  // tapi tidak lagi default — hanya boleh ada SATU isDefault per tenant, kalau
  // tidak `templates.find(t => t.isDefault)` jadi tak deterministik (persis
  // risiko yang dicatat plan/tahap-a-flow-templates.md §2).
  await tx.update(flowTemplates)
    .set({ isDefault: false })
    .where(eq(flowTemplates.id, IDS.flowTemplate));

  // Kapabilitas per tahap (kolom Tahap B di flow_nodes) — INI yang membuat alur
  // servis benar-benar mengikuti template. Konfigurasi di bawah adalah kebijakan
  // DEFAULT toko pemilik, bukan aturan yang tertanam di kode: owner bebas
  // mengubahnya lewat editor alur (/flows) tanpa deploy ulang.
  //
  // Nama & keterangan tahap INTI diambil dari `modules/flow/backbone.ts` —
  // sumber yang sama dipakai saat owner membuat alur baru, supaya kalimatnya
  // tak pernah berselisih antara alur bawaan dan alur buatan sendiri.
  // Kapabilitasnya tetap ditulis di sini, TIDAK diturunkan: template ini sudah
  // memasang QC Akhir, jadi pembayaran ada di sana; alur baru (tanpa QC)
  // menaruhnya di Pengerjaan. Perbedaan itu disengaja.
  await tx.insert(flowNodes).values(([
    {
      id: IDS.nodeServisIntake, flowTemplateId: IDS.flowTemplateServis,
      name: backboneStage('intake').name, nodeType: 'action', sequenceOrder: 1,
      description: backboneStage('intake').description,
      // Kasir hanya mencatat nama/telepon/keluhan. Sparepart SENGAJA belum
      // boleh — unitnya memang belum didiagnosis (keluhan asli pemilik).
      // Label tercetak di sini untuk menandai unit + nomor antrian.
      stageKind: 'penerimaan',
      autoPrintDocuments: ['label'],
    },
    {
      id: IDS.nodeServisDiagnosis, flowTemplateId: IDS.flowTemplateServis,
      name: backboneStage('diagnosis').name, nodeType: 'action', sequenceOrder: 2,
      requiredPermissionId: IDS.permTicketDiagnose,
      description: backboneStage('diagnosis').description,
      // "Teknisi menginput diagnosa dan juga estimasi harga dan waktu."
      stageKind: 'pemeriksaan',
      autoPrintDocuments: [],
    },
    // Dua cabang sejajar (sequenceOrder sama) — keputusan kasir setelah teknisi
    // menyampaikan harga & estimasi waktu.
    {
      id: IDS.nodeServisDitunggu, flowTemplateId: IDS.flowTemplateServis,
      name: backboneStage('ditunggu').name, nodeType: 'action', sequenceOrder: 3,
      description: backboneStage('ditunggu').description,
      // Pelanggan menunggu di tempat: TIDAK ada nota di sini, notanya keluar
      // saat selesai.
      stageKind: 'pengerjaan',
      autoPrintDocuments: [],
    },
    {
      id: IDS.nodeServisDisimpan, flowTemplateId: IDS.flowTemplateServis,
      name: backboneStage('disimpan').name, nodeType: 'action', sequenceOrder: 3,
      description: backboneStage('disimpan').description,
      // Unit ditinggal: nota tanda terima + label, keduanya tercetak otomatis.
      stageKind: 'pengerjaan',
      autoPrintDocuments: ['tanda_terima', 'label'],
    },
    {
      id: IDS.nodeServisQcAwal, flowTemplateId: IDS.flowTemplateServis,
      name: 'QC Awal', nodeType: 'action', sequenceOrder: 4,
      description: 'Cek kondisi unit sebelum dibongkar (nyala/tidak, kelengkapan, kerusakan lain). Bukti awal bila nanti ada klaim dari pelanggan.',
      stageKind: 'pengerjaan',
      autoPrintDocuments: [],
      // Tahap TAMBAHAN: boleh dilepas/dipasang owner lewat editor diagram.
      // Tulang punggung alur (Intake -> Diagnosis -> cabang -> Pengerjaan ->
      // Selesai) tetap terkunci; QC memang yang dimaksud pemilik dengan
      // "konfigurasinya hanya menambahkan QC".
      isCore: false,
      // Contoh daftar periksa, BUKAN aturan: owner bebas menambah/mengurangi
      // barisnya lewat editor alur. Yang penting id-nya tetap, karena jawaban
      // tiket menunjuk id ini.
      checklistItems: [
        { id: IDS.qcAwalItemNyala, label: 'Unit menyala dan bisa masuk menu' },
        { id: IDS.qcAwalItemLayar, label: 'Kondisi layar (retak/dead pixel) dicatat' },
        { id: IDS.qcAwalItemFisik, label: 'Kondisi fisik & kelengkapan dicatat' },
        { id: IDS.qcAwalItemSandi, label: 'Sandi/pola dari pelanggan sudah dicatat' },
      ],
    },
    {
      id: IDS.nodeServisRepair, flowTemplateId: IDS.flowTemplateServis,
      name: backboneStage('pengerjaan').name, nodeType: 'action', sequenceOrder: 5,
      description: backboneStage('pengerjaan').description,
      // Temuan tambahan saat bongkar tetap bisa dicatat (change order, B1).
      stageKind: 'pengerjaan',
      autoPrintDocuments: [],
    },
    {
      id: IDS.nodeServisQcAkhir, flowTemplateId: IDS.flowTemplateServis,
      name: 'QC Akhir', nodeType: 'action', sequenceOrder: 6,
      description: 'Cek hasil perbaikan sebelum diserahkan (unit nyala, keluhan awal hilang), kembalikan sandi/pola ke pelanggan, lalu buat faktur & terima pembayaran.',
      // "Pembayaran di bagian akhir saja, ketika sudah selesai pengerjaan."
      stageKind: 'penagihan',
      autoPrintDocuments: [],
      isCore: false,
      checklistItems: [
        { id: IDS.qcAkhirItemKeluhan, label: 'Keluhan awal pelanggan sudah hilang' },
        { id: IDS.qcAkhirItemFungsi, label: 'Fungsi lain tetap normal (kamera, suara, tombol)' },
        { id: IDS.qcAkhirItemFisik, label: 'Tidak ada kerusakan baru pada fisik unit' },
        { id: IDS.qcAkhirItemSandi, label: 'Sandi/pola sudah dikembalikan ke pelanggan' },
      ],
    },
    {
      id: IDS.nodeServisSelesai, flowTemplateId: IDS.flowTemplateServis,
      name: backboneStage('selesai').name, nodeType: 'action', sequenceOrder: 7,
      description: backboneStage('selesai').description,
      stageKind: 'penutup',
      autoPrintDocuments: [],
    },
  ] as const).map(withCapabilities)).onConflictDoNothing();

  await tx.insert(flowTransitions).values([
    { id: IDS.transServisIntakeToDiagnosis, fromNodeId: IDS.nodeServisIntake, toNodeId: IDS.nodeServisDiagnosis },
    { id: IDS.transServisDiagnosisToDitunggu, fromNodeId: IDS.nodeServisDiagnosis, toNodeId: IDS.nodeServisDitunggu },
    { id: IDS.transServisDiagnosisToDisimpan, fromNodeId: IDS.nodeServisDiagnosis, toNodeId: IDS.nodeServisDisimpan },
    { id: IDS.transServisDiagnosisToSelesai, fromNodeId: IDS.nodeServisDiagnosis, toNodeId: IDS.nodeServisSelesai },
    // Kedua cabang menyatu kembali — pengerjaannya sama, yang beda hanya di mana
    // unitnya menunggu dan dokumen apa yang dicetak.
    { id: IDS.transServisDitungguToQcAwal, fromNodeId: IDS.nodeServisDitunggu, toNodeId: IDS.nodeServisQcAwal },
    { id: IDS.transServisDisimpanToQcAwal, fromNodeId: IDS.nodeServisDisimpan, toNodeId: IDS.nodeServisQcAwal },
    { id: IDS.transServisQcAwalToRepair, fromNodeId: IDS.nodeServisQcAwal, toNodeId: IDS.nodeServisRepair },
    { id: IDS.transServisRepairToQcAkhir, fromNodeId: IDS.nodeServisRepair, toNodeId: IDS.nodeServisQcAkhir },
    { id: IDS.transServisQcAkhirToSelesai, fromNodeId: IDS.nodeServisQcAkhir, toNodeId: IDS.nodeServisSelesai },
  ]).onConflictDoNothing();

  // Tiga template LAMA (Standard Repair / Servis - Ditunggu / Servis - Disimpan)
  // dibuat sebelum kolom kapabilitas ada, jadi semuanya akan default `false` —
  // artinya tiket lama tak bisa diisi biaya sama sekali. Diberi konfigurasi
  // yang setara dengan perilaku mereka SEBELUM Tahap B, supaya tiket yang
  // sedang berjalan tidak berubah aturannya di tengah jalan:
  //   - biaya boleh di semua tahap kecuali Intake,
  //   - faktur boleh di dua tahap terakhir,
  //   - tidak ada cetak otomatis (dulu memang selalu manual).
  for (const templateId of [IDS.flowTemplate, IDS.flowTemplateDitunggu, IDS.flowTemplateDisimpan]) {
    const nodes = await tx.select().from(flowNodes).where(eq(flowNodes.flowTemplateId, templateId));
    if (nodes.length === 0) continue;
    const maxOrder = Math.max(...nodes.map((n) => n.sequenceOrder));
    for (const node of nodes) {
      // S5 — perilaku lamanya dinyatakan dulu sebagai kapabilitas, lalu
      // DIPETAKAN ke jenis tahap; jenisnya yang disimpan, kapabilitasnya
      // diturunkan lagi darinya. Jadi baris lama pun tunduk pada satu sumber
      // kebenaran yang sama dengan alur baru — tak ada tiga boolean lepas yang
      // hanya hidup di sini.
      const legacy = {
        allowsCharges: node.sequenceOrder > 1,
        allowsInvoicing: node.sequenceOrder >= maxOrder - 1,
        requiresDiagnosis: node.name.toLowerCase().includes('diagnosis'),
      };
      const stageKind = stageKindFromCapabilities(legacy);
      await tx.update(flowNodes)
        .set({ stageKind, ...capabilitiesFor(stageKind) })
        .where(eq(flowNodes.id, node.id));
    }
  }
}
