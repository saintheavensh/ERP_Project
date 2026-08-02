import { describe, it, expect } from 'vitest';
import { buildLabelBlocks, buildTandaTerimaBlocks, type TicketDocumentBundle } from '../ticket-document';
import { passcodePrintLabel } from '../../../lib/passcode';
import type { LayoutConfig } from '../types';

const layout: LayoutConfig = {
  header: { showStoreName: true, showAddress: true, showPhone: false, showLogo: false },
  items: { showLineSubtotal: false, showDescription: false },
  extra: { showCashierName: false, showTicketInfo: false, showSignature: false },
  footer: { note: 'Garansi 7 hari', warrantyPolicy: null },
};

function bundle(overrides: Partial<TicketDocumentBundle> = {}): TicketDocumentBundle {
  return {
    storeName: 'Demo Service',
    branch: { name: 'Pusat', address: 'Jl. Sudirman No. 1' },
    customerName: 'Budi',
    customerPhone: '0812',
    assetDescription: 'Smartphone Samsung Galaxy A10',
    reportedComplaint: 'LCD pecah',
    intakeDate: '2026-07-25T03:00:00.000Z',
    ...overrides,
  };
}

const text = (blocks: { type: string; value?: string }[]) =>
  blocks.filter((b) => b.type === 'text').map((b) => b.value ?? '').join('\n');

describe('passcodePrintLabel', () => {
  it('formats a pattern as "Pola: ..."', () => {
    expect(passcodePrintLabel('pola:1-2-3-6-9')).toBe('Pola: 1-2-3-6-9');
  });
  it('formats a PIN as "Sandi: ..."', () => {
    expect(passcodePrintLabel('1234')).toBe('Sandi: 1234');
  });
  it('returns empty for blank/undefined', () => {
    expect(passcodePrintLabel('')).toBe('');
    expect(passcodePrintLabel(null)).toBe('');
    expect(passcodePrintLabel(undefined)).toBe('');
  });
});

describe('buildLabelBlocks — passcode for QC', () => {
  it('prints the pattern on the label so QC can unlock the unit', () => {
    const out = text(buildLabelBlocks(layout, bundle({ passcode: 'pola:1-2-3-6-9' }), 32));
    expect(out).toContain('Pola: 1-2-3-6-9');
  });

  it('prints a PIN on the label', () => {
    const out = text(buildLabelBlocks(layout, bundle({ passcode: '1234' }), 32));
    expect(out).toContain('Sandi: 1234');
  });

  it('omits the passcode line entirely when none was recorded', () => {
    const out = text(buildLabelBlocks(layout, bundle({ passcode: undefined }), 32));
    expect(out).not.toContain('Pola:');
    expect(out).not.toContain('Sandi:');
  });
});

describe('buildTandaTerimaBlocks — customer proof of receipt', () => {
  it('never prints the passcode (that belongs on the QC label, not the customer copy)', () => {
    const out = text(buildTandaTerimaBlocks(layout, bundle({ passcode: 'pola:1-2-3-6-9' }), 32));
    expect(out).not.toContain('Pola:');
    expect(out).not.toContain('Sandi:');
    expect(out).not.toContain('1-2-3-6-9');
  });

  // R1.8-T7 — perkiraan biaya kasir.
  it('mencetak perkiraan biaya beserta kata "Perkiraan", bukan angka telanjang', () => {
    const out = text(buildTandaTerimaBlocks(layout, bundle({ intakeEstimatedCostText: 'Rp 450.000' }), 32));
    expect(out).toContain('Perkiraan biaya: Rp 450.000');
    // Pelanggan memegang kertas ini. Angka tanpa penjelasan akan dibaca sebagai
    // harga pasti, lalu jadi perselisihan saat harga sebenarnya diketahui.
    expect(out).toContain('belum final');
  });

  it('tidak mencetak baris perkiraan bila kasir tidak menyebut harga', () => {
    const out = text(buildTandaTerimaBlocks(layout, bundle({ intakeEstimatedCostText: undefined }), 32));
    expect(out).not.toContain('Perkiraan biaya');
  });

  // Tanda terima BUKAN nota: tidak boleh ada baris TOTAL, karena angkanya
  // belum pernah melewati diagnosis apalagi disetujui pelanggan.
  it('tetap bukan nota — tak ada baris TOTAL walau perkiraan biaya diisi', () => {
    const blocks = buildTandaTerimaBlocks(layout, bundle({ intakeEstimatedCostText: 'Rp 450.000' }), 32);
    expect(blocks.some((b) => b.type === 'total')).toBe(false);
    expect(text(blocks)).not.toContain('TOTAL');
  });

  it('muat di kertas 58mm — tak ada baris yang melebihi 32 karakter', () => {
    const blocks = buildTandaTerimaBlocks(layout, bundle({ intakeEstimatedCostText: 'Rp 12.345.678' }), 32);
    for (const b of blocks) {
      if (b.type === 'text') expect((b.value ?? '').length).toBeLessThanOrEqual(32);
    }
  });
});
