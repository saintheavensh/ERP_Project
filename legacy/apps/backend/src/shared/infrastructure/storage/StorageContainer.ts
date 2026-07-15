import { LocalStorageAdapter } from "./infrastructure/adapters/LocalStorageAdapter";
import { UploadFileUseCase } from "./application/use-cases/UploadFileUseCase";
import { StorageFacade } from "./application/facades/StorageFacade";

// Adapters
const storageService = new LocalStorageAdapter();

// Use Cases
export const uploadFileUseCase = new UploadFileUseCase(storageService);

// Facade
export const storageFacade = new StorageFacade(uploadFileUseCase);
