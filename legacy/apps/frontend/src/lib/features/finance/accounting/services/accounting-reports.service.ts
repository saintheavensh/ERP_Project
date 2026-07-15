import { api } from "$lib/shared/lib/api-client";

export interface GeneralLedgerParams {
    accountId: string;
    startDate?: Date;
    endDate?: Date;
}

export interface DateRangeParams {
    startDate?: Date;
    endDate?: Date;
}

export class AccountingReportService {
    static async getGeneralLedger(params: GeneralLedgerParams) {
        const query = new URLSearchParams();
        query.append("accountId", params.accountId);
        if (params.startDate) query.append("startDate", params.startDate.toISOString());
        if (params.endDate) query.append("endDate", params.endDate.toISOString());

        const response = await api.get(`/accounting/reports/gl?${query.toString()}`);
        return response.data.data;
    }

    static async getIncomeStatement(params: DateRangeParams = {}) {
        const query = new URLSearchParams();
        if (params.startDate) query.append("startDate", params.startDate.toISOString());
        if (params.endDate) query.append("endDate", params.endDate.toISOString());

        const response = await api.get(`/accounting/reports/pl?${query.toString()}`);
        return response.data.data;
    }

    static async getBalanceSheet(date?: Date) {
        const query = new URLSearchParams();
        if (date) query.append("date", date.toISOString());

        const response = await api.get(`/accounting/reports/balance-sheet?${query.toString()}`);
        return response.data.data;
    }
}
