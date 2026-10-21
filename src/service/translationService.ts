import { CachedTranslator } from "../service/translation/cachedTranslator";
import { ITranslator, TranslationResult } from "../types";
import { TranslationQueue } from "../utils/translationQueue";

class TranslationService {
    translator: ITranslator;
    private queue: TranslationQueue;

    setTranslator(translator: ITranslator) {
        this.translator = new CachedTranslator(translator);
        this.queue = new TranslationQueue(this.translator, 3);
    }

    async translateForReading(text: string, from = 'auto', to = 'zh-Hans'): Promise<TranslationResult> {
        const translator = this.translator;
        let result = await translator.translate({ text, from, to });
        if (from === 'auto' && result.from === to) {
            const opposite = to.startsWith('zh') ? 'en' : 'zh-Hans';
            result = await translator.translate({ text, from: result.from, to: opposite });
        }
        return result;
    }

    constructor(translator: ITranslator, queueConcurrency: number = 3) {
        // 使用缓存装饰器包装翻译器
        this.translator = new CachedTranslator(translator);
        this.queue = new TranslationQueue(this.translator, queueConcurrency);
    }

    async translate(
        text: string,
        from: string = 'auto',
        to: string = 'zh-Hans',
        maxRetries: number = 3
    ): Promise<string> {
        let lastError: Error | null = null;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await this.translator.translate({ text, from, to });
               
                return result.text;
            } catch (error) {
                lastError = error as Error;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => 
                        setTimeout(resolve, Math.pow(2, i) * 1000)
                    );
                }
            }
        }
        
        throw lastError;
    }

    async batchTranslate(
        texts: string[],
        from: string = 'auto',
        to: string = 'zh-Hans'
    ): Promise<string[]> {
        return Promise.all(
            texts.map(text => 
                this.queue.add({ text, from, to })
                    .then(result => result.text)
                    .catch(error => `Error: ${error.message}`)
            )
        );
    }

    async detectLanguage(text: string): Promise<string> {
        if (this.translator.detectLanguage) {
            return this.translator.detectLanguage(text);
        }
        throw new Error('Language detection not supported');
    }
}

export { TranslationService };