import { buildDocumentData, renderThermalBlocks, type InvoiceBundle } from './render';
import { buildLabelBlocks, buildTandaTerimaBlocks, type TicketDocumentBundle } from './ticket-document';
import type { DocumentType, PaperSize, LayoutConfig, DocumentData, ThermalBlock } from './types';

/**
 * Phase 7.2 — pratinjau template nota.
 *
 * Syarat yang diminta pemilik: "usahakan previewnya sama dengan kenyataannya".
 * Cara satu-satunya yang benar-benar menjamin itu adalah TIDAK menulis jalur
 * render kedua. Fungsi di bawah memanggil builder yang persis sama dengan yang
 * dipakai mencetak sungguhan (`buildDocumentData` + `renderThermalBlocks` untuk
 * struk/A4, `buildLabelBlocks`/`buildTandaTerimaBlocks` untuk label & tanda
 * terima) — yang berbeda hanya SUMBER DATANYA: contoh tetap di bawah ini,
 * bukan transaksi nyata.
 *
 * Datanya sengaja dibuat "lengkap": ada dua baris item, diskon, pajak, uang
 * tunai + kembalian, nama kasir dan teknisi. Kalau contohnya terlalu polos,
 * mematikan sebuah sakelar tidak mengubah apa pun di layar dan owner tak bisa
 * menilai efek pilihannya.
 */

export const SAMPLE_INVOICE_BUNDLE: InvoiceBundle = {
  invoiceNumber: 'INV-CONTOH-001',
  createdAt: '2026-07-28T09:30:00.000Z',
  storeName: 'Toko Servis Contoh',
  branch: {
    name: 'Pusat',
    address: 'Jl. Contoh Raya No. 12, Bandung',
    phone: '0812-3456-7890',
  },
  customerName: 'Budi Santoso',
  cashierName: 'Kasir Rina',
  technicianName: 'Teknisi Andi',
  subtotal: 485000,
  discountAmount: 15000,
  taxAmount: 0,
  grandTotal: 470000,
  amountTendered: 500000,
  lines: [
    { description: 'LCD Samsung A10 (ori)', quantity: 1, unitPrice: 385000, subtotal: 385000 },
    { description: 'Jasa pemasangan LCD', quantity: 1, unitPrice: 100000, subtotal: 100000 },
  ],
};

export const SAMPLE_TICKET_BUNDLE: TicketDocumentBundle = {
  storeName: 'Toko Servis Contoh',
  branch: { name: 'Pusat', address: 'Jl. Contoh Raya No. 12, Bandung' },
  customerName: 'Budi Santoso',
  customerPhone: '0812-3456-7890',
  assetDescription: 'Smartphone Samsung Galaxy A10',
  reportedComplaint: 'Layar pecah, sentuhan tidak berfungsi',
  intakeDate: '2026-07-28T09:30:00.000Z',
  passcode: '1234',
  queueNumber: 7,
  estimatedDurationText: '2 jam',
};

export interface TemplatePreview {
  documentType: DocumentType;
  paperSize: PaperSize;
  /** Terisi untuk A4 — komponen A4 membaca ini langsung (aturan spek 2). */
  data?: DocumentData;
  /** Terisi untuk kertas thermal — persis blok yang dikirim ke agen printer. */
  blocks?: ThermalBlock[];
}

/**
 * Render sebuah rancangan template (belum tentu tersimpan) memakai data contoh.
 *
 * `layoutConfig` diterima sebagai argumen, bukan dibaca dari DB, supaya owner
 * melihat hasil sakelar yang BARU saja diubah — sebelum menyimpannya.
 */
export function renderTemplatePreview(
  documentType: DocumentType,
  paperSize: PaperSize,
  layoutConfig: LayoutConfig
): TemplatePreview {
  if (documentType === 'label' || documentType === 'tanda_terima') {
    // Label & tanda terima tidak pernah A4 (bentuknya memang stiker/nota kecil);
    // lebar apa pun yang diminta dipetakan ke lebar thermal yang wajar.
    const thermalWidth = paperSize === '58mm' ? 32 : 48;
    const effective: PaperSize = paperSize === 'A4' ? '80mm' : paperSize;
    const blocks = documentType === 'label'
      ? buildLabelBlocks(layoutConfig, SAMPLE_TICKET_BUNDLE, thermalWidth)
      : buildTandaTerimaBlocks(layoutConfig, SAMPLE_TICKET_BUNDLE, thermalWidth);
    return { documentType, paperSize: effective, blocks };
  }

  const data = buildDocumentData(documentType, layoutConfig, SAMPLE_INVOICE_BUNDLE);
  if (paperSize === 'A4') return { documentType, paperSize, data };
  return { documentType, paperSize, data, blocks: renderThermalBlocks(paperSize, data) };
}
