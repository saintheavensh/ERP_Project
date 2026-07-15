import { z } from "@hono/zod-openapi";

export const variantSchema = z.object({
    name: z.string().openapi({
        example: "Gold Variant",
        description: "Variant name/color/size"
    }),
    price: z.number().optional().openapi({
        example: 50000,
        description: "Variant price (if different from base)"
    }),
    sku: z.string().optional().openapi({
        example: "VAR-001",
        description: "Variant SKU"
    })
});

export const createVariantSchema = z.object({
    productId: z.string().uuid().openapi({
        example: "123e4567-e89b-12d3-a456-426614174000",
        description: "Parent product ID"
    }),
    variants: z.array(variantSchema).openapi({
        description: "List of variants to create"
    })
});
