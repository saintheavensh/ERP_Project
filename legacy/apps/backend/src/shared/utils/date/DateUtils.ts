export function parseDate(dateString: string | Date): Date {
    return new Date(dateString);
}

export function getCurrentTimestamp(): Date {
    return new Date();
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}
