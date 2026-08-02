// ---------------------------------------------------------------------------
// R1.8-T1 — kolom wajib saat menerima unit servis.
//
// Pemilik (uji-R1.7 D1): "kalau bisa di perketat lagi validasinya, saya bisa
// input tiket service meskipun unit service belum di isi, dan buat keluhan /
// kerusakan jadi kolom wajib di isi".
//
// Sebelum ini, satu-satunya kolom unit yang wajib adalah "Jenis" (dropdown),
// jadi sebuah tiket sah bisa berisi seluruh unitnya cuma kata "Smartphone" —
// dan itulah yang tercetak di label, muncul di antrian teknisi, dan dipakai
// mencari unit pelanggan berminggu-minggu kemudian. Keluhan malah tak punya
// pemeriksaan sama sekali, di form maupun di backend.
//
// ATURAN: berkas ini murni — tidak menyentuh DB, tidak menyentuh HTTP, tidak
// mengimpor Zod. Bentuknya sengaja meniru `lib/passcode.ts` (R1.5C), dan
// alasannya sama: SATU definisi dipakai kedua jalur tulis (POST /intake dan
// PATCH /:id/intake-details), supaya aturannya tak bisa berbeda di antara
// keduanya. Menegakkannya di form saja adalah kunci semu — satu panggilan API
// langsung menembusnya (pelajaran S5, lalu diulang R1.5C).
// ---------------------------------------------------------------------------

export type FieldCheck =
  | { valid: true }
  | { valid: false; code: IntakeFieldCode; message: string };

export type IntakeFieldCode =
  | 'COMPLAINT_REQUIRED'
  | 'COMPLAINT_TOO_SHORT'
  | 'UNIT_TYPE_REQUIRED'
  | 'UNIT_BRAND_REQUIRED'
  | 'UNIT_MODEL_REQUIRED'
  | 'CUSTOMER_NAME_REQUIRED';

const ok: FieldCheck = { valid: true };

function blank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === '';
}

/**
 * Panjang minimum keluhan.
 *
 * Kenapa 3 dan bukan sekadar "tidak kosong": begitu sebuah kolom jadi wajib,
 * jalan pintas yang selalu muncul adalah mengetik "-" atau "." supaya form
 * lolos. Nilai satu-dua karakter tak pernah benar-benar sebuah keluhan.
 */
export const MIN_COMPLAINT_LENGTH = 3;

/**
 * Keluhan/kerusakan WAJIB. Ini satu-satunya catatan tentang kenapa unit ini
 * ada di toko: ia tercetak di tanda terima pelanggan, dan teknisi membacanya
 * di popup antrian sebelum memutuskan mengambil pekerjaan.
 */
export function checkComplaint(value: string | null | undefined): FieldCheck {
  if (blank(value)) {
    return {
      valid: false,
      code: 'COMPLAINT_REQUIRED',
      message: 'Keluhan / kerusakan wajib diisi.',
    };
  }
  if (value!.trim().length < MIN_COMPLAINT_LENGTH) {
    return {
      valid: false,
      code: 'COMPLAINT_TOO_SHORT',
      message: `Keluhan / kerusakan minimal ${MIN_COMPLAINT_LENGTH} huruf — tulis singkat pun tidak apa-apa, mis. "mati total".`,
    };
  }
  return ok;
}

export interface UnitIdentity {
  assetType: string | null | undefined;
  assetBrand: string | null | undefined;
  assetModel: string | null | undefined;
}

/**
 * Jenis + merek + model wajib saat unit BARU didaftarkan.
 *
 * Isinya bebas, dan itu keputusan pemilik (2026-08-02): "jika misalnya merk
 * ponsel tidak umum bisa di tambahkan sendiri... bisa di isi merknya Advan
 * tipenya G30, bisa seperti itu jadi flexible". Jadi yang dilarang di sini
 * hanya DIBIARKAN KOSONG — bukan "tidak ada di katalog device". Merek/model
 * yang tak cocok katalog tetap tersimpan apa adanya (`deviceModelId` null),
 * dan justru itu yang jadi bahan panel "Belum ada di katalog" (R1.8-T5).
 *
 * Tidak ada panjang minimum di sini, beda dengan keluhan di atas: merek dan
 * model itu nama, dan nama yang sah memang bisa sangat pendek ("LG", "X").
 * Menolaknya berarti kasir mentok di depan pelanggan karena aturan karangan.
 */
export function checkUnitIdentity(unit: UnitIdentity): FieldCheck {
  if (blank(unit.assetType)) {
    return {
      valid: false,
      code: 'UNIT_TYPE_REQUIRED',
      message: 'Jenis unit wajib dipilih.',
    };
  }
  if (blank(unit.assetBrand)) {
    return {
      valid: false,
      code: 'UNIT_BRAND_REQUIRED',
      message: 'Merek unit wajib diisi. Bila mereknya tidak umum, ketik saja apa adanya.',
    };
  }
  if (blank(unit.assetModel)) {
    return {
      valid: false,
      code: 'UNIT_MODEL_REQUIRED',
      message: 'Model / tipe unit wajib diisi. Bila tidak ada di daftar, ketik saja apa adanya.',
    };
  }
  return ok;
}

/**
 * Nama pelanggan wajib saat pelanggan BARU didaftarkan.
 *
 * Aturannya sendiri tidak baru — jalur intake sudah menolaknya sejak dulu,
 * tapi lewat `throw new Error('Customer name required for new customer')`:
 * kalimat bahasa Inggris dari dalam transaksi, yang sampai ke layar kasir
 * apa adanya. Dipindah ke sini supaya penolakannya jadi kalimat yang sama
 * bentuknya dengan yang lain (pelajaran R1.6-T1: pesan galat yang tak
 * terbaca sama saja dengan tak ada pesan).
 */
export function checkCustomerName(value: string | null | undefined): FieldCheck {
  if (blank(value)) {
    return {
      valid: false,
      code: 'CUSTOMER_NAME_REQUIRED',
      message: 'Nama pelanggan wajib diisi.',
    };
  }
  return ok;
}
