import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';

// P2 — Ticket Kanban board. Columns = flow nodes (ordered by sequenceOrder),
// cards = open tickets grouped by currentNodeId. Valid moves are computed
// from `transitions` edges (fromNodeId === card's current node), never from
// column adjacency — the graph branches (e.g. Diagnosis -> Approval OR Repair).
export class TicketBoardState {
  // $state so every getter reading `this.data` stays reactive; the +page.svelte
  // re-assigns this after invalidateAll() (same pattern as TicketDetailState).
  data = $state<any>(undefined);
  token: string;

  // Tap-to-move panel: which card's action list is open.
  activeTicketId = $state('');
  moving = $state(false);
  errorMsg = $state('');

  // Desktop drag-and-drop enhancement.
  dragTicketId = $state('');
  dragOverNodeId = $state('');

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;
  }

  get templates() { return this.data.templates || []; }
  get selectedTemplateId() { return this.data.selectedTemplateId || ''; }
  get nodes() { return this.data.nodes || []; }
  get transitions() { return this.data.transitions || []; }
  get tickets() { return this.data.tickets || []; }

  get columns() {
    return this.nodes.map((node: any) => ({
      node,
      tickets: this.tickets.filter((t: any) => t.currentNodeId === node.id),
    }));
  }

  // Same idiom as ticket.detail.svelte.ts's availableTransitions and
  // flows/[id]/+page.svelte's getNextNodes — filter edges by fromNodeId.
  targetsFor(ticket: any) {
    if (!ticket) return [];
    return this.transitions
      .filter((t: any) => t.fromNodeId === ticket.currentNodeId)
      .map((t: any) => {
        const target = this.nodes.find((n: any) => n.id === t.toNodeId);
        return { targetNodeId: t.toNodeId, targetNodeName: target?.name || 'Unknown' };
      });
  }

  canDrop(ticket: any, targetNodeId: string) {
    return this.targetsFor(ticket).some((tg: any) => tg.targetNodeId === targetNodeId);
  }

  toggleMovePanel(ticketId: string) {
    this.activeTicketId = this.activeTicketId === ticketId ? '' : ticketId;
    this.errorMsg = '';
  }

  closeMovePanel() {
    this.activeTicketId = '';
  }

  async move(ticketId: string, targetNodeId: string) {
    this.moving = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          // One-shot action — a fresh key per move is fine here (unlike the
          // detail page's picker, nothing retries this specific call).
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ targetNodeId }),
      });
      const result = await res.json();
      if (res.ok) {
        this.activeTicketId = '';
        await invalidateAll();
      } else {
        // 403 PERMISSION_DENIED (you can't) vs 409 (the flow graph forbids
        // this move) — both surfaced verbatim, same as the detail page.
        this.errorMsg = result.error?.message || 'Gagal memindahkan tiket';
      }
    } catch {
      this.errorMsg = 'Network error';
    } finally {
      this.moving = false;
    }
  }
}
