import { db } from "@shared/infrastructure/database/client";
import { rolePermissions } from "@shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

export interface GetRolePermissionsInput {
    roleId: string;
}

export class GetRolePermissionsUseCase {
    private permissionCache: Map<string, string[]> = new Map();
    private cacheTimestamp = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    async execute(input: GetRolePermissionsInput): Promise<string[]> {
        // Check cache freshness
        if (Date.now() - this.cacheTimestamp > this.CACHE_TTL) {
            this.permissionCache.clear();
            this.cacheTimestamp = Date.now();
        }

        // Return from cache if available
        if (this.permissionCache.has(input.roleId)) {
            return this.permissionCache.get(input.roleId)!;
        }

        // Extremely fast lookup on the indexed RolePermission table
        // No N+1 issues; strictly retrieving mapped strings
        const mappings = await db
            .select({ permissionId: rolePermissions.permissionId })
            .from(rolePermissions)
            .where(eq(rolePermissions.roleId, input.roleId));

        const perms = mappings.map(m => m.permissionId) || [];
        this.permissionCache.set(input.roleId, perms);
        return perms;
    }

    clearCache(): void {
        this.permissionCache.clear();
        this.cacheTimestamp = 0;
    }

    invalidateRole(roleId: string): void {
        this.permissionCache.delete(roleId);
    }
}
