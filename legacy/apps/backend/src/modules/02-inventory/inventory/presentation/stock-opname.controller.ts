/**
 * Stock Opname controller — delegates to StockOpnameService via DI.
 */
import type { Context } from "hono";
import { stockOpnameService } from "../inventory-container";

function requireTenantId(c: Context): string {
    const user = c.get("user");
    if (!user?.tenantId) {
        throw new Error("TenantId missing from token");
    }
    return user.tenantId as string;
}

export class StockOpnameController {
    async createSession(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = requireTenantId(c);
            const body = await c.req.json();
            const sessionId = await stockOpnameService.createSession(
                tenantId,
                user.id,
                body.notes,
                body.categoryId
            );
            return c.json({ id: sessionId }, 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async getSessions(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const sessions = await stockOpnameService.getSessions(tenantId);
            return c.json(sessions);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async getSessionDetails(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const session = await stockOpnameService.getSessionDetails(tenantId, id);
            if (!session) return c.json({ error: "Session not found" }, 404);
            return c.json(session);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async updateItem(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const itemId = parseInt(c.req.param("itemId"));
            const body = await c.req.json();
            const result = await stockOpnameService.updateItem(
                tenantId,
                itemId,
                body.physicalStock,
                body.adjustmentReason
            );
            return c.json(result);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async finalizeSession(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const result = await stockOpnameService.finalizeSession(tenantId, id, user.id);
            return c.json(result);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async cancelSession(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            await stockOpnameService.cancelSession(tenantId, id, user.id);
            return c.json({ message: "Session cancelled" });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async getAdjustmentHistory(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const history = await stockOpnameService.getAdjustmentHistory(tenantId);
            return c.json(history);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }
}
