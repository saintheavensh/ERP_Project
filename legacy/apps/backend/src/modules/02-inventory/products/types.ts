export const TYPES = {
    // Domain/Ports
    IProductRepository: Symbol.for("IProductRepository"),
    IVariantRepository: Symbol.for("IVariantRepository"),
    ICategoryGateway: Symbol.for("ICategoryGateway"),
    IInventoryGateway: Symbol.for("IInventoryGateway"),

    // Application/UseCases
    GetProductsUseCase: Symbol.for("GetProductsUseCase"),
    GetProductUseCase: Symbol.for("GetProductUseCase"),
    GetProductVariantsUseCase: Symbol.for("GetProductVariantsUseCase"),
    GetBatchesUseCase: Symbol.for("GetBatchesUseCase"),
    GetProductByIdUseCase: Symbol.for("GetProductByIdUseCase"),
    CreateProductUseCase: Symbol.for("CreateProductUseCase"),
    UpdateProductUseCase: Symbol.for("UpdateProductUseCase"),
    DeleteProductUseCase: Symbol.for("DeleteProductUseCase"),
    ActivateProductUseCase: Symbol.for("ActivateProductUseCase"),
    ProductsFacade: Symbol.for("ProductsFacade"),
    DrizzleClient: Symbol.for("DrizzleClient"),
    InventoryFacade: Symbol.for("InventoryFacade"),
    InventoryTransactionAuthority: Symbol.for("InventoryTransactionAuthority"),
    LoggerFactory: Symbol.for("LoggerFactory")
};
