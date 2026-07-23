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

  userSuperAdmin: 'e0000000-0000-4000-8000-000000000001',
  userManager: 'e0000000-0000-4000-8000-000000000002',
  userTechnician: 'e0000000-0000-4000-8000-000000000003',
  userCashier: 'e0000000-0000-4000-8000-000000000004',
  userSecondAdmin: 'e0000000-0000-4000-8000-000000000005',

  assignSuperAdmin: 'f0000000-0000-4000-8000-000000000001',
  assignManager: 'f0000000-0000-4000-8000-000000000002',
  assignTechnician: 'f0000000-0000-4000-8000-000000000003',
  assignCashier: 'f0000000-0000-4000-8000-000000000004',
  assignSecondAdmin: 'f0000000-0000-4000-8000-000000000005',

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
  ticketInProgress: 'a1000000-0000-4000-8000-000000000006',
  ticketStageIntake: 'a1000000-0000-4000-8000-000000000007',
  ticketStageDiagnosis: 'a1000000-0000-4000-8000-000000000008',
} as const;
