export type AssetCategory = "tool" | "equipment" | "furniture" | "vehicle" | "building" | "other";
export type AssetStatus = "active" | "disposed" | "fully_depreciated";

export interface FixedAsset {
    id: string;
    name: string;
    category: AssetCategory;
    purchaseDate: Date;
    purchaseCost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    monthlyDepreciation: number;
    currentValue: number;
    accumulatedDepreciation: number;
    status: AssetStatus;
    accountId?: string;
    depreciationAccountId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DepreciationEntry {
    id: string;
    assetId: string;
    period: string; // YYYY-MM
    amount: number;
    journalId?: string;
    createdAt: Date;
}
