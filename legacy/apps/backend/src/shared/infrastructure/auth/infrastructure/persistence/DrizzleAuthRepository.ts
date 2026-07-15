import { db } from "../../../../../shared/infrastructure/database/client";
import { users, userSessions } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import type { IUserRepository, UserWithRoles } from "../../domain";

export class DrizzleAuthRepository implements IUserRepository {
    async findByUsername(username: string, dbOrTx: any = db): Promise<UserWithRoles | null> {
        const row = await dbOrTx.query.users.findFirst({
            where: eq(users.username, username),
            with: { roles: { with: { roleDetail: true } } }
        });

        if (!row) return null;

        return {
            ...row,
            roles: row.roles?.map((ur: any) => ({
                ...ur,
                role: ur.roleDetail // Map roleDetail to role for domain
            }))
        } as UserWithRoles;
    }

    async findById(id: string, dbOrTx: any = db): Promise<UserWithRoles | null> {
        const row = await dbOrTx.query.users.findFirst({
            where: eq(users.id, id),
            with: { roles: { with: { roleDetail: true } } }
        });

        if (!row) return null;

        return {
            ...row,
            roles: row.roles?.map((ur: any) => ({
                ...ur,
                role: ur.roleDetail
            }))
        } as UserWithRoles;
    }

    async createSession(userId: string, role: string, dbOrTx: any = db): Promise<string> {
        const [session] = await dbOrTx.insert(userSessions).values({
            userId,
            role,
            isActive: true
        }).returning({ id: userSessions.id });
        return session.id;
    }

    async updateSessionRole(sessionId: string, newRole: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(userSessions)
            .set({ role: newRole })
            .where(eq(userSessions.id, sessionId));
    }

    async updateRefreshToken(sessionId: string, refreshToken: string, expiresAt: Date, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(userSessions)
            .set({ refreshToken, refreshTokenExpiresAt: expiresAt })
            .where(eq(userSessions.id, sessionId));
    }

    async validateSession(sessionId: string, dbOrTx: any = db): Promise<{ id: string, userId: string, role: string, isActive: boolean | null, refreshToken: string | null } | null> {
        const session = await dbOrTx.query.userSessions.findFirst({
            columns: { id: true, userId: true, role: true, isActive: true, refreshToken: true },
            where: and(
                eq(userSessions.id, sessionId),
                eq(userSessions.isActive, true)
            )
        });
        return session || null;
    }

    async deactivateSession(sessionId: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(userSessions)
            .set({ isActive: false, logoutTime: new Date() })
            .where(eq(userSessions.id, sessionId));
    }
}

