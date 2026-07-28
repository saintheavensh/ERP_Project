import { describe, it, expect } from 'vitest';
import {
  STAGE_KINDS,
  STAGE_KIND_DEFINITIONS,
  capabilitiesFor,
  stageKindFromCapabilities,
  isStageKind,
  type StageCapabilities,
} from '../stage-kinds';
import { CORE_BACKBONE } from '../backbone';

// S5 — jenis tahap.
//
// Alasan file ini ada, dari pemiliknya sendiri: "yang ada di benak saya malah
// nanti aplikasinya banyak bug karena alur penting terlalu banyak di-tweak."
//
// Tiga boolean bebas = 8 kombinasi per tahap, ~260.000 bentuk untuk alur 6
// tahap, dan hampir semuanya tak pernah dijalankan siapa pun. Yang diuji di
// sini bukan "fungsinya mengembalikan sesuatu", melainkan klaim yang dipakai
// untuk membenarkan perubahan itu: bahwa jumlah bentuk yang mungkin sekarang
// SEDIKIT, dan setiap satunya punya arti yang jelas.

describe('STAGE_KINDS — permukaan konfigurasi yang sengaja disempitkan', () => {
  it('jumlahnya sedikit dan tetap — inilah seluruh klaimnya', () => {
    // Kalau seseorang kelak menambah jenis, ia harus sadar sedang memperbesar
    // permukaan yang harus diuji, bukan diam-diam menambah satu baris enum.
    expect(STAGE_KINDS).toHaveLength(5);
    expect([...STAGE_KINDS]).toEqual(['penerimaan', 'pemeriksaan', 'pengerjaan', 'penagihan', 'penutup']);
  });

  it('tiap jenis punya label & penjelas yang benar-benar terisi', () => {
    // Keduanya dikirim ke editor dan itulah satu-satunya penjelasan yang
    // dibaca pemilik saat memilih. Kosong = kendali yang tak bisa dinilai.
    for (const kind of STAGE_KINDS) {
      const def = STAGE_KIND_DEFINITIONS[kind];
      expect(def.kind).toBe(kind);
      expect(def.label.trim().length).toBeGreaterThan(0);
      expect(def.hint.trim().length).toBeGreaterThan(10);
    }
  });

  it('tiap jenis punya kombinasi kapabilitas yang BERBEDA', () => {
    // Dua jenis dengan kapabilitas identik berarti salah satunya kendali mati —
    // memilihnya tak mengubah apa pun, persis bug yang Track F dulu bereskan.
    const seen = new Set(
      STAGE_KINDS.map((k) => {
        const c = capabilitiesFor(k);
        return `${c.allowsCharges}|${c.requiresDiagnosis}|${c.allowsInvoicing}`;
      })
    );
    expect(seen.size).toBe(STAGE_KINDS.length);
  });

  it('hanya "pemeriksaan" yang mewajibkan diagnosis', () => {
    const withDiagnosis = STAGE_KINDS.filter((k) => capabilitiesFor(k).requiresDiagnosis);
    expect(withDiagnosis).toEqual(['pemeriksaan']);
  });

  it('tahap yang mewajibkan diagnosis harus boleh mencatat biaya', () => {
    // Mengisi estimasi tanpa boleh mencatat biaya adalah keadaan yang mustahil
    // dikerjakan — teknisi diminta memperkirakan harga tapi tak bisa menuliskannya.
    for (const kind of STAGE_KINDS) {
      const c = capabilitiesFor(kind);
      if (c.requiresDiagnosis) expect(c.allowsCharges).toBe(true);
    }
  });
});

describe('stageKindFromCapabilities — membaca baris lama', () => {
  const caps = (a: boolean, d: boolean, i: boolean): StageCapabilities => ({
    allowsCharges: a, requiresDiagnosis: d, allowsInvoicing: i,
  });

  it('memetakan kelima kombinasi yang benar-benar dipakai ke jenisnya', () => {
    expect(stageKindFromCapabilities(caps(false, false, false))).toBe('penerimaan');
    expect(stageKindFromCapabilities(caps(true, true, false))).toBe('pemeriksaan');
    expect(stageKindFromCapabilities(caps(true, false, false))).toBe('pengerjaan');
    expect(stageKindFromCapabilities(caps(true, false, true))).toBe('penagihan');
    expect(stageKindFromCapabilities(caps(false, false, true))).toBe('penutup');
  });

  it('bolak-balik tanpa berubah untuk kelima jenis', () => {
    // Ini yang menjamin migrasi baris lama tidak diam-diam menggeser aturan
    // sebuah tahap yang sudah berjalan.
    for (const kind of STAGE_KINDS) {
      expect(stageKindFromCapabilities(capabilitiesFor(kind))).toBe(kind);
    }
  });

  it('kombinasi tak terpakai tidak pernah MELONGGARKAN aturan', () => {
    // (F,T,*) tak masuk akal: wajib diagnosis tapi biaya tak boleh dicatat.
    // Jatuhkan ke jenis paling ketat, jangan ke yang memberi izin baru.
    for (const invoicing of [false, true]) {
      const kind = stageKindFromCapabilities(caps(false, true, invoicing));
      const result = capabilitiesFor(kind);
      expect(result.allowsCharges).toBe(false);
      expect(result.requiresDiagnosis).toBe(false);
    }
  });
});

describe('isStageKind', () => {
  it('menolak nilai yang bukan jenis tahap', () => {
    expect(isStageKind('pengerjaan')).toBe(true);
    expect(isStageKind('qc')).toBe(false);
    expect(isStageKind('')).toBe(false);
    expect(isStageKind(undefined)).toBe(false);
    expect(isStageKind(3)).toBe(false);
  });
});

describe('CORE_BACKBONE memakai jenis tahap, bukan boolean lepas', () => {
  it('setiap tahap tulang punggung memakai jenis yang dikenal', () => {
    for (const stage of CORE_BACKBONE) {
      expect(isStageKind(stage.stageKind)).toBe(true);
    }
  });

  it('Intake tidak boleh mencatat biaya; Diagnosis wajib diagnosis', () => {
    // Keluhan asli pemilik: sparepart tak boleh dipilih sebelum unit diperiksa.
    expect(capabilitiesFor(CORE_BACKBONE[0].stageKind).allowsCharges).toBe(false);
    const diagnosis = CORE_BACKBONE.find((s) => s.key === 'diagnosis')!;
    expect(capabilitiesFor(diagnosis.stageKind).requiresDiagnosis).toBe(true);
  });

  it('pembayaran tersedia sebelum tahap akhir', () => {
    // Tiket TERTUTUP begitu masuk tahap akhir. Kalau menagih hanya boleh di
    // sana, kasir menagih setelah tiketnya selesai.
    const nonTerminalInvoicing = CORE_BACKBONE.filter(
      (s) => capabilitiesFor(s.stageKind).allowsInvoicing && s.next.length > 0
    );
    expect(nonTerminalInvoicing.map((s) => s.key)).toContain('pengerjaan');
  });
});
