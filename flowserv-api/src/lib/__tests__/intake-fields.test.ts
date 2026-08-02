import { describe, it, expect } from 'vitest';
import {
  checkComplaint,
  checkUnitIdentity,
  checkCustomerName,
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
