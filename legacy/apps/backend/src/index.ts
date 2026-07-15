import { serveStatic } from "hono/bun";
import fs from "fs";
import { OpenAPIHono } from "@hono/zod-openapi";
import { container } from "./shared/core/container";
import { TYPES } from "./shared/core/types";
import { cors } from "hono/cors";
import { db } from "./shared/infrastructure/database/client";
import { users, members, sales, purchases, productBatches, productVariants, accounts, assets } from "./shared/infrastructure/database/schema";
import { sql } from "drizzle-orm";
import { appConfig } from "./shared/infrastructure/config/AppConfig";
import { logger as appLogger, type LogContext } from "./shared/logging/AppLogger";
import { Logger } from "./shared/utils/logger/Logger";
const globalLogger = new Logger('App');
import { rateLimiterMiddleware } from "./shared/presentation/middlewares/rate-limiter.middleware";
import { secureHeadersMiddleware } from "./shared/presentation/middlewares/secure-headers.middleware";
import { swaggerApp, openApiConfig } from "./shared/presentation/docs/swagger";

import authController from "./shared/infrastructure/auth/presentation/routes/AuthRoutes";
import inventoryController from "./modules/02-inventory/inventory/presentation/inventory.routes";
import productsController from "./modules/02-inventory/products/presentation/products.routes";
import categoryController from "./modules/02-inventory/categories/presentation/categories.routes";
import { suppliersRoutes } from "./modules/01-purchases/suppliers/presentation";
import uploadsController from "./shared/infrastructure/storage/presentation/routes/StorageRoutes";
import purchaseReturnsController from "./modules/01-purchases/purchase-returns/presentation/purchase-returns.routes";
import { purchasesRoutes } from "./modules/01-purchases/purchases/presentation";
import salesController from "./modules/03-sales/sales/presentation/sales.routes";
import messagingRoutes from "./shared/infrastructure/messaging/presentation/routes/MessagingRoutes";
import customersController from "./modules/03-sales/customers/presentation/customers.routes";
import defectiveItemsController from "./modules/02-inventory/defective-items/presentation/defective-items.routes";
import serviceController from "./modules/03-sales/service/presentation/service.routes";
import serviceCategoriesController from "./modules/03-sales/service/presentation/category.routes";
import serviceTypesController from "./modules/03-sales/service/presentation/type.routes";
import serviceItemsController from "./modules/03-sales/service/presentation/items.routes";
import commissionRoutes from "./modules/03-sales/service/presentation/commissions.routes";
import reportsController from "./modules/04-finance/reports/presentation/reports.routes";
import approvalsController from "./modules/04-finance/approvals/presentation/approval.controller";
import settingsRoutes from "./modules/05-shared/settings/presentation/settings.routes";
import paymentMethodsController from "./modules/03-sales/payment-methods/presentation/payment-methods.routes";
import dashboardController from "./modules/05-shared/dashboard/presentation/dashboard.routes";
import usersController from "./modules/05-shared/users/presentation/users.routes";
import { devicesRoutes } from "./modules/05-shared/devices/presentation";
import { brandRoutes } from "./modules/02-inventory/brands/presentation";
import { storeDevicesRoutes } from "./shared/infrastructure/external-api/devices";
import serviceTools from "./modules/02-inventory/service-tools/presentation/service-tools.routes";
import operationalCostsController from "./modules/04-finance/operational-costs/presentation/operational-costs.routes";
import accountingController from "./modules/04-finance/accounting/presentation/accounting.routes";
import { dashboardRoutes } from "./shared/presentation/dashboard/routes/dashboard.routes";
// import whatsappController removed



export const app = new OpenAPIHono();



// Process-level crash logging
process.on("unhandledRejection", (reason) => {
    appLogger.error("Unhandled Promise Rejection",
        { service: "api-global", tenantId: "system", requestId: "process" },
        { error: reason }
    );
});

process.on("uncaughtException", (error) => {
    appLogger.error("Uncaught Exception",
        { service: "api-global", tenantId: "system", requestId: "process" },
        { error: error }
    );
    // Note: In production, you might want to exit the process here
    // process.exit(1);
});

import { loggerMiddleware } from "./shared/application/middlewares/LoggerMiddleware";
app.use("*", loggerMiddleware);

// Configure OpenAPI Spec
app.doc('/api-docs/spec', openApiConfig as any);
// ... existing Swagger setup ...
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
});

// CORS configuration - allow credentials for cookie-based auth
app.use("*", cors({
    origin: (origin) => {
        // Allow all origins in development (including HTTPS frontend proxying to HTTP backend)
        if (appConfig.isDevelopment) {
            return origin || "*";
        }
        // In production, check against allowed origins
        const allowedOrigins = appConfig.allowedOrigins;
        if (origin && allowedOrigins.includes(origin)) {
            return origin;
        }
        return allowedOrigins[0] || null; // Return specific origin or null if not allowed
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
}));
app.use("*", rateLimiterMiddleware);
// Secure headers
app.use("*", secureHeadersMiddleware);

// Serve static files
app.use("/uploads/*", serveStatic({ root: "./public" }));

// Swagger UI
app.route("/api-docs", swaggerApp);

// Routes
app.route("/auth", authController);
app.route("/products", productsController);
app.route("/inventory", productsController); // Alias for frontend compatibility
app.route("/inventory", inventoryController); // Keep original mounting for opname/gambling/kanibal
app.route("/categories", categoryController);
app.route("/service", serviceController);
app.route("/service-categories", serviceCategoriesController);
app.route("/service-types", serviceTypesController);
app.route("/service-items", serviceItemsController);
app.route("/commissions", commissionRoutes);
app.route("/suppliers", suppliersRoutes);
app.route("/purchases", purchasesRoutes);
app.route("/purchase-returns", purchaseReturnsController);
app.route("/sales", salesController);
app.route("/notifications", messagingRoutes);
app.route("/uploads", uploadsController);
app.route("/users", usersController);
app.route("/customers", customersController);
app.route("/defective-items", defectiveItemsController);
app.route("/reports", reportsController);
app.route("/approvals", approvalsController);
app.route("/settings", settingsRoutes);
app.route("/payment-methods", paymentMethodsController);
app.route("/payments/methods", paymentMethodsController); // Alias for frontend
app.route("/dashboard", dashboardController);
app.route("/dashboard", dashboardRoutes);
app.route("/devices", devicesRoutes);
app.route("/brands", brandRoutes);
app.route("/service-tools", serviceTools);
app.route("/operational-costs", operationalCostsController);
app.route("/accounting", accountingController);
app.route("/store-devices", storeDevicesRoutes);
app.route("/whatsapp", messagingRoutes);


// List all routes for diagnosis
try {
    const routesStr = app.routes.map(r => `${r.method} ${r.path}`).join("\n");
    fs.appendFileSync("C:/Users/Good/Documents/web/coba/apps/backend/debug.log", `\n--- REGISTERED ROUTES ---\n${routesStr}\n-------------------------\n`);
} catch (e) { }

// Root endpoint
app.get("/", (c) => {
    return c.json({ message: "Saint Heavens Backend API is Running!" });
});

// Health check endpoint
app.get("/health", async (c) => {
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        return c.json({
            status: "ok",
            database: "postgresql",
            db_users: result[0].count,
            realtime: "supabase"
        });
    } catch (e) {
        return c.json({ status: "error", message: String(e) }, 500);
    }
});



// Error handler
app.onError((err, c) => {
    // Attempt to extract context if available (middleware might have set it)
    const requestId = (c.get as any)('requestId') || 'unknown';
    const tenantId = (c.get as any)('tenantId') || 'unknown';
    const logContext: LogContext = { service: 'api-global', tenantId, requestId };

    appLogger.error('Unhandled application error', logContext, {
        error: err,
        path: c.req.path,
        method: c.req.method
    });

    // Log to file for agent diagnosis (legacy/redundant but kept as requested)
    try {
        const logMsg = `\n[${new Date().toISOString()}] APP_ON_ERROR: ${err.message}\n${err.stack}\n`;
        fs.appendFileSync("C:/Users/Good/Documents/web/coba/apps/backend/debug.log", logMsg);
    } catch (e) { }

    return c.json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            // DO NOT expose details/stack to client in production
            details: appConfig.isDevelopment ? err.message : undefined
        }
    }, 500);
});

// Not found handler
app.notFound((c) => {
    const requestId = (c.get as any)('requestId');
    globalLogger.child({ requestId }).warn('Route not found', { path: c.req.path });

    // Log to file for agent diagnosis
    try {
        const logMsg = `\n[${new Date().toISOString()}] APP_NOT_FOUND: ${c.req.method} ${c.req.path}\n`;
        fs.appendFileSync("C:/Users/Good/Documents/web/coba/apps/backend/debug.log", logMsg);
    } catch (e) { }

    return c.json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${c.req.method} ${c.req.path} not found`
        }
    }, 404);
});

const port = appConfig.port;
const hostname = appConfig.host;

globalLogger.info(`🚀 Server starting on http://${hostname}:${port}`);

export default {
    port,
    hostname,
    fetch: app.fetch,
};
