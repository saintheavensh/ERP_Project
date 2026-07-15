import { UploadFileUseCase } from "../use-cases/UploadFileUseCase";
import { FileEntity } from "../../domain";
import { injectable, inject } from "inversify";

@injectable()
export class StorageFacade {
    constructor(
        private readonly uploadFileUseCase: UploadFileUseCase
    ) { }

    async uploadFile(file: File, folder?: string): Promise<FileEntity> {
        return await this.uploadFileUseCase.execute(file, folder);
    }
}
