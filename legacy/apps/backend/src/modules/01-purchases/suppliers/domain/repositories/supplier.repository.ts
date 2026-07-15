import { TransactionContext } from "../../../../../shared/types/db-context";
import { Supplier, CreateSupplierData, UpdateSupplierData } from "../entities/supplier.entity";

export interface ISupplierRepository {
    findAll(tenantId: string, tx: TransactionContext): Promise<Supplier[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<Supplier | null>;
    getLinkedCategories(tenantId: string, supplierId: string, tx: TransactionContext): Promise<any[]>;
    create(tenantId: string, data: CreateSupplierData, tx: TransactionContext): Promise<Supplier[]>;
    update(tenantId: string, id: string, data: UpdateSupplierData, tx: TransactionContext): Promise<Supplier[]>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<any>;
    addCategoryLink(tenantId: string, supplierId: string, categoryId: string, tx: TransactionContext): Promise<void>;
    removeCategoryLink(tenantId: string, supplierId: string, categoryId: string, tx: TransactionContext): Promise<void>;

    getMappedProductVariants(tenantId: string, supplierId: string, tx: TransactionContext): Promise<any[]>;
    mapProductVariant(tenantId: string, supplierId: string, productId: string, variantId: string | null | undefined, tx: TransactionContext): Promise<void>;
    unmapProductVariant(tenantId: string, supplierId: string, productId: string, variantId: string | null | undefined, tx: TransactionContext): Promise<void>;
}
