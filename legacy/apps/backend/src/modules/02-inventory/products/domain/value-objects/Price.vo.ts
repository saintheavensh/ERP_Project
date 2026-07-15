import { ValueObject } from "../../../../../shared/core/ValueObject";
import { Result } from "../../../../../shared/core/Result";

interface PriceProps {
    amount: number; // in cents
    currency: string;
}

/**
 * Price Value Object
 * Ensures monetary values are handled as integers (cents) to avoid floating point issues.
 */
export class Price extends ValueObject<PriceProps> {
    private constructor(props: PriceProps) {
        super(props);
    }

    get amount(): number {
        return this.props.amount;
    }

    get currency(): string {
        return this.props.currency;
    }

    /**
     * Creates a new Price instance.
     * @param amount Amount in cents (must be non-negative)
     * @param currency Currency code (default: IDR)
     */
    public static create(amount: number, currency: string = "IDR"): Result<Price> {
        if (amount < 0) {
            return Result.fail("Price amount cannot be negative");
        }

        if (!Number.isInteger(amount)) {
            return Result.fail("Price amount must be an integer (cents)");
        }

        return Result.ok(new Price({ amount, currency }));
    }

    public add(other: Price): Result<Price> {
        if (this.currency !== other.currency) {
            return Result.fail("Cannot add prices with different currencies");
        }
        return Price.create(this.amount + other.amount, this.currency);
    }

    public subtract(other: Price): Result<Price> {
        if (this.currency !== other.currency) {
            return Result.fail("Cannot subtract prices with different currencies");
        }
        const newAmount = this.amount - other.amount;
        if (newAmount < 0) {
            return Result.fail("Price result cannot be negative");
        }
        return Price.create(newAmount, this.currency);
    }

    public multiply(factor: number): Result<Price> {
        const newAmount = Math.round(this.amount * factor);
        return Price.create(newAmount, this.currency);
    }
}
