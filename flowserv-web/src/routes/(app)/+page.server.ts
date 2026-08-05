import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DITOLAK_COOKIE } from '$lib/auth/route-access';
import { API_BASE } from '$lib/api/config.server';

// P3 — per-role dashboards. Everything here is derived from existing endpoints
// via server-side aggregation (no new backend route) — see
// plan/P3-role-dashboards.md for why each widget is cheap enough to compute
// this way at current data volumes.

const API = `${API_BASE}`;

async function safeGet(fetchFn: typeof fetch, path: string, token: string): Promise<any[]> {
  try {
    const res = await fetchFn(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function safeGetObject(fetchFn: typeof fetch, path: string, token: string): Promise<any | null> {
  try {
    const res = await fetchFn(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// P11 — quick actions on the Technician dashboard: which node(s) can a ticket
// legally move to next, same edge-filter the Kanban board uses
// (transitions.fromNodeId === ticket.currentNodeId). Fetched per distinct
// flowTemplateId among the technician's tickets — in practice just the one
// 'service' template (see plan/P2-ticket-kanban-board.md Decision 1), but this
// doesn't assume that.
async function withQuickActions(fetchFn: typeof fetch, tickets: any[], token: string): Promise<any[]> {
  const templateIds = [...new Set(tickets.map((t) => t.flowTemplateId).filter(Boolean))];
  const details = await Promise.all(
    templateIds.map((id) => safeGetObject(fetchFn, `/flows/${id}`, token))
  );
  const transitionsByTemplate = new Map<string, any[]>();
  const nodeNameByTemplate = new Map<string, Map<string, string>>();
  templateIds.forEach((id, i) => {
    transitionsByTemplate.set(id, details[i]?.transitions || []);
    const nodeNames = new Map<string, string>();
    for (const n of details[i]?.nodes || []) nodeNames.set(n.id, n.name);
    nodeNameByTemplate.set(id, nodeNames);
  });

  return tickets.map((t) => {
    const transitions = transitionsByTemplate.get(t.flowTemplateId) || [];
    const nodeNames = nodeNameByTemplate.get(t.flowTemplateId) || new Map();
    const quickActions = transitions
      .filter((tr: any) => tr.fromNodeId === t.currentNodeId)
      .map((tr: any) => ({ targetNodeId: tr.toNodeId, targetNodeName: nodeNames.get(tr.toNodeId) || 'Unknown' }));
    return { ...t, quickActions };
  });
}

function groupByStage(tickets: any[]) {
  const byStage: Record<string, number> = {};
  for (const t of tickets) {
    const key = t.nodeName || 'Tanpa Tahap';
    byStage[key] = (byStage[key] || 0) + 1;
  }
  // Sorted by count desc — see plan/P3-role-dashboards.md "Watch out": don't
  // hardcode stage names, a custom flow template's names aren't guaranteed.
  return Object.entries(byStage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const load: PageServerLoad = async ({ locals, fetch, cookies }) => {
  const token = locals.token;
  const roleName = locals.user?.roleName;
  if (!token) throw redirect(302, '/login');

  // R1.7 — pesan pentalan akses, dibaca lalu LANGSUNG dihapus. Karena
  // penghapusannya terjadi di sini (server), refresh berikutnya tidak lagi
  // membawa pesannya — tanpa satu baris pun kode waktu di browser.
  // Lihat DITOLAK_COOKIE di $lib/auth/route-access.ts.
  const ditolak = cookies.get(DITOLAK_COOKIE) ?? null;
  if (ditolak) cookies.delete(DITOLAK_COOKIE, { path: '/' });

  if (!roleName) return { roleName: null, token, ditolak };

  if (roleName === 'Technician') {
    // R1 — antrian tiket tak bertuan ikut diambil. Tanpa ini teknisi tak punya
    // petunjuk apa pun bahwa ada pekerjaan menunggu; beranda hanya memantulkan
    // apa yang sudah dipegangnya, jadi tiket baru bisa mengendap tanpa terlihat.
    const [tickets, unassigned] = await Promise.all([
      safeGet(fetch, '/tickets?assignedTo=me&status=open&limit=200', token),
      safeGet(fetch, '/tickets?assignedTo=none&status=open&limit=200', token),
    ]);
    const recent = await withQuickActions(fetch, tickets.slice(0, 6), token);
    return {
      roleName,
      token,
      ditolak,
      technician: {
        total: tickets.length,
        unassignedTotal: unassigned.length,
        byStage: groupByStage(tickets),
        recent,
        // R1.7 — barisnya, bukan cuma jumlahnya. Pemilik (uji-R1.6 B1):
        // "daftar antrian service ... di sertakan di bagian dashboard jadi
        // tinggal ambil saja". Dibatasi 8: beranda adalah ringkasan, dan
        // daftar penuhnya tetap ada di /tickets.
        unassignedRecent: unassigned.slice(0, 8),
      },
    };
  }

  if (roleName === 'Cashier') {
    const [invoices, receivables] = await Promise.all([
      safeGet(fetch, '/pos/invoices?limit=200', token),
      safeGet(fetch, '/finance/receivables', token),
    ]);
    const today = startOfToday();
    const todaysInvoices = invoices.filter((i) => i.status !== 'voided' && new Date(i.createdAt) >= today);
    const todaySalesTotal = todaysInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal), 0);
    const arTotal = receivables.reduce(
      (sum, r) => sum + (parseFloat(r.grandTotal) - parseFloat(r.amountPaid || '0')),
      0
    );
    return {
      roleName,
      token,
      ditolak,
      cashier: {
        todaySalesTotal,
        todaySalesCount: todaysInvoices.length,
        arTotal,
        arCount: receivables.length,
      },
    };
  }

  // Super Admin & Manager (and any future role) — the operational overview.
  // Both have near-identical sidebar visibility; see plan/P3-role-dashboards.md.
  const [tickets, inventory, receivables, payables, invoices] = await Promise.all([
    safeGet(fetch, '/tickets?status=open&limit=200', token),
    safeGet(fetch, '/inventory?limit=200', token),
    safeGet(fetch, '/finance/receivables', token),
    safeGet(fetch, '/finance/payables', token),
    safeGet(fetch, '/pos/invoices?limit=200', token),
  ]);

  const lowStock = inventory
    .filter((i) => i.reorderPoint > 0 && i.totalAvailable <= i.reorderPoint)
    .sort((a, b) => a.totalAvailable - b.totalAvailable);

  const today = startOfToday();
  const todaysInvoices = invoices.filter((i) => i.status !== 'voided' && new Date(i.createdAt) >= today);
  const todaySalesTotal = todaysInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal), 0);

  const arTotal = receivables.reduce(
    (sum, r) => sum + (parseFloat(r.grandTotal) - parseFloat(r.amountPaid || '0')),
    0
  );
  const apTotal = payables.reduce(
    (sum, p) => sum + (parseFloat(p.totalAmount) - parseFloat(p.amountPaid || '0')),
    0
  );

  return {
    roleName,
    token,
    ditolak,
    overview: {
      openTicketsTotal: tickets.length,
      byStage: groupByStage(tickets),
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 5),
      arTotal,
      arCount: receivables.length,
      apTotal,
      apCount: payables.length,
      todaySalesTotal,
      todaySalesCount: todaysInvoices.length,
    },
  };
};
