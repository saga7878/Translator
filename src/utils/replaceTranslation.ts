import * as vscode from 'vscode';
import { TranslationAction } from '../ui/hoverContentBuilder';

export async function replaceTranslation(action: TranslationAction): Promise<boolean> {
    if (!action || typeof action.translation !== 'string' || !action.range || !action.uri) return false;
    const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === action.uri);
    const r = action.range;
    const range = new vscode.Range(r.start.line, r.start.character, r.end.line, r.end.character);
    if (!document || document.version !== action.version || document.getText(range) !== action.original) {
        vscode.window.showInformationMessage('原文已改变，请重新选择后翻译。');
        return false;
    }
    // Apply without moving focus away from the translation panel.
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, action.translation);
    return vscode.workspace.applyEdit(edit);
}
