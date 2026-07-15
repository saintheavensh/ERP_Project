import { Hono } from "hono";
import { PurchaseReturnsController } from "./purchase-returns.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { permissionGuard } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new PurchaseReturnsController();

app.get("/", authMiddleware, permissionGuard("inventory.view"), (c) => controller.getAll(c));
app.get("/:id", authMiddleware, permissionGuard("inventory.view"), (c) => controller.getById(c));
app.post("/", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.create(c));

export default app;
