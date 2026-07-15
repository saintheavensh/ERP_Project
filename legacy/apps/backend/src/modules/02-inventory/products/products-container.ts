import { ContainerModule } from "inversify";
import { TYPES } from "./types";

// Repository Interfaces (Ports)
import { IProductRepository } from './domain/ports/IProductRepository';
import { IInventoryGateway } from './domain/ports/IInventoryGateway';
import { inventoryService } from "../inventory/inventory-container";

// Infrastructure
import { DrizzleProductRepository } from "./infrastructure/persistence/DrizzleProductRepository";
import { InventoryGatewayAdapter } from "./infrastructure/adapters/InventoryGatewayAdapter";

// Use Cases
import { CreateProductUseCase } from "./application/use-cases/CreateProductUseCase";
import { GetProductUseCase } from "./application/use-cases/GetProductUseCase";
import { GetProductVariantsUseCase } from "./application/use-cases/GetProductVariantsUseCase";
import { GetBatchesUseCase } from "./application/use-cases/GetBatchesUseCase";
import { GetProductsUseCase } from "./application/use-cases/GetProductsUseCase";
import { UpdateProductUseCase } from "./application/use-cases/UpdateProductUseCase";
import { ActivateProductUseCase } from "./application/use-cases/ActivateProductUseCase";
import { DeleteProductUseCase } from "./application/use-cases/DeleteProductUseCase";

// Facade
import { ProductsFacade } from "./application/facades/ProductsFacade";

/**
 * Products Module Container
 * Configures all dependencies for the Products module using Inversify.
 */
export const productsContainerModule = new ContainerModule(({ bind }) => {
    // Database is now bound in global container, so we don't bind DrizzleClient here

    // External dependencies bindings required for adapters
    // Note: InventoryFacade is provided by global container

    // Repositories
    bind<IProductRepository>(TYPES.IProductRepository).to(DrizzleProductRepository).inSingletonScope();

    // Gateways
    bind<IInventoryGateway>(TYPES.IInventoryGateway).to(InventoryGatewayAdapter).inSingletonScope();

    // Application / Use Cases
    bind<CreateProductUseCase>(TYPES.CreateProductUseCase).to(CreateProductUseCase);
    bind<GetProductUseCase>(TYPES.GetProductUseCase || Symbol.for("GetProductUseCase")).to(GetProductUseCase);
    bind<GetProductVariantsUseCase>(TYPES.GetProductVariantsUseCase || Symbol.for("GetProductVariantsUseCase")).to(GetProductVariantsUseCase);
    bind<GetBatchesUseCase>(TYPES.GetBatchesUseCase || Symbol.for("GetBatchesUseCase")).to(GetBatchesUseCase);
    bind<GetProductsUseCase>(TYPES.GetProductsUseCase).to(GetProductsUseCase);
    bind<UpdateProductUseCase>(TYPES.UpdateProductUseCase).to(UpdateProductUseCase);
    bind<DeleteProductUseCase>(TYPES.DeleteProductUseCase).to(DeleteProductUseCase);
    bind<ActivateProductUseCase>(TYPES.ActivateProductUseCase).to(ActivateProductUseCase);

    // Application / Facade
    bind<ProductsFacade>(TYPES.ProductsFacade).to(ProductsFacade).inSingletonScope();
});

import { Container } from "inversify";

const getProductsFacade = (): ProductsFacade => {
    const { container } = require("../../../shared/core/container");
    return (container as Container).get<ProductsFacade>(TYPES.ProductsFacade);
};

const productsService = new Proxy({} as ProductsFacade, {
    get: (target, prop) => {
        const facade = getProductsFacade();
        const value = (facade as any)[prop];
        if (typeof value === 'function') {
            return value.bind(facade);
        }
        return value;
    }
});

export { ProductsFacade, productsService };
