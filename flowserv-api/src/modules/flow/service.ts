import { db } from '../../db/connection';
import { flowTemplates, flowNodes, flowTransitions, serviceTickets, ticketStageHistory } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import type { FlowDesignInput, FlowDesignNodeInput, CreateFlowTemplateInput } from './types';

/**
 * Tahap B — Phase 7.1 (Flow Template Builder).
 *
 * Sejak alur servis benar-benar dikendalikan template (kolom kapabilitas di
 * flow_nodes), menyunting template = menyunting cara kerja toko. Karena itu
 * validasi di bawah bukan formalitas: alur yang rusak akan langsung menghentikan
 * tiket yang sedang berjalan.
 */

export interface FlowDesignIssue {
  code: string;
  message: string;
}

/**
 * Validasi murni (tanpa DB) atas bentuk graf alur — dipisah supaya bisa diuji
 * langsung, mengikuti pola evaluateTransition()/evaluateRbac() di codebase ini.
 *
 * Tiga aturan yang benar-benar penting:
 *  1. tepat SATU tahap awal — tiket harus tahu di mana mulai; dua tahap awal
 *     membuat pilihan itu tak deterministik.
 *  2. minimal satu tahap akhir — tanpa itu tiket tak pernah bisa ditutup
 *     (mesin alur menutup tiket saat masuk node tanpa transisi keluar).
 *  3. setiap tahap terjangkau dari tahap awal — tahap yatim tak akan pernah
 *     dilalui siapa pun, dan biasanya itu percabangan yang lupa disambung.
 */
export function validateFlowDesign(input: FlowDesignInput): FlowDesignIssue[] {
  const issues: FlowDesignIssue[] = [];
  const keys = new Set(input.nodes.map((n) => n.key));

  if (keys.size !== input.nodes.length) {
    issues.push({ code: 'DUPLICATE_NODE_KEY', message: 'Ada tahap dengan kunci ganda' });
  }

  for (const t of input.transitions) {
    if (!keys.has(t.from) || !keys.has(t.to)) {
      issues.push({ code: 'UNKNOWN_TRANSITION_NODE', message: 'Ada perpindahan yang menunjuk tahap tidak dikenal' });
      return issues; // sisa pemeriksaan tak bermakna bila graf tak konsisten
    }
    if (t.from === t.to) {
      issues.push({ code: 'SELF_TRANSITION', message: 'Sebuah tahap tidak boleh berpindah ke dirinya sendiri' });
    }
  }

  const hasIncoming = new Set(input.transitions.map((t) => t.to));
  const startNodes = input.nodes.filter((n) => !hasIncoming.has(n.key));
  if (startNodes.length === 0) {
    issues.push({ code: 'NO_START_NODE', message: 'Tidak ada tahap awal — setiap tahap punya perpindahan masuk, jadi alur ini melingkar' });
  } else if (startNodes.length > 1) {
    issues.push({
      code: 'MULTIPLE_START_NODES',
      message: `Ada ${startNodes.length} tahap awal (${startNodes.map((n) => n.name).join(', ')}). Alur harus punya tepat satu titik mulai.`,
    });
  }

  const hasOutgoing = new Set(input.transitions.map((t) => t.from));
  if (!input.nodes.some((n) => !hasOutgoing.has(n.key))) {
    issues.push({ code: 'NO_TERMINAL_NODE', message: 'Tidak ada tahap akhir — tiket tak akan pernah bisa ditutup' });
  }

  // Keterjangkauan dari tahap awal (hanya bila titik mulainya tunggal & jelas).
  if (startNodes.length === 1) {
    const adjacency = new Map<string, string[]>();
    for (const t of input.transitions) {
      adjacency.set(t.from, [...(adjacency.get(t.from) ?? []), t.to]);
    }
    const seen = new Set<string>([startNodes[0].key]);
    const queue = [startNodes[0].key];
    while (queue.length > 0) {
      for (const next of adjacency.get(queue.shift()!) ?? []) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    const orphans = input.nodes.filter((n) => !seen.has(n.key));
    if (orphans.length > 0) {
      issues.push({
        code: 'UNREACHABLE_NODE',
        message: `Tahap tak terjangkau dari awal: ${orphans.map((n) => n.name).join(', ')}. Sambungkan atau hapus.`,
      });
    }
  }

  return issues;
}

/** Bentuk minimal tahap tersimpan yang dibutuhkan pemeriksaan tulang punggung. */
export interface ExistingNodeSnapshot {
  id: string;
  name: string;
  isCore: boolean;
  /**
   * Urutan tahap yang tersimpan. WAJIB ada: urutan inti yang "benar" ditentukan
   * kolom ini, bukan urutan baris yang kebetulan dikembalikan SELECT. Diurutkan
   * di dalam fungsi ini supaya pemanggil tak bisa lupa — sempat menjadi bug
   * nyata: tanpa ORDER BY, penyisipan tahap yang sah ditolak
   * CORE_STAGE_REORDERED karena urutan pembandingnya acak.
   */
  sequenceOrder: number;
}

/**
 * Jaga TULANG PUNGGUNG alur (keputusan pemilik 2026-07-27).
 *
 * "Untuk alur intinya urutannya tidak bisa diubah, konfigurasinya hanya
 * menambahkan QC kemudian melewati tahap print awal." Editor diagram memang
 * tidak menyediakan tombol untuk melanggar itu — tapi UI bukan penjaga. Tanpa
 * pemeriksaan di sini, klaim "urutan inti terkunci" hanya berlaku selama tak
 * ada yang memanggil API-nya langsung.
 *
 * Tiga aturan, semuanya soal tahap inti saja (tahap tambahan bebas):
 *  1. tahap inti tak boleh hilang;
 *  2. urutan relatif antar tahap inti harus tetap;
 *  3. tiap sambungan inti->inti yang lama harus masih bisa ditempuh — boleh
 *     lewat tahap tambahan (itulah gunanya menyisipkan QC), tapi tidak boleh
 *     dialihkan ke tahap inti lain.
 */
export function validateCoreIntegrity(
  existingNodes: ExistingNodeSnapshot[],
  existingTransitions: Array<{ fromNodeId: string; toNodeId: string }>,
  input: FlowDesignInput
): FlowDesignIssue[] {
  const issues: FlowDesignIssue[] = [];
  const coreOrder = existingNodes
    .filter((n) => n.isCore)
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  if (coreOrder.length === 0) return issues; // alur lama tanpa tahap inti: tak ada yang dijaga

  const nameById = new Map(existingNodes.map((n) => [n.id, n.name]));
  const inputIds = new Set(input.nodes.map((n) => n.id).filter(Boolean) as string[]);

  const missing = coreOrder.filter((n) => !inputIds.has(n.id));
  if (missing.length > 0) {
    issues.push({
      code: 'CORE_STAGE_REMOVED',
      message: `Tahap inti ${missing.map((n) => n.name).join(', ')} tidak boleh dihapus — itu urutan kerja pokok toko. Yang bisa dilepas hanya tahap tambahan seperti QC.`,
    });
    return issues; // aturan 2 & 3 tak bermakna bila tulang punggungnya sudah tak utuh
  }

  const coreIds = new Set(coreOrder.map((n) => n.id));
  const inputCoreSequence = input.nodes.filter((n) => n.id && coreIds.has(n.id)).map((n) => n.id!);
  const expected = coreOrder.map((n) => n.id);
  if (inputCoreSequence.join('|') !== expected.join('|')) {
    issues.push({
      code: 'CORE_STAGE_REORDERED',
      message: `Urutan tahap inti tidak bisa diubah (${expected.map((id) => nameById.get(id)).join(' → ')}). Tambahkan tahap baru di antaranya bila perlu langkah lain.`,
    });
  }

  // Aturan 3: telusuri graf baru, hanya boleh singgah di tahap non-inti.
  const idByKey = new Map(input.nodes.map((n) => [n.key, n.id ?? null]));
  const adjacency = new Map<string, string[]>();
  for (const t of input.transitions) {
    adjacency.set(t.from, [...(adjacency.get(t.from) ?? []), t.to]);
  }
  const keyById = new Map(input.nodes.filter((n) => n.id).map((n) => [n.id!, n.key]));

  const reachesCore = (fromKey: string, targetId: string): boolean => {
    const seen = new Set<string>();
    const queue = [...(adjacency.get(fromKey) ?? [])];
    while (queue.length > 0) {
      const key = queue.shift()!;
      if (seen.has(key)) continue;
      seen.add(key);
      const id = idByKey.get(key) ?? null;
      if (id === targetId) return true;
      // Berhenti di tahap inti lain — melewatinya berarti sambungan lama sudah
      // dialihkan, bukan sekadar disisipi tahap tambahan.
      if (id && coreIds.has(id)) continue;
      queue.push(...(adjacency.get(key) ?? []));
    }
    return false;
  };

  const broken = existingTransitions.filter(
    (t) =>
      coreIds.has(t.fromNodeId) &&
      coreIds.has(t.toNodeId) &&
      !reachesCore(keyById.get(t.fromNodeId) ?? '', t.toNodeId)
  );
  if (broken.length > 0) {
    const pairs = broken.map((t) => `${nameById.get(t.fromNodeId)} → ${nameById.get(t.toNodeId)}`);
    issues.push({
      code: 'CORE_PATH_BROKEN',
      message: `Sambungan inti ${pairs.join(', ')} terputus. Tahap tambahan boleh disisipkan di antaranya, tapi jalurnya harus tetap sampai.`,
    });
  }

  return issues;
}

export async function createFlowTemplate(tenantId: string, input: CreateFlowTemplateInput) {
  const [template] = await db.insert(flowTemplates).values({
    tenantId,
    name: input.name,
    domain: input.domain,
    // Template baru TIDAK otomatis jadi default — mengganti default berarti
    // mengubah alur setiap tiket baru, keputusan yang harus disengaja.
    isDefault: false,
  }).returning();
  return template;
}

/**
 * Simpan seluruh rancangan alur secara atomik.
 *
 * Yang paling berbahaya di sini adalah MENGHAPUS tahap: `service_tickets`
 * menunjuk `currentNodeId` dan `ticket_stage_history` menyimpan jejak tiap
 * tahap yang pernah dilewati. Menghapus tahap yang masih dipakai akan
 * melanggar foreign key — atau lebih buruk, memutus riwayat tiket lama.
 * Karena itu dijawab 422 dengan menyebut tahap mana yang menghalangi, bukan
 * 500 dari database.
 */
export async function saveFlowDesign(tenantId: string, templateId: string, input: FlowDesignInput) {
  const issues = validateFlowDesign(input);
  if (issues.length > 0) {
    throw new BusinessError('INVALID_FLOW_DESIGN', issues[0].message, 422, issues);
  }

  return db.transaction(async (tx) => {
    const [template] = await tx
      .select()
      .from(flowTemplates)
      .where(and(eq(flowTemplates.id, templateId), eq(flowTemplates.tenantId, tenantId)));
    if (!template) throw new BusinessError('NOT_FOUND', 'Flow template not found', 404);

    // ORDER BY penting: urutan inti dibandingkan terhadap daftar ini.
    const existing = await tx.select().from(flowNodes)
      .where(eq(flowNodes.flowTemplateId, templateId))
      .orderBy(flowNodes.sequenceOrder);
    const existingIds = new Set(existing.map((n) => n.id));

    // Node yang dikirim membawa `id` tapi bukan milik template ini = payload
    // salah/tercampur; tolak alih-alih diam-diam memindahkan node antar template.
    for (const node of input.nodes) {
      if (node.id && !existingIds.has(node.id)) {
        throw new BusinessError('NODE_NOT_IN_TEMPLATE', `Tahap "${node.name}" bukan milik alur ini`, 422);
      }
    }

    // Tulang punggung alur dijaga SEBELUM apa pun ditulis — lihat
    // validateCoreIntegrity(). Transisi lama dibaca di sini karena aturan
    // ketiganya membandingkan sambungan inti lama dengan graf baru.
    const existingNodeIdList = existing.map((n) => n.id);
    const priorTransitions = existingNodeIdList.length > 0
      ? await tx.select().from(flowTransitions).where(inArray(flowTransitions.fromNodeId, existingNodeIdList))
      : [];
    const coreIssues = validateCoreIntegrity(existing, priorTransitions, input);
    if (coreIssues.length > 0) {
      throw new BusinessError(coreIssues[0].code, coreIssues[0].message, 422, coreIssues);
    }

    const keptIds = new Set(input.nodes.map((n) => n.id).filter(Boolean) as string[]);
    const removedIds = existing.filter((n) => !keptIds.has(n.id)).map((n) => n.id);

    if (removedIds.length > 0) {
      const [inUseTickets, inUseHistory] = await Promise.all([
        tx.select({ nodeId: serviceTickets.currentNodeId }).from(serviceTickets)
          .where(inArray(serviceTickets.currentNodeId, removedIds)),
        tx.select({ nodeId: ticketStageHistory.nodeId }).from(ticketStageHistory)
          .where(inArray(ticketStageHistory.nodeId, removedIds)),
      ]);
      const blocked = new Set<string>([
        ...inUseTickets.map((r) => r.nodeId).filter(Boolean) as string[],
        ...inUseHistory.map((r) => r.nodeId),
      ]);
      if (blocked.size > 0) {
        const names = existing.filter((n) => blocked.has(n.id)).map((n) => n.name);
        throw new BusinessError(
          'NODE_IN_USE',
          `Tahap ${names.join(', ')} tidak bisa dihapus karena masih dipakai tiket (atau tercatat di riwayat tiket). Ganti namanya bila ingin mengubah maksudnya.`,
          422
        );
      }
    }

    if (input.name && input.name !== template.name) {
      await tx.update(flowTemplates).set({ name: input.name }).where(eq(flowTemplates.id, templateId));
    }

    // Transisi dihapus lebih dulu: keduanya menunjuk node, jadi node tak bisa
    // dihapus/ditulis ulang selama transisi lama masih menunjuknya.
    if (existingNodeIdList.length > 0) {
      await tx.delete(flowTransitions).where(inArray(flowTransitions.fromNodeId, existingNodeIdList));
    }

    // Upsert node; sequenceOrder = urutan array (hasil drag-and-drop).
    const keyToId = new Map<string, string>();
    for (const [index, node] of input.nodes.entries()) {
      const values = {
        name: node.name,
        description: node.description ?? null,
        sequenceOrder: index + 1,
        nodeType: node.nodeType,
        requiredPermissionId: node.requiredPermissionId ?? null,
        allowsCharges: node.allowsCharges,
        requiresDiagnosis: node.requiresDiagnosis,
        allowsInvoicing: node.allowsInvoicing,
        autoPrintDocuments: node.autoPrintDocuments,
      };
      if (node.id) {
        await tx.update(flowNodes).set(values).where(eq(flowNodes.id, node.id));
        keyToId.set(node.key, node.id);
      } else {
        // `isCore` sengaja tidak diambil dari payload: tahap yang dibuat lewat
        // editor selalu tahap tambahan, sehingga selalu bisa dilepas lagi.
        const [created] = await tx.insert(flowNodes)
          .values({ ...values, flowTemplateId: templateId, isCore: false })
          .returning({ id: flowNodes.id });
        keyToId.set(node.key, created.id);
      }
    }

    if (removedIds.length > 0) {
      await tx.delete(flowNodes).where(inArray(flowNodes.id, removedIds));
    }

    if (input.transitions.length > 0) {
      await tx.insert(flowTransitions).values(
        input.transitions.map((t) => ({
          fromNodeId: keyToId.get(t.from)!,
          toNodeId: keyToId.get(t.to)!,
        }))
      );
    }

    const nodes = await tx.select().from(flowNodes)
      .where(eq(flowNodes.flowTemplateId, templateId))
      .orderBy(flowNodes.sequenceOrder);
    const transitions = nodes.length > 0
      ? await tx.select().from(flowTransitions).where(inArray(flowTransitions.fromNodeId, nodes.map((n) => n.id)))
      : [];

    return { template: { ...template, name: input.name ?? template.name }, nodes, transitions };
  });
}
