import * as vscode from "vscode";
import { TranslationService } from "./service/translationService";
import { MicrosoftTranslator } from "./microsoft";
import { HoverProvider } from "./providers/hoverProvider";
import { showTranslationResult, showEmptyTranslationPanel } from "./utils/transitionRes";
import { getSourceLangConfig } from "./utils/getSourceLang";
import { HoverContentBuilder } from "./ui/hoverContentBuilder";
import { CopilotTranslator } from "./ai/copilot";
import { extensionConfig, ExtensionConfigManager } from "./config/extensionConfigManager";

// register the extension
function registerConfiguration(context: vscode.ExtensionContext) {
  const config = new ExtensionConfigManager();
  
  // 创建状态栏按钮 - 直接打开翻译面板
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(globe) 翻译";
  statusBarItem.tooltip = "点击打开翻译面板";
  statusBarItem.command = 'translator.openPanel';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
   
    // 注册命令
    context.subscriptions.push(
        vscode.commands.registerCommand(extensionConfig.service.command, () => {
          
        })
    );

   

    // 初始化配置
    const service = {
      "microsoft": new MicrosoftTranslator(),
      "copilot": new CopilotTranslator()
    }
    const translationService = new TranslationService(service[config.service]);
    return translationService;
    
}

export function activate(context: vscode.ExtensionContext) {
  // 注册配置切换及翻译服务
  const translationService = registerConfiguration(context);
  const hover = new HoverProvider(translationService);
  
  // 注册 Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: "file", language: '*' },
    hover
  );

  // Hover 翻译命令
  let translateHoverCommand = vscode.commands.registerCommand(
    "translator.translateHover",
    async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (!text) {
          vscode.window.showInformationMessage("请先选择要翻译的文本");
          return;
        }
        const statusBarItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        statusBarItem.text = "$(sync~spin) 正在翻译...";
        statusBarItem.show();
        const config = vscode.workspace.getConfiguration("translator");
        const targetLang = config.get("targetLanguage", "zh-Hans");
        const sourceLang = await getSourceLangConfig(translationService, text);
        const to = sourceLang === targetLang ? "en" : targetLang;
        try {
          const result = await translationService.translate(
            text,
            sourceLang,
            to
          );
         
          hover.setTriggeredByCommand(true);
          HoverContentBuilder.build(
            text,
            result,
            sourceLang,
            to,
            false,
            selection
          );
          // 等待一会再显示 hover
         await new Promise((res) => {
            setTimeout(res, 300);
         });
          await vscode.commands.executeCommand("editor.action.showHover");
          hover.setTriggeredByCommand(false);
        } finally {
          statusBarItem.dispose();
        }
      } catch (error) {
        console.log(error);
        vscode.window.showErrorMessage(`翻译错误: ${error.message}`);
      }
    }
  );

  // 翻译面板命令
  let translateCommand = vscode.commands.registerCommand(
    "translator.translate",
    async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
          vscode.window.showInformationMessage("请先选择要翻译的文本");
          return;
        }

        const statusBarItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        statusBarItem.text = "$(sync~spin) 正在翻译...";
        statusBarItem.show();

        try {
          const config = vscode.workspace.getConfiguration("translator");
          const targetLang = config.get("targetLanguage", "zh-Hans");
          const sourceLang = await getSourceLangConfig(
            translationService,
            text
          );
          const to = sourceLang === targetLang ? "en" : targetLang;
          const result = await translationService.translate(
            text,
            sourceLang,
            to
          );

          showTranslationResult({translationService, original: text, translation: result, from: sourceLang, to});
        } finally {
          statusBarItem.dispose();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`翻译错误: ${error.message}`);
      }
    }
  );

  // 复制翻译结果命令
  let copyCommand = vscode.commands.registerCommand(
    "translator.copy",
    async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
          vscode.window.showInformationMessage("请先选择要翻译的文本");
          return;
        }

        const statusBarItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        statusBarItem.text = "$(sync~spin) 正在翻译...";
        statusBarItem.show();

        try {
          const config = vscode.workspace.getConfiguration("translator");
          const targetLang = config.get("targetLanguage", "zh-Hans");
          const sourceLang = await getSourceLangConfig(
            translationService,
            text
          );
          const to = sourceLang === targetLang ? "en" : targetLang;
          const result = await translationService.translate(
            text,
            sourceLang,
            to
          );

          await vscode.env.clipboard.writeText(result);
          vscode.window.showInformationMessage("翻译结果已复制到剪贴板");
        } finally {
          statusBarItem.dispose();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`翻译错误: ${error.message}`);
      }
    }
  );

  // 替换为翻译结果命令
  let replaceCommand = vscode.commands.registerCommand(
    "translator.replace",
    async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
          vscode.window.showInformationMessage("请先选择要翻译的文本");
          return;
        }

        const statusBarItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        statusBarItem.text = "$(sync~spin) 正在翻译...";
        statusBarItem.show();

        try {
          const config = vscode.workspace.getConfiguration("translator");
          const targetLang = config.get("targetLanguage", "zh-Hans");
          const sourceLang = await getSourceLangConfig(
            translationService,
            text
          );
          const to = sourceLang === targetLang ? "en" : targetLang;
          const result = await translationService.translate(
            text,
            sourceLang,
            to
          );

          await editor.edit((editBuilder) => {
            editBuilder.replace(selection, result);
          });
        } finally {
          statusBarItem.dispose();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`翻译错误: ${error.message}`);
      }
    }
  );

  // 翻译并替换命令
  let translateAndReplaceCommand = vscode.commands.registerCommand(
    "translator.translateAndReplace",
    async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
          vscode.window.showInformationMessage("请先选择要翻译的文本");
          return;
        }

        const statusBarItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        statusBarItem.text = "$(sync~spin) 正在翻译...";
        statusBarItem.show();

        try {
          const config = vscode.workspace.getConfiguration("translator");
          const targetLang = config.get("targetLanguage", "zh-Hans");
          const sourceLang = await getSourceLangConfig(
            translationService,
            text
          );
          const to = sourceLang === targetLang ? "en" : targetLang;
          const result = await translationService.translate(
            text,
            sourceLang,
            to
          );

          await editor.edit((editBuilder) => {
            editBuilder.replace(selection, result);
          });
        } finally {
          statusBarItem.dispose();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`翻译错误: ${error.message}`);
      }
    }
  );

  // 打开翻译面板命令
  let openPanelCommand = vscode.commands.registerCommand(
    "translator.openPanel",
    async () => {
      // 直接显示空的翻译面板，用户可以在面板中输入文本
      showEmptyTranslationPanel(translationService);
    }
  );

  // 快速翻译命令（从侧边栏触发）
  let quickTranslateCommand = vscode.commands.registerCommand(
    "translator.quickTranslate",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("请先打开一个文件");
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (!text) {
        vscode.window.showInformationMessage("请先选择要翻译的文本");
        return;
      }

      // 调用翻译面板命令
      await vscode.commands.executeCommand('translator.translate');
    }
  );

  // 打开设置命令
  let openSettingsCommand = vscode.commands.registerCommand(
    "translator.openSettings",
    () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'translator');
    }
  );

  // 更改源语言命令
  let changeSourceLanguageCommand = vscode.commands.registerCommand(
    "translator.changeSourceLanguage",
    async () => {
      const languages = [
        { label: '自动检测', value: 'auto' },
        { label: '简体中文', value: 'zh-Hans' },
        { label: '英语', value: 'en' },
        { label: '日语', value: 'ja' },
        { label: '韩语', value: 'ko' },
        { label: '法语', value: 'fr' },
        { label: '德语', value: 'de' },
        { label: '西班牙语', value: 'es' },
        { label: '俄语', value: 'ru' }
      ];

      const selected = await vscode.window.showQuickPick(languages, {
        placeHolder: '选择源语言'
      });

      if (selected) {
        const config = vscode.workspace.getConfiguration('translator');
        await config.update('sourceLanguage', selected.value, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`源语言已设置为: ${selected.label}`);
      }
    }
  );

  // 更改目标语言命令
  let changeTargetLanguageCommand = vscode.commands.registerCommand(
    "translator.changeTargetLanguage",
    async () => {
      const languages = [
        { label: '简体中文', value: 'zh-Hans' },
        { label: '英语', value: 'en' },
        { label: '日语', value: 'ja' },
        { label: '韩语', value: 'ko' },
        { label: '法语', value: 'fr' },
        { label: '德语', value: 'de' },
        { label: '西班牙语', value: 'es' },
        { label: '俄语', value: 'ru' }
      ];

      const selected = await vscode.window.showQuickPick(languages, {
        placeHolder: '选择目标语言'
      });

      if (selected) {
        const config = vscode.workspace.getConfiguration('translator');
        await config.update('targetLanguage', selected.value, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`目标语言已设置为: ${selected.label}`);
      }
    }
  );



  // 注册所有命令
  context.subscriptions.push(
    translateHoverCommand,
    translateCommand,
    copyCommand,
    replaceCommand,
    translateAndReplaceCommand,
    openPanelCommand,
    quickTranslateCommand,
    openSettingsCommand,
    changeSourceLanguageCommand,
    changeTargetLanguageCommand,
    hoverProvider
  );
  
}
