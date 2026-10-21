import { MemoryCacheStrategy } from "../../cache/memoryCacheStrategy";
import { ITranslator, ICacheStrategy, TranslationRequest, TranslationResult } from "../../types";

class CachedTranslator implements ITranslator {
    private cacheStrategy: ICacheStrategy;
    private translator: ITranslator;
    private cacheExpireTime: number;

    constructor(
        translator: ITranslator,
        cacheStrategy: ICacheStrategy = new MemoryCacheStrategy(),
        cacheExpireTime: number = 24 * 60 * 60 * 1000
    ) {
        this.translator = translator;
        this.cacheStrategy = cacheStrategy;
        this.cacheExpireTime = cacheExpireTime;
    }

    getName(): string {
        return `cached_${this.translator.getName()}`;
    }

    async translate(request: TranslationRequest): Promise<TranslationResult> {
        const cacheKey = `${this.translator.getName()}:${JSON.stringify(request)}`;
        const cached = this.cacheStrategy.get<TranslationResult>(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await this.translator.translate(request);
        this.cacheStrategy.set(cacheKey, result, this.cacheExpireTime);
        return result;
    }

    async detectLanguage(text: string): Promise<string> {
        if (this.translator.detectLanguage) {
            const cacheKey = `${this.translator.getName()}:detect:${text}`;
            const cached = this.cacheStrategy.get<string>(cacheKey);
            
            if (cached) {
                return cached;
            }

            const result = await this.translator.detectLanguage(text);
            this.cacheStrategy.set(cacheKey, result, this.cacheExpireTime);
            return result;
        }
        throw new Error('Language detection not supported');
    }

    getCached(text: string, from: string = 'en', to: string = 'zh-CN'): TranslationResult | null {
        const cacheKey = `${this.translator.getName()}:${JSON.stringify({ text, from, to })}`;
        const cached = this.cacheStrategy.get<TranslationResult>(cacheKey);
        if (cached) {
            return cached;
        }
    }
}

export { CachedTranslator };