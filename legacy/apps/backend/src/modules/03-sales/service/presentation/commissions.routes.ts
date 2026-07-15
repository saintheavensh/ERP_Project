import { Hono } from "hono";
import { CommissionController } from "./commissions.controller";
import { ManageCommissionUseCase } from "../application/use-cases/manage-commission.use-case";
import { DrizzleCommissionSettingsRepository, DrizzleCommissionRepository } from "../infrastructure/repositories/drizzle-commission.repository";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

const app = new Hono();
const settingsRepo = new DrizzleCommissionSettingsRepository();
const commissionRepo = new DrizzleCommissionRepository();
const useCase = new ManageCommissionUseCase(settingsRepo, commissionRepo);
const controller = new CommissionController(useCase);

app.use("*", authMiddleware);

app.get("/settings/:technicianId", (c) => controller.getSettings(c));
app.put("/settings/:technicianId", (c) => controller.upsertSettings(c));

app.get("/summary/:technicianId", (c) => controller.getSummary(c));
app.post("/mark-paid", (c) => controller.markAsPaid(c));

export default app;
