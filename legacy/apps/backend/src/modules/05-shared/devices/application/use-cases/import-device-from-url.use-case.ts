import { IDeviceScraper, IDeviceRepository } from "../../domain";
import { CreateDeviceUseCase } from "./create-device.use-case";
import { DBContext } from "../../../../../shared/types/db-context";

export class ImportDeviceFromUrlUseCase {
    constructor(
        private scraper: IDeviceScraper,
        private createDeviceUseCase: CreateDeviceUseCase
    ) { }

    async execute(tenantId: string, url: string, tx: DBContext) {
        // 1. Scrape
        const scraped = await this.scraper.scrapeGsmArena(url);

        // 2. Create in DB
        return await this.createDeviceUseCase.execute(tenantId, {
            brand: scraped.brand,
            model: scraped.model,
            image: scraped.image,
            code: scraped.code,
            specs: scraped.specs_ram_storage,
            chipset: scraped.chipset,
            // @ts-ignore
            specifications: scraped.specifications,
            colors: scraped.specifications?.colors?.split(",").map((s: string) => s.trim()) || []
        }, tx);
    }
}
