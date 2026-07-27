import { describe, it, expect } from 'vitest';
import { validateFlowDesign } from '../service';
import type { FlowDesignInput } from '../types';

// Tahap B / Phase 7.1 — aturan bentuk graf alur. Ini bukan validasi kosmetik:
// alur yang rusak langsung menghentikan tiket yang sedang berjalan, jadi tiap
// aturan di sini punya konsekuensi operasional nyata.

function node(key: string, name = key): FlowDesignInput['nodes'][number] {
  return {
    key,
    name,
    nodeType: 'action',
    allowsCharges: false,
    requiresDiagnosis: false,
    allowsInvoicing: false,
    autoPrintDocuments: [],
  };
}

const codes = (input: FlowDesignInput) => validateFlowDesign(input).map((i) => i.code);

describe('validateFlowDesign', () => {
  it('menerima alur lurus yang sehat', () => {
    expect(codes({
      nodes: [node('a', 'Intake'), node('b', 'Diagnosis'), node('c', 'Selesai')],
      transitions: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
    })).toEqual([]);
  });

  it('menerima alur bercabang yang menyatu kembali (bentuk alur toko)', () => {
    // Intake -> Diagnosis -> {Ditunggu | Disimpan} -> Pengerjaan -> Selesai
    expect(codes({
      nodes: ['a', 'b', 'c1', 'c2', 'd', 'e'].map((k) => node(k)),
      transitions: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c1' }, { from: 'b', to: 'c2' },
        { from: 'c1', to: 'd' }, { from: 'c2', to: 'd' },
        { from: 'd', to: 'e' },
      ],
    })).toEqual([]);
  });

  it('menolak dua tahap awal — tiket tak tahu harus mulai di mana', () => {
    expect(codes({
      nodes: [node('a'), node('b'), node('c')],
      transitions: [{ from: 'a', to: 'c' }, { from: 'b', to: 'c' }],
    })).toContain('MULTIPLE_START_NODES');
  });

  it('menolak alur tanpa tahap akhir — tiket tak akan pernah bisa ditutup', () => {
    expect(codes({
      nodes: [node('a'), node('b')],
      transitions: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
    })).toContain('NO_TERMINAL_NODE');
  });

  it('menolak tahap yatim yang tak terjangkau dari awal', () => {
    // "c" sengaja tidak disambungkan — kelupaan paling umum saat menyusun cabang.
    const result = codes({
      nodes: [node('a', 'Intake'), node('b', 'Selesai'), node('c', 'Garansi')],
      transitions: [{ from: 'a', to: 'b' }],
    });
    expect(result).toContain('MULTIPLE_START_NODES'); // c juga tanpa incoming
    const messages = validateFlowDesign({
      nodes: [node('a', 'Intake'), node('b', 'Selesai'), node('c', 'Garansi')],
      transitions: [{ from: 'a', to: 'b' }],
    }).map((i) => i.message);
    expect(messages.join(' ')).toContain('Garansi');
  });

  it('menolak transisi ke tahap yang tidak dikenal', () => {
    expect(codes({
      nodes: [node('a'), node('b')],
      transitions: [{ from: 'a', to: 'hantu' }],
    })).toContain('UNKNOWN_TRANSITION_NODE');
  });

  it('menolak tahap yang berpindah ke dirinya sendiri', () => {
    expect(codes({
      nodes: [node('a'), node('b')],
      transitions: [{ from: 'a', to: 'b' }, { from: 'b', to: 'b' }],
    })).toContain('SELF_TRANSITION');
  });

  it('menolak kunci tahap ganda', () => {
    expect(codes({
      nodes: [node('a'), node('a')],
      transitions: [],
    })).toContain('DUPLICATE_NODE_KEY');
  });
});
