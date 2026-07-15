import {
    Wrench,
    Monitor,
    Sofa,
    Car,
    Building,
    Package,
} from "lucide-svelte";

export const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(val);

export function getCategoryIcon(cat: string) {
    switch (cat) {
        case "tool": return Wrench;
        case "equipment": return Monitor;
        case "furniture": return Sofa;
        case "vehicle": return Car;
        case "building": return Building;
        default: return Package;
    }
}

export function getCategoryLabel(cat: string) {
    const labels: Record<string, string> = {
        tool: "Alat Service",
        equipment: "Peralatan",
        furniture: "Furniture",
        vehicle: "Kendaraan",
        building: "Bangunan",
        other: "Lainnya",
    };
    return labels[cat] || cat;
}

export function getStatusBadge(status: string) {
    switch (status) {
        case "active": return "bg-green-100 text-green-700";
        case "disposed": return "bg-red-100 text-red-700";
        case "fully_depreciated": return "bg-yellow-100 text-yellow-700";
        default: return "bg-slate-100 text-slate-700";
    }
}
