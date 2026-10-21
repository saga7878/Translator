import fetch from "node-fetch";
import { URL } from "url";
import { ITranslator, TranslationRequest, TranslationResult } from "../types";

class MicrosoftTranslator implements ITranslator {
    private readonly translateUrl = 'https://edge.microsoft.com/translate/translatetext';

    constructor(private readonly request: typeof fetch = fetch) {}

    getName(): string {
        return 'microsoft';
    }

    async translate(request: TranslationRequest): Promise<TranslationResult> {
        const { text, from = 'auto', to = 'zh-Hans' } = request;
        if (!text || text.trim().length === 0) {
            throw new Error('Empty text is not allowed');
        }
        if (!to || to === 'auto' || to === 'auto-detect') {
            throw new Error('A target language is required');
        }

        try {
            const url = new URL(this.translateUrl);
            url.searchParams.set('isEnterpriseClient', 'false');
            url.searchParams.set('to', to);
            const autoDetect = from === 'auto' || from === 'auto-detect';
            if (!autoDetect) {
                url.searchParams.set('from', from);
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            let result: any;
            try {
                const response = await this.request(url.toString(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    // The new Edge endpoint accepts strings, not [{ text }].
                    body: JSON.stringify([text]),
                    signal: controller.signal,
                });
                if (!response.ok) {
                    // Do not include remote response bodies, which may echo user text.
                    throw new Error(`Edge translation failed with status: ${response.status}`);
                }
                result = await response.json();
            } finally {
                clearTimeout(timeout);
            }

            if (!Array.isArray(result) || result.length === 0) {
                throw new Error('Invalid response format from translation service');
            }
            const translation = result[0]?.translations?.[0]?.text;
            if (typeof translation !== 'string' || !translation.trim()) {
                throw new Error('No translation found in response');
            }
            return {
                text: translation,
                from: autoDetect ? (result[0]?.detectedLanguage?.language || 'auto') : from,
                to,
                raw: result,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Translation error: ${errorMessage}`);
        }
    }

    async detectLanguage(text: string): Promise<string> {
        // Edge reports the source language when `from` is omitted. Keeping this
        // adapter preserves existing callers that detect before choosing a target.
        try {
            const result = await this.translate({ text, from: 'auto', to: 'en' });
            if (!result.from || result.from === 'auto') {
                throw new Error('No language detected in response');
            }
            return result.from;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Language detection error: ${errorMessage}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const result = await this.translate({ text: 'test', from: 'en', to: 'zh-Hans' });
            return result.text !== 'test';
        } catch {
            return false;
        }
    }
}

export { MicrosoftTranslator };
