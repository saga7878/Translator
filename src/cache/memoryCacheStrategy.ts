import { CacheEntry, ICacheStrategy } from "../types";

export class MemoryCacheStrategy implements ICacheStrategy {
    private cache: Map<string, CacheEntry<any>> = new Map();

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expireTime) {
            this.cache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set<T>(key: string, value: T, ttl: number): void {
        this.cache.set(key, {
            data: value,
            expireTime: Date.now() + ttl
        });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}
