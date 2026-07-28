import { describe, it, expect } from 'vitest';
import { renderTemplatePreview, SAMPLE_INVOICE_BUNDLE } from '../sample';
import { buildDocumentData, renderThermalBlocks, THERMAL_CHAR_WIDTH } from '../render';
import type { LayoutConfig } from '../types';

// Phase 7.2 — pratinjau template nota.
//
// Janji ke pemilik: "usahakan previewnya sama dengan kenyataannya". Yang diuji
// di sini persis janji itu — bukan "endpoint-nya mengembalikan sesuatu",
// melainkan bahwa hasil pratinjau IDENTIK dengan hasil mesin cetak sungguhan
// untuk layoutConfig yang sama, dan bahwa tiap sakelar benar-benar mengubahnya.

function config(overrides: Partial<{
  header: Partial<LayoutConfig['header']>;
  items: Partial<LayoutConfig['items']>;
  extra: Partial<LayoutConfig['extra']>;
  footer: Partial<LayoutConfig['footer']>;
}> = {}): LayoutConfig {
  return {
    header: { showStoreName: true, showAddress: false, showPhone: false, showLogo: false, ...overrides.header },
    items: { showLineSubtotal: false, showDescription: false, ...overrides.items },
    extra: { showCashierName: false, showTicketInfo: false, showSignature: false, ...overrides.extra },
    footer: { note: null, warrantyPolicy: null, ...overrides.footer },
  };
}

describe('renderTemplatePreview — pratinjau memakai mesin cetak yang sama', () => {
  it('menghasilkan blok yang identik dengan jalur cetak sungguhan', () => {
    // Ini inti klaimnya: bukan render kedua yang "mirip", tapi fungsi yang sama.
    // Kalau seseorang kelak menulis jalur pratinjau terpisah, tes ini gagal.
    const layout = config({ header: { showAddress: true, showPhone: true }, extra: { showCashierName: true } });

    const preview = renderTemplatePreview('receipt', '80mm', layout);
    const real = renderThermalBlocks('80mm', buildDocumentData('receipt', layout, SAMPLE_INVOICE_BUNDLE));

    expect(preview.blocks).toEqual(real);
  });

  it('A4 tidak menghasilkan blok thermal sama sekali (aturan spek 2)', () => {
    const preview = renderTemplatePreview('invoice_a4', 'A4', config());
    expect(preview.blocks).toBeUndefined();
    expect(preview.data?.items).toHaveLength(2);
  });

  it('tiap blok muat di lebar kertasnya', () => {
    for (const paper of ['58mm', '80mm'] as const) {
      const preview = renderTemplatePreview('receipt', paper, config({ header: { showAddress: true } }));
      for (const block of preview.blocks ?? []) {
        if (block.value) expect(block.value.length).toBeLessThanOrEqual(THERMAL_CHAR_WIDTH[paper]);
      }
    }
  });

  it('mematikan sebuah sakelar benar-benar mengubah hasilnya', () => {
    // Kalau contoh datanya terlalu polos, sakelar tak mengubah apa pun dan
    // pratinjau jadi tak berguna untuk mengambil keputusan.
    const withAddress = renderTemplatePreview('receipt', '80mm', config({ header: { showAddress: true } }));
    const without = renderTemplatePreview('receipt', '80mm', config({ header: { showAddress: false } }));

    const text = (p: typeof withAddress) => (p.blocks ?? []).map((b) => b.value ?? '').join('\n');
    expect(text(withAddress)).toContain('Jl. Contoh Raya');
    expect(text(without)).not.toContain('Jl. Contoh Raya');
  });

  it('catatan kaki yang diketik owner muncul di hasilnya', () => {
    const preview = renderTemplatePreview('receipt', '58mm', config({ footer: { note: 'Garansi 7 hari' } }));
    const text = (preview.blocks ?? []).map((b) => b.value ?? '').join('\n');
    expect(text).toContain('Garansi 7 hari');
  });

  it('label & tanda terima dirender lewat builder tiketnya sendiri, bukan bentuk struk', () => {
    // Keduanya bukan nota bernilai uang: memaksanya lewat jalur struk akan
    // mencetak "TOTAL Rp0" (lihat catatan di ticket-document.ts).
    const label = renderTemplatePreview('label', '58mm', config());
    const labelText = (label.blocks ?? []).map((b) => b.value ?? '').join('\n');
    expect(labelText).toContain('Budi Santoso');
    expect(labelText).not.toContain('TOTAL');

    const tandaTerima = renderTemplatePreview('tanda_terima', '80mm', config());
    const ttText = (tandaTerima.blocks ?? []).map((b) => b.value ?? '').join('\n');
    expect(ttText).toContain('Samsung Galaxy A10');
    expect(ttText).not.toContain('TOTAL');
  });

  it('label yang diminta A4 tetap dirender sebagai kertas kecil', () => {
    // Stiker tak pernah A4; meminta A4 tak boleh menghasilkan pratinjau kosong.
    const preview = renderTemplatePreview('label', 'A4', config());
    expect(preview.paperSize).toBe('80mm');
    expect(preview.blocks?.length ?? 0).toBeGreaterThan(0);
  });

  it('contoh datanya cukup lengkap untuk menilai setiap sakelar', () => {
    // Diskon, kembalian, kasir, teknisi — semuanya harus ada isinya, kalau
    // tidak ada sakelar yang efeknya tak pernah terlihat.
    expect(SAMPLE_INVOICE_BUNDLE.discountAmount).toBeGreaterThan(0);
    expect(SAMPLE_INVOICE_BUNDLE.amountTendered).toBeGreaterThan(SAMPLE_INVOICE_BUNDLE.grandTotal);
    expect(SAMPLE_INVOICE_BUNDLE.cashierName).toBeTruthy();
    expect(SAMPLE_INVOICE_BUNDLE.technicianName).toBeTruthy();
    expect(SAMPLE_INVOICE_BUNDLE.lines.length).toBeGreaterThan(1);
  });
});
