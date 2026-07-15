import { IDeviceScraper } from "../../domain";

export class GetDeviceLinksUseCase {
    constructor(private scraper: IDeviceScraper) { }

    async execute(url: string): Promise<{ name: string; url: string }[]> {
        return await this.scraper.getDeviceLinks(url);
    }
}
