import { Context } from "hono";
import { storageFacade } from "../../StorageContainer";
import { apiSuccess, apiError } from "../../../../application/middlewares/ResponseHelpers";
import { Logger } from "../../../../utils/logger/Logger";

export class StorageController {
    async upload(c: Context) {
        try {
            const body = await c.req.parseBody();
            const file = body["file"];
            const folder = body["folder"] as string | undefined;

            if (!file || !(file instanceof File)) {
                return apiError(c, "Request must include 'file' field", "Validation Error", 400);
            }

            const result = await storageFacade.uploadFile(file, folder);
            return apiSuccess(c, result, "File uploaded successfully");
        } catch (e: any) {
            new Logger("Legacy").error("Failed to upload file", e);
            const message = e.message || "Failed to upload file";
            const status = message.includes("Invalid file type") ? 400 : 500;
            return apiError(c, e, message, status);
        }
    }
}
