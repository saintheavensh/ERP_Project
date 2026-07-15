import {
    createQuery,
    createMutation,
    useQueryClient,
    type CreateQueryResult,
} from "@tanstack/svelte-query";
import { ProductsService } from "../products.service";
import { CategoriesService } from "../../categories/categories.service";
import { toast } from "svelte-sonner";

export class ProductFormController {
    private queryClient = useQueryClient();

    // Form State
    name = $state("");
    code = $state("");
    categoryId = $state("");
    minStock = $state(5);
    image = $state("");
    compatibility = $state<string[]>([]);
    manualNameParts = $state<string[]>([]);

    // Suggestion State
    nameSuggestions = $state<{ device: any; matched: string }[]>([]);
    deviceSearchQuery = $state("");
    debouncedDeviceSearch = $state("");
    deviceSearchTimeout: any;

    // Callbacks
    onClose?: () => void;

    // Mode
    editData = $state<any>(null);

    // Queries
    categoriesQuery: CreateQueryResult<any[], Error>;
    devicesQuery: CreateQueryResult<any[], Error>;

    constructor() {
        this.categoriesQuery = createQuery(() => ({
            queryKey: ["categories"],
            queryFn: CategoriesService.getAll,
        }));

        this.devicesQuery = createQuery(() => ({
            queryKey: ["devices", this.debouncedDeviceSearch],
            queryFn: () => ProductsService.getDevices(this.debouncedDeviceSearch, 500),
        }));
    }

    // derived helpers
    get categories() {
        return this.categoriesQuery.data || [];
    }

    get hierarchicalCategories() {
        return this.buildCategoryHierarchy(this.categories);
    }

    get devices() {
        return this.devicesQuery.data || [];
    }

    get selectedDevices() {
        return this.devices.filter((d: any) => this.compatibility.includes(d.id));
    }

    get filteredSuggestions() {
        const query = this.deviceSearchQuery.trim();
        if (query) {
            return [
                ...(this.devicesQuery.data || []).map((d: any) => ({
                    device: d,
                    matched: query,
                })),
                ...this.nameSuggestions.filter((s) => {
                    const term = query.toLowerCase();
                    return (
                        s.device.brand.toLowerCase().includes(term) ||
                        s.device.model.toLowerCase().includes(term) ||
                        (s.device.code && s.device.code.toLowerCase().includes(term))
                    );
                }),
            ].filter(
                (v, i, a) => a.findIndex((t) => t.device.id === v.device.id) === i,
            );
        } else {
            return this.nameSuggestions;
        }
    }

    // Setters / Methods for State Updates
    setDeviceSearchQuery(value: string) {
        this.deviceSearchQuery = value;
        if (this.deviceSearchTimeout) clearTimeout(this.deviceSearchTimeout);
        this.deviceSearchTimeout = setTimeout(() => {
            this.debouncedDeviceSearch = value;
        }, 300);
    }

    // Mutations
    createProductMutation = createMutation(() => ({
        mutationFn: ProductsService.create,
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produk berhasil dibuat! Stok awal 0.");
            this.reset();
            if (this.onClose) this.onClose();
        },
        onError: () => toast.error("Gagal menyimpan produk"),
    }));

    updateProductMutation = createMutation(() => ({
        mutationFn: (vars: { id: string; data: any }) =>
            ProductsService.update(vars.id, vars.data),
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["products"] });
            this.queryClient.invalidateQueries({ queryKey: ["inventory"] });
            toast.success("Produk berhasil diupdate!");
            this.reset();
            if (this.onClose) this.onClose();
        },
        onError: () => toast.error("Gagal update produk"),
    }));

    get isSubmitting() {
        return this.createProductMutation.isPending || this.updateProductMutation.isPending;
    }

    // Actions
    init(data: any, closeCallback?: () => void) {
        this.editData = data;
        this.onClose = closeCallback;
        if (data) {
            this.name = data.name;
            this.code = data.code || "";
            this.categoryId = data.categoryId || "";
            this.minStock = data.minStock || 5;
            this.image = data.image || "";

            // Fetch compatibility
            ProductsService.get(data.id).then((detail) => {
                this.compatibility = (detail.compatibility || []).map((d: any) => d.id);
            });
        } else {
            this.reset();
        }
    }

    reset() {
        this.editData = null;
        this.name = "";
        this.code = "";
        this.categoryId = "";
        this.minStock = 5;
        this.image = "";
        this.compatibility = [];
        this.manualNameParts = [];
        this.nameSuggestions = [];
        this.deviceSearchQuery = "";
    }

    handleNameChange(newName: string) {
        this.name = newName;
        this.parseNameForSuggestions(newName);
    }

    applySuggestion(suggestion: { device: any; matched: string }) {
        this.compatibility = [...this.compatibility, suggestion.device.id];
        this.nameSuggestions = this.nameSuggestions.filter(
            (s) => s.device.id !== suggestion.device.id,
        );
        this.deviceSearchQuery = "";
        this.updateNameFromCompatibility();
    }

    applyAllSuggestions() {
        const deviceIds = this.filteredSuggestions.map((s) => s.device.id);
        this.compatibility = [...this.compatibility, ...deviceIds];
        this.nameSuggestions = this.nameSuggestions.filter(
            (s) => !deviceIds.includes(s.device.id),
        );
        this.deviceSearchQuery = "";
        this.updateNameFromCompatibility();
    }

    removeDevice(deviceId: string) {
        this.compatibility = this.compatibility.filter((id) => id !== deviceId);
        this.updateNameFromCompatibility();
    }

    removeManualPart(index: number) {
        this.manualNameParts = this.manualNameParts.filter((_, i) => i !== index);
        this.updateNameFromCompatibility();
    }

    generateCode() {
        if (!this.categoryId) {
            toast.error("Pilih kategori terlebih dahulu untuk generate kode");
            return;
        }
        const cat = this.categories.find((c: any) => c.id === this.categoryId);
        const prefix = cat
            ? cat.name.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase()
            : "GEN";
        const random = Math.floor(1000 + Math.random() * 9000);
        this.code = `${prefix}${random}`;
    }

    handleSubmit() {
        if (!this.name) {
            toast.error("Nama produk wajib diisi");
            return;
        }

        const payload = {
            name: this.name,
            code: this.code || undefined,
            categoryId: this.categoryId || undefined,
            minStock: Number(this.minStock) || 5,
            image: this.image || undefined,
            compatibility: this.compatibility,
        };

        if (this.editData) {
            this.updateProductMutation.mutate({ id: this.editData.id, data: payload });
        } else {
            this.createProductMutation.mutate(payload);
        }
    }

    // Logic Helpers
    private buildNameFromCompatibility(): string {
        const selected = this.devices.filter((d: any) =>
            this.compatibility.includes(d.id),
        );
        if (selected.length === 0) return this.manualNameParts.join(" / ");

        const byBrand: Record<string, any[]> = {};
        for (const d of selected) {
            if (!byBrand[d.brand]) byBrand[d.brand] = [];
            byBrand[d.brand].push(d);
        }

        const parts: string[] = [];
        for (const [brand, models] of Object.entries(byBrand).sort()) {
            models.sort((a, b) => a.model.localeCompare(b.model));
            parts.push(`${brand} ${models[0].model}`);
            for (let i = 1; i < models.length; i++) {
                parts.push(models[i].model);
            }
        }

        parts.push(...this.manualNameParts);
        return parts.join(" / ");
    }

    private updateNameFromCompatibility() {
        this.name = this.buildNameFromCompatibility();
    }

    private parseNameForSuggestions(inputName: string) {
        // Logic identical to original component
        const parts = inputName.split(/\s*\/\s*/);
        const suggestions: { device: any; matched: string }[] = [];
        const newManualParts: string[] = [];
        let currentBrand = "";
        const addedDeviceIds = new Set<string>();

        // We need 'devices' to be populated. If undefined, we can't do much.
        const allDevices = this.devices;

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            const searchTerm = trimmed.toLowerCase();

            let exactMatch = allDevices.find((d: any) => {
                const fullName = `${d.brand} ${d.model}`.toLowerCase();
                return fullName === searchTerm;
            });

            if (!exactMatch && currentBrand) {
                exactMatch = allDevices.find((d: any) => {
                    return (
                        d.brand.toLowerCase() === currentBrand.toLowerCase() &&
                        d.model.toLowerCase() === searchTerm
                    );
                });
            }

            if (!exactMatch) {
                exactMatch = allDevices.find(
                    (d: any) => d.model.toLowerCase() === searchTerm,
                );
            }

            if (exactMatch) {
                currentBrand = exactMatch.brand;
                if (
                    !this.compatibility.includes(exactMatch.id) &&
                    !addedDeviceIds.has(exactMatch.id)
                ) {
                    suggestions.push({ device: exactMatch, matched: trimmed });
                    addedDeviceIds.add(exactMatch.id);
                }
            } else {
                const partialMatches = allDevices.filter((d: any) => {
                    if (
                        this.compatibility.includes(d.id) ||
                        addedDeviceIds.has(d.id)
                    )
                        return false;

                    const fullName = `${d.brand} ${d.model}`.toLowerCase();
                    const model = d.model.toLowerCase();
                    const brand = d.brand.toLowerCase();
                    const code = (d.code || "").toLowerCase();

                    return (
                        fullName.includes(searchTerm) ||
                        model.includes(searchTerm) ||
                        brand.includes(searchTerm) ||
                        code.includes(searchTerm)
                    );
                });

                if (partialMatches.length > 0) {
                    for (const match of partialMatches) {
                        if (!addedDeviceIds.has(match.id)) {
                            suggestions.push({
                                device: match,
                                matched: trimmed,
                            });
                            addedDeviceIds.add(match.id);
                        }
                    }
                    currentBrand = partialMatches[0].brand;
                } else {
                    newManualParts.push(trimmed);
                }
            }
        }

        this.nameSuggestions = suggestions;
        this.manualNameParts = newManualParts;
    }

    private buildCategoryHierarchy(
        cats: any[],
        parentId: string | null = null,
        level = 0,
    ): any[] {
        const result: any[] = [];
        const children = cats
            .filter((c) => (c.parentId || null) === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const child of children) {
            result.push({
                ...child,
                level: level,
            });
            const subResult = this.buildCategoryHierarchy(cats, child.id, level + 1);
            result.push(...subResult);
        }
        return result;
    }
}
