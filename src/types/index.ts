// 基础接口定义
export interface TranslationResult {
    text: string;
    from?: string;
    to?: string;
    raw?: any;
}

export interface TranslationRequest {
    text: string;
    from?: string;
    to?: string;
    options?: Record<string, any>;
}

export interface CacheEntry<T> {
    data: T;
    expireTime: number;
}

// 翻译器基础接口
export interface ITranslator {
    translate(request: TranslationRequest): Promise<TranslationResult>;
    detectLanguage?(text: string): Promise<string>;
    getName(): string;
    getCached?(text: string, from: string, to: string): TranslationResult | null
}

// 缓存策略接口
export interface ICacheStrategy {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttl: number): void;
    delete(key: string): void;
    clear(): void;
}

// 通用翻译队列
export interface QueueItem {
    request: TranslationRequest;
    resolve: (result: TranslationResult) => void;
    reject: (error: Error) => void;
}
