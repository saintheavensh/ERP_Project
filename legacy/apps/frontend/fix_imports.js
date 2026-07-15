const fs = require('fs');

function replaceInFile(filepath, replacements) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content;
    
    for (let [oldStr, newStr] of replacements) {
        if (oldStr instanceof RegExp) {
            newContent = newContent.replace(oldStr, newStr);
        } else {
            newContent = newContent.split(oldStr).join(newStr);
        }
    }
    
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent, 'utf8');
        console.log(`Updated ${filepath}`);
    }
}

replaceInFile("src/lib/features/auth/index.ts", [
    ['export { authStore } from "./auth.svelte";', 'export { authStore } from "$lib/shared/lib/auth-store.svelte";']
]);

replaceInFile("src/lib/shared/lib/index.ts", [
    ['from "./api"', 'from "./api-client"']
]);

replaceInFile("src/lib/features/index.ts", [
    ['export * from "./service-management";', 'export * from "./services";']
]);

replaceInFile("src/lib/features/sales/components/index.ts", [
    [/from "\.\/components\/([^"]+)"/g, 'from "./$1"']
]);

const productSvcReplace = [
    ['import { ProductsService } from "$lib/features/inventory/services/products.service";', 'import { productsService as ProductsService } from "$lib/features/inventory/services/products.service";'],
    ['import { ProductsService as InventoryService } from "$lib/features/inventory/services/products.service";', 'import { productsService as InventoryService } from "$lib/features/inventory/services/products.service";']
];

replaceInFile("src/lib/features/sales/components/sales.controller.svelte.ts", productSvcReplace);
replaceInFile("src/lib/features/sales/components/purchases/purchase-form.controller.svelte.ts", productSvcReplace);
replaceInFile("src/lib/features/services/devices/devices.controller.svelte.ts", productSvcReplace);
replaceInFile("src/lib/features/services/tickets/components/wizards/ServiceCompletionWizard.svelte", productSvcReplace);
replaceInFile("src/lib/features/inventory/components/defective-items/components/DefectiveItemForm.svelte", productSvcReplace);
replaceInFile("src/lib/features/services/tickets/components/wizard/Step2Device.svelte", productSvcReplace);
replaceInFile("src/lib/features/services/tickets/components/wizard/Step3Service.svelte", productSvcReplace);
replaceInFile("src/routes/(authenticated)/(dashboards)/warehouse/kanibal/+page.svelte", productSvcReplace);
replaceInFile("src/routes/(authenticated)/(inventory)/searchproduct/+page.svelte", productSvcReplace);

replaceInFile("src/routes/(authenticated)/(sales)/sales/+page.svelte", [
    ['$lib/features/sales/components/components/', '$lib/features/sales/components/']
]);

// Missing manager table component mapping (due to move, maybe path is wrong)
// wait, Phase 4 put it in lib/features/products/components/manager/ProductManagerTable.svelte?
// But Phase 6 moved products to inventory! So it should be $lib/features/inventory/components/products/manager/ProductManagerTable.svelte!
replaceInFile("src/routes/(authenticated)/manager/products/+page.svelte", [
    ['$lib/features/products/components/manager/ProductManagerTable.svelte', '$lib/features/inventory/components/products/manager/ProductManagerTable.svelte']
]);
replaceInFile("src/routes/(authenticated)/warehouse/products/+page.svelte", [
    ['$lib/features/products/components/warehouse/WarehouseStockTable.svelte', '$lib/features/inventory/components/products/warehouse/WarehouseStockTable.svelte']
]);
replaceInFile("src/routes/(authenticated)/teknisi/parts/+page.svelte", [
    ['$lib/features/products/components/teknisi/TeknisiPartsTable.svelte', '$lib/features/inventory/components/products/teknisi/TeknisiPartsTable.svelte']
]);

