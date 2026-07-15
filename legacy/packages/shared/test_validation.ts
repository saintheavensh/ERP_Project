
import { createServiceSchema } from "./index";

const payload = {
    type: "regular",
    customer: {
        name: "Test Customer",
        phone: "08123456789",
        address: "Test Address"
    },
    unit: {
        brand: "Samsung",
        model: "S23",
        status: "nyala",
        condition: ["Touchscreen", "LCD"],
        completeness: ["Unit Only"],
        physicalNotes: ""
    },
    complaint: "Layar pecah",
    technicianId: null, // or "" if empty? Frontend sends null
    status: "antrian",
    photos: [],
    // Regular specific
    diagnosis: {
        initial: "",
        possibleCauses: "",
        estimatedCost: "150000",
        downPayment: "0"
    },
    estimatedCompletionDate: "2024-02-01",
    // QC
    initialQC: { touchscreen: true },
    qc: {
        before: { touchscreen: true }
    }
};

try {
    createServiceSchema.parse(payload);
    console.log("Validation Successful!");
} catch (e: any) {
    console.error("Validation Failed:");
    console.error(JSON.stringify(e.errors, null, 2));
}
