export class TranslationCache {
    private static cache = new Map<string, {
        result: string;
        timestamp: number;
        from: string;
        to: string;
    }>();
    
    private static MAX_CACHE_AGE = 1000 * 60 * 60; // 1小时

    static get(text: string) {
        const cached = this.cache.get(text);
        if (cached && Date.now() - cached.timestamp < this.MAX_CACHE_AGE) {
            return cached;
        }
        return null;
    }

    static set(text: string, result: string, from: string, to: string) {
        this.cache.set(text, {
            result,
            timestamp: Date.now(),
            from,
            to
        });
    }
}