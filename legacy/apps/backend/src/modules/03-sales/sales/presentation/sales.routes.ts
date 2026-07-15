import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { SalesController } from "./sales.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";
import { createSaleSchema } from "@repo/shared";

const app = new Hono();
const controller = new SalesController();

app.use("*", authMiddleware);

app.get("/", requirePermission("sale.read", "sale.create"), (c) => controller.getAll(c));
app.get("/:id", requirePermission("sale.read", "sale.create"), (c) => controller.getOne(c));
app.post("/", requirePermission("sale.create"), zValidator("json", createSaleSchema), (c) => controller.createSale(c));

export default app;
