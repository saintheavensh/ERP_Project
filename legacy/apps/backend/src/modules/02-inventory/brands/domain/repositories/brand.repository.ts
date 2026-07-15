import { TransactionContext } from "../../../../../shared/types/db-context";
import { Brand, CreateBrandData, UpdateBrandData } from "../entities/brand.entity";

export interface IBrandRepository {
    findAll(tx: TransactionContext): Promise<Brand[]>;
    findById(id: string, tx: TransactionContext): Promise<Brand | null>;
    findByName(name: string, tx: TransactionContext): Promise<Brand | null>;
    create(data: CreateBrandData, tx: TransactionContext): Promise<Brand[]>;
    update(id: string, data: UpdateBrandData, tx: TransactionContext): Promise<Brand[]>;
    delete(id: string, tx: TransactionContext): Promise<Brand[]>;
}
