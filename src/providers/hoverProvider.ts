// src/providers/hoverProvider.ts
import * as vscode from 'vscode';
import { HoverContentBuilder } from '../ui/hoverContentBuilder';
import { getLanguageName, getOppositeLanguage } from '../utils/languages';
import { BaseProvider } from './baseProvider';
import { TranslationService } from '../service/translationService';

export class HoverProvider extends BaseProvider implements vscode.HoverProvider {
    private hoverEnabled: boolean;
    private minimumTextLength: number;
    private sourceLanguage: string;
    private targetLanguage: string;
    private isTriggeredByCommand :boolean = false;

    constructor(
        translationService: TranslationService,
    ) {
        super(translationService);
        this.updateConfiguration();
        // 监听配置变化
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('translator')) {
                this.updateConfiguration();
            }
        });
    }

    private updateConfiguration() {
        const config = this.getConfiguration();
        this.hoverEnabled = config.get<boolean>('hoverEnabled', true);
        this.minimumTextLength = config.get<number>('minimumTextLength', 2);
        this.sourceLanguage = config.get<string>('sourceLanguage', 'auto');
        this.targetLanguage = config.get<string>('targetLanguage', 'zh-Hans');
    }

    setTriggeredByCommand(value: boolean) {
        this.isTriggeredByCommand = value;
    }

    getSelectionOrWordRange(editor: vscode.TextEditor, position: vscode.Position): vscode.Range {
        if (!editor.selection.isEmpty) {
            return editor.selection;
        }
        
        const line = editor.document.lineAt(position.line);
        const lineText = line.text;
        
        // 查找注释起始位置
        const commentStart = lineText.indexOf('//');
        if (commentStart >= 0) {
            const start = new vscode.Position(position.line, commentStart + 2); // +2 跳过 //
            const end = new vscode.Position(position.line, lineText.length);
            return new vscode.Range(start, end);
        }
        
        // 如果不是注释，返回单词范围
        return editor.document.getWordRangeAtPosition(position) || new vscode.Range(position, position);
    }
    

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        try {
            if (!this.hoverEnabled && !this.isTriggeredByCommand) {
                return undefined;
            }
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            const range = this.getSelectionOrWordRange(editor, position);
            if (!range) {
                return undefined;
            }
    
            const text = document.getText(range);
           
            if (text.length < this.minimumTextLength) {
                return undefined;
            }
    
            let sourceLanguage = this.sourceLanguage;
            let targetLanguage = this.targetLanguage;
    
            // 如果配置为自动检测，则使用检测服务
            if (sourceLanguage === 'auto') {
                try {
                    sourceLanguage = await this.translationService.detectLanguage(text);
                } catch (error) {
                    console.warn('Language detection failed, falling back to auto', error);
                    sourceLanguage = 'auto';
                }
            }
    
            // 如果源语言和目标语言相同，自动切换目标语言
            if (sourceLanguage === targetLanguage) {
                targetLanguage = getOppositeLanguage(sourceLanguage);
            }
    
            const cached = this.translationService.translator.getCached(text, sourceLanguage, targetLanguage);
          
            if (cached) {
                const fromLang = getLanguageName(cached.from);
                const toLang = getLanguageName(cached.to);
                return HoverContentBuilder.build(
                    text,
                    cached.text,
                    fromLang,
                    toLang,
                    false,
                    range
                );
            }
    
            return undefined;
        } catch (error) {
            this.logError(error, 'HoverProvider');
            this.isTriggeredByCommand = false;
            return undefined;
        } finally {
            this.isTriggeredByCommand = false;
        }
    }
}