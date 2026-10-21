// src/ui/hoverContentBuilder.ts
import * as vscode from 'vscode';
import { hoverStyles } from './hoverStyleBuilder';
import { CommentExtractor } from '../utils/commont';
import { escapeHtml } from '../utils/escapeHtml';

export class HoverContentBuilder {
    static build(
        text: string,
        translation: string,
        fromLang: string,
        toLang: string,
        isLoading: boolean = false,
        rang:vscode.Range
    ): vscode.Hover {
        if (isLoading) {
            return new vscode.Hover([
                new vscode.MarkdownString('正在翻译...')
            ]);
        }

       /*  const content = new vscode.MarkdownString();
        content.supportHtml = true;
        content.isTrusted = true;
    
        // 翻译结果
        content.appendMarkdown(`\n${translation}\n`);
                
        // 语言信息（使用小号字体）
        content.appendMarkdown(`<sub>${fromLang} → ${toLang}</sub>\n`);
        
        // 操作按钮
        content.appendMarkdown(`[复制](command:translator.copy) &nbsp;&nbsp; [替换](command:translator.replace)`);
        
 */
        const content = new vscode.MarkdownString('', true);
        content.isTrusted = true;

        const copyCommand = `translator.copy`;
        const replaceCommand = `translator.replace`;

        content.appendMarkdown(`\n\n`);
        // 源语言和原文
        content.appendMarkdown(`**${fromLang}**\n\n`);
        content.appendMarkdown(`<font size=10>${CommentExtractor.clean((text))}</font>\n\n`);
        
        // 目标语言和译文
        content.appendMarkdown(`**${toLang}**\n\n`);
        content.appendMarkdown(`<font size=10>${CommentExtractor.clean(translation)}</font>\n\n`);
        
        // 操作按钮
        content.appendMarkdown(`<font size=5>` +
            `[✓ copy](command:${copyCommand}?${encodeURIComponent(JSON.stringify([translation]))})` + ` &nbsp; &nbsp;&nbsp;&nbsp;` +
            `[↻ replace](command:${replaceCommand}?${encodeURIComponent(JSON.stringify([translation, rang]))})` +
            `</font>`);
      
       
        return new vscode.Hover([content]);
    }
}