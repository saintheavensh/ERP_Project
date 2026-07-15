import { db } from "../../../shared/infrastructure/database/client";
import {
    PurchaseReturnRepositoryAdapter,
    StockMutationGatewayAdapter
} from "./infrastructure";
import {
    GetPurchaseReturnsUseCase,
    GetPurchaseReturnByIdUseCase,
    CreatePurchaseReturnUseCase
} from "./application";
import { CreatePurchaseReturnData, PurchaseReturn } from "./domain";

// Infrastructure adapters
const repository = new PurchaseReturnRepositoryAdapter();
const stockGateway = new StockMutationGatewayAdapter();

// Use cases
const getPurchaseReturnsUC = new GetPurchaseReturnsUseCase(repository);
const getPurchaseReturnByIdUC = new GetPurchaseReturnByIdUseCase(repository);
const createPurchaseReturnUC = new CreatePurchaseReturnUseCase(repository, stockGateway, db);

/**
 * PurchaseReturnsService — facade for external and presentation layers.
 */
export class PurchaseReturnsService {
    async getAll(dbOrTx?: any): Promise<PurchaseReturn[]> {
        return await getPurchaseReturnsUC.execute(dbOrTx);
    }

    async getById(id: string, dbOrTx?: any): Promise<PurchaseReturn> {
        return await getPurchaseReturnByIdUC.execute(id, dbOrTx);
    }

    async create(data: CreatePurchaseReturnData, dbOrTx?: any): Promise<PurchaseReturn> {
        return await createPurchaseReturnUC.execute(data, dbOrTx);
    }
}

/** Singleton service instance */
export const purchaseReturnsService = new PurchaseReturnsService();
