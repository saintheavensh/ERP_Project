import { Hono } from "hono";
import { AuthController } from "../controllers/AuthController";
import { RoleController } from "../controllers/RoleController";
import { authMiddleware } from "../../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

const app = new Hono();
const authController = new AuthController();
const roleController = new RoleController();

app.post("/login", (c) => authController.login(c));
app.post("/logout", (c) => authController.logout(c));
app.post("/refresh", (c) => authController.refresh(c));
app.post("/switch-role", authMiddleware, (c) => authController.switchRole(c));
app.get("/me", authMiddleware, (c) => authController.me(c));
app.get("/roles", authMiddleware, (c) => roleController.getAll(c));

export default app;
