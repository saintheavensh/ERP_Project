import { Hono } from "hono";
import { CustomersController } from "./customers.controller";
import { zValidator } from "@hono/zod-validator";
import { z } from "@hono/zod-openapi";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { permissionGuard } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new CustomersController();

const createCustomerSchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable()
});

const updateCustomerSchema = createCustomerSchema.partial();

const processPaymentSchema = z.object({
    amount: z.number().min(1),
    method: z.enum(["cash", "transfer", "qris"]),
    notes: z.string().optional(),
    saleId: z.string().optional(),
    proofImage: z.string().optional()
});

app.get("/", authMiddleware, permissionGuard("inventory.view"), (c) => controller.getAll(c));
app.get("/:id", authMiddleware, permissionGuard("inventory.view"), (c) => controller.getById(c));
app.post("/", authMiddleware, permissionGuard("inventory.manage"), zValidator("json", createCustomerSchema), (c) => controller.create(c));
app.patch("/:id", authMiddleware, permissionGuard("inventory.manage"), zValidator("json", updateCustomerSchema), (c) => controller.update(c));
app.delete("/:id", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.delete(c));

app.get("/:id/sales", authMiddleware, permissionGuard("inventory.view"), (c) => controller.getSales(c));
app.get("/:id/unpaid-sales", authMiddleware, permissionGuard("inventory.view"), (c) => controller.getUnpaidSales(c));
app.post("/:id/payments", authMiddleware, permissionGuard("inventory.manage"), zValidator("json", processPaymentSchema), (c) => controller.processPayment(c));

export default app;
