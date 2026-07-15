export interface DeviceScraperResult {
    brand: string;
    model: string;
    image: string;
    chipset: string;
    specifications: {
        network_technology: string;
        announced: string;
        status: string;
        display_type: string;
        display_size: string;
        display_resolution: string;
        os: string;
        chipset: string;
        cpu: string;
        gpu: string;
        memory_card: string;
        internal_memory: string;
        primary_camera: string;
        secondary_camera: string;
        video: string;
        wlan: string;
        bluetooth: string;
        gps: string;
        nfc: string;
        radio: string;
        usb: string;
        sensors: string;
        battery: string;
        colors: string;
        models: string;
    };
    specs_ram_storage: string;
    code: string;
}

export interface IDeviceScraper {
    scrapeGsmArena(url: string): Promise<DeviceScraperResult>;
    getDeviceLinks(url: string): Promise<{ name: string; url: string }[]>;
    downloadImage(url: string, brand: string, modelName?: string): Promise<string>;
}
