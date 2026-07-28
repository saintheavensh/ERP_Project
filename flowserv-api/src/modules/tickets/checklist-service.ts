import { db } from '../../db/connection';
import { flowNodes, serviceTickets, ticketChecklistResults, users } from '../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { parseChecklistItems, mergeChecklist, checklistProgress, type ChecklistLine } from './checklist';

export interface TicketChecklist {
  nodeId: string;
  nodeName: string;
  lines: ChecklistLine[];
  checked: number;
  total: number;
}

/**
 * Daftar periksa untuk satu tahap sebuah tiket, definisi + jawaban tergabung.
 * `null` bila tahapnya memang tidak punya daftar periksa dan belum ada jawaban
 * tersimpan — halaman tiket tak perlu menampilkan kartu kosong.
 */
export async function getTicketChecklist(
  tenantId: string,
  ticketId: string,
  nodeId: string
): Promise<TicketChecklist | null> {
  const [node] = await db.select().from(flowNodes).where(eq(flowNodes.id, nodeId));
  if (!node) return null;

  const items = parseChecklistItems(node.checklistItems);
  const saved = await db
    .select({
      itemId: ticketChecklistResults.itemId,
      label: ticketChecklistResults.label,
      checked: ticketChecklistResults.checked,
      note: ticketChecklistResults.note,
      checkedAt: ticketChecklistResults.checkedAt,
      checkedByName: users.name,
    })
    .from(ticketChecklistResults)
    .leftJoin(users, eq(ticketChecklistResults.checkedBy, users.id))
    .where(and(
      eq(ticketChecklistResults.tenantId, tenantId),
      eq(ticketChecklistResults.ticketId, ticketId),
      eq(ticketChecklistResults.nodeId, nodeId)
    ));

  if (items.length === 0 && saved.length === 0) return null;

  const lines = mergeChecklist(items, saved.map((s) => ({
    itemId: s.itemId,
    label: s.label,
    checked: s.checked,
    note: s.note,
    checkedByName: s.checkedByName,
    checkedAt: s.checkedAt ? s.checkedAt.toISOString() : null,
  })));

  return { nodeId, nodeName: node.name, lines, ...checklistProgress(lines) };
}

export interface SaveChecklistInput {
  nodeId: string;
  answers: Array<{ itemId: string; checked: boolean; note?: string | null }>;
}

/**
 * Simpan jawaban daftar periksa satu tahap.
 *
 * Dua penjagaan yang benar-benar penting:
 *  - tahapnya harus milik alur tiket ini (jangan sampai jawaban menempel pada
 *    tahap alur lain lewat payload yang dikarang);
 *  - `label` DISALIN dari definisi saat ini, karena inilah yang jadi bukti.
 * Item yang tak dikenal ditolak alih-alih diam-diam dibuang — kalau daftarnya
 * baru saja diubah owner, teknisi berhak tahu bahwa yang dia isi sudah basi.
 */
export async function saveTicketChecklist(
  tenantId: string,
  ticketId: string,
  userId: string | null,
  input: SaveChecklistInput
) {
  return db.transaction(async (tx) => {
    const [ticket] = await tx.select().from(serviceTickets)
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    if (!ticket) throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);

    const [node] = await tx.select().from(flowNodes)
      .where(and(eq(flowNodes.id, input.nodeId), eq(flowNodes.flowTemplateId, ticket.flowTemplateId)));
    if (!node) {
      throw new BusinessError('NODE_NOT_IN_TEMPLATE', 'Tahap ini bukan bagian dari alur tiket tersebut', 422);
    }

    const items = parseChecklistItems(node.checklistItems);
    const labelById = new Map(items.map((i) => [i.id, i.label]));
    const unknown = input.answers.filter((a) => !labelById.has(a.itemId));
    if (unknown.length > 0) {
      throw new BusinessError(
        'CHECKLIST_ITEM_UNKNOWN',
        'Daftar periksa tahap ini baru saja berubah. Muat ulang halamannya lalu isi lagi.',
        409
      );
    }

    for (const a of input.answers) {
      await tx.insert(ticketChecklistResults).values({
        tenantId,
        ticketId,
        nodeId: input.nodeId,
        itemId: a.itemId,
        label: labelById.get(a.itemId)!,
        checked: a.checked,
        note: a.note ?? null,
        checkedBy: userId,
      }).onConflictDoUpdate({
        target: [ticketChecklistResults.ticketId, ticketChecklistResults.nodeId, ticketChecklistResults.itemId],
        set: {
          label: labelById.get(a.itemId)!,
          checked: a.checked,
          note: a.note ?? null,
          checkedBy: userId,
          checkedAt: new Date(),
        },
      });
    }

    return { nodeId: input.nodeId, saved: input.answers.length };
  });
}

/**
 * Semua daftar periksa yang PERNAH diisi pada sebuah tiket, untuk ditampilkan
 * sebagai bukti (termasuk tahap yang sudah dilewati).
 */
export async function getTicketChecklistHistory(tenantId: string, ticketId: string) {
  const rows = await db
    .select({ nodeId: ticketChecklistResults.nodeId })
    .from(ticketChecklistResults)
    .where(and(
      eq(ticketChecklistResults.tenantId, tenantId),
      eq(ticketChecklistResults.ticketId, ticketId)
    ));
  const nodeIds = [...new Set(rows.map((r) => r.nodeId))];
  if (nodeIds.length === 0) return [];

  const result: TicketChecklist[] = [];
  for (const nodeId of nodeIds) {
    const checklist = await getTicketChecklist(tenantId, ticketId, nodeId);
    if (checklist) result.push(checklist);
  }
  return result;
}
