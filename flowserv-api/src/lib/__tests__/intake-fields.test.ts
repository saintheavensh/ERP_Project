import { describe, it, expect } from 'vitest';
import {
  checkComplaint,
  checkUnitIdentity,
  checkCustomerName,
  intakePermissionsNeeded,
  INTAKE_FIELD_PERMISSIONS,
  MIN_COMPLAINT_LENGTH,
} from '../intake-fields';

describe('checkComplaint', () => {
  it('menolak keluhan kosong', () => {
    const hasil = checkComplaint('');
    expect(hasil.valid).toBe(false);
    if (!hasil.valid) expect(hasil.code).toBe('COMPLAINT_REQUIRED');
  });

  it('menolak null dan undefined', () => {
    expect(checkComplaint(null).valid).toBe(false);
    expect(checkComplaint(undefined).valid).toBe(false);
  });

  // Ini kasus yang bikin aturannya ada: begitu sebuah kolom jadi wajib, jalan
  // pintas yang selalu muncul adalah mengetik "-" supaya form lolos.
  it('menolak "-" dan "." — spasi juga tidak dihitung', () => {
    expect(checkComplaint('-').valid).toBe(false);
    expect(checkComplaint('.').valid).toBe(false);
    expect(checkComplaint('   ').valid).toBe(false);
    const hasil = checkComplaint('  a  ');
    expect(hasil.valid).toBe(false);
    if (!hasil.valid) expect(hasil.code).toBe('COMPLAINT_TOO_SHORT');
  });

  it('menerima keluhan pendek yang wajar', () => {
    expect(checkComplaint('mati total').valid).toBe(true);
    expect(checkComplaint('LCD pecah').valid).toBe(true);
    // Tepat di batas — dijaga supaya perubahan MIN tidak diam-diam menggeser
    // apa yang sah tanpa ada tes yang gagal.
    expect(checkComplaint('a'.repeat(MIN_COMPLAINT_LENGTH)).valid).toBe(true);
    expect(checkComplaint('a'.repeat(MIN_COMPLAINT_LENGTH - 1)).valid).toBe(false);
  });

  it('pesannya bahasa Indonesia, bukan kode mentah', () => {
    const hasil = checkComplaint('');
    if (!hasil.valid) {
      expect(hasil.message).toContain('wajib diisi');
      expect(hasil.message).not.toContain('COMPLAINT');
    }
  });
});

describe('checkUnitIdentity', () => {
  const lengkap = { assetType: 'Smartphone', assetBrand: 'Samsung', assetModel: 'A54' };

  it('menerima unit yang lengkap', () => {
    expect(checkUnitIdentity(lengkap).valid).toBe(true);
  });

  // Persis yang pemilik temukan: seluruh unitnya cuma kata "Smartphone".
  it('menolak unit yang hanya berisi jenis', () => {
    const hasil = checkUnitIdentity({ assetType: 'Smartphone', assetBrand: '', assetModel: '' });
    expect(hasil.valid).toBe(false);
    if (!hasil.valid) expect(hasil.code).toBe('UNIT_BRAND_REQUIRED');
  });

  it('menyebut kolom yang benar satu per satu', () => {
    const tanpaJenis = checkUnitIdentity({ ...lengkap, assetType: '' });
    const tanpaModel = checkUnitIdentity({ ...lengkap, assetModel: '   ' });
    if (!tanpaJenis.valid) expect(tanpaJenis.code).toBe('UNIT_TYPE_REQUIRED');
    if (!tanpaModel.valid) expect(tanpaModel.code).toBe('UNIT_MODEL_REQUIRED');
  });

  // Keputusan pemilik 2026-08-02: "bisa di isi merknya Advan tipenya G30, bisa
  // seperti itu jadi flexible". Yang dilarang hanya kosong, BUKAN "tak ada di
  // katalog" — kalau tes ini gagal, T1 sudah menutup jalan yang T5 andalkan.
  it('menerima merek/model di luar katalog', () => {
    expect(checkUnitIdentity({ assetType: 'Smartphone', assetBrand: 'Advan', assetModel: 'G30' }).valid).toBe(true);
  });

  // Merek dan model itu nama; nama yang sah memang bisa sangat pendek.
  // Menolaknya berarti kasir mentok di depan pelanggan karena aturan karangan.
  it('menerima nama yang sangat pendek', () => {
    expect(checkUnitIdentity({ assetType: 'Smartphone', assetBrand: 'LG', assetModel: 'X' }).valid).toBe(true);
  });
});

describe('checkCustomerName', () => {
  it('menolak nama kosong atau spasi saja', () => {
    expect(checkCustomerName('').valid).toBe(false);
    expect(checkCustomerName('   ').valid).toBe(false);
    expect(checkCustomerName(undefined).valid).toBe(false);
  });

  it('menerima nama yang wajar', () => {
    expect(checkCustomerName('Budi').valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// R1.11-T1 — izin per-kolom di PATCH /:id/intake-details.
//
// Kelas bug yang tes ini jaga TIDAK memunculkan error apa pun: ia cuma
// menggerbangi orang yang salah. Sebelum perbaikan ini, teknisi 403 saat
// menyimpan diagnosanya sendiri dan kasir 200 saat menulis diagnosa — dan
// suite lengkap tetap hijau selama lima fase.
// ---------------------------------------------------------------------------

describe('intakePermissionsNeeded', () => {
  const kosong = {
    devicePasscode: null,
    reportedComplaint: null,
    diagnosis: null,
    estimatedDurationMinutes: null,
    intakeEstimatedCost: null,
  };

  it('tidak menuntut apa pun untuk body kosong', () => {
    expect(intakePermissionsNeeded(kosong, {})).toEqual([]);
  });

  it('kolom konter menuntut ticket.create', () => {
    expect(intakePermissionsNeeded(kosong, { reportedComplaint: 'LCD pecah' }))
      .toEqual(['ticket.create']);
    expect(intakePermissionsNeeded(kosong, { devicePasscode: '1234' }))
      .toEqual(['ticket.create']);
    expect(intakePermissionsNeeded(kosong, { intakeEstimatedCost: 450000 }))
      .toEqual(['ticket.create']);
  });

  it('kolom teknisi menuntut ticket.diagnose', () => {
    expect(intakePermissionsNeeded(kosong, { diagnosis: 'IC charging rusak' }))
      .toEqual(['ticket.diagnose']);
    expect(intakePermissionsNeeded(kosong, { estimatedDurationMinutes: 120 }))
      .toEqual(['ticket.diagnose']);
  });

  // Inilah bug yang R1.11 ada untuk memperbaikinya, ditulis sebagai tes.
  it('teknisi menyimpan diagnosa TIDAK menuntut ticket.create', () => {
    const perlu = intakePermissionsNeeded(kosong, {
      diagnosis: 'IC charging rusak',
      estimatedDurationMinutes: 120,
    });
    expect(perlu).toEqual(['ticket.diagnose']);
    expect(perlu).not.toContain('ticket.create');
  });

  // Dan ini arah sebaliknya, yang sama-sama salah sebelum perbaikan.
  it('kasir menulis diagnosa TETAP menuntut ticket.diagnose', () => {
    expect(intakePermissionsNeeded(kosong, { diagnosis: 'ditulis kasir' }))
      .toContain('ticket.diagnose');
  });

  it('body campuran menuntut kedua izin, urutannya stabil', () => {
    const perlu = intakePermissionsNeeded(kosong, {
      reportedComplaint: 'mati total',
      diagnosis: 'IC rusak',
    });
    expect(perlu).toEqual(['ticket.create', 'ticket.diagnose']);
  });

  it('tidak mengulang izin yang sama untuk dua kolom sekelompok', () => {
    expect(intakePermissionsNeeded(kosong, {
      reportedComplaint: 'mati total',
      devicePasscode: '1234',
      intakeEstimatedCost: 450000,
    })).toEqual(['ticket.create']);
  });

  // --- Kondisional terhadap PERUBAHAN, bukan terhadap keberadaan kunci ---
  // Pelajaran R1.10-T4: form bisa mengirim seluruh objek tiap simpan, jadi
  // memeriksa "ada di payload" memblokir orang yang tak menyentuh kolom itu.

  it('menyimpan ulang nilai yang sama tidak menuntut izin apa pun', () => {
    const sekarang = { ...kosong, reportedComplaint: 'LCD pecah', diagnosis: 'IC rusak' };
    expect(intakePermissionsNeeded(sekarang, {
      reportedComplaint: 'LCD pecah',
      diagnosis: 'IC rusak',
    })).toEqual([]);
  });

  it('kasir mengirim seluruh objek tapi hanya mengubah keluhan → cuma ticket.create', () => {
    const sekarang = { ...kosong, reportedComplaint: 'LCD pecah', diagnosis: 'IC rusak' };
    expect(intakePermissionsNeeded(sekarang, {
      reportedComplaint: 'LCD pecah + tidak mengisi daya',
      diagnosis: 'IC rusak', // tidak diubah
    })).toEqual(['ticket.create']);
  });

  it('kunci yang bernilai undefined diperlakukan seperti tidak dikirim', () => {
    expect(intakePermissionsNeeded(kosong, { diagnosis: undefined })).toEqual([]);
  });

  // --- Penyamaan bentuk. Tanpa ini, penolakan PALSU. ---

  it('angka dari payload sama dengan numeric string dari DB', () => {
    // Postgres numeric mengembalikan "450000.00"; payload mengirim 450000.
    expect(intakePermissionsNeeded(
      { intakeEstimatedCost: '450000.00' },
      { intakeEstimatedCost: 450000 }
    )).toEqual([]);
  });

  it('angka yang benar-benar berubah tetap menuntut izin', () => {
    expect(intakePermissionsNeeded(
      { intakeEstimatedCost: '450000.00' },
      { intakeEstimatedCost: 500000 }
    )).toEqual(['ticket.create']);
  });

  it('kosong punya tiga wajah dan ketiganya dianggap sama', () => {
    expect(intakePermissionsNeeded({ devicePasscode: null }, { devicePasscode: '' })).toEqual([]);
    expect(intakePermissionsNeeded({ devicePasscode: '' }, { devicePasscode: null })).toEqual([]);
    expect(intakePermissionsNeeded({ diagnosis: null }, { diagnosis: '   ' })).toEqual([]);
  });

  it('mengosongkan nilai yang tadinya terisi tetap menuntut izin', () => {
    expect(intakePermissionsNeeded({ devicePasscode: '1234' }, { devicePasscode: null }))
      .toEqual(['ticket.create']);
  });

  // Teks yang kebetulan diawali angka tidak boleh dinumerikkan — kalau ia
  // jadi NaN, NaN !== NaN membuat SETIAP penyimpanan tampak berubah.
  it('keluhan berupa teks tetap dibandingkan sebagai teks', () => {
    expect(intakePermissionsNeeded(
      { reportedComplaint: '0812 tidak bisa telepon' },
      { reportedComplaint: '0812 tidak bisa telepon' }
    )).toEqual([]);
  });

  it('peta kolom→izin memuat tepat lima kolom yang endpoint terima', () => {
    // Menjaga agar kolom baru di updateIntakeDetailsInput tidak lolos tanpa
    // izin: kalau seseorang menambah kolom di types.ts dan lupa di sini,
    // jumlahnya berubah dan tes ini yang bersuara lebih dulu.
    expect(Object.keys(INTAKE_FIELD_PERMISSIONS).sort()).toEqual([
      'devicePasscode',
      'diagnosis',
      'estimatedDurationMinutes',
      'intakeEstimatedCost',
      'reportedComplaint',
    ]);
  });
});
