/**
 * Products API routes — exact same route paths as the old inventory product routes.
 * Schemas imported from local presentation/schemas/.
 */
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { ProductsController } from "./products.controller";
import { productsService } from "../products-container";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { requirePermission, requireRole } from "../../../../shared/infrastructure/auth/presentation/middlewares/permission.middleware";
import { variantSchema, createVariantSchema } from "./schemas/variant.schema";
import { bulkMinStockSchema } from "./schemas/bulk-min-stock.schema";
import { labelSchema } from "./schemas/label.schema";

const app = new OpenAPIHono();
const controller = new ProductsController(productsService);

// ============================================
// OPENAPI ROUTE DEFINITIONS
// ============================================

const getAllProductsRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Products'],
    description: 'Get paginated list of products',
    responses: {
        200: {
            description: 'Paginated list of products',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.any()),
                        meta: z.object({
                            page: z.number().default(1),
                            limit: z.number().default(20),
                            totalItems: z.number().default(0),
                            totalPages: z.number().default(0),
                            hasNext: z.boolean().default(false),
                            hasPrev: z.boolean().default(false)
                        }).optional()
                    })
                }
            }
        }
    }
});

const getProductByIdRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Products'],
    description: 'Get product by ID',
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Product ID' })
        })
    },
    responses: {
        200: {
            description: 'Product found',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        }
    }
});

const zCreateProduct = z.object({
    name: z.string().min(1).max(255).openapi({ example: 'New Product' }),
    sku: z.string().openapi({ example: 'SKU-123' }),
    price: z.number().min(0).openapi({ example: 10000 }),
    categoryId: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' })
});

const zUpdateProduct = z.object({
    name: z.string().min(1).max(255).optional().openapi({ example: 'Updated Product' }),
    sku: z.string().optional().openapi({ example: 'SKU-123' }),
    price: z.number().min(0).optional().openapi({ example: 15000 }),
    categoryId: z.string().uuid().optional().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional().openapi({ example: 'ACTIVE' })
});

const createProductRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Products'],
    description: 'Create a new product',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: zCreateProduct
                }
            }
        }
    },
    responses: {
        201: { description: 'Product created' },
        400: { description: 'Validation Error' },
    }
});

const updateProductRoute = createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Products'],
    description: 'Update product by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Product ID' })
        }),
        body: {
            content: {
                'application/json': {
                    schema: zUpdateProduct
                }
            }
        }
    },
    responses: {
        200: { description: 'Product updated' },
        400: { description: 'Validation Error' },
    }
});

const deleteProductRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Products'],
    description: 'Delete product by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Product ID' })
        })
    },
    responses: {
        200: { description: 'Product deleted' },
    }
});

const getStatsRoute = createRoute({
    method: 'get',
    path: '/stats',
    tags: ['Products'],
    description: 'Get aggregate product statistics',
    responses: {
        200: {
            description: 'Product statistics',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.object({
                            totalProducts: z.number(),
                            totalValue: z.number(),
                            lowStockCount: z.number(),
                            outOfStockCount: z.number()
                        })
                    })
                }
            }
        }
    }
});

const searchProductRoute = createRoute({
    method: 'get',
    path: '/searchproduct',
    tags: ['Products'],
    description: 'Search products by keyword',
    request: {
        query: z.object({
            q: z.string().openapi({ description: 'Search query' })
        })
    },
    responses: {
        200: {
            description: 'Search results',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.any())
                    })
                }
            }
        }
    }
});

const getProductCountByCategoryRoute = createRoute({
    method: 'get',
    path: '/categories/{id}/product-count',
    tags: ['Products'],
    description: 'Get total product count for a specific category',
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Category ID' })
        })
    },
    responses: {
        200: {
            description: 'Product count',
            content: {
                'application/json': {
                    schema: z.object({
                        count: z.number()
                    })
                }
            }
        }
    }
});

const getSupplierVariantsRoute = createRoute({
    method: 'get',
    path: '/suppliers/{id}/variants',
    tags: ['Products'],
    description: 'Get variants for a specific supplier',
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Supplier ID' })
        })
    },
    responses: {
        200: {
            description: 'List of variants',
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
            }
        }
    }
});

const getProductVariantsRoute = createRoute({
    method: 'get',
    path: '/{id}/variants',
    tags: ['Products'],
    description: 'Get variants for a specific product',
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Product ID' })
        }),
        query: z.object({
            supplierId: z.string().optional().openapi({ description: 'Optional Supplier ID' })
        })
    },
    responses: {
        200: {
            description: 'List of variants',
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
            }
        }
    }
});

const getBatchesRoute = createRoute({
    method: 'get',
    path: '/batches',
    tags: ['Products'],
    description: 'Get list of active batches',
    request: {
        query: z.object({
            supplierId: z.string().optional().openapi({ description: 'Filter by Supplier ID' })
        })
    },
    responses: {
        200: {
            description: 'List of batches',
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
            }
        }
    }
});

const createVariantRoute = createRoute({
    method: 'post',
    path: '/variants',
    tags: ['Products'],
    description: 'Create a new product variant',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: createVariantSchema
                }
            }
        }
    },
    responses: {
        201: { description: 'Variant created' },
        400: { description: 'Validation Error' }
    }
});

const updateVariantRoute = createRoute({
    method: 'put',
    path: '/variants/{id}',
    tags: ['Products'],
    description: 'Update an existing product variant',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Variant ID' })
        }),
        body: {
            content: {
                'application/json': {
                    schema: variantSchema.partial()
                }
            }
        }
    },
    responses: {
        200: { description: 'Variant updated' },
        400: { description: 'Validation Error' }
    }
});

const deleteVariantRoute = createRoute({
    method: 'delete',
    path: '/variants/{id}',
    tags: ['Products'],
    description: 'Delete a product variant',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Variant ID' })
        })
    },
    responses: {
        200: { description: 'Variant deleted' }
    }
});

const bulkUpdateMinStockRoute = createRoute({
    method: 'patch',
    path: '/bulk-min-stock',
    tags: ['Products'],
    description: 'Bulk update minimum stock levels for products in a category',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: bulkMinStockSchema
                }
            }
        }
    },
    responses: {
        200: { description: 'Bulk update successful' },
        400: { description: 'Validation Error' }
    }
});

const printLabelRoute = createRoute({
    method: 'post',
    path: '/print-label',
    tags: ['Products'],
    description: 'Print label for products',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: labelSchema
                }
            }
        }
    },
    responses: {
        200: { description: 'Label printed' },
        400: { description: 'Validation Error' }
    }
});

// ============================================
// BIND OPENAPI ROUTES TO CONTROLLER
// ============================================

// Public-ish or all-authenticated routes
app.use("*", authMiddleware);

app.openapi(getStatsRoute, ((c: any) => controller.getStats(c)) as any);
app.openapi(searchProductRoute, ((c: any) => controller.searchProduct(c)) as any);
app.openapi(getProductCountByCategoryRoute, ((c: any) => controller.getProductCountByCategory(c)) as any);
app.openapi(getAllProductsRoute, ((c: any) => controller.getAllProducts(c)) as any);
app.openapi(getSupplierVariantsRoute, ((c: any) => controller.getSupplierVariants(c)) as any);
app.openapi(getBatchesRoute, ((c: any) => controller.getBatches(c)) as any);
app.openapi(getProductVariantsRoute, ((c: any) => controller.getProductVariants(c)) as any);
app.openapi(getProductByIdRoute, ((c: any) => controller.getProductById(c)) as any);

// Manager only routes
app.use("/", requireRole('manager'));
app.use("/:id", requireRole('manager'));
app.use("/variants", requireRole('manager'));
app.use("/variants/:id", requireRole('manager'));
app.use("/bulk-min-stock", requireRole('manager'));
app.use("/print-label", requireRole('manager'));

app.openapi(createProductRoute, ((c: any) => controller.createProduct(c)) as any);
app.openapi(updateProductRoute, ((c: any) => controller.updateProduct(c)) as any);
app.openapi(deleteProductRoute, ((c: any) => controller.deleteProduct(c)) as any);
app.openapi(createVariantRoute, ((c: any) => controller.createVariant(c)) as any);
app.openapi(updateVariantRoute, ((c: any) => controller.updateVariant(c)) as any);
app.openapi(deleteVariantRoute, ((c: any) => controller.deleteVariant(c)) as any);
app.openapi(bulkUpdateMinStockRoute, ((c: any) => controller.bulkUpdateMinStock(c)) as any);
app.openapi(printLabelRoute, ((c: any) => controller.printLabel(c)) as any);

export default app;
