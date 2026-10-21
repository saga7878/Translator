import * as vscode from 'vscode';
import { TranslationService } from '../service/translationService';
import { showTranslationResult } from '../utils/transitionRes';
import { getSourceLangConfig } from '../utils/getSourceLang';

export class TranslatorPanelProvider implements vscode.TreeDataProvider<TranslatorItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TranslatorItem | undefined | null | void> = new vscode.EventEmitter<TranslatorItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TranslatorItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private hasAutoOpened = false;

    constructor(private translationService: TranslationService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TranslatorItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TranslatorItem): Thenable<TranslatorItem[]> {
        // 当侧边栏首次打开时，自动打开翻译面板
        if (!element && !this.hasAutoOpened) {
            this.hasAutoOpened = true;
            // 延迟一点时间确保视图已经完全加载
            setTimeout(() => {
                vscode.commands.executeCommand('translator.openPanel');
            }, 100);
        }
        
        if (!element) {
            // 返回一个提示项，告诉用户翻译面板即将打开
            return Promise.resolve([
                new TranslatorItem(
                    '翻译面板已打开',
                    '翻译面板已在右侧打开，您可以在其中输入文本进行翻译',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    'check'
                )
            ]);
        }
        
        return Promise.resolve([]);
    }
}

export class TranslatorItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        iconName?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.command = command;
        
        if (iconName) {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }
        
        // 设置上下文值用于条件显示
        this.contextValue = 'translatorItem';
    }
}
