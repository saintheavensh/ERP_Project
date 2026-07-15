import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ServiceController } from "./service.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requireRole } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";
import { createServiceSchema } from "@repo/shared";

const app = new Hono();
const controller = new ServiceController();

app.use("*", authMiddleware);

app.get("/", requireRole("super_admin", "owner", "manager", "kasir", "teknisi"), (c) => controller.getAll(c));
app.get("/counts", requireRole("super_admin", "owner", "manager", "kasir", "teknisi"), (c) => controller.getCounts(c));
app.get("/dashboard/stats", requireRole("super_admin", "owner", "manager", "kasir", "teknisi"), (c) => controller.getStats(c));
app.get("/:id", requireRole("super_admin", "owner", "manager", "kasir", "teknisi"), (c) => controller.getById(c));
app.get("/:id/print", requireRole("super_admin", "owner", "manager", "kasir", "teknisi"), (c) => controller.printService(c));

app.post("/", requireRole("super_admin", "owner", "manager", "kasir"), zValidator("json", createServiceSchema), (c) => controller.createService(c));
app.post("/:id/assign", requireRole("super_admin", "owner", "manager", "kasir"), (c) => controller.assignTechnician(c));

app.put("/:id/status", requireRole("super_admin", "owner", "manager", "teknisi"), (c) => controller.updateStatus(c));
app.put("/:id/details", requireRole("super_admin", "owner", "manager", "kasir", "teknisi"), (c) => controller.updateDetails(c));

app.patch("/:id", requireRole("super_admin", "owner", "manager", "kasir", "teknisi"), (c) => controller.patchService(c));

app.delete("/:id", requireRole("super_admin", "owner", "manager"), (c) => controller.deleteService(c));

export default app;
