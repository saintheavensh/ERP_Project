import "reflect-metadata";
import { ContainerModule } from "inversify";
import { TYPES } from "../../core/types";
import type {
    INotificationService,
    IWhatsAppGateway,
    INotificationRepository,
    ITemplateService
} from "./domain";
import {
    NodemailerAdapter,
    WhatsAppAdapter,
    HandlebarsAdapter,
    DrizzleNotificationRepository
} from "./infrastructure";
import {
    SendNotificationUseCase,
    SendWhatsAppUseCase,
    GetNotificationsUseCase,
    MarkNotificationAsReadUseCase,
    MessagingFacade
} from "./application";
import { HttpClient } from "../external-api/client/HttpClient";
import { MessagingController } from "./presentation/controllers/MessagingController";

export const messagingContainer = new ContainerModule(({ bind }) => {
    // Shared
    bind<HttpClient>(TYPES.HttpClient).to(HttpClient).inSingletonScope();

    // Ports
    bind<INotificationService>(TYPES.INotificationService).to(NodemailerAdapter).inSingletonScope();
    bind<IWhatsAppGateway>(TYPES.IWhatsAppGateway).to(WhatsAppAdapter).inSingletonScope();
    bind<INotificationRepository>(TYPES.INotificationRepository).to(DrizzleNotificationRepository).inSingletonScope();
    bind<ITemplateService>(TYPES.ITemplateService).to(HandlebarsAdapter).inSingletonScope();

    // Use Cases
    bind<SendNotificationUseCase>(SendNotificationUseCase).toSelf().inSingletonScope();
    bind<SendWhatsAppUseCase>(SendWhatsAppUseCase).toSelf().inSingletonScope();
    bind<GetNotificationsUseCase>(GetNotificationsUseCase).toSelf().inSingletonScope();
    bind<MarkNotificationAsReadUseCase>(MarkNotificationAsReadUseCase).toSelf().inSingletonScope();

    // Facade
    bind<MessagingFacade>(TYPES.MessagingFacade).to(MessagingFacade).inSingletonScope();

    // Presentation
    bind<MessagingController>(MessagingController).toSelf().inSingletonScope();
});
