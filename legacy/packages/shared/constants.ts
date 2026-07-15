
export const DEFAULT_BRANDS = [
    "Samsung",
    "Apple / iPhone",
    "Xiaomi",
    "Oppo",
    "Vivo",
    "Realme",
    "Infinix",
    "Asus",
    "Google",
    "Lainnya",
];

export const DEVICE_STATUS_OPTIONS = [
    {
        value: "nyala",
        label: "Nyala Normal",
        color: "text-green-600",
        bg: "bg-green-100",
        border: "border-green-200",
    },
    {
        value: "mati_total",
        label: "Mati Total",
        color: "text-red-600",
        bg: "bg-red-100",
        border: "border-red-200",
    },
    {
        value: "restart",
        label: "Restart",
        color: "text-orange-600",
        bg: "bg-orange-100",
        border: "border-orange-200",
    },
    {
        value: "blank_hitam",
        label: "Blank Hitam",
        color: "text-gray-800",
        bg: "bg-gray-100",
        border: "border-gray-200",
    },
];

export const PHYSICAL_CONDITIONS = [
    { v: "normal", l: "Normal (Mulus)" },
    { v: "lecet", l: "Lecet / Goresan" },
    { v: "retak", l: "Retak / Pecah" },
    { v: "bekas_air", l: "Bekas Air / Korosi" },
    { v: "bengkok", l: "Bengkok / Dent" },
];

export const COMPLETENESS_OPTIONS = [
    { v: "charger", l: "Charger" },
    { v: "box", l: "Dus/Box" },
    { v: "simcard", l: "SIM Card" },
    { v: "memorycard", l: "Memory Card" },
    { v: "case", l: "Case/Casing" },
    { v: "earphone", l: "Earphone" },
];

export const SPAREPART_SOURCES = [
    { v: "none", l: "Tanpa Part" },
    { v: "inventory", l: "Inventory" },
    { v: "external", l: "Beli Luar" },
    { v: "customer", l: "Bawa Sendiri" }
];

export const WARRANTY_PRESETS = [
    { label: "Tidak Ada", days: 0 },
    { label: "Garansi 3 Hari (Cek Fisik)", days: 3 },
    { label: "Garansi 1 Minggu", days: 7 },
    { label: "Garansi 1 Bulan", days: 30 }
];

export const SERVICE_STATUSES = [
    "antrian",
    "dicek",
    "konfirmasi",
    "dikerjakan",
    "re-konfirmasi",
    "selesai",
    "diambil",
    "batal"
] as const;

export const PAYMENT_METHODS = ["cash", "transfer", "qris", "mixed"] as const;
export const PAYMENT_STATUSES = ["paid", "partial", "unpaid"] as const;

export const QC_ITEMS = [
    { key: "touchscreen", label: "Touchscreen" },
    { key: "display", label: "Display" },
    { key: "speaker", label: "Speaker" },
    { key: "earpiece", label: "Earpiece" },
    { key: "microphone", label: "Microphone" },
    { key: "frontCamera", label: "Kamera Depan" },
    { key: "rearCamera", label: "Kamera Belakang" },
    { key: "wifi", label: "WiFi" },
    { key: "bluetooth", label: "Bluetooth" },
    { key: "chargingPort", label: "Port Charging" },
    { key: "buttons", label: "Tombol (Vol/Power)" },
    { key: "fingerprint", label: "Fingerprint" },
];
