
import * as vscode from 'vscode';
import { TranslationService } from '../service/translationService';

export abstract class BaseProvider {
    constructor(protected translationService: TranslationService) {}

    protected getConfiguration() {
        return vscode.workspace.getConfiguration('translator');
    }

    protected logError(error: any, source: string): void {
        console.error(`[${source}] Error:`, error);
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`翻译错误: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('发生未知错误');
        }
    }
}