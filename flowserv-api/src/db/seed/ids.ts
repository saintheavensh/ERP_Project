// Fixed UUIDs for every row the seed creates. Deterministic on purpose — see
// plan/H0-seed-and-reset.md: "Jangan pakai Math.random() untuk nilai apa pun."
// Every insert in seed/*.ts uses one of these as its primary key plus
// .onConflictDoNothing(), which is what makes `npm run db:reset` produce an
// identical result on every run, and what lets tests reference fixed rows
// (via SEED_IDS in index.ts) without querying for them first.
//
// The middle groups are fixed to `-0000-4xxx-8xxx-` (a valid v4/variant-8
// shape) rather than all-zero — several routes validate UUIDs with Zod's
// strict RFC 4122 pattern (version nibble 1-8, variant nibble 8/9/a/b), which
// an all-zero UUID fails. Only the first and last groups vary, so IDs stay
// recognizable by domain (first group) and index (last group).

export const IDS = {
  tenantMain: 'a0000000-0000-4000-8000-000000000001',
  tenantSecond: 'a0000000-0000-4000-8000-000000000002',

  branchPusat: 'b0000000-0000-4000-8000-000000000001',
  branchCabang: 'b0000000-0000-4000-8000-000000000002',
  branchSecond: 'b0000000-0000-4000-8000-000000000003',

  roleSuperAdmin: 'c0000000-0000-4000-8000-000000000001',
  roleManager: 'c0000000-0000-4000-8000-000000000002',
  roleTechnician: 'c0000000-0000-4000-8000-000000000003',
  roleCashier: 'c0000000-0000-4000-8000-000000000004',
  roleSecondAdmin: 'c0000000-0000-4000-8000-000000000005',

  permTicketCreate: 'd1000000-0000-4000-8000-000000000001',
  permTicketDiagnose: 'd1000000-0000-4000-8000-000000000002',
  permTicketApproveQuote: 'd1000000-0000-4000-8000-000000000003',
  permInventoryReserve: 'd1000000-0000-4000-8000-000000000004',
  permInventoryAdjust: 'd1000000-0000-4000-8000-000000000005',
  permPosPayment: 'd1000000-0000-4000-8000-000000000006',
  permPosVoid: 'd1000000-0000-4000-8000-000000000007',
  permFinanceRefund: 'd1000000-0000-4000-8000-000000000008',
  permFinanceReports: 'd1000000-0000-4000-8000-000000000009',
  permFlowConfigure: 'd1000000-0000-4000-8000-000000000010',

  // H12 — coarse, resource-level codes added to cover the ~37 mutating route
  // handlers that had no permission code at all (everything above this line
  // predates H12 and maps to the spec's 10-action matrix).
  permTicketAssignTechnician: 'd1000000-0000-4000-8000-000000000011',
  permTicketManageCharges: 'd1000000-0000-4000-8000-000000000012',
  permInventoryManageItems: 'd1000000-0000-4000-8000-000000000013',
  permInventoryReceiveStock: 'd1000000-0000-4000-8000-000000000014',
  permFinanceRecordPayment: 'd1000000-0000-4000-8000-000000000015',
  permCatalogManage: 'd1000000-0000-4000-8000-000000000016',
  permCustomerManage: 'd1000000-0000-4000-8000-000000000017',
  permSupplierManage: 'd1000000-0000-4000-8000-000000000018',
  permPurchasingManageOrders: 'd1000000-0000-4000-8000-000000000019',
  permPurchasingManageInvoices: 'd1000000-0000-4000-8000-000000000020',
  // H13 — admin-only audit log viewer.
  permAuditView: 'd1000000-0000-4000-8000-000000000021',
  // F3 — cancel a service ticket (SVC-013).
  permTicketCancel: 'd1000000-0000-4000-8000-000000000022',
  // P9 — Settings CRUD (5.10). Admin-only per specification/features/13-settings.md
  // (SET-001 "Admin access only"; SET-002/003/004 "Admin manages") — deliberately
  // NOT granted to Manager below, same pattern as permAuditView.
  permBranchManage: 'd1000000-0000-4000-8000-000000000023',
  permUserManage: 'd1000000-0000-4000-8000-000000000024',
  permSettingsManageCompany: 'd1000000-0000-4000-8000-000000000025',
  // Phase 6 (6A.1) — printer device/template/assignment CRUD. Admin-only,
  // same pattern as permAuditView/permBranchManage.
  permPrinterManage: 'd1000000-0000-4000-8000-000000000026',
  permFlowManage: 'd1000000-0000-4000-8000-000000000029',
  // Mengisi daftar periksa (QC) sebuah tiket. Dipisah dari ticket.diagnose:
  // yang memeriksa hasil kerja belum tentu yang mendiagnosis, dan di banyak
  // toko QC akhir justru dilakukan orang lain sebagai kontrol.
  permTicketQc: 'd1000000-0000-4000-8000-000000000030',

  // Item daftar periksa QC bawaan. Id-nya tetap karena jawaban tiket menunjuk
  // ke sini; kalimatnya boleh diubah owner kapan saja tanpa memutus jawaban.
  qcAwalItemNyala: 'd2000000-0000-4000-8000-000000000001',
  qcAwalItemLayar: 'd2000000-0000-4000-8000-000000000002',
  qcAwalItemFisik: 'd2000000-0000-4000-8000-000000000003',
  qcAwalItemSandi: 'd2000000-0000-4000-8000-000000000004',
  qcAkhirItemKeluhan: 'd2000000-0000-4000-8000-000000000011',
  qcAkhirItemFungsi: 'd2000000-0000-4000-8000-000000000012',
  qcAkhirItemFisik: 'd2000000-0000-4000-8000-000000000013',
  qcAkhirItemSandi: 'd2000000-0000-4000-8000-000000000014',
  // Tahap A (go-live gap Tier-1 #4) — payment-method CRUD. Admin-only, NOT
  // granted to Manager (same pattern as permBranchManage). GET stays open to
  // any authenticated user because the POS checkout reads the list.
  permPaymentManage: 'd1000000-0000-4000-8000-000000000027',
  // D2 (go-live tahap-B) — apply a POS/service discount. Granted to Manager +
  // Super Admin, NOT Cashier: the pilot rule is "only a manager may discount".
  // Enforced only when discountAmount > 0 (a zero-discount sale needs no grant).
  permPosApplyDiscount: 'd1000000-0000-4000-8000-000000000028',

  userSuperAdmin: 'e0000000-0000-4000-8000-000000000001',
  userManager: 'e0000000-0000-4000-8000-000000000002',
  userTechnician: 'e0000000-0000-4000-8000-000000000003',
  userCashier: 'e0000000-0000-4000-8000-000000000004',
  userSecondAdmin: 'e0000000-0000-4000-8000-000000000005',
  // R1.6 — teknisi kedua. Pemilik (uji-R1.5 E5): "buatlah seednya jadi
  // teknisinya ada dua sehingga saya tidak perlu tambah tambah lagi di bagian
  // settings". Diperlukan untuk menguji bahwa tiket yang sudah diambil teknisi
  // A tidak lagi muncul di antrian teknisi B (poin B6 uji R1).
  userTechnician2: 'e0000000-0000-4000-8000-000000000006',

  assignSuperAdmin: 'f0000000-0000-4000-8000-000000000001',
  assignManager: 'f0000000-0000-4000-8000-000000000002',
  assignTechnician: 'f0000000-0000-4000-8000-000000000003',
  assignCashier: 'f0000000-0000-4000-8000-000000000004',
  assignSecondAdmin: 'f0000000-0000-4000-8000-000000000005',
  assignTechnician2: 'f0000000-0000-4000-8000-000000000006',

  deviceBrandSamsung: '10000000-0000-4000-8000-000000000001',
  deviceModelA10: '10000000-0000-4000-8000-000000000002',
  deviceBrandAsus: '10000000-0000-4000-8000-000000000003',
  deviceModelAsusX: '10000000-0000-4000-8000-000000000004',
  deviceBrandXiaomi: '10000000-0000-4000-8000-000000000005',
  deviceModelRedmi9: '10000000-0000-4000-8000-000000000006',
  deviceBrandOppo: '10000000-0000-4000-8000-000000000007',
  deviceModelA3s: '10000000-0000-4000-8000-000000000008',
  deviceBrandApple: '10000000-0000-4000-8000-000000000009',
  deviceModelIphoneX: '10000000-0000-4000-8000-000000000010',

  categoryLcd: '20000000-0000-4000-8000-000000000001',
  categoryBattery: '20000000-0000-4000-8000-000000000002',

  // Merk SPAREPART (bukan merk HP) — menentukan kualitas/harga, bukan kompatibilitas.
  partBrandIncell: '11000000-0000-4000-8000-000000000001',
  partBrandMegaScreen: '11000000-0000-4000-8000-000000000002',
  partBrandOem: '11000000-0000-4000-8000-000000000003',

  itemLcdMultiBatch: '30000000-0000-4000-8000-000000000001',
  itemStokSatu: '30000000-0000-4000-8000-000000000002',

  supplierCash: '40000000-0000-4000-8000-000000000001',
  supplierTempo: '40000000-0000-4000-8000-000000000002',

  // Supplier -> merk sparepart yang dia jual. Form pembelian membaca ini untuk
  // membatasi pilihan merk setelah supplier dipilih.
  supplierBrandCashIncell: '41000000-0000-4000-8000-000000000001',
  supplierBrandCashOem: '41000000-0000-4000-8000-000000000002',
  supplierBrandTempoMega: '41000000-0000-4000-8000-000000000003',
  supplierBrandTempoIncell: '41000000-0000-4000-8000-000000000004',

  // Item -> supplier (many-to-many, is_primary menandai supplier utama).
  productSupplierLcdCash: '42000000-0000-4000-8000-000000000001',
  productSupplierLcdTempo: '42000000-0000-4000-8000-000000000002',
  productSupplierBatCash: '42000000-0000-4000-8000-000000000003',

  // Harga jual per merk untuk satu SKU yang sama.
  itemBrandPriceLcdIncell: '43000000-0000-4000-8000-000000000001',
  itemBrandPriceLcdMega: '43000000-0000-4000-8000-000000000002',
  itemBrandPriceBatOem: '43000000-0000-4000-8000-000000000003',

  batchLcdOld: '50000000-0000-4000-8000-000000000001',
  batchLcdNew: '50000000-0000-4000-8000-000000000002',
  batchStokSatu: '50000000-0000-4000-8000-000000000003',
  batchLcdPo: '50000000-0000-4000-8000-000000000004',

  movementLcdOld: '60000000-0000-4000-8000-000000000001',
  movementLcdNew: '60000000-0000-4000-8000-000000000002',
  movementStokSatu: '60000000-0000-4000-8000-000000000003',
  movementLcdPo: '60000000-0000-4000-8000-000000000004',

  levelLcd: '70000000-0000-4000-8000-000000000001',
  levelStokSatu: '70000000-0000-4000-8000-000000000002',

  flowTemplate: '80000000-0000-4000-8000-000000000001',
  nodeIntake: '80000000-0000-4000-8000-000000000002',
  nodeDiagnosis: '80000000-0000-4000-8000-000000000003',
  nodeApproval: '80000000-0000-4000-8000-000000000004',
  nodeRepair: '80000000-0000-4000-8000-000000000005',
  nodeCompletion: '80000000-0000-4000-8000-000000000006',

  transIntakeToDiagnosis: '81000000-0000-4000-8000-000000000001',
  transDiagnosisToApproval: '81000000-0000-4000-8000-000000000002',
  transDiagnosisToRepair: '81000000-0000-4000-8000-000000000003',
  transApprovalToRepair: '81000000-0000-4000-8000-000000000004',
  transApprovalToCompletion: '81000000-0000-4000-8000-000000000005',
  transRepairToCompletion: '81000000-0000-4000-8000-000000000006',

  customerBudi: '90000000-0000-4000-8000-000000000001',
  assetBudiHp: '90000000-0000-4000-8000-000000000002',
  customerSiti: '90000000-0000-4000-8000-000000000003',
  assetSitiLaptop: '90000000-0000-4000-8000-000000000004',
  customerAndi: '90000000-0000-4000-8000-000000000005',
  assetAndiHp: '90000000-0000-4000-8000-000000000006',
  customerDewi: '90000000-0000-4000-8000-000000000007',
  assetDewiHp: '90000000-0000-4000-8000-000000000008',

  poOrdered: 'a1000000-0000-4000-8000-000000000001',
  poOrderedLine: 'a1000000-0000-4000-8000-000000000002',
  poCompleted: 'a1000000-0000-4000-8000-000000000003',
  poCompletedLine: 'a1000000-0000-4000-8000-000000000004',
  supplierInvoiceUnpaid: 'a1000000-0000-4000-8000-000000000005',

  // R1.6 — piutang pelanggan (AR). Pemilik menguji kartu "Piutang" di Beranda
  // kasir dan mendapat 0 (uji-R1.5 A6); ternyata seed tidak pernah membuat SATU
  // PUN faktur POS, jadi kartu itu memang selalu 0 untuk semua peran — bukan
  // gerbang izinnya yang salah. Dua faktur di bawah membuatnya bisa diuji.
  posInvoiceTempoUnpaid: 'a2000000-0000-4000-8000-000000000001',
  posInvoiceTempoUnpaidLine: 'a2000000-0000-4000-8000-000000000002',
  posInvoicePartial: 'a2000000-0000-4000-8000-000000000003',
  posInvoicePartialLine: 'a2000000-0000-4000-8000-000000000004',
  posInvoicePartialPayment: 'a2000000-0000-4000-8000-000000000005',
  ledgerRevenueTempoUnpaid: 'a2000000-0000-4000-8000-000000000006',
  ledgerRevenuePartial: 'a2000000-0000-4000-8000-000000000007',
  ticketInProgress: 'a1000000-0000-4000-8000-000000000006',
  ticketStageIntake: 'a1000000-0000-4000-8000-000000000007',
  ticketStageDiagnosis: 'a1000000-0000-4000-8000-000000000008',

  // Phase 6 (6A.1) — printer devices are per-branch (physical printer);
  // templates are tenant-wide (document_type + paper_size layout);
  // assignments tie one branch's document_type to one device + one template.
  devicePrinterThermalPusat: 'b1000000-0000-4000-8000-000000000001',
  devicePrinterA4Pusat: 'b1000000-0000-4000-8000-000000000002',
  devicePrinterThermalCabang: 'b1000000-0000-4000-8000-000000000003',

  templatePrinterReceipt58: 'b2000000-0000-4000-8000-000000000001',
  templatePrinterReceipt80: 'b2000000-0000-4000-8000-000000000002',
  templatePrinterInvoiceA4: 'b2000000-0000-4000-8000-000000000003',
  // Defined per plan Q2, wired to a print trigger by Tahap A (go-live gap Tier-1 #3).
  templatePrinterLabelGaransi: 'b2000000-0000-4000-8000-000000000004',
  // Tahap A — new document type, thermal-only (80mm) for MVP.
  templatePrinterTandaTerima: 'b2000000-0000-4000-8000-000000000005',

  assignPrinterPusatReceipt: 'b3000000-0000-4000-8000-000000000001',
  assignPrinterPusatInvoiceA4: 'b3000000-0000-4000-8000-000000000002',
  // Deliberately the only assignment for branchCabang — proves 6A.4's
  // "no assignment for this branch+docType -> fall back to the tenant
  // default template" path against real seed data (Cabang has no invoice_a4
  // assignment at all).
  assignPrinterCabangReceipt: 'b3000000-0000-4000-8000-000000000003',

  // Tahap A (go-live gap Tier-1 #4) — payment methods. `type` is the finite
  // category (cash/transfer/qris/ewallet/tempo); `name` is the specific brand.
  // Three e-wallets share type 'ewallet' on purpose — the POS radio binds on
  // id (not type), so Dana/OVO/GoPay each render as a distinct, selectable option.
  paymentTunai: 'b4000000-0000-4000-8000-000000000001',
  paymentTransfer: 'b4000000-0000-4000-8000-000000000002',
  paymentQris: 'b4000000-0000-4000-8000-000000000003',
  paymentDana: 'b4000000-0000-4000-8000-000000000004',
  paymentOvo: 'b4000000-0000-4000-8000-000000000005',
  paymentGopay: 'b4000000-0000-4000-8000-000000000006',
  paymentTempo: 'b4000000-0000-4000-8000-000000000007',
  // Second tenant — a minimal set so its POS isn't empty either.
  paymentSecondTunai: 'b4000000-0000-4000-8000-000000000008',
  paymentSecondQris: 'b4000000-0000-4000-8000-000000000009',

  // Tahap A (go-live gap Tier-1 #2) — two new service flow templates
  // (Ditunggu/Disimpan), added alongside the existing "Standard Repair"
  // WITHOUT touching it (see plan/tahap-a-flow-templates.md §2 — Standard
  // Repair's fixed node/transition IDs are hardcoded across several existing
  // tests). Neither new template is isDefault — Standard Repair stays the
  // sole default so the Kanban board's default-template resolution is
  // unaffected by adding these rows.
  flowTemplateDitunggu: '84000000-0000-4000-8000-000000000001',
  flowTemplateDisimpan: '84000000-0000-4000-8000-000000000002',

  nodeDitungguIntake: '85000000-0000-4000-8000-000000000001',
  nodeDitungguDiagnosis: '85000000-0000-4000-8000-000000000002',
  nodeDitungguApproval: '85000000-0000-4000-8000-000000000003',
  nodeDitungguQcAwal: '85000000-0000-4000-8000-000000000004',
  nodeDitungguRepair: '85000000-0000-4000-8000-000000000005',
  nodeDitungguQcAkhir: '85000000-0000-4000-8000-000000000006',
  nodeDitungguSelesai: '85000000-0000-4000-8000-000000000007',

  nodeDisimpanIntake: '85000000-0000-4000-8000-000000000008',
  nodeDisimpanDiagnosis: '85000000-0000-4000-8000-000000000009',
  nodeDisimpanUnitDisimpan: '85000000-0000-4000-8000-000000000010',
  nodeDisimpanApproval: '85000000-0000-4000-8000-000000000011',
  nodeDisimpanQcAwal: '85000000-0000-4000-8000-000000000012',
  nodeDisimpanRepair: '85000000-0000-4000-8000-000000000013',
  nodeDisimpanQcAkhir: '85000000-0000-4000-8000-000000000014',
  nodeDisimpanSelesai: '85000000-0000-4000-8000-000000000015',

  // Ditunggu: linear chain + one shortcut (Approval -> Selesai, mirrors the
  // existing transApprovalToCompletion on Standard Repair for the
  // "ternyata tidak ada kerusakan" case).
  transDitungguIntakeToDiagnosis: '86000000-0000-4000-8000-000000000001',
  transDitungguDiagnosisToApproval: '86000000-0000-4000-8000-000000000002',
  transDitungguApprovalToQcAwal: '86000000-0000-4000-8000-000000000003',
  transDitungguApprovalToSelesai: '86000000-0000-4000-8000-000000000004',
  transDitungguQcAwalToRepair: '86000000-0000-4000-8000-000000000005',
  transDitungguRepairToQcAkhir: '86000000-0000-4000-8000-000000000006',
  transDitungguQcAkhirToSelesai: '86000000-0000-4000-8000-000000000007',

  // Disimpan: same shape with Unit Disimpan inserted after Diagnosis.
  transDisimpanIntakeToDiagnosis: '86000000-0000-4000-8000-000000000008',
  transDisimpanDiagnosisToUnitDisimpan: '86000000-0000-4000-8000-000000000009',
  transDisimpanUnitDisimpanToApproval: '86000000-0000-4000-8000-000000000010',
  transDisimpanApprovalToQcAwal: '86000000-0000-4000-8000-000000000011',
  transDisimpanApprovalToSelesai: '86000000-0000-4000-8000-000000000012',
  transDisimpanQcAwalToRepair: '86000000-0000-4000-8000-000000000013',
  transDisimpanRepairToQcAkhir: '86000000-0000-4000-8000-000000000014',
  transDisimpanQcAkhirToSelesai: '86000000-0000-4000-8000-000000000015',

  // Tahap B (2026-07-27) — template servis TUNGGAL yang bercabang setelah
  // Diagnosis, menggantikan keharusan memilih Ditunggu/Disimpan di form intake.
  // Ini bentuk yang sebenarnya dijalankan toko: kasir baru bisa memutuskan
  // "ditunggu atau ditinggal" SETELAH teknisi mendiagnosis dan menyebut harga
  // serta lama pengerjaan. Jadi default baru (isDefault), tiga template lama
  // dibiarkan apa adanya untuk tiket yang sudah berjalan + test yang mengunci
  // ID node-nya.
  flowTemplateServis: '84000000-0000-4000-8000-000000000003',

  nodeServisIntake: '85000000-0000-4000-8000-000000000016',
  nodeServisDiagnosis: '85000000-0000-4000-8000-000000000017',
  nodeServisDitunggu: '85000000-0000-4000-8000-000000000018',
  nodeServisDisimpan: '85000000-0000-4000-8000-000000000019',
  nodeServisQcAwal: '85000000-0000-4000-8000-000000000020',
  nodeServisRepair: '85000000-0000-4000-8000-000000000021',
  nodeServisQcAkhir: '85000000-0000-4000-8000-000000000022',
  nodeServisSelesai: '85000000-0000-4000-8000-000000000023',

  transServisIntakeToDiagnosis: '86000000-0000-4000-8000-000000000016',
  // Percabangan pasca-diagnosis: ini "tiga kemungkinan" milik pemilik —
  // Ditunggu / Disimpan / (batal lewat tombol Batalkan Tiket yang sudah ada,
  // bukan node tersendiri, supaya tidak menduplikasi SVC-013/F3).
  transServisDiagnosisToDitunggu: '86000000-0000-4000-8000-000000000017',
  transServisDiagnosisToDisimpan: '86000000-0000-4000-8000-000000000018',
  // Pintas "ternyata tidak ada kerusakan" — tutup tanpa bongkar.
  transServisDiagnosisToSelesai: '86000000-0000-4000-8000-000000000019',
  transServisDitungguToQcAwal: '86000000-0000-4000-8000-000000000020',
  transServisDisimpanToQcAwal: '86000000-0000-4000-8000-000000000021',
  transServisQcAwalToRepair: '86000000-0000-4000-8000-000000000022',
  transServisRepairToQcAkhir: '86000000-0000-4000-8000-000000000023',
  transServisQcAkhirToSelesai: '86000000-0000-4000-8000-000000000024',
} as const;
