import { ValueObject } from "../../../../../shared/core/ValueObject";
import { Result } from "../../../../../shared/core/Result";

interface SkuProps {
    value: string;
}

/**
 * Sku Value Object
 * Validates the format of the Stock Keeping Unit.
 */
export class Sku extends ValueObject<SkuProps> {
    private constructor(props: SkuProps) {
        super(props);
    }

    get value(): string {
        return this.props.value;
    }

    /**
     * Creates a new Sku instance.
     * Format: SKU-XXXXX (alphanumeric, min length 3)
     */
    public static create(value: string): Result<Sku> {
        if (!value || value.trim().length < 3) {
            return Result.fail("SKU must be at least 3 characters long");
        }

        // Simplified format check: SKU-XXXX or just alphanumeric
        const skuRegex = /^[a-zA-Z0-9-]+$/;
        if (!skuRegex.test(value)) {
            return Result.fail("SKU contains invalid characters");
        }

        return Result.ok(new Sku({ value: value.toUpperCase() }));
    }
}
