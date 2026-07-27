import { describe, it, expect } from 'vitest';
import { validateFlowDesign, validateCoreIntegrity } from '../service';
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

// ---------------------------------------------------------------------------
// Tulang punggung alur. Keputusan pemilik: urutan inti terkunci, yang boleh
// diatur hanya tahap tambahan (QC) dan dokumen cetak per tahap.
// ---------------------------------------------------------------------------

const ID = {
  intake: '11111111-1111-4111-8111-111111111111',
  diagnosis: '22222222-2222-4222-8222-222222222222',
  repair: '33333333-3333-4333-8333-333333333333',
  done: '44444444-4444-4444-8444-444444444444',
  qc: '55555555-5555-4555-8555-555555555555',
};

/** Intake -> Diagnosis -> Pengerjaan -> Selesai, semuanya inti. */
const SAVED = [
  { id: ID.intake, name: 'Intake', isCore: true, sequenceOrder: 1 },
  { id: ID.diagnosis, name: 'Diagnosis', isCore: true, sequenceOrder: 2 },
  { id: ID.repair, name: 'Pengerjaan', isCore: true, sequenceOrder: 3 },
  { id: ID.done, name: 'Selesai', isCore: true, sequenceOrder: 4 },
];
const SAVED_EDGES = [
  { fromNodeId: ID.intake, toNodeId: ID.diagnosis },
  { fromNodeId: ID.diagnosis, toNodeId: ID.repair },
  { fromNodeId: ID.repair, toNodeId: ID.done },
];

/** Node payload untuk tahap yang SUDAH tersimpan (key = id, sesuai kontrak editor). */
function saved(id: string, name: string): FlowDesignInput['nodes'][number] {
  return { ...node(id, name), id };
}

const coreCodes = (input: FlowDesignInput, nodes = SAVED, edges = SAVED_EDGES) =>
  validateCoreIntegrity(nodes, edges, input).map((i) => i.code);

describe('validateCoreIntegrity', () => {
  it('menerima alur yang tidak diubah tulang punggungnya', () => {
    expect(coreCodes({
      nodes: [saved(ID.intake, 'Intake'), saved(ID.diagnosis, 'Diagnosis'), saved(ID.repair, 'Pengerjaan'), saved(ID.done, 'Selesai')],
      transitions: [
        { from: ID.intake, to: ID.diagnosis },
        { from: ID.diagnosis, to: ID.repair },
        { from: ID.repair, to: ID.done },
      ],
    })).toEqual([]);
  });

  it('menerima QC yang disisipkan di antara dua tahap inti', () => {
    // Inilah satu-satunya perubahan struktur yang memang dimaksudkan owner:
    // Diagnosis -> QC Awal -> Pengerjaan. Sambungan inti lama masih tertempuh.
    expect(coreCodes({
      nodes: [
        saved(ID.intake, 'Intake'), saved(ID.diagnosis, 'Diagnosis'),
        node('baru', 'QC Awal'),
        saved(ID.repair, 'Pengerjaan'), saved(ID.done, 'Selesai'),
      ],
      transitions: [
        { from: ID.intake, to: ID.diagnosis },
        { from: ID.diagnosis, to: 'baru' },
        { from: 'baru', to: ID.repair },
        { from: ID.repair, to: ID.done },
      ],
    })).toEqual([]);
  });

  it('menerima pelepasan tahap TAMBAHAN', () => {
    const withQc = [...SAVED, { id: ID.qc, name: 'QC Awal', isCore: false, sequenceOrder: 5 }];
    const edges = [
      { fromNodeId: ID.intake, toNodeId: ID.diagnosis },
      { fromNodeId: ID.diagnosis, toNodeId: ID.qc },
      { fromNodeId: ID.qc, toNodeId: ID.repair },
      { fromNodeId: ID.repair, toNodeId: ID.done },
    ];
    expect(coreCodes({
      nodes: [saved(ID.intake, 'Intake'), saved(ID.diagnosis, 'Diagnosis'), saved(ID.repair, 'Pengerjaan'), saved(ID.done, 'Selesai')],
      transitions: [
        { from: ID.intake, to: ID.diagnosis },
        { from: ID.diagnosis, to: ID.repair },
        { from: ID.repair, to: ID.done },
      ],
    }, withQc, edges)).toEqual([]);
  });

  it('menolak penghapusan tahap inti', () => {
    const result = validateCoreIntegrity(SAVED, SAVED_EDGES, {
      nodes: [saved(ID.intake, 'Intake'), saved(ID.repair, 'Pengerjaan'), saved(ID.done, 'Selesai')],
      transitions: [{ from: ID.intake, to: ID.repair }, { from: ID.repair, to: ID.done }],
    });
    expect(result.map((i) => i.code)).toContain('CORE_STAGE_REMOVED');
    expect(result[0].message).toContain('Diagnosis');
  });

  it('menolak penukaran urutan dua tahap inti', () => {
    expect(coreCodes({
      nodes: [saved(ID.intake, 'Intake'), saved(ID.repair, 'Pengerjaan'), saved(ID.diagnosis, 'Diagnosis'), saved(ID.done, 'Selesai')],
      transitions: [
        { from: ID.intake, to: ID.repair },
        { from: ID.repair, to: ID.diagnosis },
        { from: ID.diagnosis, to: ID.done },
      ],
    })).toContain('CORE_STAGE_REORDERED');
  });

  it('menolak sambungan inti yang dialihkan ke tahap inti lain', () => {
    // Urutan array masih sama, tapi Diagnosis kini melompati Pengerjaan.
    // Tanpa aturan ketiga, pelanggaran ini lolos.
    expect(coreCodes({
      nodes: [saved(ID.intake, 'Intake'), saved(ID.diagnosis, 'Diagnosis'), saved(ID.repair, 'Pengerjaan'), saved(ID.done, 'Selesai')],
      transitions: [
        { from: ID.intake, to: ID.diagnosis },
        { from: ID.diagnosis, to: ID.done },
        { from: ID.repair, to: ID.done },
      ],
    })).toContain('CORE_PATH_BROKEN');
  });

  it('memakai sequenceOrder, bukan urutan baris yang diterima', () => {
    // Bug nyata: `SELECT ... FROM flow_nodes` tanpa ORDER BY mengembalikan baris
    // dalam urutan acak, sehingga penyisipan QC yang sah ditolak
    // CORE_STAGE_REORDERED. Daftar di bawah sengaja diacak.
    const shuffled = [SAVED[2], SAVED[0], SAVED[3], SAVED[1]];
    expect(coreCodes({
      nodes: [saved(ID.intake, 'Intake'), saved(ID.diagnosis, 'Diagnosis'), saved(ID.repair, 'Pengerjaan'), saved(ID.done, 'Selesai')],
      transitions: [
        { from: ID.intake, to: ID.diagnosis },
        { from: ID.diagnosis, to: ID.repair },
        { from: ID.repair, to: ID.done },
      ],
    }, shuffled)).toEqual([]);
  });

  it('mengabaikan alur lama yang belum punya tahap inti sama sekali', () => {
    const legacy = SAVED.map((n) => ({ ...n, isCore: false }));
    expect(coreCodes({ nodes: [], transitions: [] }, legacy, SAVED_EDGES)).toEqual([]);
  });
});
