import * as cheerio from "cheerio";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "node:fs/promises";
import { Logger } from "../../../../../shared/utils/logger/Logger";
import { ApiError } from "../../../../../shared/core/errors/ApiError";
import { z } from "@hono/zod-openapi";
import { IDeviceScraper, DeviceScraperResult } from "../../domain";

const ScrapeUrlSchema = z.string().url();

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

export class DeviceScraperAdapter implements IDeviceScraper {
    async scrapeGsmArena(url: string): Promise<DeviceScraperResult> {
        try {
            // Validation
            const validation = ScrapeUrlSchema.safeParse(url);
            if (!validation.success) {
                throw new ApiError("Invalid URL format", 400);
            }

            new Logger("Legacy").info(`Parsing URL: ${url}`);

            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) {
                if (response.status === 429) {
                    throw new ApiError("Too Many Requests - try again later", 429);
                }
                throw new ApiError(`Failed to fetch URL: ${response.statusText}`, response.status);
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // Extract basic info
            const title = $(".specs-phone-name-title").text();
            if (!title) throw new ApiError("Could not find device title", 422);

            // Normalize brand name: capitalize first letter
            const rawBrand = title.split(" ")[0];
            const brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1).toLowerCase();
            const model = title.replace(rawBrand, "").trim();
            const imageUrl = $(".specs-photo-main img").attr("src");

            // Extract Spec Tables
            const specs: Record<string, any> = {};

            $("table").each((i, table) => {
                const category = $(table).find("th").text().trim();

                $(table).find("tr").each((j, tr) => {
                    const label = $(tr).find(".ttl").text().trim();
                    const value = $(tr).find(".nfo").text().trim();
                    if (label && value) {
                        specs[label] = value;
                    }
                });
            });

            // Handle Image Download
            let localImagePath = "";
            if (imageUrl) {
                localImagePath = await this.downloadImage(imageUrl, brand, model);
            }

            // Colors often in "Misc" table
            const colors = specs["Colors"] || specs["Colors (USA)"] || "";
            const rawModels = specs["Models"] || "";

            // Clean up Models string
            const modelsArray = rawModels.split(/,|\\n/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            const codes = modelsArray.join(", ");

            // Map to our schema
            return {
                brand: brand,
                model: model,
                image: localImagePath,
                chipset: specs["Chipset"] || "",
                specifications: {
                    network_technology: specs["Technology"] || "",
                    announced: specs["Announced"] || "",
                    status: specs["Status"] || "",
                    display_type: specs["Type"] || "",
                    display_size: specs["Size"] || "",
                    display_resolution: specs["Resolution"] || "",
                    os: specs["OS"] || "",
                    chipset: specs["Chipset"] || "",
                    cpu: specs["CPU"] || "",
                    gpu: specs["GPU"] || "",
                    memory_card: specs["Card slot"] || "",
                    internal_memory: specs["Internal"] || "",
                    primary_camera: specs["Single"] || specs["Dual"] || specs["Triple"] || specs["Quad"] || "",
                    secondary_camera: specs["Single"] || specs["Dual"] || "",
                    video: specs["Video"] || "",
                    wlan: specs["WLAN"] || "",
                    bluetooth: specs["Bluetooth"] || "",
                    gps: specs["Positioning"] || "",
                    nfc: specs["NFC"] || "",
                    radio: specs["Radio"] || "",
                    usb: specs["USB"] || "",
                    sensors: specs["Sensors"] || "",
                    battery: specs["Type"] || "",
                    colors: colors,
                    models: codes
                },
                specs_ram_storage: specs["Internal"] || "",
                code: codes
            };

        } catch (error) {
            new Logger("Legacy").error("Scraping error", error);
            if (error instanceof ApiError) throw error;
            throw new ApiError("Failed to scrape URL", 500);
        }
    }

    async downloadImage(url: string, brand: string, modelName: string = ""): Promise<string> {
        try {
            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) {
                new Logger("Legacy").warn(`Failed to download image from ${url}: ${response.statusText}`);
                return "";
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Determine folder
            const safeBrand = brand.replace(/[^a-zA-Z0-9]/g, "");
            const uploadDir = join("public/uploads", safeBrand);

            // Async mkdir
            try {
                await fs.access(uploadDir);
            } catch {
                await fs.mkdir(uploadDir, { recursive: true });
            }

            // Generate filename from Model Name
            const ext = url.split(".").pop() || "jpg";
            let filename = `${uuidv4()}.${ext}`;

            if (modelName) {
                const safeModel = modelName.replace(/[^a-zA-Z0-9]/g, "_");
                filename = `${safeModel}.${ext}`;
            }

            const filepath = join(uploadDir, filename);

            // Async write
            await fs.writeFile(filepath, buffer);

            return `/uploads/${safeBrand}/${filename}`;
        } catch (e) {
            new Logger("Legacy").error("Failed to download image", e);
            return "";
        }
    }

    async getDeviceLinks(url: string): Promise<{ name: string; url: string; }[]> {
        try {
            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) throw new ApiError("Failed to fetch list URL", response.status);

            const html = await response.text();
            const $ = cheerio.load(html);
            const results: { name: string; url: string; }[] = [];

            $(".makers ul li").each((i, el) => {
                const link = $(el).find("a");
                const href = link.attr("href");
                const name = link.find("span").html()?.replace(/<br>/g, " ").trim() || link.text().trim();

                if (href && name) {
                    const fullUrl = href.startsWith("http") ? href : `https://www.gsmarena.com/${href}`;
                    results.push({ name, url: fullUrl });
                }
            });

            return results;
        } catch (e) {
            new Logger("Legacy").error("Failed to parse list", e);
            throw new ApiError("Failed to parse device list", 500);
        }
    }
}
