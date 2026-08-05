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

// ---------------------------------------------------------------------------
// R1.11-T1 — izin per-KOLOM untuk PATCH /v1/tickets/:id/intake-details.
//
// Endpoint itu menampung lima kolom milik DUA peran, tapi selama ini
// digerbangi SATU izin di tingkat route (`ticket.create`). Akibatnya terbalik
// ke dua arah sekaligus, dan dibuktikan lewat curl ke API sungguhan sebelum
// perbaikan ini ditulis:
//
//   teknisi -> diagnosis   403  (padahal itu pekerjaan intinya)
//   kasir   -> diagnosis   200  (padahal ia tidak mendiagnosis)
//
// Rusak sejak R1.5B (2026-08-01) mencabut `ticket.create` dari teknisi atas
// permintaan pemilik. Alasan pencabutannya benar; yang luput adalah bahwa satu
// route lain kebetulan menumpang izin yang sama, jadi ia ikut mati tanpa satu
// tes pun gagal — nol e2e backend menyentuh endpoint ini, dan setiap tes
// diagnosa berjalan sebagai Super Admin, yang MELEWATI seluruh RBAC.
//
// Gerbang tingkat-route tak bisa menyatakan "kolom ini milik A, kolom itu
// milik B" — itu persis alasan `enforcePermission()` ada (lihat komentarnya di
// middleware/rbac.ts). Pola yang sama sudah dipakai tiga kali: D2
// `pos.apply_discount`, R1.9-T1b `customer.allow_tempo`, R1.10-T4
// `customer.set_category`.
//
// ATURAN berkas ini tetap berlaku: murni, tanpa DB/HTTP/Zod.
// ---------------------------------------------------------------------------

/**
 * Kolom `/intake-details` → izin yang benar-benar memilikinya.
 *
 * Konter (kasir) mencatat apa yang dibawa pelanggan; teknisi mencatat apa yang
 * ia temukan. `intakeEstimatedCost` milik konter — dan ia PUNYA kunci kedua
 * yang tidak ada hubungannya dengan izin (`INTAKE_ESTIMATE_LOCKED` di
 * `modules/tickets/service.ts`, aturan bukti yang berlaku juga untuk Super
 * Admin). Dua hal berbeda yang kebetulan mengenai kolom yang sama.
 */
export const INTAKE_FIELD_PERMISSIONS = {
  devicePasscode: 'ticket.create',
  reportedComplaint: 'ticket.create',
  intakeEstimatedCost: 'ticket.create',
  diagnosis: 'ticket.diagnose',
  estimatedDurationMinutes: 'ticket.diagnose',
} as const;

export type IntakeDetailField = keyof typeof INTAKE_FIELD_PERMISSIONS;

/** Nilai kolom-kolom di atas, apa adanya dari DB maupun dari payload. */
export type IntakeDetailValues = Partial<
  Record<IntakeDetailField, string | number | null | undefined>
>;

/**
 * Menyamakan bentuk sebelum dibandingkan.
 *
 * Dua hal yang wajib ditangani, dan keduanya akan menghasilkan penolakan
 * PALSU kalau dilewatkan:
 *
 * 1. Angka datang sebagai `number` dari payload tapi tersimpan sebagai
 *    `"450000.00"` (numeric Postgres). `450000 !== "450000.00"`, jadi
 *    membandingkan mentah-mentah membuat "menyimpan ulang nilai yang sama"
 *    terlihat seperti perubahan.
 * 2. Kosong punya tiga wajah — `null`, `undefined`, dan `''`. Form mengirim
 *    `null` saat dikosongkan, DB menyimpan `null`, tapi sebuah input teks yang
 *    disentuh lalu dibiarkan kosong bisa mengirim `''`.
 */
function normalizeValue(value: string | number | null | undefined): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  // Hanya angka murni yang dinumerikkan. Keluhan "0812..." adalah teks dan
  // harus tetap teks — `Number()` atas teks bebas mengembalikan NaN, dan
  // NaN !== NaN akan membuat setiap penyimpanan tampak seperti perubahan.
  const asNumber = Number(trimmed);
  return Number.isFinite(asNumber) && trimmed !== '' && /^-?\d+(\.\d+)?$/.test(trimmed)
    ? asNumber
    : trimmed;
}

/**
 * Izin apa saja yang harus dipegang pemanggil untuk menyimpan `input` ini.
 *
 * **Kondisional terhadap nilai yang BENAR-BENAR BERUBAH, bukan terhadap "ada
 * di payload".** Alasannya sudah dibayar sekali di R1.10-T4: sebuah form bisa
 * mengirim seluruh objek tiap kali menyimpan, jadi memeriksa keberadaan kunci
 * akan memblokir orang yang tidak sedang menyentuh kolom itu sama sekali —
 * kasir yang membetulkan keluhan tidak boleh tersandung aturan diagnosa.
 *
 * Menyimpan ulang nilai yang sama persis karena itu tidak menuntut izin apa
 * pun. Itu memang bukan perubahan, dan tak ada yang perlu dijaga.
 *
 * @returns kode izin unik, urutannya stabil (mengikuti urutan kolom di
 *          `INTAKE_FIELD_PERMISSIONS`) supaya pesan 403 yang diterima pemakai
 *          tidak berubah-ubah antar permintaan yang sama.
 */
export function intakePermissionsNeeded(
  current: IntakeDetailValues,
  input: IntakeDetailValues
): string[] {
  const needed: string[] = [];

  for (const field of Object.keys(INTAKE_FIELD_PERMISSIONS) as IntakeDetailField[]) {
    // Kunci yang tidak dikirim adalah no-op di service, jadi ia juga bukan
    // urusan izin. `in` (bukan `!== undefined`) supaya `{ diagnosis: undefined }`
    // diperlakukan sama dengan tidak mengirim apa-apa.
    if (!(field in input)) continue;

    if (normalizeValue(input[field]) === normalizeValue(current[field])) continue;

    const permission = INTAKE_FIELD_PERMISSIONS[field];
    if (!needed.includes(permission)) needed.push(permission);
  }

  return needed;
}
