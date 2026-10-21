import * as vscode from 'vscode';
import { getLanguageName } from '../utils/languages';

export interface TranslationAction {
    translation: string;
    original: string;
    uri: string;
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    version: number;
}

export class HoverContentBuilder {
    static build(text: string, translation: string, from: string, to: string,
        isLoading = false, range?: vscode.Range, action?: TranslationAction): vscode.Hover {
        const content = new vscode.MarkdownString();
        content.appendMarkdown(`**${isLoading ? '正在翻译…' : '译文'}**\n\n`);
        if (!isLoading) {
            content.appendText(translation);
            content.appendMarkdown(`\n\n---\n${getLanguageName(from)} → ${getLanguageName(to)}\n\n`);
            if (action) {
                const args = encodeURIComponent(JSON.stringify([action]));
                content.appendMarkdown(`[复制译文](command:translator.copy?${args})　[替换原文](command:translator.replace?${args})`);
                content.isTrusted = { enabledCommands: ['translator.copy', 'translator.replace'] };
            }
        }
        return new vscode.Hover(content, range);
    }
}
