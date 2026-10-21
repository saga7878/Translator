import fetch from "node-fetch";
import { URL } from "url";
import { ITranslator, TranslationRequest, TranslationResult } from "../types";

class MicrosoftTranslator implements ITranslator {
    private baseUrl: string;
    private translateUrl: string;
    private token: string | null = null;
    private tokenExpireTime: number = 0;
    private readonly tokenValidityPeriod: number = 9 * 60 * 1000;

    constructor() {
        this.baseUrl = 'https://edge.microsoft.com/translate/auth';
        this.translateUrl = 'https://api.cognitive.microsofttranslator.com'; 
    }

    getName(): string {
        return 'microsoft';
    }

    private async getToken(): Promise<string> {
        const timeUntilExpiry = this.tokenExpireTime - Date.now();
        if (this.token && timeUntilExpiry > 30000) {
            return this.token;
        }

        try {
            const response = await fetch(this.baseUrl, {
                headers: {
                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Token fetch failed with status: ${response.status}`);
            }

            this.token = await response.text();
            this.tokenExpireTime = Date.now() + this.tokenValidityPeriod;
            return this.token;
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    private validateLanguageCode(code: string): string {
        // 简单的语言代码验证
        if (code === 'auto') return 'auto-detect';
        if (code === 'zh-Hans') return 'zh-Hans';
        // 可以添加更多语言代码的验证和映射
        return code;
    }

    async translate(request: TranslationRequest): Promise<TranslationResult> {
        const { text, from = 'auto', to = 'zh-Hans' } = request;
        
        if (!text || text.trim().length === 0) {
            throw new Error('Empty text is not allowed');
        }

        try {
            const token = await this.getToken();
            const url = new URL(`${this.translateUrl}/translate`);
            url.searchParams.append('api-version', '3.0');
            
            // 处理语言代码
            const fromLang = this.validateLanguageCode(from);
            const toLang = this.validateLanguageCode(to);
        
            if (fromLang !== 'auto-detect') {
                url.searchParams.append('from', fromLang);
            }
            url.searchParams.append('to', toLang);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify([{ text }])
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.token = null;
                    this.tokenExpireTime = 0;
                    return this.translate(request);
                }
                
                const errorBody = await response.text();
                throw new Error(`Translation failed with status: ${response.status}, body: ${errorBody}`);
            }

            const result = await response.json();
            
            if (!result || !Array.isArray(result) || result.length === 0) {
                throw new Error('Invalid response format from translation service');
            }

            const translation = result[0]?.translations?.[0]?.text;
            if (!translation) {
                throw new Error('No translation found in response');
            }
            return {
                text: translation,
                from: fromLang === 'auto-detect' ? (result[0]?.detectedLanguage?.language || from) : fromLang,
                to: toLang,
                raw: result
            };
        } catch (error) {
            // 添加更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Translation error: ${errorMessage}`);
        }
    }

    async detectLanguage(text: string): Promise<string> {
        if (!text || text.trim().length === 0) {
            throw new Error('Empty text is not allowed');
        }

        try {
            const token = await this.getToken();
            const url = new URL(`${this.translateUrl}/detect`);
            url.searchParams.append('api-version', '3.0');

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify([{ text }])
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Language detection failed: ${response.status}, body: ${errorBody}`);
            }

            const result = await response.json();
            
            if (!result || !Array.isArray(result) || result.length === 0) {
                throw new Error('Invalid response format from detection service');
            }

            const language = result[0]?.language;
            if (!language) {
                throw new Error('No language detected in response');
            }

            return language;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Language detection error: ${errorMessage}`);
        }
    }

    // 用于测试连接是否正常
    async testConnection(): Promise<boolean> {
        try {
            const token = await this.getToken();
            const testText = 'test';
            const result = await this.translate({ text: testText, from: 'en', to: 'zh-Hans' });
            return result.text !== testText;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

export { MicrosoftTranslator };