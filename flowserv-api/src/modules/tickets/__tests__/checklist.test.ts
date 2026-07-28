import { describe, it, expect } from 'vitest';
import { parseChecklistItems, mergeChecklist, checklistProgress } from '../checklist';

// Daftar periksa QC. Yang diuji di sini bukan "centangnya tersimpan", melainkan
// bahwa BUKTI-nya tetap utuh saat owner mengubah daftarnya — itu satu-satunya
// alasan fitur ini ada ("evidence kepada pelanggan").

const answer = (itemId: string, label: string, checked = true) => ({
  itemId, label, checked, note: null, checkedByName: 'Budi', checkedAt: '2026-07-27T00:00:00Z',
});

describe('parseChecklistItems', () => {
  it('mengabaikan isi jsonb yang bentuknya bukan item', () => {
    expect(parseChecklistItems([
      { id: 'a', label: 'Layar nyala' },
      { id: 'b' },              // tanpa label
      'bukan objek',
      null,
      { label: 'tanpa id' },
    ])).toEqual([{ id: 'a', label: 'Layar nyala' }]);
  });

  it('mengembalikan daftar kosong untuk nilai yang bukan array', () => {
    expect(parseChecklistItems(null)).toEqual([]);
    expect(parseChecklistItems({})).toEqual([]);
  });
});

describe('mergeChecklist', () => {
  it('mengikuti urutan template dan menandai yang belum diperiksa', () => {
    const lines = mergeChecklist(
      [{ id: 'a', label: 'Layar nyala' }, { id: 'b', label: 'Kamera oke' }],
      [answer('b', 'Kamera oke')]
    );
    expect(lines.map((l) => l.itemId)).toEqual(['a', 'b']);
    expect(lines[0].checked).toBe(false);
    expect(lines[1].checked).toBe(true);
    expect(lines[1].checkedByName).toBe('Budi');
  });

  it('memakai kalimat TERBARU dari template untuk item yang masih ada', () => {
    // Owner memperbaiki kalimatnya; teknisi harus membaca yang baru.
    const lines = mergeChecklist(
      [{ id: 'a', label: 'Layar nyala, tidak ada dead pixel' }],
      [answer('a', 'Layar nyala')]
    );
    expect(lines[0].label).toBe('Layar nyala, tidak ada dead pixel');
  });

  it('tetap menampilkan jawaban atas item yang sudah dihapus dari template', () => {
    // Inti fitur: merapikan daftar periksa TIDAK BOLEH menghapus bukti yang
    // sudah diberikan ke pelanggan.
    const lines = mergeChecklist(
      [{ id: 'a', label: 'Layar nyala' }],
      [answer('a', 'Layar nyala'), answer('lama', 'Tombol home berfungsi')]
    );
    expect(lines).toHaveLength(2);
    const removed = lines.find((l) => l.itemId === 'lama')!;
    expect(removed.removedFromTemplate).toBe(true);
    // ...dengan kalimat SIMPANAN, karena template tak lagi punya kalimatnya.
    expect(removed.label).toBe('Tombol home berfungsi');
  });
});

describe('checklistProgress', () => {
  it('menghitung hanya item yang masih ada di template', () => {
    const lines = mergeChecklist(
      [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
      [answer('a', 'A'), answer('lama', 'Lama')]
    );
    expect(checklistProgress(lines)).toEqual({ checked: 1, total: 3 });
  });
});
