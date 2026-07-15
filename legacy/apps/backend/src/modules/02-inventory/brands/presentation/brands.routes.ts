import { Hono } from "hono";
import { z } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { BrandsController } from "./brands.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { permissionGuard } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

export const brands = new Hono();
const controller = new BrandsController();

const createBrandSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    logo: z.string().optional(),
});

const updateBrandSchema = z.object({
    name: z.string().optional(),
    logo: z.string().optional(),
});

brands.get("/", (c) => controller.getAll(c));

brands.post(
    "/",
    authMiddleware,
    permissionGuard("inventory.manage"),
    zValidator("json", createBrandSchema),
    (c) => controller.create(c)
);

brands.patch(
    "/:id",
    authMiddleware,
    permissionGuard("inventory.manage"),
    zValidator("json", updateBrandSchema),
    (c) => controller.update(c)
);

brands.delete(
    "/:id",
    authMiddleware,
    permissionGuard("inventory.manage"),
    (c) => controller.delete(c)
);

export default brands;
