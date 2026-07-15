import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "@hono/zod-openapi";
import { PurchasesController } from "./purchases.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new PurchasesController();

const purchaseItemSchema = z.object({
    productId: z.string(),
    variant: z.string().optional(),
    qtyOrdered: z.number().min(1),
    estimatedBuyPrice: z.number().min(0).optional(),
    targetSellPrice: z.number().min(0).optional(),
});

const purchaseSchema = z.object({
    supplierId: z.string(),
    userId: z.string().optional(),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
    date: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1),
});

const receiveItemSchema = z.object({
    productId: z.string(),
    variant: z.string().optional(),
    qtyReceived: z.number().min(0),
});

const receiveSchema = z.object({
    items: z.array(receiveItemSchema).min(1),
});

const verifyItemSchema = z.object({
    productId: z.string(),
    variant: z.string().optional(),
    buyPrice: z.number().min(0),
    sellPrice: z.number().min(0),
});

const verifySchema = z.object({
    items: z.array(verifyItemSchema).min(1),
    shippingFee: z.number().optional(),
    discountAmount: z.number().optional(),
    referenceNumber: z.string().optional(),
    payment: z.object({
        method: z.string(),
        amount: z.number(),
        accountId: z.string().optional()
    }).optional()
});

app.use("*", authMiddleware);

app.get("/", requirePermission("purchase.create", "inventory.manage"), (c) => controller.getAll(c));
app.post("/", requirePermission("purchase.create"), zValidator("json", purchaseSchema), (c) => controller.createOrder(c));
app.get("/recommendations/low-stock", requirePermission("purchase.create", "inventory.manage"), (c) => controller.getLowStockSummary(c));
app.get("/:id", requirePermission("purchase.create", "inventory.manage"), (c) => controller.getById(c));
app.post("/:id/cancel", requirePermission("purchase.create", "inventory.manage"), (c) => controller.cancelOrder(c));
app.post("/:id/receive", requirePermission("purchase.create", "inventory.manage"), zValidator("json", receiveSchema), (c) => controller.receiveGoods(c));
app.post("/:id/verify", requirePermission("purchase.create", "inventory.manage"), zValidator("json", verifySchema), (c) => controller.verifyGoods(c));
app.delete("/:id", requirePermission("purchase.create", "inventory.manage"), (c) => controller.deletePurchase(c));

export default app;
