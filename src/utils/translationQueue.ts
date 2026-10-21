import { QueueItem, ITranslator, TranslationRequest, TranslationResult } from "../types";

class TranslationQueue {
    private queue: QueueItem[] = [];
    private running: number = 0;
    private translator: ITranslator;
    private concurrency: number;

    constructor(translator: ITranslator, concurrency: number = 3) {
        this.translator = translator;
        this.concurrency = concurrency;
    }

    async add(request: TranslationRequest): Promise<TranslationResult> {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.running >= this.concurrency || this.queue.length === 0) {
            return;
        }

        this.running++;
        const item = this.queue.shift()!;

        try {
            const result = await this.translator.translate(item.request);
            item.resolve(result);
        } catch (error) {
            item.reject(error as Error);
        } finally {
            this.running--;
            this.processQueue();
        }
    }
}


export { TranslationQueue };