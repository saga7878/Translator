import * as vscode from 'vscode';

type  SupportedLanguage = string;
type PromptType = string | 'default';

interface ITranslationPrompt {
    sourceLang: SupportedLanguage;
    targetLang: SupportedLanguage;
    promptType: PromptType;
}

interface IPromptBuilder  {
    withLanguages(sourceLang: SupportedLanguage, targetLang: SupportedLanguage): void;
    addCustomPrompt(promptType: PromptType, prompt: string): void;
    build(type?: PromptType): string;
}

export class PromptBuilder implements IPromptBuilder, ITranslationPrompt {
    public sourceLang: string;
    public targetLang: string;
    public promptType: 'default' | string;

    private readonly prompts = new Map<string, string>();
    constructor() {
        this.prompts.set('languageDetectionPrompt', `分析给定文本的语言，返回符合微软翻译API支持的语言代码，仅返回一行JSON字符串，不要有任何其他内容、标记或说明，格式为：
            {"code": string, "nativeName": string,"name": string,"confidence": number }
        请分析以下文本：`);
    }

    withLanguages(sourceLang: string, targetLang: string): this {
        this.sourceLang = sourceLang;
        this.targetLang = targetLang;
        return this;
    }

    addCustomPrompt(type: string, prompt: string): this {
        this.prompts.set(type, prompt);
        return this;
    }

    private formatTemplate(template: string): string {
        return template
            .replace(/\${this.sourceLang}/g, this.sourceLang)
            .replace(/\${this.targetLang}/g, this.targetLang)
            .trim();
    }



    private  getDefaultTemplate() { 
        return `You are an expert programmer and technical translator with deep knowledge of software development and documentation standards.
    
            Role: Professional Technical Translator & Software Developer
            Task: Translate code comments and documentation
            
            Context: This is programming code documentation or comments
            Source Language: \${this.sourceLang}
            Target Language: \${this.targetLang}
            
            Instructions:
            - Translate from \${this.sourceLang} to \${this.targetLang}
            - Keep technical terms unchanged (e.g., API, function names)
            - Maintain code formatting
            - Use standard programming terminology in \${this.targetLang}
            - Ensure translations follow industry best practices
            - Preserve any markdown or special formatting
            - Only output the translated text without any explanations or comments
            
            Please provide the translation in the same format as the original text.`;
    }

    build(type?: string) {
        const template = this.prompts.get(type) ?? this.getDefaultTemplate();
        return this.formatTemplate(template);

    }

}

