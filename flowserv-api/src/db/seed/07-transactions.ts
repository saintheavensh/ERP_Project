import {
  purchaseOrders,
  purchaseOrderLines,
  supplierInvoices,
  serviceTickets,
  ticketStageHistory,
  stockBatches,
  stockMovements,
  posInvoices,
  posInvoiceLines,
  customerPayments,
  financeLedgerEntries,
} from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function seedTransactions(tx: SeedTx): Promise<void> {
  const now = Date.now();
  const twoDaysAgo = new Date(now - 2 * DAY_MS);
  const yesterday = new Date(now - 1 * DAY_MS);
  // Due date anchored to the invoice date (yesterday) + Supplier B's 30-day
  // term, not to "now" — otherwise it drifts a day off what the payment-term
  // calculation (4B.3) would itself produce.
  const dueDate = new Date(yesterday.getTime() + 30 * DAY_MS);

  // PO #1 — still 'ordered', not yet received. Exercises the goods-receiving
  // page (H track receiving flow) against a fresh order.
  await tx.insert(purchaseOrders).values({
    id: IDS.poOrdered,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    supplierId: IDS.supplierCash,
    poNumber: 'PO-SEED-0001',
    status: 'ordered',
    estimatedTotal: '2000000',
  }).onConflictDoNothing();

  await tx.insert(purchaseOrderLines).values({
    id: IDS.poOrderedLine,
    tenantId: IDS.tenantMain,
    purchaseOrderId: IDS.poOrdered,
    inventoryItemId: IDS.itemStokSatu,
    quantity: 10,
    receivedQuantity: 0,
    unitPrice: '200000',
  }).onConflictDoNothing();

  // PO #2 — fully 'completed' and invoiced on tempo terms, so the payables
  // page has something to show unpaid.
  await tx.insert(purchaseOrders).values({
    id: IDS.poCompleted,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    supplierId: IDS.supplierTempo,
    poNumber: 'PO-SEED-0002',
    status: 'completed',
    estimatedTotal: '3200000',
    actualTotal: '3300000',
    invoiceNumber: 'INV-SUP-0001',
    invoiceDate: yesterday,
    invoiceDueDate: dueDate,
  }).onConflictDoNothing();

  await tx.insert(purchaseOrderLines).values({
    id: IDS.poCompletedLine,
    tenantId: IDS.tenantMain,
    purchaseOrderId: IDS.poCompleted,
    inventoryItemId: IDS.itemLcdMultiBatch,
    quantity: 20,
    receivedQuantity: 20,
    unitPrice: '160000',
    actualUnitPrice: '165000',
  }).onConflictDoNothing();

  // Barang yang BENAR-BENAR masuk dari penerimaan PO di atas. Bentuknya sengaja
  // dibuat sama persis dengan yang dihasilkan routes/purchasing/receipts.ts
  // (purchaseOrderLineId terisi, movement referenceType 'purchase_order'),
  // supaya data seed tidak beda bentuk dari data hasil pemakaian aplikasi.
  //
  // Tanpa dua baris ini, PO berstatus 'completed' dengan receivedQuantity 20
  // sementara stoknya tidak pernah bertambah — inkonsistensi yang bikin
  // "beli 20, master produk cuma 10".
  await tx.insert(stockBatches).values({
    id: IDS.batchLcdPo,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    inventoryItemId: IDS.itemLcdMultiBatch,
    partBrandId: IDS.partBrandIncell,
    supplierId: IDS.supplierTempo,
    purchaseOrderLineId: IDS.poCompletedLine,
    unitCost: '165000', // actualUnitPrice, bukan unitPrice — ini harga yang betul-betul dibayar
    quantityReceived: 20,
    quantityRemaining: 20,
    receivedAt: yesterday,
  }).onConflictDoNothing();

  await tx.insert(stockMovements).values({
    id: IDS.movementLcdPo,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    inventoryItemId: IDS.itemLcdMultiBatch,
    stockBatchId: IDS.batchLcdPo,
    movementType: 'in',
    quantity: 20,
    referenceType: 'purchase_order',
    referenceId: IDS.poCompleted,
    createdAt: yesterday,
  }).onConflictDoNothing();

  await tx.insert(supplierInvoices).values({
    id: IDS.supplierInvoiceUnpaid,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    supplierId: IDS.supplierTempo,
    purchaseOrderId: IDS.poCompleted,
    invoiceNumber: 'INV-SUP-0001',
    status: 'unpaid',
    totalAmount: '3300000',
    amountPaid: '0',
    paymentMethod: 'tempo',
    invoiceDate: yesterday,
    dueDate: dueDate,
  }).onConflictDoNothing();

  // One ticket mid-flow (sitting at Diagnosis) — lets intake/transition/detail
  // pages be exercised immediately without creating a ticket by hand first.
  await tx.insert(serviceTickets).values({
    id: IDS.ticketInProgress,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    customerId: IDS.customerAndi,
    customerAssetId: IDS.assetAndiHp,
    flowTemplateId: IDS.flowTemplate,
    currentNodeId: IDS.nodeDiagnosis,
    status: 'open',
    createdAt: twoDaysAgo,
    // R1.8-T3 — nomor antrian ikut diisi. Endpoint intake SELALU mengisinya
    // (routes/tickets.ts), tapi seed menulis langsung ke tabel dan melewatinya,
    // jadi tiket contoh muncul dengan "-" di popup antrian. Pemilik sempat
    // mengira fiturnya belum ada (uji-R1.7 B2) — data contoh yang tidak
    // menyerupai data asli membuat orang menguji hal yang salah. Ini kedua
    // kalinya: di R1.5 kartu Piutang bernilai 0 karena seed tak pernah membuat
    // faktur POS.
    //
    // queueDate sengaja tanggal tiket ini dibuat (dua hari lalu), bukan hari
    // ini: penomorannya per hari, jadi tiket lama tidak boleh ikut menggeser
    // nomor antrian pelanggan yang datang hari ini.
    queueNumber: 1,
    queueDate: twoDaysAgo.toISOString().slice(0, 10),
  }).onConflictDoNothing();

  await tx.insert(ticketStageHistory).values([
    { id: IDS.ticketStageIntake, ticketId: IDS.ticketInProgress, nodeId: IDS.nodeIntake, actorId: IDS.userTechnician, notes: 'Tiket masuk dari seed', enteredAt: twoDaysAgo },
    { id: IDS.ticketStageDiagnosis, ticketId: IDS.ticketInProgress, nodeId: IDS.nodeDiagnosis, actorId: IDS.userTechnician, notes: 'Mulai diagnosis', enteredAt: yesterday },
  ]).onConflictDoNothing();

  // -------------------------------------------------------------------------
  // R1.6 — dua faktur POS yang BELUM lunas, supaya kartu "Piutang (AR)" di
  // Beranda punya isi.
  //
  // Kenapa keduanya hanya berisi JASA, tanpa suku cadang: baris 'part' akan
  // menuntut batch FIFO yang ikut berkurang, `stock_movements`, dan cache
  // `stock_levels` yang cocok. Salah sedikit, `GET /v1/inventory/reconciliation`
  // langsung melaporkan selisih — dan itu justru laporan yang dipakai untuk
  // memastikan tidak ada bug stok (PHASES.md, keputusan H4). Data contoh tidak
  // boleh mengotori alat pendeteksi bug.
  // -------------------------------------------------------------------------
  await tx.insert(posInvoices).values([
    {
      id: IDS.posInvoiceTempoUnpaid,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      invoiceNumber: 'INV-SEED-0001',
      customerName: 'Budi Santoso',
      customerId: IDS.customerBudi, // 'tempo' WAJIB punya pelanggan asli (check constraint di schema)
      subtotal: '450000',
      grandTotal: '450000',
      status: 'active',
      paymentStatus: 'unpaid',
      amountPaid: '0',
      paymentMethod: 'tempo',
      createdAt: twoDaysAgo,
      createdBy: IDS.userCashier,
    },
    {
      id: IDS.posInvoicePartial,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      invoiceNumber: 'INV-SEED-0002',
      customerName: 'Siti Rahayu',
      customerId: IDS.customerSiti,
      subtotal: '800000',
      grandTotal: '800000',
      status: 'active',
      paymentStatus: 'partial',
      amountPaid: '300000', // DP 300rb, sisa 500rb — menguji tampilan "sebagian"
      paymentMethod: 'tempo',
      createdAt: yesterday,
      createdBy: IDS.userCashier,
    },
    // R1.9-T2 — nota KEDUA milik Budi Santoso, supaya pengelompokan piutang per
    // pelanggan benar-benar bisa dilihat. Dua faktur di atas milik dua orang
    // berbeda, jadi sebelum baris ini setiap grup selalu berisi satu nota dan
    // fitur yang pemilik minta tak tampak apa-apa saat diuji. Jasa saja, alasan
    // sama dengan komentar di atas.
    {
      id: IDS.posInvoiceBudiKedua,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      invoiceNumber: 'INV-SEED-0003',
      customerName: 'Budi Santoso',
      customerId: IDS.customerBudi,
      subtotal: '275000',
      grandTotal: '275000',
      status: 'active',
      paymentStatus: 'unpaid',
      amountPaid: '0',
      paymentMethod: 'tempo',
      createdAt: yesterday,
      createdBy: IDS.userCashier,
    },
  ]).onConflictDoNothing();

  await tx.insert(posInvoiceLines).values([
    {
      id: IDS.posInvoiceTempoUnpaidLine,
      tenantId: IDS.tenantMain,
      posInvoiceId: IDS.posInvoiceTempoUnpaid,
      sourceType: 'labor',
      description: 'Jasa servis — ganti konektor pengisian',
      quantity: 1,
      unitPrice: '450000',
      subtotal: '450000',
    },
    {
      id: IDS.posInvoicePartialLine,
      tenantId: IDS.tenantMain,
      posInvoiceId: IDS.posInvoicePartial,
      sourceType: 'labor',
      description: 'Jasa servis — perbaikan mainboard',
      quantity: 1,
      unitPrice: '800000',
      subtotal: '800000',
    },
    {
      id: IDS.posInvoiceBudiKeduaLine,
      tenantId: IDS.tenantMain,
      posInvoiceId: IDS.posInvoiceBudiKedua,
      sourceType: 'labor',
      description: 'Jasa servis — ganti speaker',
      quantity: 1,
      unitPrice: '275000',
      subtotal: '275000',
    },
  ]).onConflictDoNothing();

  // Cicilan yang sudah masuk untuk faktur kedua. Tanpa baris ini, `amountPaid`
  // 300rb di atas tidak punya asal-usul, dan halaman riwayat pembayaran (H14)
  // akan tampak kosong padahal fakturnya bilang sudah dibayar sebagian.
  await tx.insert(customerPayments).values({
    id: IDS.posInvoicePartialPayment,
    tenantId: IDS.tenantMain,
    posInvoiceId: IDS.posInvoicePartial,
    amount: '300000',
    method: 'cash',
    paidAt: yesterday,
    createdBy: IDS.userCashier,
  }).onConflictDoNothing();

  // Pendapatan dicatat ke buku kas seperti yang dilakukan checkout sungguhan
  // (H11). Tanpa ini, Buku Kas dan Beranda akan saling bertentangan: satu
  // bilang ada penjualan, satunya bilang tidak ada pendapatan. Tidak ada baris
  // COGS karena tidak ada barang yang keluar — keduanya murni jasa.
  await tx.insert(financeLedgerEntries).values([
    {
      id: IDS.ledgerRevenueTempoUnpaid,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      entryType: 'revenue',
      amount: '450000',
      // 'pos_sale', BUKAN 'pos_invoice'. Keduanya dipakai di ledger.ts untuk
      // hal yang berbeda, dan hanya 'pos_sale' yang dihitung oleh
      // GET /v1/finance/ledger/reconcile. Percobaan pertama memakai
      // 'pos_invoice' dan membuat kedua faktur ini tampak belum dibukukan —
      // ketahuan dari tes e2e, bukan dari membaca ulang kode.
      referenceType: 'pos_sale',
      referenceId: IDS.posInvoiceTempoUnpaid,
      postedAt: twoDaysAgo,
    },
    {
      id: IDS.ledgerRevenuePartial,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      entryType: 'revenue',
      amount: '800000',
      // 'pos_sale', BUKAN 'pos_invoice'. Keduanya dipakai di ledger.ts untuk
      // hal yang berbeda, dan hanya 'pos_sale' yang dihitung oleh
      // GET /v1/finance/ledger/reconcile. Percobaan pertama memakai
      // 'pos_invoice' dan membuat kedua faktur ini tampak belum dibukukan —
      // ketahuan dari tes e2e, bukan dari membaca ulang kode.
      referenceType: 'pos_sale',
      referenceId: IDS.posInvoicePartial,
      postedAt: yesterday,
    },
    {
      id: IDS.ledgerRevenueBudiKedua,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      entryType: 'revenue',
      amount: '275000',
      // 'pos_sale' — lihat catatan di dua baris di atas. Melewatkan baris ini
      // akan membuat GET /v1/finance/ledger/reconcile melaporkan faktur ketiga
      // sebagai belum dibukukan, dan e2e H15 gagal dengan `isClean: false`.
      referenceType: 'pos_sale',
      referenceId: IDS.posInvoiceBudiKedua,
      postedAt: yesterday,
    },
  ]).onConflictDoNothing();
}
