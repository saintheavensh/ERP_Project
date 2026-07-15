import { Hono } from "hono";
import { ReportsController } from "./reports.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new ReportsController();

app.use("*", authMiddleware);
app.use("*", requirePermission("report.read", "analytics.view"));

app.get("/summary", (c) => controller.getSummary(c));
app.get("/transactions", (c) => controller.getTransactions(c));

// Sales Nesting (Frontend expectations)
app.get("/sales/summary", (c) => controller.getSummary(c));
app.get("/sales/transactions", (c) => controller.getTransactions(c));

// Services Nesting
app.get("/services", (c) => controller.getServiceStats(c));
app.get("/services/stats", (c) => controller.getServiceStats(c));
app.get("/services/transactions", (c) => controller.getServiceTransactions(c));
app.get("/services/technicians", (c) => controller.getTechnicianStats(c));
app.get("/services/parts-usage", (c) => controller.getPartsUsageReport(c));

// Flat Technician & Parts for backward compat
app.get("/technicians", (c) => controller.getTechnicianStats(c));
app.get("/parts", (c) => controller.getPartsUsageReport(c));

// Purchases
app.get("/purchases/summary", (c) => controller.getPurchasesSummary(c));
app.get("/purchases/transactions", (c) => controller.getPurchaseTransactions(c));

// Inventory
app.get("/inventory/adjustments", (c) => controller.getStockAdjustments(c));

app.get("/logs", (c) => controller.getActivityLogs(c));
app.get("/profit-loss", (c) => controller.getProfitAndLoss(c));
app.get("/stock-value", (c) => controller.getStockValueReport(c));

// Kasir Daily & Warehouse Low Stock
app.get("/kasir/daily", (c) => controller.getKasirDailyReport(c));
app.get("/warehouse/low-stock", (c) => controller.getLowStockReport(c));

export default app;
