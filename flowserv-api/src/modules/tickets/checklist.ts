/**
 * Daftar periksa per tahap (QC).
 *
 * Pemilik memakai QC "untuk operasional dan evidence kepada pelanggan", jadi
 * yang penting bukan sekadar centangnya, melainkan bahwa buktinya tetap utuh:
 * item boleh ditambah/dikurangi kapan saja di template, tanpa mengubah bunyi
 * bukti tiket yang sudah lewat.
 *
 * Dua fungsi murni di bawah adalah seluruh aturannya, dipisah dari DB supaya
 * bisa diuji langsung — pola yang sama dengan evaluateTransition/evaluateRbac.
 */

export interface ChecklistItemDef {
  id: string;
  label: string;
}

export interface ChecklistAnswer {
  itemId: string;
  label: string;
  checked: boolean;
  note: string | null;
  checkedByName?: string | null;
  checkedAt?: string | null;
}

export interface ChecklistLine extends ChecklistAnswer {
  /** true = item ini sudah tidak ada lagi di template, tapi jawabannya tercatat. */
  removedFromTemplate: boolean;
}

/** Bentuk `flow_nodes.checklist_items` yang tersimpan bisa apa saja (jsonb). */
export function parseChecklistItems(raw: unknown): ChecklistItemDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is ChecklistItemDef =>
      !!i && typeof i === 'object' && typeof (i as any).id === 'string' && typeof (i as any).label === 'string')
    .map((i) => ({ id: i.id, label: i.label }));
}

/**
 * Gabungkan definisi tahap dengan jawaban yang sudah tersimpan.
 *
 * Urutan mengikuti template (itu urutan kerja yang dimaksud owner). Jawaban
 * atas item yang sudah DIHAPUS dari template tetap ikut ditampilkan di bawah,
 * ditandai `removedFromTemplate` — menghilangkannya diam-diam berarti bukti
 * yang pernah diberikan ke pelanggan lenyap begitu owner merapikan daftarnya.
 */
export function mergeChecklist(
  items: ChecklistItemDef[],
  saved: ChecklistAnswer[]
): ChecklistLine[] {
  const savedById = new Map(saved.map((a) => [a.itemId, a]));

  const lines: ChecklistLine[] = items.map((item) => {
    const answer = savedById.get(item.id);
    return {
      itemId: item.id,
      // Label dari TEMPLATE untuk item yang masih ada: kalau owner memperbaiki
      // kalimatnya, teknisi harus membaca kalimat yang baru.
      label: item.label,
      checked: answer?.checked ?? false,
      note: answer?.note ?? null,
      checkedByName: answer?.checkedByName ?? null,
      checkedAt: answer?.checkedAt ?? null,
      removedFromTemplate: false,
    };
  });

  const known = new Set(items.map((i) => i.id));
  for (const answer of saved) {
    if (known.has(answer.itemId)) continue;
    // Label SIMPANAN untuk item yang sudah dihapus — template tak lagi punya
    // kalimatnya, dan itulah gunanya menyalin label saat menyimpan.
    lines.push({ ...answer, removedFromTemplate: true });
  }

  return lines;
}

/** Ringkasan untuk lencana di daftar/tiket: "3/5 diperiksa". */
export function checklistProgress(lines: ChecklistLine[]): { checked: number; total: number } {
  const active = lines.filter((l) => !l.removedFromTemplate);
  return { checked: active.filter((l) => l.checked).length, total: active.length };
}
