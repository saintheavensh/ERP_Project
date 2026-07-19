import { differenceInDays, format } from 'date-fns';
import { id } from 'date-fns/locale';

export class PayablesState {
  data: any;

  constructor(data: any) {
    this.data = data;
  }

  get payables() {
    return this.data.payables || [];
  }

  formatMoney(amount: number | string) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount));
  }

  getStatusColor(dueDateStr: string | null) {
    if (!dueDateStr) return 'text-slate-500 bg-slate-100';
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return 'text-red-700 bg-red-100 font-bold'; 
    if (diff <= 3) return 'text-orange-700 bg-orange-100 font-medium'; 
    return 'text-green-700 bg-green-100'; 
  }

  getStatusText(dueDateStr: string | null) {
    if (!dueDateStr) return 'N/A';
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return `Jatuh Tempo (Lewat ${Math.abs(diff)} hari)`;
    if (diff === 0) return 'Jatuh Tempo Hari Ini';
    return `${diff} hari lagi`;
  }
  
  formatDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: id });
  }
}
