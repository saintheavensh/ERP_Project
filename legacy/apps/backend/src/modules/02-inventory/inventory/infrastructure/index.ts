/**
 * Barrel export for inventory infrastructure adapters.
 * Only stock-related adapters remain after catalog extraction to products module.
 */
export { StockMutationGatewayAdapter } from "./adapters/stock-mutation-gateway.adapter";
export { StockOpnameRepositoryAdapter } from "./adapters/stock-opname-repository.adapter";
export { BatchRepositoryAdapter } from "./adapters/batch-repository.adapter";
export { ActivityLoggerAdapter } from "./adapters/activity-logger.adapter";
