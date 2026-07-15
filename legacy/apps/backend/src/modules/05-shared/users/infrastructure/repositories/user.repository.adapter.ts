import { eq, sql, and } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { users, userRoles } from "../../../../../shared/infrastructure/database/schema";
import { IUserRepository, User } from "../../domain";

export class UserRepositoryAdapter implements IUserRepository {
    async findAll(tenantId: string, tx: DBContext, role?: string): Promise<User[]> {
        let rows;
        if (role) {
            rows = await tx.query.users.findMany({
                where: and(
                    eq(users.tenantId, tenantId),
                    sql`EXISTS (
                        SELECT 1 FROM user_roles 
                        WHERE user_roles.user_id = users.id 
                        AND user_roles.tenant_id = ${tenantId}
                        AND user_roles.role = ${role}
                    )`
                ),
                with: { roles: { with: { roleDetail: true } } }
            });
        } else {
            rows = await tx.query.users.findMany({
                where: eq(users.tenantId, tenantId),
                with: { roles: { with: { roleDetail: true } } }
            });
        }

        return rows.map((row: any) => ({
            ...row,
            email: row.email, // Explicit mapping
            roles: row.roles?.map((ur: any) => ({
                ...ur,
                role: ur.roleDetail // Map roleDetail to role for domain compatibility
            }))
        })) as User[];
    }

    async findById(tenantId: string, id: string, tx: DBContext): Promise<User | null> {
        const row = await tx.query.users.findFirst({
            where: and(eq(users.tenantId, tenantId), eq(users.id, id)),
            with: { roles: { with: { roleDetail: true } } }
        });

        if (!row) return null;

        return {
            ...row,
            email: row.email,
            roles: row.roles?.map((ur: any) => ({
                ...ur,
                role: ur.roleDetail
            }))
        } as User;
    }

    async create(tenantId: string, data: any, tx: DBContext): Promise<User> {
        const [result] = await tx.insert(users).values({ ...data, tenantId }).returning();
        if (!result) throw new Error("UserRepositoryAdapter: Failed to create user");
        return {
            ...result,
            email: result.email
        } as User;
    }

    async update(tenantId: string, id: string, data: any, tx: DBContext): Promise<User> {
        const [result] = await tx.update(users)
            .set(data)
            .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
            .returning();
        if (!result) throw new Error("UserRepositoryAdapter: Failed to update user");
        return {
            ...result,
            email: result.email
        } as User;
    }

    async delete(tenantId: string, id: string, tx: DBContext): Promise<void> {
        await tx.delete(users).where(and(eq(users.tenantId, tenantId), eq(users.id, id)));
    }

    async syncRoles(tenantId: string, userId: string, roles: string[], tx: DBContext): Promise<void> {
        // Delete existing roles
        await tx.delete(userRoles).where(and(
            eq(userRoles.tenantId, tenantId),
            eq(userRoles.userId, userId)
        ));

        // Insert new roles
        if (roles.length > 0) {
            const roleValues = roles.map((roleId: string) => ({
                tenantId: tenantId,
                userId: userId,
                role: roleId
            }));
            await tx.insert(userRoles).values(roleValues);
        }
    }
}
