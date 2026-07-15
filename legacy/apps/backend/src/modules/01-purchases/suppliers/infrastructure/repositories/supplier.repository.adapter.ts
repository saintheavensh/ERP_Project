import { eq, desc, and, isNull } from "drizzle-orm";
import { suppliers, supplierCategories, categories, categoryVariants, supplierProductVariants, products, productVariants } from "../../../../../shared/infrastructure/database/schema";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository, Supplier, CreateSupplierData, UpdateSupplierData } from "../../domain";

export class SupplierRepositoryAdapter implements ISupplierRepository {
    async findAll(tenantId: string, tx: TransactionContext): Promise<Supplier[]> {
        const result = await tx.query.suppliers.findMany({
            where: and(
                eq(suppliers.tenantId, tenantId),
                eq(suppliers.isActive, true)
            ),
            orderBy: [desc(suppliers.createdAt)],
        });
        return result as Supplier[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<Supplier | null> {
        const result = await tx.query.suppliers.findFirst({
            where: and(
                eq(suppliers.tenantId, tenantId),
                eq(suppliers.id, id)
            )
        });
        return (result as Supplier) || null;
    }

    async getLinkedCategories(tenantId: string, supplierId: string, tx: TransactionContext): Promise<any[]> {
        const result = await tx
            .select({
                id: categories.id,
                name: categories.name,
                parentId: categories.parentId
            })
            .from(supplierCategories)
            .innerJoin(categories, eq(supplierCategories.categoryId, categories.id))
            .where(
                and(
                    eq(supplierCategories.tenantId, tenantId),
                    eq(supplierCategories.supplierId, supplierId)
                )
            );
        return result;
    }

    async create(tenantId: string, data: CreateSupplierData, tx: TransactionContext): Promise<Supplier[]> {
        return await tx.insert(suppliers).values({ ...data, tenantId }).returning();
    }

    async update(tenantId: string, id: string, data: UpdateSupplierData, tx: TransactionContext): Promise<Supplier[]> {
        return await tx.update(suppliers)
            .set(data)
            .where(
                and(
                    eq(suppliers.tenantId, tenantId),
                    eq(suppliers.id, id)
                )
            )
            .returning();
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<any> {
        // Delete linked category variants first (no cascade in schema)
        await tx.delete(categoryVariants)
            .where(
                and(
                    eq(categoryVariants.tenantId, tenantId),
                    eq(categoryVariants.supplierId, id)
                )
            );

        return await tx.delete(suppliers)
            .where(
                and(
                    eq(suppliers.tenantId, tenantId),
                    eq(suppliers.id, id)
                )
            );
    }

    async addCategoryLink(tenantId: string, supplierId: string, categoryId: string, tx: TransactionContext): Promise<void> {
        await tx.insert(supplierCategories)
            .values({ supplierId, categoryId, tenantId })
            .onConflictDoNothing();
    }

    async removeCategoryLink(tenantId: string, supplierId: string, categoryId: string, tx: TransactionContext): Promise<void> {
        await tx.delete(supplierCategories)
            .where(
                and(
                    eq(supplierCategories.tenantId, tenantId),
                    eq(supplierCategories.supplierId, supplierId),
                    eq(supplierCategories.categoryId, categoryId)
                )
            );
    }

    async getMappedProductVariants(tenantId: string, supplierId: string, tx: TransactionContext): Promise<any[]> {
        const results = await tx
            .select({
                id: supplierProductVariants.id,
                productId: products.id,
                productName: products.name,
                variantId: productVariants.id,
                variantName: productVariants.name,
                isActive: supplierProductVariants.isActive
            })
            .from(supplierProductVariants)
            .innerJoin(products, eq(supplierProductVariants.productId, products.id))
            .leftJoin(productVariants, eq(supplierProductVariants.variantId, productVariants.id))
            .where(
                and(
                    eq(supplierProductVariants.tenantId, tenantId),
                    eq(supplierProductVariants.supplierId, supplierId)
                )
            );

        return results;
    }

    async mapProductVariant(tenantId: string, supplierId: string, productId: string, variantId: string | null | undefined, tx: TransactionContext): Promise<void> {
        // Handle null vs string
        const vId = variantId || null;

        await tx.insert(supplierProductVariants)
            .values({ supplierId, productId, variantId: vId, tenantId })
            .onConflictDoUpdate({
                target: [supplierProductVariants.supplierId, supplierProductVariants.productId, supplierProductVariants.variantId],
                set: { isActive: true }
            });
    }

    async unmapProductVariant(tenantId: string, supplierId: string, productId: string, variantId: string | null | undefined, tx: TransactionContext): Promise<void> {
        const conditions = [
            eq(supplierProductVariants.tenantId, tenantId),
            eq(supplierProductVariants.supplierId, supplierId),
            eq(supplierProductVariants.productId, productId)
        ];

        if (variantId) {
            conditions.push(eq(supplierProductVariants.variantId, variantId));
        } else {
            conditions.push(isNull(supplierProductVariants.variantId));
        }

        await tx.delete(supplierProductVariants)
            .where(and(...conditions));
    }
}
