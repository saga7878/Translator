import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

type NestedMessages = {
    [key: string]: string | NestedMessages;
};

export class I18n {
    private static instance: I18n;
    private messages: NestedMessages = {};
    private currentLanguage: string;

    private constructor() {
        this.currentLanguage = vscode.env.language;
        this.loadMessages();
    }

    public static getInstance(): I18n {
        if (!I18n.instance) {
            I18n.instance = new I18n();
        }
        return I18n.instance;
    }

    private loadMessages() {
        try {
            const languageFile = path.join(__dirname, `../locales/${this.currentLanguage}.json`);
            
            if (!fs.existsSync(languageFile)) {
                this.currentLanguage = 'en';
            }
            
            this.messages = JSON.parse(fs.readFileSync(
                path.join(__dirname, `../src/locales/${this.currentLanguage}.json`),
                'utf-8'
            ));
        } catch (error) {
            console.error('Failed to load language file:', error);
            this.messages = {};
        }
    }

    public t(key: string, params: { [key: string]: string } = {}): string {
        const keys = key.split('.');
        let value: any = this.messages;
        
        // 遍历嵌套对象获取翻译值
        for (const k of keys) {
            if (value === undefined || value[k] === undefined) {
                return key; // 如果找不到翻译，返回原始键
            }
            value = value[k];
        }

        // 确保最终值是字符串
        if (typeof value !== 'string') {
            return key;
        }

        // 替换参数
        let result = value;
        Object.keys(params).forEach(param => {
            result = result.replace(`{${param}}`, params[param]);
        });

        return result;
    }
}