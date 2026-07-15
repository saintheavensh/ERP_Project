import { Context } from "hono";
import { accountingService, AccountingService } from "../accounting-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { AccountingReportService } from "../services/accounting-reports.service";
import { LiabilitiesService } from "../services/liabilities.service";
import { SupplierPaymentService } from "../services/supplier-payment.service";
import { RevenueTargetService } from "../services/revenue-target.service";
import { inventoryAuthority } from "../../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../../shared/types/db-context";

export class AccountingController {
    constructor(
        private readonly service: AccountingService = accountingService
    ) { }

    // Dashboard Summary
    async getDashboard(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                // 1. Get today's register progress
                const todayProgress = await this.service.getTodayRegisterProgress(tenantId, tx);

                // 2. Get Income Statement for current year to show Revenue vs Expenses
                const yearStart = new Date(new Date().getFullYear(), 0, 1);
                const now = new Date();
                const incomeStatement = await AccountingReportService.getIncomeStatement(tenantId, tx, yearStart, now);

                // 3. Aggregate for frontend
                return {
                    todayProgress,
                    balanceSummary: {
                        REVENUE: incomeStatement.revenue,
                        EXPENSE: {
                            total: incomeStatement.expenses.total + incomeStatement.cogs.total,
                            accounts: [...incomeStatement.expenses.accounts, ...incomeStatement.cogs.accounts]
                        }
                    }
                };
            });

            return apiSuccess(c, result, "Dashboard data retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve dashboard data");
        }
    }

    // Liabilities
    async getLiabilitiesSummary(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const summary = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await LiabilitiesService.getSummary(tenantId, tx);
            });
            return apiSuccess(c, summary);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve liabilities summary");
        }
    }

    async getSupplierDebts(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const debts = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await LiabilitiesService.getSupplierDebts(tenantId, tx);
            });
            return apiSuccess(c, debts);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve supplier debts");
        }
    }

    async getExpenseDebts(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const expenses = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await LiabilitiesService.getExpenseDebts(tenantId, tx);
            });
            return apiSuccess(c, expenses);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve expense debts");
        }
    }

    async getCommissionDebts(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { period } = c.req.query();
            const commissions = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await LiabilitiesService.getCommissionDebts(tenantId, tx, period);
            });
            return apiSuccess(c, commissions);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve commission debts");
        }
    }

    async payExpenseDebt(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const payload = await c.req.json();
            const userId = c.get("user")?.id;
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await LiabilitiesService.payExpense(tenantId, tx, id, payload, userId);
            });
            return apiSuccess(c, result, "Expense paid successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to pay expense");
        }
    }

    // Accounts
    async getAllAccounts(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { typeId } = c.req.query();
            const accounts = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                const filters = typeId ? { typeId } : {};
                return await this.service.getAllAccounts(tenantId, filters, tx);
            });
            return apiSuccess(c, accounts, "Accounts retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve accounts");
        }
    }

    async getAccountTree(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { typeId } = c.req.query();
            const tree = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                const filters = typeId ? { typeId } : {};
                return await this.service.getAccountTree(tenantId, filters, tx);
            });
            return apiSuccess(c, tree, "Account tree retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve account tree");
        }
    }

    async getAccountTypes(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const types = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getAccountTypes(tenantId, tx);
            });
            return apiSuccess(c, types, "Account types retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve account types");
        }
    }

    async createAccount(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.createAccount(tenantId, body, tx, userId);
            });
            return apiSuccess(c, { id }, "Account created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create account");
        }
    }

    async updateAccount(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                await this.service.updateAccount(tenantId, id, body, tx, userId);
            });
            return apiSuccess(c, null, "Account updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update account");
        }
    }

    async deleteAccount(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const userId = c.get("user")?.id;
            await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                await this.service.deleteAccount(tenantId, id, tx, userId);
            });
            return apiSuccess(c, null, "Account deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete account");
        }
    }

    // Journals
    async getAllJournals(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const filters = c.req.query();
            const journals = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getAllJournals(tenantId, filters, tx);
            });
            return apiSuccess(c, journals, "Journals retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve journals");
        }
    }

    async getJournalById(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const journal = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getJournalById(tenantId, id, tx);
            });
            if (!journal) return apiError(c, null, "Journal not found", 404);
            return apiSuccess(c, journal, "Journal retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve journal");
        }
    }

    // Cash Register
    async getCurrentRegister(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const register = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getTodayRegisterProgress(tenantId, tx);
            });
            return apiSuccess(c, register, "Current register status retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve register status");
        }
    }

    async openRegister(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { openingBalance } = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.openRegister(tenantId, openingBalance, userId, tx);
            });
            return apiSuccess(c, { id }, "Register opened successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to open register");
        }
    }

    async closeRegister(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { actualClosing, notes, reservation } = await c.req.json();
            const userId = c.get("user")?.id;
            await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                await this.service.closeRegister(tenantId, actualClosing, notes, userId, tx, reservation);
            });
            return apiSuccess(c, null, "Register closed successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to close register");
        }
    }

    async recordExpense(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { amount, category, description, userRoles } = await c.req.json();
            const userId = c.get("user")?.id;
            await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                await this.service.recordCashExpense(tenantId, amount, category, description, userId, userRoles, tx);
            });
            return apiSuccess(c, null, "Expense recorded successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to record expense");
        }
    }

    // Assets
    async getAllAssets(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const assets = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getAllAssets(tenantId, tx);
            });
            return apiSuccess(c, assets, "Assets retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve assets");
        }
    }

    async createAsset(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.createAsset(tenantId, body, tx, userId);
            });
            return apiSuccess(c, { id }, "Asset created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create asset");
        }
    }

    // Reports
    async getGeneralLedger(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { accountId, startDate, endDate } = c.req.query();
            if (!accountId) return apiError(c, null, "accountId is required", 400);

            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const report = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await AccountingReportService.getGeneralLedger(tenantId, tx, accountId, start, end);
            });
            return apiSuccess(c, report, "General Ledger retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve General Ledger");
        }
    }

    async getIncomeStatement(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { startDate, endDate } = c.req.query();
            // Default to current year if not provided
            const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
            const end = endDate ? new Date(endDate) : new Date();

            const report = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await AccountingReportService.getIncomeStatement(tenantId, tx, start, end);
            });
            return apiSuccess(c, report, "Income Statement retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve Income Statement");
        }
    }

    async getBalanceSheet(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { date } = c.req.query();
            const asOfDate = date ? new Date(date) : new Date();

            const report = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await AccountingReportService.getBalanceSheet(tenantId, tx, asOfDate);
            });
            return apiSuccess(c, report, "Balance Sheet retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve Balance Sheet");
        }
    }

    // Payables (Supplier Debts)
    async getPayablesSummary(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const summary = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                const debts = await LiabilitiesService.getSupplierDebts(tenantId, tx);
                const bySupplier: Record<string, { name: string; total: number; count: number }> = {};

                for (const d of debts) {
                    const sid = d.supplierId;
                    if (!bySupplier[sid]) {
                        bySupplier[sid] = { name: d.supplierName, total: 0, count: 0 };
                    }
                    const entry = bySupplier[sid]!;
                    entry.total += d.outstanding;
                    entry.count++;
                }

                return {
                    totalOutstanding: debts.reduce((s, d) => s + d.outstanding, 0),
                    purchaseCount: debts.length,
                    bySupplier: Object.values(bySupplier)
                };
            });

            return apiSuccess(c, summary);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve payables summary");
        }
    }

    async getAllPayables(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const mapped = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                const debts = await LiabilitiesService.getSupplierDebts(tenantId, tx);
                // Map consistent with frontend expectations
                return debts.map(d => ({
                    ...d,
                    totalPaid: d.paidAmount,
                    paymentStatus: d.paidAmount > 0 ? "partial" : "unpaid"
                }));
            });
            return apiSuccess(c, mapped);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve payables");
        }
    }

    async getPayableById(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const mapped = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                const debts = await LiabilitiesService.getSupplierDebts(tenantId, tx);
                const payable = debts.find(d => d.purchaseId === id);
                if (!payable) return null;

                return {
                    ...payable,
                    totalPaid: payable.paidAmount,
                    paymentStatus: payable.paidAmount > 0 ? "partial" : "unpaid"
                };
            });

            if (!mapped) return apiError(c, null, "Payable not found", 404);
            return apiSuccess(c, mapped);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve payable details");
        }
    }

    async recordPayablePayment(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const { amount, accountId, notes, method } = await c.req.json();
            const userId = c.get("user")?.id;

            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await SupplierPaymentService.create(tenantId, tx, {
                    purchaseId: id,
                    amount,
                    method: method || "cash",
                    accountId,
                    reference: notes
                }, userId);
            });

            return apiSuccess(c, { id: result }, "Payment recorded successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to record payment");
        }
    }

    // Revenue Targets
    async getTodayTargets(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const progress = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await RevenueTargetService.getTodayProgress(tenantId, tx);
            });
            return apiSuccess(c, progress);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve today targets");
        }
    }

    async getMonthTargets(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const month = c.req.param("month");
            const progress = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await RevenueTargetService.getMonthProgress(tenantId, tx, month);
            });
            return apiSuccess(c, progress);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve month targets");
        }
    }

    async setTarget(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const month = c.req.param("month");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                await RevenueTargetService.calculateAndSet(tenantId, tx, {
                    month,
                    workingDays: body.workingDays,
                    profitMarginPercent: body.profitMarginPercent
                }, userId);
            });
            return apiSuccess(c, null, "Target updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update target");
        }
    }

    async getAuditLogs(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { limit, offset, entityType, entityId } = c.req.query();
            const filters: { limit?: number; offset?: number; entityType?: string; entityId?: string } = {
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0
            };
            if (entityType) filters.entityType = entityType;
            if (entityId) filters.entityId = entityId;

            const logsRes = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                const { AuditService } = await import("../services/audit.service");
                return await AuditService.getAll(tenantId, tx, filters);
            });
            return apiSuccess(c, logsRes, "Audit logs retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve audit logs");
        }
    }
}
