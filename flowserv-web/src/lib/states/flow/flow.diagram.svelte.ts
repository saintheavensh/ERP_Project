import { API_BASE } from '$lib/api/config';

/**
 * Editor alur servis — bentuk DIAGRAM (dari mana ke mana), bukan daftar baris.
 *
 * Keputusan pemilik (2026-07-27): alur diatur di halaman /flows, digambar
 * sebagai diagram, dan "untuk alur intinya urutannya tidak bisa diubah —
 * konfigurasinya hanya menambahkan QC kemudian melewati tahap print awal".
 *
 * Jadi state ini sengaja TIDAK menyediakan penyusunan ulang bebas. Yang ada
 * cuma tiga tindakan:
 *   1. menyisipkan tahap tambahan di sebuah sambungan (seret dari palet),
 *   2. melepas / memindahkan tahap tambahan itu,
 *   3. mengatur isi tiap tahap (keterangan, kapabilitas, dokumen cetak).
 * Tulang punggungnya terkunci — dan dikunci juga di server
 * (`validateCoreIntegrity`), bukan hanya di layar.
 *
 * Tata letaknya DIHITUNG, bukan diukur dari DOM: pangkat (kolom) tiap tahap =
 * jalur terpanjang dari tahap awal, jalur (baris) = urutan dalam pangkat itu.
 * Dengan begitu percabangan Ditunggu/Disimpan tergambar berdampingan tanpa
 * perlu menunggu render selesai untuk tahu posisinya.
 */

export interface DiagramNode {
  key: string;
  id?: string;
  name: string;
  description: string;
  nodeType: string;
  requiredPermissionId: string | null;
  allowsCharges: boolean;
  requiresDiagnosis: boolean;
  allowsInvoicing: boolean;
  autoPrintDocuments: string[];
  /** Tahap pokok: tak bisa dilepas, urutannya tak bisa ditukar. */
  isCore: boolean;
  /** key tahap-tahap yang boleh dituju dari sini (percabangan). */
  next: string[];
}

export interface LaidOutNode extends DiagramNode {
  x: number;
  y: number;
  rank: number;
}

export interface LaidOutEdge {
  from: string;
  to: string;
  path: string;
  midX: number;
  midY: number;
}

export const NODE_W = 184;
export const NODE_H = 104;
const GAP_X = 88;
const GAP_Y = 32;

export const DOCUMENT_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: 'label', label: 'Label unit', hint: 'Stiker penanda yang ditempel di unit (nomor antrian, keluhan, sandi).' },
  { value: 'tanda_terima', label: 'Nota tanda terima', hint: 'Bukti titip untuk pelanggan yang meninggalkan unitnya.' },
  { value: 'receipt', label: 'Struk', hint: 'Struk thermal transaksi.' },
  { value: 'invoice_a4', label: 'Invoice A4', hint: 'Faktur ukuran A4.' },
];

/**
 * Palet tahap tambahan. Isinya bukan sekadar nama: tiap preset membawa
 * keterangan + kapabilitas yang masuk akal, supaya owner tidak perlu menebak
 * apa yang harus dicentang setelah menyisipkannya.
 */
export interface StagePreset {
  id: string;
  name: string;
  description: string;
  allowsCharges: boolean;
  requiresDiagnosis: boolean;
  allowsInvoicing: boolean;
}

export const STAGE_PRESETS: StagePreset[] = [
  {
    id: 'qc-awal',
    name: 'QC Awal',
    description: 'Cek kondisi unit sebelum dibongkar (nyala/tidak, kelengkapan, kerusakan lain). Bukti awal bila nanti ada klaim dari pelanggan.',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: false,
  },
  {
    id: 'qc-akhir',
    name: 'QC Akhir',
    description: 'Cek hasil perbaikan sebelum diserahkan (unit nyala, keluhan awal hilang), kembalikan sandi/pola ke pelanggan.',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: true,
  },
  {
    id: 'tunggu-sparepart',
    name: 'Menunggu Sparepart',
    description: 'Sparepart belum ada di toko dan harus dipesan dulu. Unit ditahan sampai barangnya datang.',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: false,
  },
  {
    id: 'kustom',
    name: 'Tahap Baru',
    description: '',
    allowsCharges: true, requiresDiagnosis: false, allowsInvoicing: false,
  },
];

export type DragPayload =
  | { kind: 'preset'; preset: StagePreset }
  | { kind: 'node'; key: string };

export class FlowDiagramState {
  token: string;
  templateId = $state('');
  templateName = $state('');
  nodes = $state<DiagramNode[]>([]);

  saving = $state(false);
  errorMsg = $state('');
  successMsg = $state('');
  /** Tahap yang panel pengaturannya sedang terbuka. */
  selectedKey = $state<string | null>(null);
  /** Yang sedang diseret — preset dari palet, atau tahap tambahan yang dipindah. */
  dragging = $state<DragPayload | null>(null);
  /** Sambungan yang sedang di bawah kursor seretan, mis. "a→b". */
  dropTarget = $state<string | null>(null);

  constructor(token: string, template: any, nodes: any[], transitions: any[]) {
    this.token = token;
    this.templateId = template?.id ?? '';
    this.templateName = template?.name ?? '';
    this.nodes = (nodes ?? []).map((n: any) => ({
      key: n.id,
      id: n.id,
      name: n.name,
      description: n.description ?? '',
      nodeType: n.nodeType ?? 'action',
      requiredPermissionId: n.requiredPermissionId ?? null,
      allowsCharges: !!n.allowsCharges,
      requiresDiagnosis: !!n.requiresDiagnosis,
      allowsInvoicing: !!n.allowsInvoicing,
      autoPrintDocuments: Array.isArray(n.autoPrintDocuments) ? [...n.autoPrintDocuments] : [],
      isCore: n.isCore !== false,
      next: (transitions ?? []).filter((t: any) => t.fromNodeId === n.id).map((t: any) => t.toNodeId),
    }));
  }

  node(key: string): DiagramNode | undefined {
    return this.nodes.find((n) => n.key === key);
  }

  nodeName(key: string): string {
    return this.node(key)?.name ?? '(tahap terhapus)';
  }

  get selected(): DiagramNode | undefined {
    return this.selectedKey ? this.node(this.selectedKey) : undefined;
  }

  /** Tahap awal = tak ada tahap lain yang menuju ke sini. */
  get startKeys(): string[] {
    const targeted = new Set(this.nodes.flatMap((n) => n.next));
    return this.nodes.filter((n) => !targeted.has(n.key)).map((n) => n.key);
  }

  get terminalKeys(): string[] {
    return this.nodes.filter((n) => n.next.length === 0).map((n) => n.key);
  }

  // ---------------------------------------------------------------------------
  // Tata letak
  // ---------------------------------------------------------------------------

  /**
   * Pangkat tiap tahap = jalur TERPANJANG dari tahap awal. Dipakai jalur
   * terpanjang, bukan terpendek, supaya jalan pintas (mis. Diagnosis → Selesai
   * saat unit ternyata tak rusak) tidak menarik tahap akhir maju ke kolom dua.
   */
  get ranks(): Map<string, number> {
    const rank = new Map<string, number>(this.nodes.map((n) => [n.key, 0]));
    // Relaksasi berulang, dibatasi jumlah tahap: aman walau graf sempat
    // melingkar saat owner setengah jalan menyunting.
    for (let i = 0; i < this.nodes.length; i++) {
      let changed = false;
      for (const n of this.nodes) {
        for (const to of n.next) {
          if (!rank.has(to)) continue;
          const candidate = (rank.get(n.key) ?? 0) + 1;
          if (candidate > (rank.get(to) ?? 0)) { rank.set(to, candidate); changed = true; }
        }
      }
      if (!changed) break;
    }
    return rank;
  }

  get layout(): LaidOutNode[] {
    const ranks = this.ranks;
    const laneCounter = new Map<number, number>();
    return this.nodes.map((n) => {
      const rank = ranks.get(n.key) ?? 0;
      const lane = laneCounter.get(rank) ?? 0;
      laneCounter.set(rank, lane + 1);
      return { ...n, rank, x: rank * (NODE_W + GAP_X), y: lane * (NODE_H + GAP_Y) };
    });
  }

  get canvasWidth(): number {
    const nodes = this.layout;
    return nodes.length === 0 ? NODE_W : Math.max(...nodes.map((n) => n.x)) + NODE_W;
  }

  get canvasHeight(): number {
    const nodes = this.layout;
    return nodes.length === 0 ? NODE_H : Math.max(...nodes.map((n) => n.y)) + NODE_H;
  }

  get edges(): LaidOutEdge[] {
    const byKey = new Map(this.layout.map((n) => [n.key, n]));
    const out: LaidOutEdge[] = [];
    for (const n of this.layout) {
      for (const toKey of n.next) {
        const to = byKey.get(toKey);
        if (!to) continue;
        const x1 = n.x + NODE_W;
        const y1 = n.y + NODE_H / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_H / 2;
        out.push({
          from: n.key,
          to: toKey,
          path: `M ${x1} ${y1} C ${x1 + GAP_X / 2} ${y1}, ${x2 - GAP_X / 2} ${y2}, ${x2} ${y2}`,
          midX: (x1 + x2) / 2,
          midY: (y1 + y2) / 2,
        });
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Peringatan (cermin validasi server, ditampilkan sebelum Simpan ditekan)
  // ---------------------------------------------------------------------------

  get warnings(): string[] {
    const out: string[] = [];
    if (this.nodes.length < 2) out.push('Alur minimal punya 2 tahap.');
    const starts = this.startKeys;
    if (starts.length === 0) out.push('Tidak ada tahap awal — alurnya melingkar.');
    if (starts.length > 1) {
      out.push(`Ada ${starts.length} tahap awal (${starts.map((k) => this.nodeName(k)).join(', ')}). Harus tepat satu.`);
    }
    if (this.terminalKeys.length === 0) out.push('Tidak ada tahap akhir — tiket tak akan pernah bisa ditutup.');

    // Keterjangkauan: tahap tambahan yang dilepas lalu lupa disambung lagi
    // adalah kesalahan paling mungkin di editor ini.
    if (starts.length === 1) {
      const seen = new Set([starts[0]]);
      const queue = [starts[0]];
      while (queue.length > 0) {
        for (const next of this.node(queue.shift()!)?.next ?? []) {
          if (!seen.has(next)) { seen.add(next); queue.push(next); }
        }
      }
      const orphans = this.nodes.filter((n) => !seen.has(n.key));
      if (orphans.length > 0) {
        out.push(`Tahap tak tersambung: ${orphans.map((n) => n.name).join(', ')}. Seret ke salah satu panah, atau lepas.`);
      }
    }

    if (!this.nodes.some((n) => n.allowsCharges)) {
      out.push('Tak satu pun tahap mengizinkan input biaya — sparepart & jasa tak akan bisa dicatat di mana pun.');
    }
    const invoicing = this.nodes.filter((n) => n.allowsInvoicing);
    if (invoicing.length === 0) {
      out.push('Tak satu pun tahap mengizinkan pembayaran — faktur tak akan bisa dibuat.');
    } else if (invoicing.every((n) => n.next.length === 0)) {
      // Tiket tertutup begitu masuk tahap akhir, jadi menaruh pembayaran hanya
      // di sana berarti kasir menagih setelah tiketnya selesai.
      out.push('Pembayaran hanya diizinkan di tahap akhir. Tiket sudah tertutup saat itu — sebaiknya izinkan juga di tahap sebelumnya.');
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Menyisipkan / melepas tahap tambahan
  // ---------------------------------------------------------------------------

  /** Putuskan `key` dari graf, sambungkan pendahulunya langsung ke penerusnya. */
  private unlink(key: string) {
    const succ = this.node(key)?.next ?? [];
    this.nodes = this.nodes.map((n) => {
      if (!n.next.includes(key)) return n;
      const rest = n.next.filter((k) => k !== key);
      for (const s of succ) if (s !== n.key && !rest.includes(s)) rest.push(s);
      return { ...n, next: rest };
    });
  }

  /** Sisipkan tahap baru dari palet tepat di sambungan `from → to`. */
  insertPreset(preset: StagePreset, fromKey: string, toKey: string) {
    const key = `new-${crypto.randomUUID()}`;
    const created: DiagramNode = {
      key,
      name: preset.name,
      description: preset.description,
      nodeType: 'action',
      requiredPermissionId: null,
      allowsCharges: preset.allowsCharges,
      requiresDiagnosis: preset.requiresDiagnosis,
      allowsInvoicing: preset.allowsInvoicing,
      autoPrintDocuments: [],
      isCore: false,
      next: [toKey],
    };
    const fromIndex = this.nodes.findIndex((n) => n.key === fromKey);
    const rewired = this.nodes.map((n) =>
      n.key === fromKey ? { ...n, next: n.next.map((k) => (k === toKey ? key : k)) } : n
    );
    rewired.splice(fromIndex + 1, 0, created);
    this.nodes = rewired;
    this.selectedKey = key;
    this.successMsg = '';
  }

  /** Pindahkan tahap tambahan yang sudah ada ke sambungan `from → to`. */
  moveToEdge(key: string, fromKey: string, toKey: string) {
    if (key === fromKey || key === toKey) return;
    this.unlink(key);
    this.nodes = this.nodes.map((n) => {
      if (n.key === key) return { ...n, next: [toKey] };
      if (n.key === fromKey) return { ...n, next: n.next.map((k) => (k === toKey ? key : k)) };
      return n;
    });
    this.successMsg = '';
  }

  /** Lepas tahap tambahan; alur menyambung langsung melewatinya. */
  detach(key: string) {
    const target = this.node(key);
    if (!target || target.isCore) return;
    this.unlink(key);
    this.nodes = this.nodes.filter((n) => n.key !== key);
    if (this.selectedKey === key) this.selectedKey = null;
    this.successMsg = '';
  }

  /** Sambungan tempat sebuah tahap tambahan bisa dijatuhkan. */
  handleDrop(fromKey: string, toKey: string) {
    const payload = this.dragging;
    this.dragging = null;
    this.dropTarget = null;
    if (!payload) return;
    if (payload.kind === 'preset') this.insertPreset(payload.preset, fromKey, toKey);
    else this.moveToEdge(payload.key, fromKey, toKey);
  }

  toggleDocument(key: string, doc: string) {
    this.nodes = this.nodes.map((n) => {
      if (n.key !== key) return n;
      const has = n.autoPrintDocuments.includes(doc);
      return {
        ...n,
        autoPrintDocuments: has ? n.autoPrintDocuments.filter((d) => d !== doc) : [...n.autoPrintDocuments, doc],
      };
    });
    this.successMsg = '';
  }

  /**
   * Hapus seluruh alur ini. Server menolak bila alurnya default atau masih
   * dipakai tiket — pesan penolakannya ditampilkan apa adanya, karena di
   * situlah alasannya dijelaskan.
   */
  async remove(): Promise<boolean> {
    this.saving = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/flows/${this.templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (res.status === 204) return true;
      const result = await res.json();
      throw new Error(result.error?.message || 'Gagal menghapus alur');
    } catch (err: any) {
      this.errorMsg = err.message;
      return false;
    } finally {
      this.saving = false;
    }
  }

  async save() {
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';
    try {
      const res = await fetch(`${API_BASE}/flows/${this.templateId}/design`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
        body: JSON.stringify({
          name: this.templateName,
          // `isCore` tidak dikirim — server yang menentukannya (tahap buatan
          // editor selalu tahap tambahan).
          nodes: this.nodes.map((n) => ({
            key: n.key,
            id: n.id,
            name: n.name,
            description: n.description || null,
            nodeType: n.nodeType,
            requiredPermissionId: n.requiredPermissionId,
            allowsCharges: n.allowsCharges,
            requiresDiagnosis: n.requiresDiagnosis,
            allowsInvoicing: n.allowsInvoicing,
            autoPrintDocuments: n.autoPrintDocuments,
          })),
          transitions: this.nodes.flatMap((n) => n.next.map((to) => ({ from: n.key, to }))),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan alur');
      // Tahap baru kini punya id sungguhan. Dua hal HARUS ikut disinkronkan,
      // kalau tidak simpanan berikutnya akan menduplikasi tahap: (1) key/id tiap
      // tahap, dan (2) daftar `next` yang masih menunjuk key sementara
      // ("new-…") milik tahap yang barusan dibuat.
      // Server mengembalikan node terurut sequenceOrder = urutan array ini.
      const saved = result.data.nodes as any[];
      const keyMap = new Map<string, string>();
      this.nodes.forEach((n, i) => { if (saved[i]) keyMap.set(n.key, saved[i].id); });
      this.nodes = this.nodes.map((n, i) => ({
        ...n,
        id: saved[i]?.id ?? n.id,
        key: saved[i]?.id ?? n.key,
        isCore: saved[i]?.isCore ?? n.isCore,
        next: n.next.map((k) => keyMap.get(k) ?? k),
      }));
      if (this.selectedKey) this.selectedKey = keyMap.get(this.selectedKey) ?? this.selectedKey;
      this.successMsg = 'Alur tersimpan. Perubahan langsung berlaku untuk tiket baru.';
    } catch (err: any) {
      this.errorMsg = err.message;
    } finally {
      this.saving = false;
    }
  }
}
