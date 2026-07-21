import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// H11 — read-only ledger view (DAS-004 Simple Mode). No chart of accounts,
// no editing here on purpose — see PHASES.md Architecture Debt.
export class LedgerState {
  data: any;

  constructor(data: any) {
    this.data = data;
  }

  get entries() {
    return this.data.entries || [];
  }

  get reconcile() {
    return this.data.reconcile || { isClean: true, gaps: [] };
  }

  formatMoney(amount: number | string) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
      Number(amount)
    );
  }

  formatDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: id });
  }

  entryTypeColor(entryType: string) {
    switch (entryType) {
      case 'revenue':
        return 'text-green-700 bg-green-100';
      case 'cogs':
        return 'text-orange-700 bg-orange-100';
      case 'loss':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-slate-700 bg-slate-100';
    }
  }
}
