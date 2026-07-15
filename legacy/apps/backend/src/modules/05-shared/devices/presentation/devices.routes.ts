import { Hono } from "hono";
import { DevicesController } from "./devices.controller";
import { permissionGuard } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

const router = new Hono();
const controller = new DevicesController();

// Use authMiddleware for all device routes
router.use("*", authMiddleware);

// Scraper routes
router.post("/scrape", permissionGuard("inventory.manage"), (c) => controller.scrape(c));
router.post("/scrape-list", permissionGuard("inventory.manage"), (c) => controller.scrapeList(c));
router.post("/import", permissionGuard("inventory.manage"), (c) => controller.importUrl(c));

// Standard CRUD
router.get("/", (c) => controller.getAll(c));
router.get("/unlinked", permissionGuard("inventory.view"), (c) => controller.getUnlinked(c));
router.get("/:id", (c) => controller.getById(c));
router.post("/", permissionGuard("inventory.manage"), (c) => controller.create(c));
router.put("/:id", permissionGuard("inventory.manage"), (c) => controller.update(c));
router.delete("/bulk", permissionGuard("inventory.manage"), (c) => controller.bulkDelete(c));
router.delete("/:id", permissionGuard("inventory.manage"), (c) => controller.delete(c));

// Utility
router.post("/:id/sync", permissionGuard("inventory.manage"), (c) => controller.sync(c));

export default router;
