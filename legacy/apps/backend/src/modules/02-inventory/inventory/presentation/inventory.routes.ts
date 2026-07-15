import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { StockOpnameController } from "./stock-opname.controller";
import gamblingController from "./gambling.controller";
import kanibalController from "./kanibal.controller";
import { authMiddleware } from "@shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission, requireRole } from "@shared/infrastructure/auth/presentation/middlewares/permission.middleware";

const app = new OpenAPIHono();
const stockOpnameController = new StockOpnameController();

// ============================================
// OPENAPI ROUTE DEFINITIONS
// ============================================

const getSessionsRoute = createRoute({
    method: 'get',
    path: '/opname/sessions',
    tags: ['Inventory'],
    description: 'Get all stock opname sessions',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'List of sessions',
            content: { 'application/json': { schema: z.array(z.any()) } }
        }
    }
});

const getAdjustmentHistoryRoute = createRoute({
    method: 'get',
    path: '/opname/adjustment-history',
    tags: ['Inventory'],
    description: 'Get stock adjustment history',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Adjustment history',
            content: { 'application/json': { schema: z.array(z.any()) } }
        }
    }
});

const createSessionRoute = createRoute({
    method: 'post',
    path: '/opname/sessions',
    tags: ['Inventory'],
    description: 'Create a new stock opname session',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        notes: z.string().optional(),
                        categoryId: z.string().optional()
                    })
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Session created',
            content: { 'application/json': { schema: z.object({ id: z.string() }) } }
        }
    }
});

const getSessionDetailsRoute = createRoute({
    method: 'get',
    path: '/opname/sessions/{id}',
    tags: ['Inventory'],
    description: 'Get details of a specific stock opname session',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Session ID' })
        })
    },
    responses: {
        200: {
            description: 'Session details',
            content: { 'application/json': { schema: z.any() } }
        },
        404: { description: 'Session not found' }
    }
});

const updateOpnameItemRoute = createRoute({
    method: 'put',
    path: '/opname/items/{itemId}',
    tags: ['Inventory'],
    description: 'Update physical stock for an item in a session',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            itemId: z.string().openapi({ description: 'Opname Item ID' })
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        physicalStock: z.number(),
                        adjustmentReason: z.string().optional()
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Item updated',
            content: { 'application/json': { schema: z.any() } }
        }
    }
});

const finalizeSessionRoute = createRoute({
    method: 'post',
    path: '/opname/sessions/{id}/finalize',
    tags: ['Inventory'],
    description: 'Finalize a stock opname session and apply adjustments',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Session ID' })
        })
    },
    responses: {
        200: {
            description: 'Session finalized',
            content: { 'application/json': { schema: z.any() } }
        }
    }
});

const cancelSessionRoute = createRoute({
    method: 'post',
    path: '/opname/sessions/{id}/cancel',
    tags: ['Inventory'],
    description: 'Cancel a stock opname session',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Session ID' })
        })
    },
    responses: {
        200: {
            description: 'Session cancelled',
            content: { 'application/json': { schema: z.object({ message: z.string() }) } }
        }
    }
});

// ============================================
// BIND OPENAPI ROUTES TO CONTROLLER
// ============================================

app.use("*", authMiddleware);

// Restricted to Warehouse & Manager
app.use("/opname/*", requireRole('warehouse', 'manager'));

app.openapi(getSessionsRoute, ((c: any) => stockOpnameController.getSessions(c)) as any);
app.openapi(getAdjustmentHistoryRoute, ((c: any) => stockOpnameController.getAdjustmentHistory(c)) as any);
app.openapi(createSessionRoute, ((c: any) => stockOpnameController.createSession(c)) as any);
app.openapi(getSessionDetailsRoute, ((c: any) => stockOpnameController.getSessionDetails(c)) as any);
app.openapi(updateOpnameItemRoute, ((c: any) => stockOpnameController.updateItem(c)) as any);
app.openapi(finalizeSessionRoute, ((c: any) => stockOpnameController.finalizeSession(c)) as any);
app.openapi(cancelSessionRoute, ((c: any) => stockOpnameController.cancelSession(c)) as any);

// Standard Hono routes for Gambling & Kanibal
app.route("/gambling", gamblingController);
app.route("/kanibal", kanibalController);

export default app;
