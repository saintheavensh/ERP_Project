import { describe, it, expect } from "vitest";
import { Price } from "../value-objects/Price.vo";

describe("Price Value Object", () => {
    it("should create a valid price", () => {
        const priceResult = Price.create(1000, "IDR");
        expect(priceResult.isSuccess).toBe(true);
        const price = priceResult.getValue();
        expect(price.amount).toBe(1000);
        expect(price.currency).toBe("IDR");
    });

    it("should fail for negative amount", () => {
        const priceResult = Price.create(-100);
        expect(priceResult.isFailure).toBe(true);
        expect(priceResult.errorValue()).toBe("Price amount cannot be negative");
    });

    it("should fail for non-integer amount", () => {
        const priceResult = Price.create(10.5);
        expect(priceResult.isFailure).toBe(true);
        expect(priceResult.errorValue()).toBe("Price amount must be an integer (cents)");
    });

    it("should add two prices of the same currency", () => {
        const p1 = Price.create(1000).getValue();
        const p2 = Price.create(500).getValue();
        const result = p1.add(p2);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().amount).toBe(1500);
    });

    it("should fail adding different currencies", () => {
        const p1 = Price.create(1000, "IDR").getValue();
        const p2 = Price.create(100, "USD").getValue();
        const result = p1.add(p2);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Cannot add prices with different currencies");
    });

    it("should subtract two prices", () => {
        const p1 = Price.create(1000).getValue();
        const p2 = Price.create(400).getValue();
        const result = p1.subtract(p2);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().amount).toBe(600);
    });

    it("should fail if subtraction results in negative", () => {
        const p1 = Price.create(100).getValue();
        const p2 = Price.create(200).getValue();
        const result = p1.subtract(p2);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Price result cannot be negative");
    });

    it("should multiply price by a factor", () => {
        const p1 = Price.create(1000).getValue();
        const result = p1.multiply(1.5);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().amount).toBe(1500);
    });
});
