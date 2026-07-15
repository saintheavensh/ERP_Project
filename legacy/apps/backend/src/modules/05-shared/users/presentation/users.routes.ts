import { Hono } from "hono";
import { UsersController } from "./users.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new UsersController();

app.use("*", authMiddleware);

app.get("/", requirePermission("employee.manage"), (c) => controller.getAll(c));
app.get("/:id", requirePermission("employee.manage"), (c) => controller.getById(c));
app.post("/", requirePermission("employee.manage"), (c) => controller.create(c));
app.put("/:id", requirePermission("employee.manage"), (c) => controller.update(c));
app.delete("/:id", requirePermission("employee.manage"), (c) => controller.delete(c));

export default app;
