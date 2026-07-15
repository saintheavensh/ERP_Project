import { Hono } from "hono";
import { DefectiveItemsController } from "./defective-items.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new DefectiveItemsController();

app.use("*", authMiddleware);

// GET / - returns all defective items (for manager returns page)
app.get("/", requirePermission("inventory.read"), (c) => controller.getPending(c));

app.get("/pending", requirePermission("inventory.read"), (c) => controller.getPending(c));
app.get("/processed", requirePermission("inventory.read"), (c) => controller.getProcessed(c));

app.post("/", requirePermission("inventory.write"), (c) => controller.createItem(c));
app.post("/process-return", requirePermission("purchase-return.create"), (c) => controller.processReturn(c));
// Alias for frontend compatibility
app.post("/create-return", requirePermission("purchase-return.create"), (c) => controller.processReturn(c));

export default app;
