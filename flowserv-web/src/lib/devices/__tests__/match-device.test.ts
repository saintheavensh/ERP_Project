import { describe, it, expect } from 'vitest';
import { cocokSemuaKata, cariKatalog } from '../match-device';

/**
 * R1.10-T5 — pencarian katalog device.
 *
 * Tes pertama adalah kalimat pemilik sendiri, apa adanya (uji-R1.9 D2):
 * "samsung a20" HARUS menemukan "Samsung Galaxy A20". Sebelum R1.10 ia tidak
 * menemukannya, dan itu bukan kelemahan samar: kata "Galaxy" yang dilompati
 * sudah cukup menggagalkan seluruh pencarian.
 */

const KATALOG = [
  { brandName: 'Samsung', modelName: 'Galaxy A20' },
  { brandName: 'Samsung', modelName: 'Galaxy A10' },
  { brandName: 'Samsung', modelName: 'Galaxy S23 Ultra' },
  { brandName: 'Xiaomi', modelName: 'Redmi Note 12' },
  { brandName: 'Apple', modelName: 'iPhone 13 Pro' },
];

describe('cocokSemuaKata', () => {
  it('menemukan "samsung a20" di "Samsung Galaxy A20" — keluhan asli pemilik', () => {
    expect(cocokSemuaKata('Samsung Galaxy A20', 'samsung a20')).toBe(true);
  });

  it('urutan kata bebas', () => {
    expect(cocokSemuaKata('Samsung Galaxy A20', 'a20 samsung')).toBe(true);
  });

  it('mengetik separuh tetap berguna (awalan kata)', () => {
    expect(cocokSemuaKata('Samsung Galaxy A20', 'sam a2')).toBe(true);
  });

  it('tidak peduli huruf besar/kecil', () => {
    expect(cocokSemuaKata('Samsung Galaxy A20', 'SAMSUNG GALAXY')).toBe(true);
  });

  it('spasi berlebih tidak merusak pencarian', () => {
    expect(cocokSemuaKata('Samsung Galaxy A20', '  samsung   a20  ')).toBe(true);
  });

  it('satu kata yang tidak ada membuat seluruhnya tidak cocok', () => {
    // Ini yang membedakan "semua kata" dari "ada satu kata yang cocok". Tanpa
    // aturan ini, mencari "samsung iphone" akan memunculkan kedua merek.
    expect(cocokSemuaKata('Samsung Galaxy A20', 'samsung iphone')).toBe(false);
  });

  it('tidak cocok di TENGAH kata — "a20" bukan bagian dari "za20x"', () => {
    // Kalau dicocokkan dengan includes() biasa, kata kunci pendek akan
    // memunculkan hasil acak yang membingungkan.
    expect(cocokSemuaKata('Merek za20x', 'a20')).toBe(false);
  });

  it('kata kunci kosong tidak cocok dengan apa pun', () => {
    expect(cocokSemuaKata('Samsung Galaxy A20', '')).toBe(false);
    expect(cocokSemuaKata('Samsung Galaxy A20', '   ')).toBe(false);
  });
});

describe('cariKatalog', () => {
  it('menyaring lintas merek dan model sekaligus', () => {
    const hasil = cariKatalog(KATALOG, 'samsung a20');
    expect(hasil).toHaveLength(1);
    expect(hasil[0].modelName).toBe('Galaxy A20');
  });

  it('kata kunci merek saja mengembalikan semua model merek itu', () => {
    expect(cariKatalog(KATALOG, 'samsung')).toHaveLength(3);
  });

  it('kata kunci kosong mengembalikan daftar kosong, bukan seluruh katalog', () => {
    // Halaman katalog menampilkan kartu per merek saat kotak cari kosong;
    // mengembalikan semuanya di sini akan memunculkan 1.784 baris datar.
    expect(cariKatalog(KATALOG, '')).toEqual([]);
    expect(cariKatalog(KATALOG, '   ')).toEqual([]);
  });

  it('"galaxy 13" tidak mencampur iPhone 13 ke hasil Samsung', () => {
    expect(cariKatalog(KATALOG, 'galaxy 13')).toEqual([]);
  });
});
