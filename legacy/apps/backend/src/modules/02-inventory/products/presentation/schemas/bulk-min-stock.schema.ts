import { z } from "@hono/zod-openapi";

export const bulkMinStockSchema = z.object({
    categoryId: z.string().min(1, "Category ID is required").openapi({ example: "123e4567-e89b-12d3-a456-426614174000", description: "Category UUID" }),
    minStock: z.number().min(0, "Min stock must be 0 or greater").openapi({ example: 10, description: "Minimum calculated stock threshold" })
});
