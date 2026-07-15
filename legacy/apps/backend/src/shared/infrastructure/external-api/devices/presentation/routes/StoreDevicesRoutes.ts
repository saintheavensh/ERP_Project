import { Hono } from "hono";
import { authMiddleware } from "../../../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { StoreDevicesController } from "../controllers/StoreDevicesController";
import { container } from "../../../../../../shared/core/container";

const app = new Hono();

const getController = () => container.get<StoreDevicesController>(StoreDevicesController);

app.post("/register", authMiddleware, (c) => getController().register(c));
app.get("/:deviceId/status", authMiddleware, (c) => getController().getStatus(c));
app.post("/:deviceId/ping", authMiddleware, (c) => getController().ping(c));

export default app;
