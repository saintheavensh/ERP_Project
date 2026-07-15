import { Hono } from "hono";
import { ServiceItemController } from "./items.controller";
import { AddServiceItemUseCase } from "../application/use-cases/add-service-item.use-case";
import { AddServicePartUseCase } from "../application/use-cases/add-service-part.use-case";
import { CompleteServiceItemUseCase } from "../application/use-cases/complete-service-item.use-case";
import { DrizzleServiceItemRepository } from "../infrastructure/repositories/drizzle-service-item.repository";
import { DrizzleServicePartRepository } from "../infrastructure/repositories/drizzle-service-part.repository";
import { DrizzleCommissionSettingsRepository, DrizzleCommissionRepository } from "../infrastructure/repositories/drizzle-commission.repository";
import { DrizzleServiceTypeRepository } from "../infrastructure/repositories/drizzle-service-type.repository";
import { db } from "../../../../shared/infrastructure/database/client";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

const app = new Hono();
const itemRepo = new DrizzleServiceItemRepository();
const partRepo = new DrizzleServicePartRepository();
const commissionSettingsRepo = new DrizzleCommissionSettingsRepository();
const commissionRepo = new DrizzleCommissionRepository();
const typeRepo = new DrizzleServiceTypeRepository();

// Mock db transaction for use cases without breaking dependencies
const dbMockTx = { transaction: (fn: any) => fn(db) };

const addItemUseCase = new AddServiceItemUseCase(itemRepo, dbMockTx);
const addPartUseCase = new AddServicePartUseCase(partRepo, dbMockTx);
const completeItemUseCase = new CompleteServiceItemUseCase(itemRepo, partRepo, commissionSettingsRepo, commissionRepo, typeRepo, dbMockTx);

const controller = new ServiceItemController(addItemUseCase, addPartUseCase, completeItemUseCase);

app.use("*", authMiddleware);

app.post("/", (c) => controller.addItem(c));
app.post("/:id/parts", (c) => controller.addPart(c));
app.put("/:id/complete", (c) => controller.completeItem(c));

export default app;
