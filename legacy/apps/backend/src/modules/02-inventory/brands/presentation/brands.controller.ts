import type { Context } from "hono";
import { brandsFacade } from "../brands-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

function requireTenantId(c: Context): string {
    const user = c.get("user");
    if (!user?.tenantId) {
        throw new Error("TenantId missing from token");
    }
    return user.tenantId as string;
}

export class BrandsController {
    async getAll(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const brands = await brandsFacade.getAll(tenantId);
            return apiSuccess(c, brands);
        } catch (e: unknown) {
            return apiError(c, e, "Failed to fetch brands", 500);
        }
    }

    async create(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const data = (c.req as unknown as { valid(target: string): unknown }).valid("json");
            const brand = await brandsFacade.create(tenantId, data) as unknown[];
            return apiSuccess(c, brand[0], "Brand created", 201);
        } catch (e: unknown) {
            if (e instanceof Error && "code" in e && (e as Error & { code: string }).code === "23505") {
                return apiError(c, "Brand ID already exists", "Duplicate Brand ID", 409);
            }
            return apiError(c, e, "Failed to create brand", 500);
        }
    }

    async update(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const data = (c.req as unknown as { valid(target: string): unknown }).valid("json");
            const brand = await brandsFacade.update(tenantId, id, data) as unknown[];
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, brand[0]);
        } catch (e: unknown) {
            return apiError(c, e, "Failed to update brand", 500);
        }
    }

    async delete(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const brand = await brandsFacade.delete(tenantId, id) as unknown[];
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, { deleted: true });
        } catch (e: unknown) {
            return apiError(c, e, "Failed to delete brand", 500);
        }
    }
}
