import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

export const openApiConfig = {
    openapi: '3.0.0',
    info: {
        title: 'Coba App Backend API',
        version: '1.0.0',
        description: 'Complete API documentation for the Coba Application Backend',
        contact: {
            name: 'API Support',
            email: 'support@coba.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:4000',
            description: 'Development server'
        },
        {
            url: 'https://api.coba.com',
            description: 'Production server'
        }
    ],
    tags: [
        { name: 'Products', description: 'Product management endpoints' },
        { name: 'Sales', description: 'Sales and transactions' },
        { name: 'Inventory', description: 'Inventory management' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Dashboard', description: 'Dashboard and analytics' }
    ]
};

export const swaggerApp = new OpenAPIHono();
// This will be used for the UI itself, pointing to the main spec
swaggerApp.get('/docs', swaggerUI({ url: '/api-docs/spec' }));
