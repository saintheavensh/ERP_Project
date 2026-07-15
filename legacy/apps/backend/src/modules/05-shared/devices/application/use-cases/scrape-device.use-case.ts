import { IDeviceScraper, DeviceScraperResult } from "../../domain";

export class ScrapeDeviceUseCase {
    constructor(private scraper: IDeviceScraper) { }

    async execute(url: string): Promise<DeviceScraperResult> {
        return await this.scraper.scrapeGsmArena(url);
    }
}
