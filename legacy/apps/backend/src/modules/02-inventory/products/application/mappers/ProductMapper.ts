import { Result } from "../../../../../shared/core/Result";
import { Product } from "../../domain/entities/Product.entity";
import { Price } from "../../domain/value-objects/Price.vo";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { ProductStatus, Status } from "../../domain/value-objects/ProductStatus.vo";
import { ProductDTO } from "../dtos/ProductDTO";

/**
 * ProductMapper
 * Responsible for mapping data between layers to maintain decoupling.
 */
export class ProductMapper {
    /**
     * Maps a domain Entity to a DTO for the presentation layer.
     */
    public static toDTO(product: Product): ProductDTO {
        return {
            id: product.id,
            sku: product.sku.value,
            name: product.name,
            price: product.price.amount,
            stock: product.stock,
            minimumStock: product.minimumStock,
            unit: product.unit,
            status: product.status.value,
            isActive: product.isActive,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }

    /**
     * Maps a raw database persistence object to a Domain Entity.
     */
    public static toDomain(raw: any): Result<Product> {
        const skuResult = Sku.create(raw.code || raw.sku);
        const priceResult = Price.create(raw.price || 0); // Default price to 0 if not fetched from batch
        const statusResult = ProductStatus.create((raw.status || Status.ACTIVE) as Status);

        const result = Result.combine([skuResult, priceResult, statusResult]);
        if (result.isFailure) {
            return Result.fail<Product>(result.errorValue());
        }

        return Product.create(
            {
                sku: skuResult.getValue(),
                name: raw.name,
                price: priceResult.getValue(),
                stock: raw.stock || 0,
                minimumStock: raw.minimumStock || 0,
                unit: raw.unit || 'pcs',
                status: statusResult.getValue(),
                isActive: raw.isActive ?? true,
                categoryId: raw.categoryId,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt
            },
            raw.id
        );
    }

    /**
     * Maps a Domain Entity to a raw object for database persistence.
     */
    public static toPersistence(product: Product): any {
        return {
            id: product.id,
            sku: product.sku.value,
            name: product.name,
            minimumStock: product.minimumStock,
            unit: product.unit,
            isActive: product.isActive,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }
}
