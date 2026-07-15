import { ContainerModule } from "inversify";
import { TYPES } from "../../../shared/core/types";
import { DashboardAggregator } from "./services/DashboardAggregator";
import { DashboardController } from "./controllers/DashboardController";

export const dashboardContainer = new ContainerModule(({ bind }) => {
    bind<DashboardAggregator>(TYPES.DashboardAggregator).to(DashboardAggregator);
    bind<DashboardController>(TYPES.DashboardController).to(DashboardController);
});
