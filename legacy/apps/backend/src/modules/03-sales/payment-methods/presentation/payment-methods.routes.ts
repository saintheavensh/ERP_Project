import { Hono } from "hono";
import { PaymentMethodsController } from "./payment-methods.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { permissionGuard } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new PaymentMethodsController();

app.use("*", authMiddleware);

app.get("/", permissionGuard("sale.view"), (c) => controller.getAll(c));
app.get("/enabled", (c) => controller.getEnabled(c));
app.get("/:id", permissionGuard("sale.view"), (c) => controller.getById(c));
app.post("/", permissionGuard("admin"), (c) => controller.create(c));
app.patch("/:id", permissionGuard("admin"), (c) => controller.update(c));
app.delete("/:id", permissionGuard("admin"), (c) => controller.disable(c));

// Variants
app.post("/:id/variants", permissionGuard("admin"), (c) => controller.addVariant(c));
app.patch("/variants/:id", permissionGuard("admin"), (c) => controller.updateVariant(c));
app.delete("/variants/:id", permissionGuard("admin"), (c) => controller.disableVariant(c));

export default app;
