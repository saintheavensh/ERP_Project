import { Hono } from "hono";
import { z } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requireRole } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";
import { AccountingController } from "./accounting.controller";

const app = new Hono();
const controller = new AccountingController();

app.use("*", authMiddleware);
app.use("*", requireRole("super_admin", "owner", "manager"));

app.get("/dashboard", (c) => controller.getDashboard(c));

// Liabilities
app.get("/liabilities/summary", (c) => controller.getLiabilitiesSummary(c));
app.get("/liabilities/suppliers", (c) => controller.getSupplierDebts(c));
app.get("/liabilities/expenses", (c) => controller.getExpenseDebts(c));
app.get("/liabilities/commissions", (c) => controller.getCommissionDebts(c));
app.post("/liabilities/expenses/:id/pay", (c) => controller.payExpenseDebt(c));

// Accounts
app.get("/accounts", (c) => controller.getAllAccounts(c));
app.get("/accounts/tree", (c) => controller.getAccountTree(c));
app.get("/accounts/shared/core/types", (c) => controller.getAccountTypes(c));

const createAccountSchema = z.object({
    code: z.string().min(3),
    name: z.string().min(2),
    typeId: z.string(),
    parentId: z.string().optional(),
    description: z.string().optional(),
});
app.post("/accounts", zValidator("json", createAccountSchema), (c) => controller.createAccount(c));
app.patch("/accounts/:id", (c) => controller.updateAccount(c));
app.delete("/accounts/:id", (c) => controller.deleteAccount(c));

// Journals
app.get("/journals", (c) => controller.getAllJournals(c));
app.get("/journals/:id", (c) => controller.getJournalById(c));

// Cash Register
app.get("/register/current", (c) => controller.getCurrentRegister(c));
app.get("/register/status", (c) => controller.getCurrentRegister(c)); // Alias for frontend
app.post("/register/open", (c) => controller.openRegister(c));
app.post("/register/close", (c) => controller.closeRegister(c));
app.post("/register/expense", (c) => controller.recordExpense(c));

// Assets
app.get("/assets", (c) => controller.getAllAssets(c));
app.post("/assets", (c) => controller.createAsset(c));

// Payables
app.get("/payables", (c) => controller.getAllPayables(c));
app.get("/payables/summary", (c) => controller.getPayablesSummary(c));
app.get("/payables/:id", (c) => controller.getPayableById(c));
app.post("/payables/:id/payments", (c) => controller.recordPayablePayment(c));

// Targets
app.get("/targets/today", (c) => controller.getTodayTargets(c));
app.get("/targets/:month", (c) => controller.getMonthTargets(c));
app.post("/targets/:month", (c) => controller.setTarget(c));

// Reports
app.get("/reports/gl", (c) => controller.getGeneralLedger(c));
app.get("/reports/pl", (c) => controller.getIncomeStatement(c));
app.get("/reports/balance-sheet", (c) => controller.getBalanceSheet(c));

// Audit Logs
app.get("/audit-logs", (c) => controller.getAuditLogs(c));

export default app;
