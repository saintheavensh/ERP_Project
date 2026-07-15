import { Hono } from "hono";
import { ServiceTypeController } from "./type.controller";
import { TypeManagementUseCase } from "../application/use-cases/type-management.use-case";
import { DrizzleServiceTypeRepository } from "../infrastructure/repositories/drizzle-service-type.repository";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

const app = new Hono();
const repository = new DrizzleServiceTypeRepository();
const useCase = new TypeManagementUseCase(repository);
const controller = new ServiceTypeController(useCase);

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.post("/", (c) => controller.create(c));
app.get("/:id", (c) => controller.getById(c));
app.put("/:id", (c) => controller.update(c));
app.delete("/:id", (c) => controller.delete(c));

export default app;
