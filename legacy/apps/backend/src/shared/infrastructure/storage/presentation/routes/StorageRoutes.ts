import { Hono } from "hono";
import { StorageController } from "../controllers/StorageController";
import { authMiddleware } from "../../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

const app = new Hono();
const storageController = new StorageController();

app.post("/", authMiddleware, (c) => storageController.upload(c));

export default app;
