import os
import re

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        if callable(old):
            new_content = old(new_content)
        else:
            new_content = new_content.replace(old, new)
            
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# 1. Fix auth store export
replace_in_file("src/lib/features/auth/index.ts", [
    ('export { authStore } from "./auth.svelte";', 'export { authStore } from "$lib/shared/lib/auth-store.svelte";')
])

# 2. Fix api export in shared lib index
replace_in_file("src/lib/shared/lib/index.ts", [
    ('from "./api"', 'from "./api-client"')
])

# 3. Fix features index
replace_in_file("src/lib/features/index.ts", [
    ('export * from "./service-management";', 'export * from "./services";')
])

# 4. Fix sales components index.ts (from "./components/X" to "./X")
def fix_sales_index(content):
    return re.sub(r'from "\./components/([^"]+)"', r'from "./\1"', content)

replace_in_file("src/lib/features/sales/components/index.ts", [
    (fix_sales_index, "")
])

# 5. Fix ProductsService -> productsService in sales controller
replace_in_file("src/lib/features/sales/components/sales.controller.svelte.ts", [
    ('import { ProductsService } from "$lib/features/inventory/services/products.service";', 'import { productsService as ProductsService } from "$lib/features/inventory/services/products.service";')
])

# 6. Purchase form controller ProductsService -> productsService
replace_in_file("src/lib/features/sales/components/purchases/purchase-form.controller.svelte.ts", [
    ('import { ProductsService } from "$lib/features/inventory/services/products.service";', 'import { productsService as ProductsService } from "$lib/features/inventory/services/products.service";')
])

# 7. devices.controller ProductsService
replace_in_file("src/lib/features/services/devices/devices.controller.svelte.ts", [
    ('import { ProductsService } from "$lib/features/inventory/services/products.service";', 'import { productsService as ProductsService } from "$lib/features/inventory/services/products.service";')
])

# 8. ServiceCompletionWizard ProductsService
replace_in_file("src/lib/features/services/tickets/components/wizards/ServiceCompletionWizard.svelte", [
    ('import { ProductsService as InventoryService } from "$lib/features/inventory/services/products.service";', 'import { productsService as InventoryService } from "$lib/features/inventory/services/products.service";')
])

# 9. DefectiveItemForm ProductsService
replace_in_file("src/lib/features/inventory/components/defective-items/components/DefectiveItemForm.svelte", [
    ('import { ProductsService } from "$lib/features/inventory/services/products.service";', 'import { productsService as ProductsService } from "$lib/features/inventory/services/products.service";')
])

# 10. wizard/Step2Device ProductsService
replace_in_file("src/lib/features/services/tickets/components/wizard/Step2Device.svelte", [
    ('import { ProductsService as InventoryService } from "$lib/features/inventory/services/products.service";', 'import { productsService as InventoryService } from "$lib/features/inventory/services/products.service";')
])

# 11. wizard/Step3Service ProductsService
replace_in_file("src/lib/features/services/tickets/components/wizard/Step3Service.svelte", [
    ('import { ProductsService as InventoryService } from "$lib/features/inventory/services/products.service";', 'import { productsService as InventoryService } from "$lib/features/inventory/services/products.service";')
])

# 12. warehouse kanibal ProductsService
replace_in_file("src/routes/(authenticated)/(dashboards)/warehouse/kanibal/+page.svelte", [
    ('import { ProductsService } from "$lib/features/inventory/services/products.service";', 'import { productsService as ProductsService } from "$lib/features/inventory/services/products.service";')
])

# 13. searchproduct ProductsService
replace_in_file("src/routes/(authenticated)/(inventory)/searchproduct/+page.svelte", [
    ('import { ProductsService as InventoryService } from "$lib/features/inventory/services/products.service";', 'import { productsService as InventoryService } from "$lib/features/inventory/services/products.service";')
])

# 14. Fix routes component paths
replace_in_file("src/routes/(authenticated)/(sales)/sales/+page.svelte", [
    ('$lib/features/sales/components/components/', '$lib/features/sales/components/'),
    ('import { SalesController } from "$lib/features/sales/components/sales.controller.svelte";', 'import { SalesController } from "$lib/features/sales/components/sales.controller.svelte";\nimport { productsService as ProductsService } from "$lib/features/inventory/services/products.service";') # Just in case it needs it
])

