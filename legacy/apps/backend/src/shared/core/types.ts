export const TYPES = {
    // Shared
    HttpClient: Symbol.for('HttpClient'),
    AppConfig: Symbol.for('AppConfig'),
    DrizzleClient: Symbol.for('DrizzleClient'),

    // Dashboard
    DashboardAggregator: Symbol.for('DashboardAggregator'),
    DashboardController: Symbol.for('DashboardController'),

    // Services
    CacheService: Symbol.for('CacheService'),

    // Facades (Infrastructure/External)
    SalesFacade: Symbol.for('SalesFacade'),
    InventoryFacade: Symbol.for('InventoryFacade'),
    ProductsFacade: Symbol.for('ProductsFacade'),
    CustomersFacade: Symbol.for('CustomersFacade'),
    StoreDeviceFacade: Symbol.for('StoreDeviceFacade'),

    // Config & Settings
    ISettingRepository: Symbol.for('ISettingRepository'),
    GetSettingUseCase: Symbol.for('GetSettingUseCase'),
    UpdateSettingUseCase: Symbol.for('UpdateSettingUseCase'),
    GetModuleSettingsUseCase: Symbol.for('GetModuleSettingsUseCase'),
    ConfigFacade: Symbol.for('ConfigFacade'),
    ConfigController: Symbol.for('ConfigController'),
    LoggerFactory: Symbol.for('LoggerFactory'),

    // Messaging
    MessagingFacade: Symbol.for('MessagingFacade'),
    INotificationService: Symbol.for('INotificationService'),
    IWhatsAppGateway: Symbol.for('IWhatsAppGateway'),
    INotificationRepository: Symbol.for('INotificationRepository'),
    ITemplateService: Symbol.for("ITemplateService"),
    // External API - Devices
    IDeviceApiGateway: Symbol.for("IDeviceApiGateway"),
    IStoreDeviceRepository: Symbol.for("IStoreDeviceRepository"),
};
