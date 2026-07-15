import { TransactionContext } from "../../../../../shared/types/db-context";
import { accounts } from "../../../../../shared/infrastructure/database/schema";
import { IAccountGateway } from "../../domain";
import { eq, and, like, desc } from "drizzle-orm";

export class AccountGatewayAdapter implements IAccountGateway {
    async ensureAccount(tenantId: string, name: string, type: string, tx: TransactionContext, providedAccountId?: string | undefined): Promise<string> {
        if (providedAccountId) return providedAccountId;

        const parentId = "1-1000"; // Kas & Bank
        const prefix = "10"; // Base for 10xx codes

        // Try searching by name first
        const existing = await tx.query.accounts.findFirst({
            where: and(
                eq(accounts.tenantId, tenantId),
                eq(accounts.parentId, parentId),
                eq(accounts.name, name)
            )
        });

        if (existing) return existing.id;

        // Create new account
        const lastAccount = await tx.query.accounts.findFirst({
            where: and(eq(accounts.tenantId, tenantId), like(accounts.code, `${prefix}%`)),
            orderBy: [desc(accounts.code)]
        });

        const nextNum = lastAccount ? (parseInt(lastAccount.code) + 1) : 1001;
        const nextCode = nextNum.toString();
        const nextId = `1-${nextCode}`;

        await tx.insert(accounts).values({
            id: nextId,
            code: nextCode,
            name: name,
            typeId: "ASSET",
            parentId: parentId,
            isActive: true,
            balance: 0,
            tenantId
        });

        return nextId;
    }
}
