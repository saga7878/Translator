import * as vscode from 'vscode';
import { TranslationService } from '../service/translationService';

export async function getSourceLangConfig(translationService: TranslationService, text: string) {
    const config = vscode.workspace.getConfiguration('translator');
    const sourceConfig = config.get('sourceLanguage', 'auto');
    let sourceLang: string;
    if (sourceConfig === 'auto') {
        sourceLang = await translationService.detectLanguage(text);
    } else {
        sourceLang = sourceConfig;
    }
    return sourceLang;
}