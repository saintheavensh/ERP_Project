import { TransactionContext } from "../../../../../shared/types/db-context";
import { categories, categoryVariants, products, productVariants } from "../../../../../shared/infrastructure/database/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";
import { ICategoryRepository } from "../../domain";

export class CategoryRepositoryAdapter implements ICategoryRepository {
    async findAll(tx: TransactionContext): Promise<any[]> {
        return await tx.query.categories.findMany({
            where: and(eq(categories.isActive, true), eq(categories.tenantId, tx.tenantId!)),
            orderBy: [desc(categories.name)],
            with: {
                variantTemplates: {
                    with: {
                        supplier: true
                    }
                }
            }
        });
    }

    async findById(id: string, tx: TransactionContext): Promise<any | null> {
        return await tx.query.categories.findFirst({
            where: and(eq(categories.id, id), eq(categories.tenantId, tx.tenantId!)),
            with: {
                variantTemplates: {
                    orderBy: [asc(categoryVariants.name)]
                }
            }
        });
    }

    async create(data: any, tx: TransactionContext): Promise<any> {
        return await tx.insert(categories).values({
            ...data,
            tenantId: tx.tenantId!
        }).returning();
    }

    async update(id: string, data: any, tx: TransactionContext): Promise<any> {
        return await tx.update(categories)
            .set(data)
            .where(and(eq(categories.id, id), eq(categories.tenantId, tx.tenantId!)))
            .returning();
    }

    async delete(id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(categories).where(and(eq(categories.id, id), eq(categories.tenantId, tx.tenantId!)));
    }

    async addVariantTemplate(categoryId: string, name: string, tx: TransactionContext, supplierId?: string): Promise<any> {
        return await tx.insert(categoryVariants).values({
            categoryId,
            name,
            tenantId: tx.tenantId!,
            supplierId: supplierId || null
        }).returning();
    }

    async removeVariantTemplate(id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(categoryVariants).where(and(eq(categoryVariants.id, id), eq(categoryVariants.tenantId, tx.tenantId!)));
    }

    async propagateVariantToProducts(categoryId: string, variantName: string, tx: TransactionContext, supplierId?: string): Promise<void> {
        const productsInCategory = await tx.query.products.findMany({
            where: and(eq(products.categoryId, categoryId), eq(products.tenantId, tx.tenantId!))
        });

        for (const product of productsInCategory) {
            const existingVariant = await tx.query.productVariants.findFirst({
                where: and(
                    eq(productVariants.productId, product.id),
                    eq(productVariants.name, variantName),
                    eq(productVariants.tenantId, tx.tenantId!)
                )
            });

            if (!existingVariant) {
                await tx.insert(productVariants).values({
                    id: generateId(ID_PREFIX.VARIANT),
                    productId: product.id,
                    name: variantName,
                    tenantId: tx.tenantId!
                });
            }
        }
    }
}
