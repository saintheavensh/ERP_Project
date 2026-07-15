import { z } from "@hono/zod-openapi";

export const labelSchema = z.object({
    productName: z.string().openapi({ example: "Samsung Galaxy S24" }),
    variantName: z.string().optional().openapi({ example: "256GB / Black" }),
    code: z.string().openapi({ example: "PRD-SG24-BLK" }),
    price: z.number().optional().openapi({ example: 15000000 })
});
