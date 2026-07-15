/**
 * Normalize name: capitalize first letter, rest lowercase
 * Example: "realme" -> "Realme", "REALME" -> "Realme", "realMe" -> "Realme"
 */
export function normalizeName(name: string): string {
    if (!name || name.trim().length === 0) return name;
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
