/**
 * ALUR INTI — tulang punggung yang dipakai setiap alur servis baru.
 *
 * Keputusan pemilik (2026-07-27): "untuk alur intinya urutannya tidak bisa
 * diubah, konfigurasinya hanya menambahkan QC kemudian melewati tahap print
 * awal". Konsekuensinya, membuat alur baru TIDAK boleh menghasilkan kanvas
 * kosong: kalau tak ada satu pun tahap, tak ada satu pun panah, dan tak ada
 * tempat untuk menyisipkan apa pun — editornya buntu. Alur baru lahir dengan
 * tulang punggung ini, lalu owner tinggal menambah QC dan mengatur dokumen
 * cetak per tahap.
 *
 * Bentuknya sengaja sama dengan template "Servis" yang di-seed (`db/seed/04-flows.ts`),
 * dan seed itu MENGAMBIL nama/keterangan/kapabilitasnya dari sini supaya tidak
 * ada dua kebenaran yang bisa berselisih. Yang tidak ada di sini: QC Awal &
 * QC Akhir — keduanya tahap TAMBAHAN, dan alur baru memang berhak dimulai
 * tanpa QC sampai owner memasangnya.
 */

export interface BackboneStage {
  key: string;
  name: string;
  description: string;
  allowsCharges: boolean;
  requiresDiagnosis: boolean;
  allowsInvoicing: boolean;
  autoPrintDocuments: string[];
  nodeType: string;
  /** key tahap berikutnya; kosong = tahap akhir. */
  next: string[];
}

export const CORE_BACKBONE: BackboneStage[] = [
  {
    key: 'intake',
    name: 'Intake',
    description: 'Kasir mencatat nama, nomor telepon, dan keluhan pelanggan. Label unit + nomor antrian dicetak di sini, lalu pelanggan menunggu dipanggil.',
    // Sparepart sengaja belum boleh: unitnya memang belum didiagnosis.
    allowsCharges: false, requiresDiagnosis: false, allowsInvoicing: false,
    autoPrintDocuments: ['label'],
    nodeType: 'action',
    next: ['diagnosis'],
  },
  {
    key: 'diagnosis',
    name: 'Diagnosis',
    description: 'Teknisi memeriksa unit, lalu mengisi hasil diagnosa, estimasi biaya (sparepart & jasa), dan estimasi lama pengerjaan. Sampaikan ke pelanggan sebelum lanjut.',
    allowsCharges: true, requiresDiagnosis: true, allowsInvoicing: false,
    autoPrintDocuments: [],
    nodeType: 'action',
    // Percabangan setelah harga & estimasi waktu disampaikan: ditunggu,
    // ditinggal, atau batal (langsung ke tahap akhir).
    next: ['ditunggu', 'disimpan', 'selesai'],
  },
  {
    key: 'ditunggu',
    name: 'Ditunggu',
    description: 'Pelanggan setuju dan menunggu di tempat. Tidak ada nota yang dicetak sekarang — nota keluar saat pengerjaan selesai dan dibayar.',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: false,
    autoPrintDocuments: [],
    nodeType: 'action',
    next: ['pengerjaan'],
  },
  {
    key: 'disimpan',
    name: 'Unit Disimpan',
    description: 'Pelanggan setuju dan meninggalkan unit di toko. Nota tanda terima + label dicetak otomatis sebagai bukti titip; unit disimpan sampai giliran dikerjakan.',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: false,
    autoPrintDocuments: ['tanda_terima', 'label'],
    nodeType: 'action',
    next: ['pengerjaan'],
  },
  {
    key: 'pengerjaan',
    name: 'Pengerjaan',
    description: 'Teknisi mengerjakan unit dan memakai sparepart (stok terpotong saat dipakai). Menemukan kerusakan tambahan? Tambahkan biayanya lalu minta persetujuan ulang.',
    // Pembayaran diizinkan di sini, bukan hanya di tahap akhir: tiket sudah
    // TERTUTUP begitu masuk tahap akhir, jadi kasir harus bisa menagih saat
    // pengerjaan selesai tapi tiketnya masih hidup.
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: true,
    autoPrintDocuments: [],
    nodeType: 'action',
    next: ['selesai'],
  },
  {
    key: 'selesai',
    name: 'Selesai',
    description: 'Unit sudah diserahkan ke pelanggan dan tiket ditutup. Tahap akhir — tidak ada langkah setelah ini.',
    allowsCharges: false, requiresDiagnosis: false, allowsInvoicing: true,
    autoPrintDocuments: [],
    nodeType: 'action',
    // Tanpa perpindahan keluar — mesin alur mengenali tahap akhir secara
    // struktural dan itulah yang menutup tiket.
    next: [],
  },
];

/** Cari satu tahap tulang punggung berdasarkan key (dipakai seed). */
export function backboneStage(key: string): BackboneStage {
  const found = CORE_BACKBONE.find((s) => s.key === key);
  if (!found) throw new Error(`Unknown backbone stage: ${key}`);
  return found;
}
