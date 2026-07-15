import { ContainerModule } from "inversify";
import { TYPES } from "../../../core/types";
import { DeviceApiAdapter, DrizzleStoreDeviceRepository } from "./infrastructure/index";
import { RegisterStoreDeviceUseCase, GetStoreDeviceStatusUseCase, PingStoreDeviceUseCase, StoreDeviceFacade } from "./application/index";
import { StoreDevicesController } from "./presentation/controllers/StoreDevicesController";
import { HttpClient } from "../client/HttpClient";
import type { IStoreDeviceRepository, IDeviceApiGateway } from "./domain";

export const deviceContainer = new ContainerModule(({ bind }) => {
    // Shared
    bind<HttpClient>(TYPES.HttpClient).to(HttpClient).inSingletonScope();
    bind(TYPES.AppConfig).toDynamicValue(() => {
        const { appConfig } = require("../../../infrastructure/config/AppConfig");
        return appConfig;
    }).inSingletonScope();
    // Note: DrizzleClient is provided by global container

    // Ports
    bind<IDeviceApiGateway>(TYPES.IDeviceApiGateway).to(DeviceApiAdapter).inSingletonScope();
    bind<IStoreDeviceRepository>(TYPES.IStoreDeviceRepository).to(DrizzleStoreDeviceRepository).inSingletonScope();

    // Use Cases
    bind<RegisterStoreDeviceUseCase>(RegisterStoreDeviceUseCase).toSelf().inSingletonScope();
    bind<GetStoreDeviceStatusUseCase>(GetStoreDeviceStatusUseCase).toSelf().inSingletonScope();
    bind<PingStoreDeviceUseCase>(PingStoreDeviceUseCase).toSelf().inSingletonScope();

    // Facade
    bind<StoreDeviceFacade>(TYPES.StoreDeviceFacade).to(StoreDeviceFacade).inSingletonScope();

    // Presentation
    bind<StoreDevicesController>(StoreDevicesController).toSelf().inSingletonScope();
});
