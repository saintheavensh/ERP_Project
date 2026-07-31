import { describe, it, expect } from 'vitest';
import { checkPasscode, passcodePrintLabel, MIN_PASSCODE_LENGTH } from '../passcode';

// R1.5C — pemilik (uji-R1 A5): "tambahkan validasi untuk pin dan polanya
// minimal 4 huruf".
//
// Yang membuat ini tidak sesederhana `length >= 4`: satu field teks menyimpan
// dua bentuk, jadi "panjang" berarti dua hal berbeda.

describe('checkPasscode — boleh kosong', () => {
  // Memaksa staf mengarang sandi untuk unit yang tidak terkunci jauh lebih
  // buruk daripada membiarkannya kosong: yang tercatat jadi bohong.
  it.each([undefined, null, ''])('menerima nilai kosong (%s)', (v) => {
    expect(checkPasscode(v).valid).toBe(true);
  });
});

describe('checkPasscode — PIN/sandi', () => {
  it('menolak PIN lebih pendek dari minimum', () => {
    const hasil = checkPasscode('123');
    expect(hasil.valid).toBe(false);
    if (!hasil.valid) {
      expect(hasil.code).toBe('PASSCODE_TOO_SHORT');
      expect(hasil.message).toContain(String(MIN_PASSCODE_LENGTH));
    }
  });

  it('menerima PIN tepat sepanjang minimum', () => {
    expect(checkPasscode('1234').valid).toBe(true);
  });

  it('menerima sandi huruf, bukan hanya angka', () => {
    // Pemilik menulis "minimal 4 huruf" — sandi alfanumerik memang dipakai.
    expect(checkPasscode('rahasia').valid).toBe(true);
  });

  it('spasi di tepi tidak dihitung sebagai panjang', () => {
    // "12  " terlihat 4 karakter tapi hanya 2 yang berarti; menerimanya
    // berarti mencatat sandi yang tak bisa dipakai membuka unit.
    expect(checkPasscode('12  ').valid).toBe(false);
  });
});

describe('checkPasscode — pola', () => {
  it('menolak pola kurang dari 4 titik meski string-nya panjang', () => {
    // Justru kasus ini yang membuat hitungan `.length` mentah salah:
    // "pola:1-2" panjangnya 8 karakter, tapi hanya 2 titik.
    expect('pola:1-2'.length).toBeGreaterThan(MIN_PASSCODE_LENGTH);
    const hasil = checkPasscode('pola:1-2');
    expect(hasil.valid).toBe(false);
    if (!hasil.valid) {
      expect(hasil.code).toBe('PASSCODE_TOO_SHORT');
      expect(hasil.message).toContain('titik');
    }
  });

  it('menerima pola 4 titik', () => {
    expect(checkPasscode('pola:1-2-3-6').valid).toBe(true);
  });

  it('menerima pola panjang', () => {
    expect(checkPasscode('pola:1-2-3-6-9-8-7-4').valid).toBe(true);
  });

  it('menolak pola kosong', () => {
    expect(checkPasscode('pola:').valid).toBe(false);
  });

  it('menolak pola dengan titik di luar 1..9', () => {
    const hasil = checkPasscode('pola:1-2-3-99');
    expect(hasil.valid).toBe(false);
    if (!hasil.valid) expect(hasil.code).toBe('PASSCODE_MALFORMED');
  });

  it('menolak pola yang tidak terbaca', () => {
    const hasil = checkPasscode('pola:a-b-c-d');
    expect(hasil.valid).toBe(false);
    if (!hasil.valid) expect(hasil.code).toBe('PASSCODE_MALFORMED');
  });
});

describe('passcodePrintLabel tidak berubah oleh R1.5C', () => {
  // Regresi: validasi baru tidak boleh menyentuh apa yang tercetak di label.
  it('pola dicetak sebagai urutan titik', () => {
    expect(passcodePrintLabel('pola:1-2-3-6')).toBe('Pola: 1-2-3-6');
  });
  it('PIN dicetak apa adanya', () => {
    expect(passcodePrintLabel('1234')).toBe('Sandi: 1234');
  });
  it('kosong tidak mencetak apa pun', () => {
    expect(passcodePrintLabel('')).toBe('');
  });
});
