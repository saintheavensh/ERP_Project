import { describe, it, expect } from 'vitest';
import { buildDocumentData, renderThermalBlocks, summarizeItems, truncate, padRow, formatMoney, THERMAL_CHAR_WIDTH } from '../render';
import type { LayoutConfig } from '../types';
import type { InvoiceBundle } from '../render';

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

describe('summarizeItems — Tahap A invoice display mode', () => {
  it('returns an empty array for no lines', () => {
    expect(summarizeItems([])).toEqual([]);
  });

  it('collapses multiple lines into one row summing their subtotals', () => {
    const items = [
      { description: 'LCD Samsung A10', quantity: 1, unitPrice: 220000, subtotal: 220000 },
      { description: 'Jasa Pasang LCD', quantity: 1, unitPrice: 50000, subtotal: 50000 },
    ];
    const summary = summarizeItems(items);
    expect(summary).toHaveLength(1);
    expect(summary[0].description).toBe('2 item/jasa');
    expect(summary[0].quantity).toBe(1);
    expect(summary[0].subtotal).toBe(270000);
    expect(summary[0].unitPrice).toBe(270000);
  });

  it('buildDocumentData always computes summaryItems alongside the full items array', () => {
    const doc = buildDocumentData('invoice_a4', fullLayout, bundle);
    expect(doc.items).toHaveLength(1);
    expect(doc.summaryItems).toEqual(summarizeItems(doc.items));
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
