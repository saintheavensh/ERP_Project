import { Context } from "hono";
import { customersService, CustomersService } from "../customers-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class CustomersController {
    constructor(private readonly service: CustomersService = customersService) { }

    async getAll(c: Context) {
        try {
            const query = c.req.query("q");
            const tenantId = c.get("user")?.tenantId || "default";
            const customers = await this.service.getAll(tenantId, query);
            return apiSuccess(c, customers);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const tenantId = c.get("user")?.tenantId || "default";
            const customer = await this.service.getById(tenantId, id);
            return apiSuccess(c, customer);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to retrieve customer", status);
        }
    }

    async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const tenantId = c.get("user")?.tenantId || "default";
            const customer = await this.service.create(tenantId, data);
            return apiSuccess(c, customer, "Customer created successfully", 201);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to create customer", status);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const tenantId = c.get("user")?.tenantId || "default";
            const customer = await this.service.update(tenantId, id, data);
            return apiSuccess(c, customer, "Customer updated successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to update customer", status);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            const tenantId = c.get("user")?.tenantId || "default";
            await this.service.delete(tenantId, id);
            return apiSuccess(c, null, "Customer deleted successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to delete customer", status);
        }
    }

    async getSales(c: Context) {
        try {
            const id = c.req.param("id");
            const tenantId = c.get("user")?.tenantId || "default";
            const sales = await this.service.getSales(tenantId, id);
            return apiSuccess(c, sales);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    async getUnpaidSales(c: Context) {
        try {
            const id = c.req.param("id");
            const tenantId = c.get("user")?.tenantId || "default";
            const sales = await this.service.getUnpaidSales(tenantId, id);
            return apiSuccess(c, sales);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    async processPayment(c: Context) {
        try {
            const id = c.req.param("id");
            const body = (c.req as any).valid("json");
            const tenantId = c.get("user")?.tenantId || "default";
            const customer = await this.service.processPayment(tenantId, {
                ...body,
                customerId: id
            });
            return apiSuccess(c, customer, "Payment processed successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to process payment", status);
        }
    }
}
