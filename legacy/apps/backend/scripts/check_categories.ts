
import { db } from "../src/db";
import { categories } from "../src/db/schema";
import { CategoriesService } from "../src/modules/categories/categories.service";

const service = new CategoriesService();

async function run() {
    console.log("Checking Categories...");
    try {
        const list = await service.getAll();
        console.log("Categories found:", list.length);
        console.log(JSON.stringify(list, null, 2));

        if (list.length === 0) {
            console.log("Creating default category...");
            // Seed one if empty
            await service.create({ name: "General", description: "Default category" });
            console.log("Created 'General' category.");
        }
    } catch (e) {
        console.error("Error fetching categories:", e);
    }
}

run();
