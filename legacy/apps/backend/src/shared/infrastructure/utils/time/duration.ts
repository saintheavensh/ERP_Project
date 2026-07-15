export function parseDuration(durationStr: string): { seconds: number; ms: number } {
    const value = parseInt(durationStr.slice(0, -1), 10);
    if (isNaN(value)) {
        return { seconds: 15 * 60, ms: 15 * 60 * 1000 }; // Fallback 15m
    }

    if (durationStr.endsWith("m")) {
        return { seconds: value * 60, ms: value * 60 * 1000 };
    }
    if (durationStr.endsWith("h")) {
        return { seconds: value * 60 * 60, ms: value * 60 * 60 * 1000 };
    }
    if (durationStr.endsWith("d")) {
        return { seconds: value * 24 * 60 * 60, ms: value * 24 * 60 * 60 * 1000 };
    }

    // Default fallback (15 minutes) just in case
    return { seconds: 15 * 60, ms: 15 * 60 * 1000 };
}
