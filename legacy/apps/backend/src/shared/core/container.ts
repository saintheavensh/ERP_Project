import { Container } from "inversify";
import { TYPES } from "./types";
import { dashboardContainer } from "../presentation/dashboard/dashboard.container";
import { deviceContainer } from "../infrastructure/external-api/devices/DeviceContainer";
import { configContainer } from "../infrastructure/config/config.container";
import { LoggerFactory } from "../utils/logger/Logger";

// Import legacy singleton facades
import { salesService } from "../../modules/03-sales/sales/sales-container";
import { inventoryService } from "../../modules/02-inventory/inventory/inventory-container";
import { customersService } from "../../modules/03-sales/customers/customers-container";
// For products, we don't have a singleton yet, we'll need to load its container module if it exists
import { productsContainerModule } from "../../modules/02-inventory/products/products-container";

const container = new Container();

// Load modules
container.load(dashboardContainer);
container.load(deviceContainer);
container.load(productsContainerModule);
container.load(configContainer);

import { CacheService } from "../infrastructure/cache/CacheService";
import { DrizzleClient } from "../infrastructure/database/DrizzleClient";

// Global Bindings
container.bind<DrizzleClient>(TYPES.DrizzleClient).to(DrizzleClient).inSingletonScope();
container.bind<CacheService>(TYPES.CacheService).to(CacheService).inSingletonScope();

// Bind legacy facades as constants
container.bind(TYPES.SalesFacade).toConstantValue(salesService);
container.bind(TYPES.InventoryFacade).toConstantValue(inventoryService);
container.bind(TYPES.CustomersFacade).toConstantValue(customersService);

// Register logger factory as singleton
container.bind<LoggerFactory>(TYPES.LoggerFactory)
    .to(LoggerFactory)
    .inSingletonScope();

// The ProductsFacade is automatically bound by productsContainerModule, but under its own TYPES.ProductsFacade.
// Since the string 'ProductsFacade' is the same, it shares the symbol.

export { container };
