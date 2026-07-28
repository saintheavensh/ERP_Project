/**
 * JENIS TAHAP — pengganti tiga sakelar aturan yang berdiri sendiri.
 *
 * Kenapa ada (keputusan pemilik, 2026-07-28):
 *
 * > "yang ada di benak saya malah nanti aplikasinya banyak bug karena alur
 * >  penting dan juga yang lainnya terlalu banyak di-tweak."
 *
 * Sebelumnya tiap tahap punya tiga boolean bebas (`allowsCharges`,
 * `requiresDiagnosis`, `allowsInvoicing`) = 8 kemungkinan per tahap. Alur 6
 * tahap berarti ~260.000 bentuk, dan hampir semuanya tak pernah diuji siapa
 * pun. Itulah sumber ketakutan di atas, dan ketakutan itu beralasan.
 *
 * Tapi saat data yang ADA diperiksa (`db/seed/04-flows.ts` + `backbone.ts`),
 * dari 8 kombinasi yang mungkin **hanya 5 yang benar-benar dipakai**. Jadi
 * menamai kelimanya bukan penyederhanaan yang dipaksakan — itu memang bentuk
 * aslinya, yang selama ini disembunyikan di balik tiga sakelar.
 *
 * Hasilnya: dari ~260.000 bentuk tak teruji jadi 5 bentuk yang semuanya
 * teruji. Owner tetap bisa menyusun alur sesuai tokonya, tapi tidak bisa lagi
 * merakit kombinasi yang belum pernah dicoba siapa pun. Buat pemakai juga
 * lebih masuk akal: memilih "ini tahap QC/penagihan" jauh lebih mudah
 * dipahami daripada menebak arti tiga sakelar.
 *
 * ATURAN: file ini murni — tidak menyentuh DB, tidak menyentuh HTTP. Kapabilitas
 * adalah TURUNAN dari jenis, tidak pernah disimpan sebagai kebenaran terpisah;
 * `stage_kind` adalah satu-satunya sumber kebenaran di `flow_nodes`.
 */

export const STAGE_KINDS = ['penerimaan', 'pemeriksaan', 'pengerjaan', 'penagihan', 'penutup'] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export interface StageCapabilities {
  /** Boleh mencatat sparepart / jasa / biaya lain di tahap ini. */
  allowsCharges: boolean;
  /** Tahap ini wajib mengisi hasil diagnosa + estimasi. */
  requiresDiagnosis: boolean;
  /** Boleh menerbitkan nota & menerima pembayaran di tahap ini. */
  allowsInvoicing: boolean;
}

export interface StageKindDefinition extends StageCapabilities {
  kind: StageKind;
  /** Nama yang dilihat pemilik di editor alur. */
  label: string;
  /** Satu kalimat penjelas, dalam bahasa toko. */
  hint: string;
}

export const STAGE_KIND_DEFINITIONS: Record<StageKind, StageKindDefinition> = {
  penerimaan: {
    kind: 'penerimaan',
    label: 'Penerimaan',
    hint: 'Unit baru diterima. Belum boleh mencatat biaya — unitnya memang belum diperiksa.',
    allowsCharges: false, requiresDiagnosis: false, allowsInvoicing: false,
  },
  pemeriksaan: {
    kind: 'pemeriksaan',
    label: 'Pemeriksaan',
    hint: 'Teknisi memeriksa dan mengisi hasil diagnosa + estimasi biaya. Boleh mencatat biaya, belum boleh menagih.',
    allowsCharges: true, requiresDiagnosis: true, allowsInvoicing: false,
  },
  pengerjaan: {
    kind: 'pengerjaan',
    label: 'Pengerjaan',
    hint: 'Unit sedang ditangani atau menunggu giliran. Boleh menambah biaya, belum boleh menagih.',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: false,
  },
  penagihan: {
    kind: 'penagihan',
    label: 'Penagihan',
    hint: 'Pekerjaan selesai dan pelanggan dapat membayar. Boleh menambah biaya sekaligus menerbitkan nota.',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: true,
  },
  penutup: {
    kind: 'penutup',
    label: 'Penutup',
    hint: 'Unit sudah diserahkan dan tiket ditutup. Biaya tak bisa ditambah lagi; pelunasan sisa tagihan masih boleh.',
    allowsCharges: false, requiresDiagnosis: false, allowsInvoicing: true,
  },
};

export function isStageKind(value: unknown): value is StageKind {
  return typeof value === 'string' && (STAGE_KINDS as readonly string[]).includes(value);
}

/** Kapabilitas sebuah jenis tahap. Satu-satunya tempat kapabilitas ditentukan. */
export function capabilitiesFor(kind: StageKind): StageCapabilities {
  const def = STAGE_KIND_DEFINITIONS[kind];
  return {
    allowsCharges: def.allowsCharges,
    requiresDiagnosis: def.requiresDiagnosis,
    allowsInvoicing: def.allowsInvoicing,
  };
}

/**
 * Menebak jenis tahap dari tiga boolean lama.
 *
 * Dipakai SEKALI untuk membaca baris `flow_nodes` yang dibuat sebelum kolom
 * `stage_kind` ada — bukan jalur tulis. Kombinasi yang tak dikenal (3 dari 8
 * yang memang tak pernah dipakai) jatuh ke jenis terdekat yang tidak
 * melonggarkan aturan, supaya migrasi tak pernah diam-diam memberi izin baru:
 *
 * - (F,T,*) "wajib diagnosis tapi tak boleh catat biaya" -> pemeriksaan tanpa
 *   biaya tak masuk akal; jatuhkan ke `penerimaan` (paling ketat).
 * - (F,F,F) -> penerimaan; (F,*,T) -> penutup.
 */
export function stageKindFromCapabilities(caps: StageCapabilities): StageKind {
  const { allowsCharges, requiresDiagnosis, allowsInvoicing } = caps;
  if (allowsCharges && requiresDiagnosis) return 'pemeriksaan';
  if (allowsCharges && allowsInvoicing) return 'penagihan';
  if (allowsCharges) return 'pengerjaan';
  if (allowsInvoicing) return 'penutup';
  return 'penerimaan';
}
