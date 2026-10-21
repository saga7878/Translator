import * as vscode from 'vscode';
import { TranslationService } from '../service/translationService';
import { HoverContentBuilder, TranslationAction } from '../ui/hoverContentBuilder';
import { TranslationResult } from '../types';

export function makeAction(document: vscode.TextDocument, range: vscode.Range, translation: string): TranslationAction {
    return { translation, original: document.getText(range), uri: document.uri.toString(), version: document.version,
        range: { start: { line: range.start.line, character: range.start.character },
            end: { line: range.end.line, character: range.end.character } } };
}

export class HoverProvider implements vscode.HoverProvider {
    private shown?: { action: TranslationAction; result: TranslationResult };
    private generation = 0;
    private pending = new Map<string, Promise<TranslationResult>>();
    constructor(private service: TranslationService) {}

    show(action: TranslationAction, result: TranslationResult) { this.shown = { action, result }; }
    clear() { this.shown = undefined; this.pending.clear(); this.generation++; }

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        const shown = this.shown;
        if (shown && shown.action.uri === document.uri.toString() && shown.action.version === document.version) {
            const r = shown.action.range;
            const range = new vscode.Range(r.start.line, r.start.character, r.end.line, r.end.character);
            if (range.contains(position)) {
                return HoverContentBuilder.build(shown.action.original, shown.result.text,
                    shown.result.from, shown.result.to, false, range, shown.action);
            }
        }
        const config = vscode.workspace.getConfiguration('translator');
        if (!config.get('hoverEnabled', false)) return;
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== document.uri.toString()) return;
        const range = !editor.selection.isEmpty && editor.selection.contains(position)
            ? editor.selection : document.getWordRangeAtPosition(position);
        if (!range) return;
        const text = document.getText(range);
        if (text.trim().length < config.get('minimumTextLength', 2)) return;
        const version = document.version;
        const generation = this.generation;
        await new Promise(resolve => setTimeout(resolve, config.get('hoverDelay', 300)));
        if (token.isCancellationRequested || document.version !== version || generation !== this.generation) return;
        const from = config.get('sourceLanguage', 'auto');
        const to = config.get('targetLanguage', 'zh-Hans');
        const key = JSON.stringify([text, from, to]);
        let request = this.pending.get(key);
        if (!request) {
            request = this.service.translateForReading(text, from, to);
            this.pending.set(key, request);
        }
        try {
            const result = await request;
            if (token.isCancellationRequested || document.version !== version || generation !== this.generation) return;
            const action = makeAction(document, range, result.text);
            return HoverContentBuilder.build(text, result.text, result.from, result.to, false, range, action);
        } catch {
            // Passive hovering should not interrupt typing with notifications.
            return;
        } finally { if (this.pending.get(key) === request) this.pending.delete(key); }
    }
}
