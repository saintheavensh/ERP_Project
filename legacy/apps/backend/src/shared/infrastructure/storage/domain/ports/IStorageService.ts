import { FileEntity } from "../entities/FileEntity";

export interface IStorageService {
    upload(file: File, folder?: string): Promise<FileEntity>;
}
