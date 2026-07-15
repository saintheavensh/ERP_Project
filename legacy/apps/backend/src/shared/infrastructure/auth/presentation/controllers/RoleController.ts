import { Context } from "hono";
import { getRolesUseCase } from "../../AuthContainer";
import { apiSuccess, apiError } from "../../../../application/middlewares/ResponseHelpers";

export class RoleController {
    async getAll(c: Context) {
        try {
            const roles = await getRolesUseCase.execute();
            return apiSuccess(c, roles, "Roles retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch roles", 500);
        }
    }
}
