import { ContainerModule } from "inversify";
import { TYPES } from "../../../shared/core/types";
import type { ISettingRepository } from "./domain/ports/ISettingRepository";
import { DrizzleSettingRepository } from "./infrastructure/persistence/DrizzleSettingRepository";
import { GetSettingUseCase } from "./application/use-cases/GetSettingUseCase";
import { UpdateSettingUseCase } from "./application/use-cases/UpdateSettingUseCase";
import { GetModuleSettingsUseCase } from "./application/use-cases/GetModuleSettingsUseCase";
import { ConfigFacade } from "./application/facades/ConfigFacade";
import { ConfigController } from "./presentation/controllers/ConfigController";

export const configContainer = new ContainerModule(({ bind }) => {
    // Repository
    bind<ISettingRepository>(TYPES.ISettingRepository).to(DrizzleSettingRepository).inSingletonScope();

    // Use Cases
    bind<GetSettingUseCase>(TYPES.GetSettingUseCase).to(GetSettingUseCase);
    bind<UpdateSettingUseCase>(TYPES.UpdateSettingUseCase).to(UpdateSettingUseCase);
    bind<GetModuleSettingsUseCase>(TYPES.GetModuleSettingsUseCase).to(GetModuleSettingsUseCase);

    // Facade
    bind<ConfigFacade>(TYPES.ConfigFacade).to(ConfigFacade).inSingletonScope();

    // Controller
    bind<ConfigController>(TYPES.ConfigController).to(ConfigController);
});
