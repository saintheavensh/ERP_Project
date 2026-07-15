import { v4 as uuidv4 } from "uuid";
import { ID_PREFIXES, type IdPrefix } from "@repo/shared";

export const ID_PREFIX = ID_PREFIXES;

export function generateId(prefix: IdPrefix): string {
    return `${prefix}-${uuidv4().substring(0, 8).toUpperCase()}`;
}

export function generateServiceNo(sequenceNumber: number): string {
    const year = new Date().getFullYear();
    return `${ID_PREFIX.SERVICE}-${year}-${String(sequenceNumber).padStart(3, "0")}`;
}
