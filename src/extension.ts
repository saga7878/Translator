import * as vscode from 'vscode';
import { TranslationService } from './service/translationService';
import { MicrosoftTranslator } from './microsoft';
import { CopilotTranslator } from './ai/copilot';
import { HoverProvider, makeAction } from './providers/hoverProvider';
import { TranslationAction } from './ui/hoverContentBuilder';
import { showTranslationResult, showEmptyTranslationPanel, disposeTranslationPanel } from './utils/transitionRes';
import { getLanguageList } from './utils/languages';
import { replaceTranslation } from './utils/replaceTranslation';

export function activate(context: vscode.ExtensionContext) {
    const createTranslator = () => vscode.workspace.getConfiguration('translator').get<string>('service', 'microsoft') === 'copilot'
        ? new CopilotTranslator() : new MicrosoftTranslator();
    const service = new TranslationService(createTranslator());
    const hover = new HoverProvider(service);
    const register = (name: string, callback: (...args: any[]) => any) => {
        context.subscriptions.push(vscode.commands.registerCommand(name, callback));
    };
    const selected = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showInformationMessage('先选中一段文字，再翻译。');
            return;
        }
        return { editor, range: new vscode.Range(editor.selection.start, editor.selection.end),
            text: editor.document.getText(editor.selection), version: editor.document.version };
    };
    const translateSelection = async (mode: 'hover' | 'panel' | 'copy' | 'replace') => {
        const selection = selected();
        if (!selection) return;
        try {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: '正在翻译…' }, async () => {
                const config = vscode.workspace.getConfiguration('translator');
                const result = await service.translateForReading(selection.text,
                    config.get('sourceLanguage', 'auto'), config.get('targetLanguage', 'zh-Hans'));
                if (selection.editor.document.version !== selection.version) {
                    vscode.window.showInformationMessage('原文已改变，请重新选择后翻译。');
                    return;
                }
                const action = makeAction(selection.editor.document, selection.range, result.text);
                if (mode === 'copy') {
                    await vscode.env.clipboard.writeText(result.text);
                    vscode.window.setStatusBarMessage('$(check) 译文已复制', 2000);
                } else if (mode === 'replace') {
                    await replaceTranslation(action);
                } else if (mode === 'panel') {
                    showTranslationResult({ original: selection.text, translation: result.text,
                        from: result.from, to: result.to, translationService: service, action });
                } else {
                    if (vscode.window.activeTextEditor !== selection.editor) return;
                    hover.show(action, result);
                    await vscode.commands.executeCommand('editor.action.showHover');
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`翻译失败：${error instanceof Error ? error.message : '请稍后重试'}`);
        }
    };
    register('translator.translateHover', () => translateSelection('hover'));
    register('translator.quickTranslate', () => translateSelection('hover'));
    register('translator.translate', () => translateSelection('panel'));
    register('translator.translateAndReplace', () => translateSelection('replace'));
    register('translator.copy', async (action?: TranslationAction) => {
        if (!action) return translateSelection('copy');
        if (typeof action.translation !== 'string') return;
        await vscode.env.clipboard.writeText(action.translation);
        vscode.window.setStatusBarMessage('$(check) 译文已复制', 2000);
    });
    register('translator.replace', async (action?: TranslationAction) => {
        if (!action) return translateSelection('replace');
        await replaceTranslation(action);
    });
    register('translator.openPanel', () => showEmptyTranslationPanel(service));
    register('translator.openSettings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'translator'));
    for (const key of ['sourceLanguage', 'targetLanguage']) {
        register(`translator.change${key === 'sourceLanguage' ? 'Source' : 'Target'}Language`, async () => {
            const choices = getLanguageList().map(language => ({ label: language.name, value: language.code }));
            if (key === 'sourceLanguage') choices.unshift({ label: '自动识别', value: 'auto' });
            const choice = await vscode.window.showQuickPick(choices, { placeHolder: key === 'sourceLanguage' ? '原文语言' : '译文语言' });
            if (choice) await vscode.workspace.getConfiguration('translator').update(key, choice.value, vscode.ConfigurationTarget.Global);
        });
    }
    context.subscriptions.push(
        vscode.languages.registerHoverProvider({ scheme: 'file', language: '*' }, hover),
        vscode.languages.registerHoverProvider({ scheme: 'untitled', language: '*' }, hover),
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('translator.service')) service.setTranslator(createTranslator());
            if (event.affectsConfiguration('translator')) hover.clear();
        }),
        { dispose: disposeTranslationPanel },
    );
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    status.text = '$(globe) 翻译';
    status.tooltip = process.platform === 'darwin' ? '打开翻译面板 · 选中文字按 ⌥⌘T 快速翻译' : '打开翻译面板 · 选中文字按 Ctrl+Alt+T 快速翻译';
    status.command = 'translator.openPanel';
    status.show();
    context.subscriptions.push(status);
}
