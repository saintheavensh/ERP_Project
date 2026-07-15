
import { api } from "$lib/shared/lib/api-client";
import type { Product, Device, ApiResponse } from "@repo/shared";
import * as XLSX from "xlsx";
import { BrandsService, type Brand } from "../brands/brands.service";

/** Input type for creating a device */
export interface CreateDeviceInput {
    brand: string;
    model: string;
    code?: string;
    image?: string;
}

/** Input type for creating a product */
export interface CreateProductInput {
    name: string;
    code?: string;
    categoryId?: string;
    image?: string;
    minStock?: number;
    compatibility?: string[];
}

export const ProductsService = {
    // Products
    getAll: async (deviceId?: string, search?: string, categoryId?: string): Promise<Product[]> => {
        const res = await api.get<ApiResponse<Product[]>>("/inventory", {
            params: { deviceId, search, categoryId }
        });
        return res.data?.data ?? [];
    },
    search: async (search?: string): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>("/inventory/searchproduct", {
            params: { search }
        });
        return res.data?.data ?? [];
    },
    getStats: async (): Promise<{ totalProducts: number; lowStock: number; totalValue: number; totalCategories: number }> => {
        const res = await api.get<ApiResponse<{ totalProducts: number; lowStock: number; totalValue: number; totalCategories: number }>>("/inventory/stats");
        return res.data?.data!;
    },
    get: async (id: string): Promise<Product> => {
        const res = await api.get<ApiResponse<Product>>(`/inventory/${id}`);
        return res.data?.data!;
    },
    create: async (data: CreateProductInput): Promise<Product> => {
        const res = await api.post<ApiResponse<Product>>("/inventory", data);
        return res.data?.data!;
    },
    update: async (id: string, data: Partial<CreateProductInput>): Promise<Product> => {
        const res = await api.put<ApiResponse<Product>>(`/inventory/${id}`, data);
        return res.data?.data!;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/inventory/${id}`);
    },
    getVariants: async (id: string, supplierId?: string): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>(`/inventory/${id}/variants`, {
            params: { supplierId }
        });
        return res.data?.data ?? [];
    },

    // Variants
    createVariant: async (data: { productId: string; name: string; image?: string; sku?: string; defaultPrice?: number; }): Promise<any> => {
        const res = await api.post<ApiResponse<any>>("/inventory/variants", data);
        return res.data?.data;
    },
    updateVariant: async (id: string, data: { name?: string; image?: string; sku?: string; defaultPrice?: number; }): Promise<any> => {
        const res = await api.put<ApiResponse<any>>(`/inventory/variants/${id}`, data);
        return res.data?.data;
    },
    deleteVariant: async (id: string): Promise<void> => {
        await api.delete(`/inventory/variants/${id}`);
    },

    // Devices
    getDevices: async (search?: string, limit: number = 20, offset: number = 0, brand?: string): Promise<Device[]> => {
        const res = await api.get<ApiResponse<Device[]>>("/devices", {
            params: { search, limit, offset, brand }
        });
        return res.data?.data ?? [];
    },
    createDevice: async (data: CreateDeviceInput): Promise<Device> => {
        const res = await api.post<ApiResponse<Device>>("/devices", data);
        return res.data?.data!;
    },
    updateDevice: async (id: string, data: Partial<CreateDeviceInput>): Promise<Device> => {
        const res = await api.patch<ApiResponse<Device>>(`/devices/${id}`, data);
        return res.data?.data!;
    },
    deleteDevice: async (id: string): Promise<void> => {
        await api.delete(`/devices/${id}`);
    },
    bulkDeleteDevices: async (ids: string[]): Promise<void> => {
        await api.post("/devices/bulk-delete", { ids });
    },
    syncDeviceCompatibility: async (id: string): Promise<{ count: number; products: string[] }> => {
        const res = await api.post<ApiResponse<{ count: number; products: string[] }>>(`/devices/${id}/sync`);
        return res.data?.data!;
    },
    getUnlinkedDevices: async (limit: number = 50, offset: number = 0): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>(`/devices/unlinked?limit=${limit}&offset=${offset}`);
        return res.data?.data || [];
    },
    getUnlinkedProducts: async (limit: number = 50, offset: number = 0): Promise<Product[]> => {
        const res = await api.get<ApiResponse<Product[]>>("/inventory/unlinked", {
            params: { limit, offset }
        });
        return res.data?.data || [];
    },
    scrapeDevice: async (url: string): Promise<any> => {
        const res = await api.post<ApiResponse<any>>("/devices/scrape", { url });
        return res.data?.data;
    },
    getDeviceList: async (url: string): Promise<{ name: string; url: string; }[]> => {
        const res = await api.post<ApiResponse<{ name: string; url: string; }[]>>("/devices/scrape-list", { url });
        return res.data?.data ?? [];
    },
    importDeviceFromUrl: async (url: string): Promise<any> => {
        const res = await api.post<ApiResponse<any>>("/devices/import-url", { url });
        return res.data?.data;
    },

    // Import/Export Logic
    exportDevices: async (format: "csv" | "excel") => {
        try {
            const devices = await ProductsService.getDevices();

            const rows = devices.map(d => ({
                Brand: d.brand,
                Model: d.model,
                Series: d.series || "",
                Code: d.code || "",
                Image: d.image || "",
                Colors: Array.isArray(d.colors) ? d.colors.join(", ") : "",
                Specs: d.specs || "",
                Chipset: d.chipset || "",
                Specifications: d.specifications ? JSON.stringify(d.specifications) : ""
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            // @ts-ignore
            const cols = Object.keys(rows[0] || {}).map(k => ({ wch: 20 }));
            // @ts-ignore
            ws['!cols'] = cols;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Devices");

            if (format === "csv") {
                XLSX.writeFile(wb, "devices_export.csv");
            } else {
                XLSX.writeFile(wb, "devices_export.xlsx");
            }
        } catch (e) {
            console.error("Export failed", e);
            throw e;
        }
    },
    parseImportFile: async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

                    const normalizedRows = rows.map(row => {
                        const normalized: any = {};
                        Object.keys(row).forEach(key => {
                            normalized[key.toLowerCase()] = row[key];
                        });
                        return normalized;
                    });

                    resolve(normalizedRows);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    },

    importDeviceRow: async (normalizedRow: any): Promise<void> => {
        const brandName = normalizedRow.brand;
        const modelName = normalizedRow.model;

        if (!brandName || !modelName) {
            throw new Error("Brand and Model are required");
        }

        const normalizeBrandName = (name: string): string => {
            if (!name || name.trim().length === 0) return name;
            const trimmed = name.trim();
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        };

        const normalizedBrandName = normalizeBrandName(brandName);

        try {
            const brandKey = normalizedBrandName.toLowerCase().trim();
            const allBrands = await BrandsService.getAll();
            const exists = allBrands.find((b: Brand) => b.name.toLowerCase().trim() === brandKey);

            if (!exists) {
                await BrandsService.create({
                    id: brandKey.replace(/\s+/g, "-"),
                    name: normalizedBrandName
                });
            }
        } catch (err) {
            console.warn(`Brand creation warning for ${brandName}`, err);
        }

        let colorsArray: string[] = [];
        if (normalizedRow.colors && typeof normalizedRow.colors === 'string') {
            colorsArray = normalizedRow.colors.split(",").map((c: string) => c.trim()).filter((c: string) => c);
        }

        let specifications = {};
        if (normalizedRow.specifications) {
            try {
                specifications = JSON.parse(normalizedRow.specifications);
            } catch { }
        }

        await ProductsService.createDevice({
            brand: normalizedBrandName,
            model: modelName.trim(),
            code: normalizedRow.code?.toString(),
            image: normalizedRow.image,
            // @ts-ignore
            series: normalizedRow.series,
            colors: colorsArray.length > 0 ? colorsArray : undefined,
            specs: normalizedRow.specs,
            chipset: normalizedRow.chipset,
            specifications: Object.keys(specifications).length > 0 ? specifications : undefined
        });
    },

    importDevices: async (file: File): Promise<{ imported: number; skipped: number; errors: string[] }> => {
        try {
            const rows = await ProductsService.parseImportFile(file);
            const result = { imported: 0, skipped: 0, errors: [] as string[] };

            for (const row of rows) {
                try {
                    await ProductsService.importDeviceRow(row);
                    result.imported++;
                } catch (err: any) {
                    result.errors.push(`Failed: ${err.message}`);
                    result.skipped++;
                }
            }
            return result;
        } catch (err: any) {
            return { imported: 0, skipped: 0, errors: [err.message] };
        }
    },
};
