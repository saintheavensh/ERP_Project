import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServiceToolRepository, ServiceTool, ToolCondition } from "../../domain";

export class CreateServiceToolUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(data: any, tx: TransactionContext): Promise<ServiceTool> {
        // Generate ID TOOL-XXX
        const last = await this.repository.findLast(tx);
        let nextId = "TOOL-001";

        if (last) {
            const parts = last.id.split("-");
            if (parts.length > 1) {
                const num = parseInt(parts[1]);
                if (!isNaN(num)) {
                    nextId = `TOOL-${String(num + 1).padStart(3, "0")}`;
                }
            }
        }

        const toolData = {
            id: nextId,
            name: data.name,
            brand: data.brand || null,
            qty: Number(data.qty) || 1,
            condition: (data.condition as ToolCondition) || "good",
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            price: Number(data.price) || 0,
            notes: data.notes || null,
            userId: data.userId || null
        };

        return await this.repository.create(toolData, tx);
    }
}

export class UpdateServiceToolUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(id: string, data: any, tx: TransactionContext): Promise<void> {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.brand !== undefined) updateData.brand = data.brand;
        if (data.qty !== undefined) updateData.qty = Number(data.qty);
        if (data.condition) updateData.condition = data.condition;
        if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
        if (data.price !== undefined) updateData.price = Number(data.price);
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.userId !== undefined) updateData.userId = data.userId;

        await this.repository.update(id, updateData, tx);
    }
}

export class UpdateToolConditionUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(id: string, condition: ToolCondition, tx: TransactionContext): Promise<void> {
        await this.repository.update(id, { condition }, tx);
    }
}

export class DeleteServiceToolUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(id: string, tx: TransactionContext): Promise<void> {
        await this.repository.delete(id, tx);
    }
}
