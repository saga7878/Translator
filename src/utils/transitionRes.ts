import * as vscode from 'vscode';
import { getWebviewContent } from '../ui/getWebviewContent';
import { TranslationService } from '../service/translationService';
import { TranslationAction } from '../ui/hoverContentBuilder';
import { isValidLanguageCode } from './languages';
import { replaceTranslation } from './replaceTranslation';

type PanelInput = { original: string; translation: string; from: string; to: string;
    translationService: TranslationService; action?: TranslationAction };
let panel: vscode.WebviewPanel | undefined;
let input: PanelInput;
let sequence = 0;
let view = 0;
let latest: { id: number; text: string } | undefined;

function render(data: PanelInput) {
    input = data;
    sequence++;
    view++;
    latest = data.translation ? { id: 1, text: data.translation } : undefined;
    const config = vscode.workspace.getConfiguration('translator');
    const serviceName = config.get<string>('service', 'microsoft') === 'copilot' ? 'GitHub Copilot' : 'Microsoft Edge';
    panel.webview.html = getWebviewContent(data.original, data.translation,
        config.get('sourceLanguage', 'auto'), data.to, { canReplace: !!data.action, service: serviceName, session: String(view) });
}

function open(data: PanelInput) {
    if (panel) {
        panel.reveal(vscode.ViewColumn.Beside);
        // Clicking the status item again keeps the current text and result.
        if (data.original) render(data);
        return;
    }
    panel = vscode.window.createWebviewPanel('translationResult', '翻译', vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true });
    const activePanel = panel;
    render(data);
    const receiver = activePanel.webview.onDidReceiveMessage(async message => {
        if (!message || typeof message.command !== 'string' || message.session !== String(view)) return;
        if (message.command === 'ready') return;
        if (!Number.isSafeInteger(message.id)) return;
        if (message.command === 'copy' && latest?.id === message.id) {
            await vscode.env.clipboard.writeText(latest.text);
            await activePanel.webview.postMessage({ command: 'copied', session: message.session, id: message.id });
            return;
        }
        if (message.command === 'replace' && latest?.id === message.id && input.action) {
            const ok = await replaceTranslation({ ...input.action, translation: latest.text });
            await activePanel.webview.postMessage({ command: 'replaced', session: message.session, id: message.id, ok });
            return;
        }
        if (message.command !== 'translate' || typeof message.text !== 'string' || !message.text.trim()) return;
        if (typeof message.from !== 'string' || typeof message.to !== 'string' ||
            !isValidLanguageCode(message.from) || !isValidLanguageCode(message.to) || message.to === 'auto') return;
        const current = ++sequence;
        latest = undefined;
        const service = input.translationService;
        try {
            const result = await service.translateForReading(message.text, message.from, message.to);
            if (panel !== activePanel || current !== sequence) return;
            latest = { id: message.id, text: result.text };
            await activePanel.webview.postMessage({ command: 'result', session: message.session, id: message.id,
                translation: result.text, from: result.from, to: result.to });
        } catch (error) {
            if (panel !== activePanel || current !== sequence) return;
            await activePanel.webview.postMessage({ command: 'error', session: message.session, id: message.id,
                message: error instanceof Error ? error.message : '服务暂时不可用，请稍后重试。' });
        }
    });
    const configuration = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('translator.service')) {
            sequence++; latest = undefined;
            activePanel.webview.postMessage({ command: 'serviceChanged', session: String(view), service:
                vscode.workspace.getConfiguration('translator').get<string>('service', 'microsoft') === 'copilot'
                    ? 'GitHub Copilot' : 'Microsoft Edge' });
        }
    });
    activePanel.onDidDispose(() => { receiver.dispose(); configuration.dispose(); if (panel === activePanel) {
        panel = undefined; latest = undefined; sequence++;
    } });
}

export function showTranslationResult(options: PanelInput) { open(options); }
export function showEmptyTranslationPanel(service: TranslationService) {
    const config = vscode.workspace.getConfiguration('translator');
    open({ original: '', translation: '', from: config.get('sourceLanguage', 'auto'),
        to: config.get('targetLanguage', 'zh-Hans'), translationService: service });
}
export function disposeTranslationPanel() { panel?.dispose(); }
