import { Hono } from "hono";
import { ServiceCategoryController } from "./category.controller";
import { CategoryManagementUseCase } from "../application/use-cases/category-management.use-case";
import { DrizzleServiceCategoryRepository } from "../infrastructure/repositories/drizzle-service-category.repository";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

const app = new Hono();
const repository = new DrizzleServiceCategoryRepository();
const useCase = new CategoryManagementUseCase(repository);
const controller = new ServiceCategoryController(useCase);

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.post("/", (c) => controller.create(c));
app.get("/:id", (c) => controller.getById(c));
app.put("/:id", (c) => controller.update(c));
app.delete("/:id", (c) => controller.delete(c));

export default app;
