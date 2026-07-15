import { Hono } from "hono";
import { DashboardController } from "./dashboard.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requireRole } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";
const dashboard = new Hono();
const controller = new DashboardController();

dashboard.use("*", authMiddleware);

dashboard.get("/", requireRole("super_admin", "owner", "manager", "kasir", "teknisi", "warehouse"), (c) => controller.getDashboardData(c));
dashboard.get("/activities", requireRole("super_admin", "owner", "manager", "kasir", "teknisi", "warehouse"), (c) => controller.getRecentActivities(c));
dashboard.get("/recent-services", requireRole("super_admin", "owner", "manager", "kasir", "teknisi", "warehouse"), (c) => controller.getRecentServices(c));
dashboard.get("/urgent-services", requireRole("super_admin", "owner", "manager", "kasir", "teknisi", "warehouse"), (c) => controller.getUrgentServices(c));
dashboard.get("/technician", requireRole("super_admin", "owner", "manager", "teknisi"), (c) => controller.getTechnicianDashboard(c));
dashboard.get("/cashier", requireRole("super_admin", "owner", "manager", "kasir"), (c) => controller.getCashierDashboard(c));
dashboard.get("/warehouse", requireRole("super_admin", "owner", "manager", "warehouse"), (c) => controller.getWarehouseDashboard(c));
dashboard.get("/profit-loss", requireRole("super_admin", "owner", "manager"), (c) => controller.getProfitLoss(c));

export default dashboard;
