import { API_BASE } from '$lib/api/config';

/**
 * Tahap B / Phase 7.1 — state editor alur servis.
 *
 * Bekerja atas SALINAN rancangan di memori, lalu menyimpannya sekaligus lewat
 * `PUT /v1/flows/:id/design`. Alasannya sama dengan di backend: menyusun ulang
 * tahap sambil mengubah percabangan harus atomik — kalau tiap seretan langsung
 * disimpan, alur bisa sempat berada dalam keadaan tak sah (mis. dua tahap awal)
 * yang saat itu juga dipakai tiket berjalan.
 */

export interface BuilderNode {
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
  /** key tahap-tahap yang boleh dituju dari sini (percabangan). */
  next: string[];
}

export const DOCUMENT_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: 'label', label: 'Label unit', hint: 'Stiker penanda yang ditempel di unit (nomor antrian, keluhan, sandi).' },
  { value: 'tanda_terima', label: 'Nota tanda terima', hint: 'Bukti titip untuk pelanggan yang meninggalkan unitnya.' },
  { value: 'receipt', label: 'Struk', hint: 'Struk thermal transaksi.' },
  { value: 'invoice_a4', label: 'Invoice A4', hint: 'Faktur ukuran A4.' },
];

export class FlowBuilderState {
  token: string;
  templateId = $state('');
  templateName = $state('');
  nodes = $state<BuilderNode[]>([]);

  saving = $state(false);
  errorMsg = $state('');
  successMsg = $state('');
  /** Indeks tahap yang sedang diseret — dipakai untuk umpan balik visual. */
  draggingIndex = $state<number | null>(null);

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
      next: (transitions ?? []).filter((t: any) => t.fromNodeId === n.id).map((t: any) => t.toNodeId),
    }));
  }

  /** Tahap awal = tak ada tahap lain yang menuju ke sini. */
  get startKeys(): string[] {
    const targeted = new Set(this.nodes.flatMap((n) => n.next));
    return this.nodes.filter((n) => !targeted.has(n.key)).map((n) => n.key);
  }

  get terminalKeys(): string[] {
    return this.nodes.filter((n) => n.next.length === 0).map((n) => n.key);
  }

  /**
   * Peringatan yang sama dengan validasi backend, dihitung ulang di klien
   * supaya owner melihatnya SEBELUM menekan Simpan — backend tetap penjaga
   * sebenarnya (`validateFlowDesign`).
   */
  get warnings(): string[] {
    const out: string[] = [];
    if (this.nodes.length < 2) out.push('Alur minimal punya 2 tahap.');
    const starts = this.startKeys;
    if (starts.length === 0) out.push('Tidak ada tahap awal — alurnya melingkar.');
    if (starts.length > 1) {
      const names = this.nodes.filter((n) => starts.includes(n.key)).map((n) => n.name);
      out.push(`Ada ${starts.length} tahap awal (${names.join(', ')}). Harus tepat satu.`);
    }
    if (this.terminalKeys.length === 0) out.push('Tidak ada tahap akhir — tiket tak akan pernah bisa ditutup.');
    if (!this.nodes.some((n) => n.allowsCharges)) {
      out.push('Tak satu pun tahap mengizinkan input biaya — sparepart & jasa tak akan bisa dicatat di mana pun.');
    }
    if (!this.nodes.some((n) => n.allowsInvoicing)) {
      out.push('Tak satu pun tahap mengizinkan pembayaran — faktur tak akan bisa dibuat.');
    }
    return out;
  }

  nodeName(key: string): string {
    return this.nodes.find((n) => n.key === key)?.name ?? '(tahap terhapus)';
  }

  // ---- Drag & drop (HTML5 native, pola yang sama dengan papan Kanban P2) ----

  startDrag(index: number) {
    this.draggingIndex = index;
  }

  endDrag() {
    this.draggingIndex = null;
  }

  /** Pindahkan tahap yang sedang diseret ke posisi `targetIndex`. */
  dropOn(targetIndex: number) {
    const from = this.draggingIndex;
    this.draggingIndex = null;
    if (from === null || from === targetIndex) return;
    const next = [...this.nodes];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    this.nodes = next;
    this.successMsg = '';
  }

  /** Tombol naik/turun — jalur yang sama dengan seret, untuk layar sentuh. */
  move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= this.nodes.length) return;
    const next = [...this.nodes];
    [next[index], next[target]] = [next[target], next[index]];
    this.nodes = next;
    this.successMsg = '';
  }

  addNode() {
    const key = `new-${crypto.randomUUID()}`;
    this.nodes = [...this.nodes, {
      key,
      name: 'Tahap Baru',
      description: '',
      nodeType: 'action',
      requiredPermissionId: null,
      allowsCharges: false,
      requiresDiagnosis: false,
      allowsInvoicing: false,
      autoPrintDocuments: [],
      next: [],
    }];
    this.successMsg = '';
  }

  removeNode(key: string) {
    this.nodes = this.nodes
      .filter((n) => n.key !== key)
      .map((n) => ({ ...n, next: n.next.filter((k) => k !== key) }));
    this.successMsg = '';
  }

  toggleNext(fromKey: string, toKey: string) {
    this.nodes = this.nodes.map((n) => {
      if (n.key !== fromKey) return n;
      const has = n.next.includes(toKey);
      return { ...n, next: has ? n.next.filter((k) => k !== toKey) : [...n.next, toKey] };
    });
    this.successMsg = '';
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
      // Node baru kini punya id sungguhan. Dua hal HARUS ikut disinkronkan,
      // kalau tidak simpanan berikutnya akan menduplikasi node: (1) key/id tiap
      // node, dan (2) daftar `next` yang masih menunjuk key sementara
      // ("new-…") milik node yang barusan dibuat.
      // Server mengembalikan node terurut sequenceOrder = urutan array ini.
      const saved = result.data.nodes as any[];
      const keyMap = new Map<string, string>();
      this.nodes.forEach((n, i) => { if (saved[i]) keyMap.set(n.key, saved[i].id); });
      this.nodes = this.nodes.map((n, i) => ({
        ...n,
        id: saved[i]?.id ?? n.id,
        key: saved[i]?.id ?? n.key,
        next: n.next.map((k) => keyMap.get(k) ?? k),
      }));
      this.successMsg = 'Alur tersimpan. Perubahan langsung berlaku untuk tiket baru.';
    } catch (err: any) {
      this.errorMsg = err.message;
    } finally {
      this.saving = false;
    }
  }
}
