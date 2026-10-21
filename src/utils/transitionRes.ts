

import * as vscode from 'vscode';
import { getWebviewContent } from '../ui/getWebviewContent';
import { TranslationService } from '../service/translationService';
import { getSourceLangConfig } from './getSourceLang';

export function showTranslationResult(options: {
    original: string, translation: string, from: string, to: string,
    translationService:TranslationService
    
}) {
    const { original, translation, from, to, translationService } = options;
    const panel = vscode.window.createWebviewPanel(
        'translationResult',
        'Translation Pannel',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    );

    panel.webview.html = getWebviewContent(original, translation, from, to);

    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'translate':
                    try {
                        if (!message.text || message.text.trim() === '') {
                            panel.webview.postMessage({
                                command: 'updateTranslation',
                                translation: '请输入要翻译的文本',
                                from: 'auto',
                                to: 'zh-Hans'
                            });
                            return;
                        }
                       
                        console.log('开始翻译:', message.text);
                        const config = vscode.workspace.getConfiguration("translator");
                        const targetLang = config.get("targetLanguage", "zh-Hans");
                        const sourceLang = await getSourceLangConfig(translationService, message.text);
                        const to = sourceLang === targetLang ? "en" : targetLang;
                        
                        console.log('翻译参数:', { sourceLang, to, service: config.get("service", "microsoft") });
                        
                        // 执行翻译
                        const result = await translationService.translate(message.text, sourceLang, to);
                        
                        console.log('翻译结果:', result);
                        
                        // 发送结果回 webview
                        panel.webview.postMessage({
                            command: 'updateTranslation',
                            translation: result,
                            from: sourceLang,
                            to: to
                        });
                    } catch (error) {
                        console.error('翻译错误:', error);
                        const errorMessage = error instanceof Error ? error.message : '未知错误';
                        vscode.window.showErrorMessage(`翻译错误: ${errorMessage}`);
                        
                        // 向面板发送错误信息
                        panel.webview.postMessage({
                            command: 'updateTranslation',
                            translation: `翻译失败: ${errorMessage}`,
                            from: 'error',
                            to: 'error'
                        });
                    }
                    break;
            }
        },
        undefined
    );
}

// 新增：直接显示翻译面板，不需要预先的翻译结果
export function showEmptyTranslationPanel(translationService: TranslationService) {
    const panel = vscode.window.createWebviewPanel(
        'translationResult',
        'Translation Panel',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    );

    // 显示空的翻译面板，用户可以在其中输入文本
    panel.webview.html = getWebviewContent('', '', 'auto', 'zh-Hans');

    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'translate':
                    try {
                        if (!message.text || message.text.trim() === '') {
                            return;
                        }
                       
                        console.log('开始翻译:', message.text);
                        const config = vscode.workspace.getConfiguration("translator");
                        const targetLang = config.get("targetLanguage", "zh-Hans");
                        const sourceLang = await getSourceLangConfig(translationService, message.text);
                        const to = sourceLang === targetLang ? "en" : targetLang;
                        
                        console.log('翻译参数:', { sourceLang, to, service: config.get("service", "microsoft") });
                        
                        // 执行翻译
                        const result = await translationService.translate(message.text, sourceLang, to);
                        
                        console.log('翻译结果:', result);
                        
                        // 发送结果回 webview
                        panel.webview.postMessage({
                            command: 'updateTranslation',
                            translation: result,
                            from: sourceLang,
                            to: to
                        });
                    } catch (error) {
                        console.error('翻译错误:', error);
                        const errorMessage = error instanceof Error ? error.message : '未知错误';
                        vscode.window.showErrorMessage(`翻译错误: ${errorMessage}`);
                        
                        // 向面板发送错误信息
                        panel.webview.postMessage({
                            command: 'updateTranslation',
                            translation: `翻译失败: ${errorMessage}`,
                            from: 'error',
                            to: 'error'
                        });
                    }
                    break;
            }
        },
        undefined
    );
}