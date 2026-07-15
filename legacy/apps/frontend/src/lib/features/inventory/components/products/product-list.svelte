<script lang="ts">
    import { ProductListController } from "$lib/features/inventory/products/controllers/product-list.controller.svelte";
    import ProductListingToolbar from "./product-listing-toolbar.svelte";
    import ProductMobileList from "./product-mobile-list.svelte";
    import ProductDesktopTable from "./product-desktop-table.svelte";

    const controller = new ProductListController();
</script>

<div class="space-y-6">
    <!-- Toolbar -->
    <ProductListingToolbar {controller} />

    <!-- Mobile List View -->
    <ProductMobileList {controller} />

    <!-- Desktop Table -->
    <ProductDesktopTable {controller} />
</div>
