import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "@hono/zod-openapi";
import { SuppliersController } from "./suppliers.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new SuppliersController();

const supplierSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contact: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    image: z.string().optional()
});

const linkCategorySchema = z.object({ categoryId: z.string() });

const mapProductVariantSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    variantId: z.string().optional().nullable()
});

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.get("/:id/categories", (c) => controller.getLinkedCategories(c));
app.post("/", requirePermission("inventory.manage", "purchase.create"), zValidator("json", supplierSchema), (c) => controller.create(c));
app.put("/:id", requirePermission("inventory.manage", "purchase.create"), zValidator("json", supplierSchema), (c) => controller.update(c));
app.delete("/:id", requirePermission("inventory.manage"), (c) => controller.delete(c));

app.post("/:id/categories", requirePermission("inventory.manage"), zValidator("json", linkCategorySchema), (c) => controller.linkCategory(c));
app.delete("/:id/categories/:categoryId", requirePermission("inventory.manage"), (c) => controller.unlinkCategory(c));

// Product Variant Mapping
app.get("/:id/product-variants", requirePermission("inventory.manage", "purchase.create"), (c) => controller.getMappedProductVariants(c));
app.post("/:id/product-variants", requirePermission("inventory.manage", "purchase.create"), zValidator("json", mapProductVariantSchema), (c) => controller.mapProductVariant(c));
app.delete("/:id/product-variants/:productId", requirePermission("inventory.manage", "purchase.create"), (c) => controller.unmapProductVariant(c));

export default app;
