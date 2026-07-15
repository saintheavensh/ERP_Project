import { TransactionContext } from "../../../../shared/types/db-context";
import { accounts, journals, journalLines } from "../../../../shared/infrastructure/database/schema";
import { eq, and, gte, lte, sql, sum } from "drizzle-orm";

export class AccountingReportService {

    // ==========================================
    // 1. GENERAL LEDGER (Buku Besar)
    // ==========================================
    static async getGeneralLedger(tenantId: string, tx: TransactionContext, accountId: string, startDate?: Date, endDate?: Date) {
        // 1. Calculate Opening Balance (Sum of all transactions BEFORE startDate)
        let openingBalance = 0;

        if (startDate) {
            const openingQuery = await tx
                .select({
                    debit: sum(journalLines.debit),
                    credit: sum(journalLines.credit)
                })
                .from(journalLines)
                .innerJoin(journals, eq(journals.id, journalLines.journalId))
                .where(and(
                    eq(journals.tenantId, tenantId),
                    eq(journalLines.accountId, accountId),
                    eq(journals.status, 'posted'),
                    sql`${journals.date} < ${startDate.toISOString()}`
                ));

            const dr = Number(openingQuery[0]?.debit || 0);
            const cr = Number(openingQuery[0]?.credit || 0);

            // Simple net movement (Debit - Credit)
            // Whether it's positive or negative depends on account type, but mathematically correct for running balance.
            openingBalance = dr - cr;
        }

        // 2. Get Transactions in Period
        const whereClause = [
            eq(journals.tenantId, tenantId),
            eq(journalLines.accountId, accountId),
            eq(journals.status, 'posted')
        ];

        if (startDate) whereClause.push(gte(journals.date, startDate));
        if (endDate) whereClause.push(lte(journals.date, endDate));

        const transactions = await tx
            .select({
                id: journals.id,
                date: journals.date,
                description: journals.description,
                reference: journals.referenceId,
                refType: journals.referenceType,
                debit: journalLines.debit,
                credit: journalLines.credit,
                lineDesc: journalLines.description
            })
            .from(journalLines)
            .innerJoin(journals, eq(journals.id, journalLines.journalId))
            .where(and(...whereClause))
            .orderBy(journals.date);

        // 3. Calculate Running Balance
        let runningBalance = openingBalance;
        const result = transactions.map(t => {
            const dr = Number(t.debit || 0);
            const cr = Number(t.credit || 0);
            runningBalance += (dr - cr);
            return {
                ...t,
                balance: runningBalance
            };
        });

        return {
            accountId,
            openingBalance,
            closingBalance: runningBalance,
            transactions: result
        };
    }

    // ==========================================
    // 2. INCOME STATEMENT (Laba Rugi)
    // ==========================================
    static async getIncomeStatement(tenantId: string, tx: TransactionContext, startDate: Date, endDate: Date) {
        // Fetch all REVENUE and EXPENSE accounts with their transaction sums in the period
        // We filter by account types or code prefixes.
        // Assuming Standard: 4=Revenue, 5=Expense.

        const movements = await tx
            .select({
                accountId: accounts.id,
                accountName: accounts.name,
                accountCode: accounts.code,
                typeId: accounts.typeId,
                debit: sum(journalLines.debit),
                credit: sum(journalLines.credit)
            })
            .from(journalLines)
            .innerJoin(journals, eq(journals.id, journalLines.journalId))
            .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
            .where(and(
                eq(journals.tenantId, tenantId),
                eq(journals.status, 'posted'),
                gte(journals.date, startDate),
                lte(journals.date, endDate)
            ))
            .groupBy(accounts.id, accounts.name, accounts.code, accounts.typeId);

        // Structure the Data
        const revenue = { total: 0, accounts: [] as any[] };
        const cogs = { total: 0, accounts: [] as any[] }; // HPP (5-1...)
        const expenses = { total: 0, accounts: [] as any[] }; // Opex (5-2...)

        for (const m of movements) {
            // Filter by Type ID string directly
            // Note: DB returns strings like "REVENUE", "EXPENSE" based on your seeds

            const dr = Number(m.debit || 0);
            const cr = Number(m.credit || 0);
            const netCredit = cr - dr; // Revenue is Credit normal
            const netDebit = dr - cr;  // Expense is Debit normal

            if (m.typeId === 'REVENUE' || m.accountCode.startsWith('4')) {
                // Revenue
                revenue.total += netCredit;
                if (netCredit !== 0) revenue.accounts.push({ ...m, amount: netCredit });
            }
            else if (m.typeId === 'EXPENSE' || m.accountCode.startsWith('5')) {
                // Expense Logic
                if (m.accountCode.startsWith('5-1')) {
                    // COGS
                    cogs.total += netDebit;
                    if (netDebit !== 0) cogs.accounts.push({ ...m, amount: netDebit });
                } else {
                    // OPEX
                    expenses.total += netDebit;
                    if (netDebit !== 0) expenses.accounts.push({ ...m, amount: netDebit });
                }
            }
        }

        const grossProfit = revenue.total - cogs.total;
        const netIncome = grossProfit - expenses.total;

        return {
            period: { start: startDate, end: endDate },
            revenue,
            cogs,
            grossProfit,
            expenses,
            netIncome
        };
    }

    // ==========================================
    // 3. BALANCE SHEET (Neraca)
    // ==========================================
    static async getBalanceSheet(tenantId: string, tx: TransactionContext, asOfDate: Date) {
        // Balance Sheet includes all Asset (1), Liability (2), Equity (3)
        // AND current period earnings (which is Rev - Exp).

        // 1. Fetch Balances
        const balances = await tx
            .select({
                accountId: accounts.id,
                accountName: accounts.name,
                accountCode: accounts.code,
                typeId: accounts.typeId,
                debit: sum(journalLines.debit),
                credit: sum(journalLines.credit)
            })
            .from(journalLines)
            .innerJoin(journals, eq(journals.id, journalLines.journalId))
            .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
            .where(and(
                eq(journals.tenantId, tenantId),
                eq(journals.status, 'posted'),
                lte(journals.date, asOfDate)
            ))
            .groupBy(accounts.id, accounts.name, accounts.code, accounts.typeId);

        const assets = { total: 0, groups: {} as Record<string, any> };
        const liabilities = { total: 0, accounts: [] as any[] };
        const equity = { total: 0, accounts: [] as any[] };

        let retainedEarningsOffset = 0; // Net Income (Rev - Exp) to add to Equity

        for (const b of balances) {
            const dr = Number(b.debit || 0);
            const cr = Number(b.credit || 0);

            // Check Type
            if (b.typeId === 'ASSET' || b.accountCode.startsWith('1')) {
                const amount = dr - cr; // Asset is Debit normal
                assets.total += amount;

                // Group by Sub-Category (e.g. 1-10xx Cash)
                // Use first 4 chars "1-10" as group key
                const prefix = b.accountCode.substring(0, 4);
                if (!assets.groups[prefix]) assets.groups[prefix] = { total: 0, accounts: [] };

                assets.groups[prefix].total += amount;
                assets.groups[prefix].accounts.push({ ...b, amount });
            }
            else if (b.typeId === 'LIABILITY' || b.accountCode.startsWith('2')) {
                const amount = cr - dr; // Liab is Credit normal
                liabilities.total += amount;
                liabilities.accounts.push({ ...b, amount });
            }
            else if (b.typeId === 'EQUITY' || b.accountCode.startsWith('3')) {
                const amount = cr - dr; // Equity is Credit normal
                equity.total += amount;
                equity.accounts.push({ ...b, amount });
            }
            else {
                // Revenue (4) or Expense (5) -> Calculates into Retained Earnings
                const netCr = cr - dr;
                retainedEarningsOffset += netCr; // Revenue adds, Expesne subtracts (if Expense, NetCr is negative)
            }
        }

        // Add "Current Earnings" to Equity
        equity.total += retainedEarningsOffset;

        // Push a pseudo-account for display
        equity.accounts.push({
            accountId: 'calculated-re',
            accountName: 'Current Period Earnings (Laba Berjalan)',
            accountCode: '3-9999',
            amount: retainedEarningsOffset
        });

        return {
            asOf: asOfDate,
            assets,
            liabilities,
            equity,
            check: assets.total - (liabilities.total + equity.total) // Should be 0
        };
    }
}
