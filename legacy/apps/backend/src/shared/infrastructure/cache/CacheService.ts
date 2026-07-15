import { injectable } from 'inversify';

export interface CacheOptions {
    ttl: number; // seconds
}

@injectable()
export class CacheService {
    private cache: Map<string, { value: any; expiry: number }> = new Map();
    private defaultTTL: number = 300; // 5 minutes

    /**
     * Get value from cache
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value as T;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: any, ttl?: number): void {
        const expiry = Date.now() + (ttl || this.defaultTTL) * 1000;
        this.cache.set(key, { value, expiry });
    }

    /**
     * Delete value from cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get or set cache (memoize pattern)
     */
    async remember<T>(
        key: string,
        callback: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) return cached;

        const value = await callback();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Generate cache key from parts
     */
    static key(...parts: (string | number)[]): string {
        return parts.join(':');
    }
}
