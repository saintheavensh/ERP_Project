import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import * as fs from "node:fs";
import { IStorageService, FileEntity } from "../../domain";
import { appConfig } from "../../../../infrastructure/config/AppConfig";

export class LocalStorageAdapter implements IStorageService {
    async upload(file: File, folder?: string): Promise<FileEntity> {
        const extension = file.name.split(".").pop();
        const filename = `${uuidv4()}.${extension}`;

        // Save to public/uploads
        let uploadDir = "public/uploads";
        let relativeUrl = "/uploads";

        // If folder is provided, sanitize and append
        if (typeof folder === "string" && folder.trim().length > 0) {
            // Sanitize folder name to allow only alphanumeric, underscores, hyphens, and spaces
            const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim();
            if (sanitizedFolder) {
                uploadDir = join(uploadDir, sanitizedFolder);
                relativeUrl = `/uploads/${sanitizedFolder}`;
            }
        }

        const path = join(uploadDir, filename);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore - Bun global
        await Bun.write(path, arrayBuffer);

        return { url: `${relativeUrl}/${filename}` };
    }
}
