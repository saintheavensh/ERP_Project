import { Context } from "hono";
import { usersService, UsersService } from "../users-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class UsersController {
    constructor(private readonly service: UsersService = usersService) { }

    async getAll(c: Context) {
        try {
            const user = c.get("user");
            const role = c.req.query("role");
            const users = await this.service.findAll(user.tenantId, role);
            return apiSuccess(c, users, "Users retrieved successfully");
        } catch (e: any) {
            console.error("[UsersController] GetAll Error:", e);
            return apiError(c, e.message || String(e));
        }
    }

    async getById(c: Context) {
        try {
            const user = c.get("user");
            const id = c.req.param("id");
            const userRecord = await this.service.getById(user.tenantId, id);
            return apiSuccess(c, userRecord);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to retrieve user", status);
        }
    }

    async create(c: Context) {
        try {
            const user = c.get("user");
            const data = await c.req.json();
            const newUser = await this.service.create(user.tenantId, data);
            return apiSuccess(c, newUser, "User created successfully", 201);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to create user", status);
        }
    }

    async update(c: Context) {
        try {
            const user = c.get("user");
            const id = c.req.param("id");
            const data = await c.req.json();
            const updatedUser = await this.service.update(user.tenantId, id, data);
            return apiSuccess(c, updatedUser, "User updated successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to update user", status);
        }
    }

    async delete(c: Context) {
        try {
            const user = c.get("user");
            const id = c.req.param("id");
            await this.service.delete(user.tenantId, id);
            return apiSuccess(c, null, "User deleted successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to delete user", status);
        }
    }
}
