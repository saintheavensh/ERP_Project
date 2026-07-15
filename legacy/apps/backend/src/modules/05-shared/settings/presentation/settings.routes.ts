import { Hono } from "hono";
import { SettingsController } from "./settings.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requireRole } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new Hono();
const controller = new SettingsController();

app.use("*", authMiddleware);

// GET endpoints: accessible to super_admin, owner, manager
app.get("/*", requireRole("super_admin", "owner", "manager"));

// All write (PUT/POST) endpoints: restricted to super_admin and owner
app.put("/*", requireRole("super_admin", "owner"));
app.post("/*", requireRole("super_admin", "owner"));

app.get("/", (c) => controller.getAll(c));

// Payment Methods
app.get("/payment-methods", (c) => controller.getPaymentMethods(c));
app.put("/payment-methods", (c) => controller.setPaymentMethods(c));

// Store Info
app.get("/store-info", (c) => controller.getStoreInfo(c));
app.put("/store-info", (c) => controller.setStoreInfo(c));

// Receipt
app.get("/receipt", (c) => controller.getReceiptSettings(c));
app.put("/receipt", (c) => controller.setReceiptSettings(c));

// Service
app.get("/service", (c) => controller.getServiceSettings(c));
app.put("/service", (c) => controller.setServiceSettings(c));

// WhatsApp
app.get("/whatsapp", (c) => controller.getWhatsAppSettings(c));
app.put("/whatsapp", (c) => controller.setWhatsAppSettings(c));

// Commission
app.get("/commission", (c) => controller.getCommissionSettings(c));
app.put("/commission", (c) => controller.setCommissionSettings(c));

// Account Mappings
app.get("/account-mappings", (c) => controller.getAccountMappings(c));
app.put("/account-mappings", (c) => controller.setAccountMappings(c));

// General
app.get("/general", (c) => controller.getGeneralSettings(c));
app.put("/general", (c) => controller.setGeneralSettings(c));

// Tax
app.get("/tax", (c) => controller.getTaxSettings(c));
app.put("/tax", (c) => controller.setTaxSettings(c));

// System
app.get("/system", (c) => controller.getSystemSettings(c));
app.put("/system", (c) => controller.setSystemSettings(c));

// Reset
app.post("/reset", (c) => controller.factoryReset(c));

// Role Behavior
app.get("/role-behavior", (c) => controller.getRoleBehavior(c));
app.put("/role-behavior", (c) => controller.setRoleBehavior(c));

// Generic (Fallback)
app.get("/:key", (c) => controller.getByKey(c));
app.put("/:key", (c) => controller.setByKey(c));

export default app;
