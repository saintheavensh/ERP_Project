import { printerDevices, printerTemplates, printerAssignments } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';
import type { LayoutConfig } from '../../modules/printer/types';

// Detail increases with paper size (spec table) — each layoutConfig below is a
// deliberately different point on that scale, not just size-relabeled copies.
const layoutReceipt58: LayoutConfig = {
  header: { showStoreName: true, showAddress: false, showPhone: false, showLogo: false },
  items: { showLineSubtotal: false, showDescription: false },
  extra: { showCashierName: false, showTicketInfo: false, showSignature: false },
  footer: { note: null, warrantyPolicy: null },
};

const layoutReceipt80: LayoutConfig = {
  header: { showStoreName: true, showAddress: true, showPhone: true, showLogo: false },
  items: { showLineSubtotal: true, showDescription: false },
  extra: { showCashierName: true, showTicketInfo: false, showSignature: false },
  footer: { note: 'Garansi servis 7 hari untuk kerusakan yang sama.', warrantyPolicy: null },
};

const layoutInvoiceA4: LayoutConfig = {
  header: { showStoreName: true, showAddress: true, showPhone: true, showLogo: true },
  items: { showLineSubtotal: true, showDescription: true },
  extra: { showCashierName: true, showTicketInfo: true, showSignature: true },
  footer: {
    note: null,
    warrantyPolicy: 'Barang yang telah diperbaiki bergaransi 7 (tujuh) hari kalender sejak tanggal invoice ini untuk kerusakan yang sama. Garansi tidak berlaku untuk kerusakan akibat air, benturan fisik, atau kesalahan pemakaian setelah unit diterima kembali oleh pelanggan.',
  },
};

// Defined per plan Q2 but not yet wired to a print trigger anywhere in the FE.
const layoutLabelGaransi: LayoutConfig = {
  header: { showStoreName: true, showAddress: false, showPhone: false, showLogo: false },
  items: { showLineSubtotal: false, showDescription: false },
  extra: { showCashierName: false, showTicketInfo: false, showSignature: false },
  footer: { note: 'Garansi 7 hari', warrantyPolicy: null },
};

export async function seedPrinter(tx: SeedTx): Promise<void> {
  // Devices are per-branch (a physical printer sits in one place).
  await tx.insert(printerDevices).values([
    {
      id: IDS.devicePrinterThermalPusat,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      name: 'Epson TM-T82 - Kasir Pusat',
      connectionType: 'usb',
      connectionAddress: 'USB001',
      paperSize: '80mm',
    },
    {
      id: IDS.devicePrinterA4Pusat,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      name: 'Printer Kantor (OS) - Pusat',
      connectionType: 'os_printer',
      connectionAddress: null,
      paperSize: 'A4',
    },
    {
      id: IDS.devicePrinterThermalCabang,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchCabang,
      name: 'Epson TM-T20 - Kasir Cabang',
      connectionType: 'usb',
      connectionAddress: 'USB001',
      paperSize: '58mm',
    },
  ]).onConflictDoNothing();

  // Templates are tenant-wide (layout_config, not tied to one branch).
  await tx.insert(printerTemplates).values([
    {
      id: IDS.templatePrinterReceipt58,
      tenantId: IDS.tenantMain,
      name: 'Struk Default 58mm',
      documentType: 'receipt',
      paperSize: '58mm',
      layoutConfig: layoutReceipt58,
      isDefault: true,
    },
    {
      id: IDS.templatePrinterReceipt80,
      tenantId: IDS.tenantMain,
      name: 'Struk Default 80mm',
      documentType: 'receipt',
      paperSize: '80mm',
      layoutConfig: layoutReceipt80,
      isDefault: true,
    },
    {
      id: IDS.templatePrinterInvoiceA4,
      tenantId: IDS.tenantMain,
      name: 'Invoice Resmi A4',
      documentType: 'invoice_a4',
      paperSize: 'A4',
      layoutConfig: layoutInvoiceA4,
      isDefault: true,
    },
    {
      id: IDS.templatePrinterLabelGaransi,
      tenantId: IDS.tenantMain,
      name: 'Label Garansi 58mm',
      documentType: 'label',
      paperSize: '58mm',
      layoutConfig: layoutLabelGaransi,
      isDefault: true,
    },
  ]).onConflictDoNothing();

  // Assignments — deliberately asymmetric across branches: Cabang only gets a
  // receipt assignment, no invoice_a4 one. This is real seed data exercising
  // 6A.4's "no assignment for this branch+docType -> fall back to the
  // tenant's isDefault template" path, not just the happy path.
  await tx.insert(printerAssignments).values([
    {
      id: IDS.assignPrinterPusatReceipt,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      documentType: 'receipt',
      printerDeviceId: IDS.devicePrinterThermalPusat,
      printerTemplateId: IDS.templatePrinterReceipt80,
    },
    {
      id: IDS.assignPrinterPusatInvoiceA4,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      documentType: 'invoice_a4',
      printerDeviceId: IDS.devicePrinterA4Pusat,
      printerTemplateId: IDS.templatePrinterInvoiceA4,
    },
    {
      id: IDS.assignPrinterCabangReceipt,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchCabang,
      documentType: 'receipt',
      printerDeviceId: IDS.devicePrinterThermalCabang,
      printerTemplateId: IDS.templatePrinterReceipt58,
    },
  ]).onConflictDoNothing();
}
