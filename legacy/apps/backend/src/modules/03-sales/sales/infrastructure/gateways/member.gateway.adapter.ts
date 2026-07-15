import { eq, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { members } from "../../../../../shared/infrastructure/database/schema";
import { IMemberGateway } from "../../domain";

export class MemberGatewayAdapter implements IMemberGateway {
    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<any> {
        return await tx.query.members.findFirst({
            where: and(eq(members.tenantId, tenantId), eq(members.id, id))
        });
    }

    async updateDebt(tenantId: string, id: string, delta: number, tx: TransactionContext): Promise<void> {
        const member = await this.findById(tenantId, id, tx);
        if (!member) return;

        await tx.update(members)
            .set({ debt: (member.debt || 0) + delta })
            .where(and(eq(members.tenantId, tenantId), eq(members.id, id)));
    }
}
