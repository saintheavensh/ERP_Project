import { IStorageService, FileEntity } from "../../domain";

export class UploadFileUseCase {
    constructor(private readonly storageService: IStorageService) { }

    async execute(file: File, folder?: string): Promise<FileEntity> {
        // Validation logic
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
        }

        return await this.storageService.upload(file, folder);
    }
}
