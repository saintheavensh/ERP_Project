import { describe, it, expect } from 'vitest';
import { buildDocumentData, renderThermalBlocks, renderTicketThermalBlocks, truncate, padRow, formatMoney, THERMAL_CHAR_WIDTH } from '../render';
import type { LayoutConfig } from '../types';
import type { InvoiceBundle, ServiceTicketBundle } from '../render';

const bareLayout: LayoutConfig = {
  header: { showStoreName: true, showAddress: false, showPhone: false, showLogo: false },
  items: { showLineSubtotal: false, showDescription: false },
  extra: { showCashierName: false, showTicketInfo: false, showSignature: false },
  footer: { note: null, warrantyPolicy: null },
};

const fullLayout: LayoutConfig = {
  header: { showStoreName: true, showAddress: true, showPhone: true, showLogo: true },
  items: { showLineSubtotal: true, showDescription: true },
  extra: { showCashierName: true, showTicketInfo: true, showSignature: true },
  footer: { note: 'Garansi 7 hari', warrantyPolicy: 'Kebijakan garansi lengkap.' },
};

const bundle: InvoiceBundle = {
  invoiceNumber: 'INV-20260724-001',
  createdAt: '2026-07-24 10:00',
  storeName: 'Demo Service Center',
  branch: { name: 'Pusat', address: 'Jl. Sudirman No. 1, Jakarta', phone: '021-5551234' },
  customerName: 'Budi',
  cashierName: 'Sari',
  subtotal: 350000,
  discountAmount: 0,
  taxAmount: 0,
  grandTotal: 350000,
  lines: [{ description: 'LCD iPhone 11 Original', quantity: 1, unitPrice: 350000, subtotal: 350000 }],
  technicianName: 'Andi',
};

describe('padRow', () => {
  it('pads left+right to exactly `width` characters', () => {
    const row = padRow('TOTAL', '350.000', 32);
    expect(row.length).toBe(32);
    expect(row.startsWith('TOTAL')).toBe(true);
    expect(row.endsWith('350.000')).toBe(true);
  });

  it('truncates the left side when left+right would overflow the width', () => {
    const row = padRow('Nama Barang Yang Sangat Sangat Panjang Sekali', '99.000', 32);
    expect(row.length).toBe(32);
    expect(row.endsWith('99.000')).toBe(true);
  });
});

describe('truncate', () => {
  it('leaves short text untouched', () => {
    expect(truncate('LCD', 32)).toBe('LCD');
  });

  it('cuts long text and marks it with ".."', () => {
    const long = 'LCD iPhone 11 Pro Max Original Grade A Premium';
    const result = truncate(long, 20);
    expect(result.length).toBe(20);
    expect(result.endsWith('..')).toBe(true);
  });
});

describe('formatMoney', () => {
  it('formats with Indonesian-style thousands separators', () => {
    expect(formatMoney(350000)).toBe('350.000');
    expect(formatMoney(1500000)).toBe('1.500.000');
    expect(formatMoney(999)).toBe('999');
  });
});

describe('buildDocumentData — "detail increases with paper size" (data-inclusion)', () => {
  it('bare layout (58mm-shaped): omits address, phone, cashier, ticket info', () => {
    const doc = buildDocumentData('receipt', bareLayout, bundle);
    expect(doc.header.storeName).toBe('Demo Service Center');
    expect(doc.header.address).toBeUndefined();
    expect(doc.header.phone).toBeUndefined();
    expect(doc.extra.cashierName).toBeUndefined();
    expect(doc.extra.technicianName).toBeUndefined();
    expect(doc.display.showLineSubtotal).toBe(false);
  });

  it('full layout (A4-shaped): includes address, phone, cashier, and ticket info', () => {
    const doc = buildDocumentData('invoice_a4', fullLayout, bundle);
    expect(doc.header.address).toBe(bundle.branch.address);
    expect(doc.header.phone).toBe(bundle.branch.phone);
    expect(doc.extra.cashierName).toBe('Sari');
    expect(doc.extra.technicianName).toBe('Andi');
    expect(doc.display.showLogo).toBe(true);
    expect(doc.display.showSignature).toBe(true);
    expect(doc.footer.warrantyPolicy).toBe('Kebijakan garansi lengkap.');
  });

  it('never includes a transaction value the layoutConfig did not resolve from real data — values always come from the bundle, never the config', () => {
    const doc = buildDocumentData('receipt', fullLayout, bundle);
    expect(doc.totals.grandTotal).toBe(bundle.grandTotal);
    expect(doc.items[0].description).toBe(bundle.lines[0].description);
  });
});

describe('renderThermalBlocks — 58mm vs 80mm', () => {
  it('58mm: every text/row block fits within 32 characters', () => {
    const doc = buildDocumentData('receipt', bareLayout, bundle);
    const blocks = renderThermalBlocks('58mm', doc);
    for (const b of blocks) {
      if (b.type === 'text' || b.type === 'row' || b.type === 'total') {
        expect(b.value.length).toBeLessThanOrEqual(THERMAL_CHAR_WIDTH['58mm']);
      }
    }
  });

  it('80mm: every text/row block fits within 48 characters', () => {
    const doc = buildDocumentData('receipt', fullLayout, bundle);
    const blocks = renderThermalBlocks('80mm', doc);
    for (const b of blocks) {
      if (b.type === 'text' || b.type === 'row' || b.type === 'total') {
        expect(b.value.length).toBeLessThanOrEqual(THERMAL_CHAR_WIDTH['80mm']);
      }
    }
  });

  it('truncates a long item name on 58mm rather than overflowing the line', () => {
    const longBundle: InvoiceBundle = {
      ...bundle,
      lines: [{ description: 'LCD iPhone 11 Pro Max Original Grade A Premium Quality', quantity: 1, unitPrice: 350000, subtotal: 350000 }],
    };
    const doc = buildDocumentData('receipt', bareLayout, longBundle);
    const blocks = renderThermalBlocks('58mm', doc);
    const itemLine = blocks.find((b) => b.type === 'text' && b.value.startsWith('LCD'));
    expect(itemLine).toBeDefined();
    expect((itemLine as { value: string }).value.length).toBeLessThanOrEqual(32);
    expect((itemLine as { value: string }).value.endsWith('..')).toBe(true);
  });

  it('80mm with showLineSubtotal shows a padded row per item; 58mm without it shows plain qty x price text', () => {
    const doc80 = buildDocumentData('receipt', fullLayout, bundle);
    const blocks80 = renderThermalBlocks('80mm', doc80);
    expect(blocks80.some((b) => b.type === 'row' && b.value.includes('350.000'))).toBe(true);

    const doc58 = buildDocumentData('receipt', bareLayout, bundle);
    const blocks58 = renderThermalBlocks('58mm', doc58);
    const qtyPriceLine = blocks58.find((b) => b.type === 'text' && b.value.startsWith('1x'));
    expect(qtyPriceLine).toBeDefined();
  });

  it('the total row is always present and formatted as money', () => {
    const doc = buildDocumentData('receipt', bareLayout, bundle);
    const blocks = renderThermalBlocks('58mm', doc);
    const total = blocks.find((b) => b.type === 'total');
    expect(total).toBeDefined();
    expect((total as { value: string }).value).toContain('350.000');
  });

  it('a footer note only appears when the layout config sets one', () => {
    const withNote = renderThermalBlocks('80mm', buildDocumentData('receipt', fullLayout, bundle));
    expect(withNote.some((b) => b.type === 'text' && b.value.includes('Garansi'))).toBe(true);

    const withoutNote = renderThermalBlocks('58mm', buildDocumentData('receipt', bareLayout, bundle));
    expect(withoutNote.some((b) => b.type === 'text' && b.value.includes('Garansi'))).toBe(false);
  });

  it('ends every document with a cut block', () => {
    const blocks = renderThermalBlocks('58mm', buildDocumentData('receipt', bareLayout, bundle));
    expect(blocks[blocks.length - 1]).toEqual({ type: 'cut' });
  });
});

describe('renderTicketThermalBlocks (Tahap A — label + tanda_terima)', () => {
  const ticketBundleQuoted: ServiceTicketBundle = {
    createdAt: '2026-07-24 10:00',
    storeName: 'Demo Service Center',
    branch: { name: 'Pusat', address: 'Jl. Sudirman No. 1, Jakarta', phone: '021-5551234' },
    customerName: 'Budi',
    assetLabel: 'Smartphone Samsung Galaxy A54',
    reportedComplaint: 'Layar retak dan tidak bisa charge',
    unlockCode: '1234',
    serviceMode: 'disimpan',
    quotedAmount: 225000,
  };

  const ticketBundleUnquoted: ServiceTicketBundle = {
    ...ticketBundleQuoted,
    unlockCode: undefined,
    quotedAmount: undefined,
  };

  it('label never includes a price, even when one is available', () => {
    const blocks = renderTicketThermalBlocks('label', '58mm', ticketBundleQuoted);
    expect(blocks.some((b) => b.type === 'total')).toBe(false);
    expect(blocks.some((b) => b.type === 'text' && b.value.includes('225.000'))).toBe(false);
  });

  it('label includes nama, kerusakan, and tanggal masuk', () => {
    // 58mm (32 chars) truncates the long complaint text -- that's truncate()
    // doing its job, so assert on a prefix rather than the full string.
    const blocks = renderTicketThermalBlocks('label', '58mm', ticketBundleQuoted);
    const joined = blocks.map((b) => ('value' in b ? b.value : '')).join(' ');
    expect(joined).toContain('Budi');
    expect(joined).toContain('Layar retak');
    expect(joined).toContain('2026-07-24 10:00');

    // 80mm (48 chars) fits the complaint in full -- confirms it's truncation,
    // not the text being wrong/missing.
    const wideBlocks = renderTicketThermalBlocks('label', '80mm', ticketBundleQuoted);
    const wideJoined = wideBlocks.map((b) => ('value' in b ? b.value : '')).join(' ');
    expect(wideJoined).toContain('Layar retak dan tidak bisa charge');
  });

  it('tanda_terima includes the agreed price and unlock code', () => {
    const blocks = renderTicketThermalBlocks('tanda_terima', '58mm', ticketBundleQuoted);
    const total = blocks.find((b) => b.type === 'total');
    expect(total).toBeDefined();
    expect((total as { value: string }).value).toContain('225.000');
    expect(blocks.some((b) => b.type === 'text' && b.value.includes('1234'))).toBe(true);
  });

  it('tanda_terima before quotation shows a placeholder, not a fabricated price', () => {
    const blocks = renderTicketThermalBlocks('tanda_terima', '58mm', ticketBundleUnquoted);
    expect(blocks.some((b) => b.type === 'total')).toBe(false);
    expect(blocks.some((b) => b.type === 'text' && b.value.includes('menunggu diagnosa'))).toBe(true);
  });

  it('respects the 32/48-char width for each paper size', () => {
    const blocks58 = renderTicketThermalBlocks('tanda_terima', '58mm', ticketBundleQuoted);
    const total58 = blocks58.find((b) => b.type === 'total') as { value: string };
    expect(total58.value.length).toBe(32);

    const blocks80 = renderTicketThermalBlocks('tanda_terima', '80mm', ticketBundleQuoted);
    const total80 = blocks80.find((b) => b.type === 'total') as { value: string };
    expect(total80.value.length).toBe(48);
  });

  it('ends with a cut block', () => {
    const blocks = renderTicketThermalBlocks('label', '58mm', ticketBundleQuoted);
    expect(blocks[blocks.length - 1]).toEqual({ type: 'cut' });
  });
});
