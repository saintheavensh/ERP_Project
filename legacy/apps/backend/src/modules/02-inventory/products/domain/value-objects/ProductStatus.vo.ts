import { ValueObject } from "../../../../../shared/core/ValueObject";
import { Result } from "../../../../../shared/core/Result";

export enum Status {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ARCHIVED = "ARCHIVED"
}

interface ProductStatusProps {
    value: Status;
}

/**
 * ProductStatus Value Object
 * Handles status enums and validates business rules for status transitions.
 */
export class ProductStatus extends ValueObject<ProductStatusProps> {
    private constructor(props: ProductStatusProps) {
        super(props);
    }

    get value(): Status {
        return this.props.value;
    }

    public static create(value: Status = Status.DRAFT): Result<ProductStatus> {
        if (!Object.values(Status).includes(value)) {
            return Result.fail("Invalid product status");
        }
        return Result.ok(new ProductStatus({ value }));
    }

    /**
     * Checks if transition to a new status is allowed.
     */
    public canTransitionTo(newStatus: Status): boolean {
        const current = this.value;

        if (current === Status.ARCHIVED) {
            return false; // Cannot move out of ARCHIVED
        }

        if (current === Status.DRAFT && newStatus === Status.ACTIVE) return true;
        if (current === Status.DRAFT && newStatus === Status.INACTIVE) return true;
        if (current === Status.ACTIVE && newStatus === Status.INACTIVE) return true;
        if (current === Status.INACTIVE && newStatus === Status.ACTIVE) return true;

        // Any status can be ARCHIVED
        if (newStatus === Status.ARCHIVED) return true;

        return false;
    }

    public transitionTo(newStatus: Status): Result<ProductStatus> {
        if (!this.canTransitionTo(newStatus)) {
            return Result.fail(`Cannot transition from ${this.value} to ${newStatus}`);
        }
        return ProductStatus.create(newStatus);
    }
}
