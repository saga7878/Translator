import * as vscode from "vscode";
import {
  ITranslator,
  TranslationRequest,
  TranslationResult,
} from "../../types";
import { ChatManager } from "./chatManager";
import { PromptBuilder } from "./promptBuilder";
import { CommentExtractor } from "../../utils/commont";
import { LanguageInfo } from "../../utils/languages";
import { MicrosoftTranslator } from "../../microsoft";

export class CopilotTranslator implements ITranslator {
  private promptBuilder: PromptBuilder;
  private chatManager: ChatManager;
  private model: vscode.LanguageModelChat;

  constructor() {
    this.promptBuilder = new PromptBuilder();
    this.chatManager = new ChatManager();
  }

  private async getModel(family?: string) {
    if (!this.model || family) {
      try {
        // 优先尝试选择 gpt-4o 模型（文档中推荐用于复杂任务）
        // 如果指定了 family，则尝试选择该模型
        let models: readonly vscode.LanguageModelChat[];

        if (family) {
          models = await vscode.lm.selectChatModels({
            vendor: "copilot",
            family: family,
          });
        } else {
          // 先尝试 gpt-4o
          models = await vscode.lm.selectChatModels({
            vendor: "copilot",
            family: "gpt-4o",
          });

          // 如果 gpt-4o 不可用，尝试所有模型
          if (!models || models.length === 0) {
            models = await vscode.lm.selectChatModels({
              vendor: "copilot",
            });
          }
        }

        if (!models || models.length === 0) {
          throw new Error(
            "没有可用的 Copilot 模型。请确保已登录 GitHub Copilot 并且订阅处于活动状态。"
          );
        }

        console.log(
          "可用的 Copilot 模型：",
          models.map((m) => `${m.vendor}/${m.family} (${m.id})`)
        );

        // 选择第一个可用模型
        this.model = models[0];
        console.log(
          "使用模型：",
          `${this.model.vendor}/${this.model.family} (${this.model.id})`
        );
      } catch (error) {
        console.error("获取模型失败：", error);
        throw error;
      }
    }
    return this.model;
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const { text, from = "auto", to = "zh-Hans" } = request;

    const userText = CommentExtractor.clean(text);

    // 获取所有可用的 Copilot 模型，然后逐个尝试
    let allModels: readonly vscode.LanguageModelChat[] = [];
    try {
      allModels = await vscode.lm.selectChatModels({
        vendor: "copilot",
      });

      if (!allModels || allModels.length === 0) {
        throw new Error(
          "没有可用的 Copilot 模型。请确保已登录 GitHub Copilot 并且订阅处于活动状态。"
        );
      }

      console.log(
        "所有可用的 Copilot 模型：",
        allModels.map((m) => `${m.vendor}/${m.family} (${m.id})`)
      );
    } catch (error) {
      throw new Error(
        `无法获取 Copilot 模型: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    let lastError: any = null;

    // 逐个尝试每个模型
    for (const model of allModels) {
      try {
        console.log(`尝试使用模型: ${model.family} (${model.id})`);

        // 使用更自然、更简洁的翻译提示
        // 避免可能触发 API 限制的复杂指令
        const simplePrompt = `Please translate this text to ${to}. Return only the translation, nothing else:

${userText}`;

        const messages = [vscode.LanguageModelChatMessage.User(simplePrompt)];

        // 根据最新的类型定义，options 和 token 都是可选参数
        // 尝试不传递 options 参数，避免 model 参数错误
        let chatResponse: vscode.LanguageModelChatResponse;
        try {
          // 方法1: 只传递 messages，不传递 options（根据类型定义，options 是可选的）
          chatResponse = await model.sendRequest(messages);
        } catch (noOptionsError: any) {
          // 如果方法1失败，尝试方法2: 传递 undefined 作为 options
          if (
            noOptionsError?.message?.includes("not supported") ||
            (noOptionsError as any)?.code === "model_not_supported"
          ) {
            try {
              // 方法2: 明确传递 undefined 作为 options
              chatResponse = await model.sendRequest(
                messages,
                undefined,
                new vscode.CancellationTokenSource().token
              );
            } catch (undefinedError: any) {
              // 如果还是失败，尝试方法3: 传递空对象
              try {
                chatResponse = await model.sendRequest(
                  messages,
                  {},
                  new vscode.CancellationTokenSource().token
                );
              } catch (emptyOptionsError: any) {
                console.log(
                  `模型 ${model.family} 的所有调用方式都失败:`,
                  emptyOptionsError?.message || emptyOptionsError
                );
                lastError = emptyOptionsError;
                throw emptyOptionsError; // 抛出错误以继续尝试下一个模型
              }
            }
          } else {
            throw noOptionsError;
          }
        }

        const res = await this.parseChatResponse(chatResponse);

        // 检查响应是否为空
        if (!res || !res.text || res.text.trim().length === 0) {
          throw new Error("模型返回了空的翻译结果");
        }

        // 清理响应文本，移除可能的代码块格式和其他格式
        res.text = res.text
          .replace(/^```[\w]*\n?/gm, "")
          .replace(/\n?```$/gm, "")
          .trim();

        // 移除可能的引号
        if (
          (res.text.startsWith('"') && res.text.endsWith('"')) ||
          (res.text.startsWith("'") && res.text.endsWith("'"))
        ) {
          res.text = res.text.slice(1, -1);
        }

        // 再次检查清理后的文本是否为空
        if (res.text.trim().length === 0) {
          throw new Error("清理后的翻译结果为空");
        }

        // 成功返回
        console.log(`模型 ${model.family} 翻译成功！`);
        return { ...res, from, to, raw: text };
      } catch (error: any) {
        console.log(
          `模型 ${model.family} (${model.id}) 失败:`,
          error.message || error
        );
        lastError = error;

        // 检查是否是模型不支持的错误（更宽松的匹配）
        const isModelNotSupported =
          error?.message?.includes("not supported") ||
          error?.message?.includes("model_not_supported") ||
          (error as any)?.code === "model_not_supported" ||
          (error?.message &&
            (error.message.includes('"code":"model_not_supported"') ||
              error.message.includes('"param":"model"')));

        if (isModelNotSupported) {
          console.log(`模型 ${model.family} 不支持翻译请求，尝试下一个模型...`);
          lastError = error;
          continue; // 尝试下一个模型
        }

        // 其他错误也继续尝试下一个模型（可能是网络错误等临时问题）
        // 只有当所有模型都失败时才抛出错误
        lastError = error;
        continue;
      }
    }

    // 所有模型都失败了，处理最后的错误
    if (lastError) {
      console.log(
        "所有模型尝试都失败，处理错误:",
        lastError?.message || lastError
      );

      // 检查是否是模型不支持的错误（更宽松的检查）
      const errorMessage = lastError?.message?.toLowerCase() || "";
      const errorCode = (lastError as any)?.code;
      const isModelNotSupported =
        errorMessage.includes("not supported") ||
        errorMessage.includes("model_not_supported") ||
        errorCode === "model_not_supported" ||
        (lastError?.message &&
          (lastError.message.includes('"code":"model_not_supported"') ||
            lastError.message.includes('"param":"model"')));

      // 根据文档，可能的错误原因包括：
      // - model does not exist
      // - user consent not given
      // - quota limits were exceeded
      if (
        lastError instanceof vscode.LanguageModelError ||
        isModelNotSupported
      ) {
        let errorMsg = `语言模型错误: ${lastError.message}`;

        if (errorCode) {
          errorMsg += ` (错误代码: ${errorCode})`;
        }

        // 检查是否是模型不支持的错误
        if (isModelNotSupported) {
          console.log("检测到模型不支持错误，准备自动切换到 Microsoft 翻译...");
          // 自动切换到 Microsoft 翻译服务
          console.log(
            "检测到 Copilot 不支持翻译，自动切换到 Microsoft 翻译服务..."
          );

          try {
            // 切换配置
            await vscode.workspace
              .getConfiguration("translator")
              .update(
                "service",
                "microsoft",
                vscode.ConfigurationTarget.Global
              );

            // 使用 Microsoft 翻译服务完成翻译（先执行翻译，避免用户等待）
            console.log("使用 Microsoft 翻译服务进行翻译...");
            const microsoftTranslator = new MicrosoftTranslator();

            try {
              const result = await microsoftTranslator.translate(request);

              // 翻译成功，静默返回结果，不显示任何消息
              // 只在控制台记录，用户不需要看到任何提示
              console.log("Microsoft 翻译成功，自动切换完成，返回结果");

              // 完全静默返回，不显示任何用户提示
              return result;
            } catch (microsoftError) {
              // Microsoft 翻译也失败了，这是真正的失败，需要显示错误
              console.error("Microsoft 翻译也失败了:", microsoftError);
              const finalError = new Error(
                `所有翻译方式都失败：
1. GitHub Copilot 不支持翻译请求
2. Microsoft 翻译服务也失败: ${
                  microsoftError instanceof Error
                    ? microsoftError.message
                    : String(microsoftError)
                }`
              );

              // 只有在所有方式都失败时才显示错误
              vscode.window
                .showErrorMessage(
                  `翻译失败：Microsoft 翻译服务错误。请检查网络连接或稍后重试。`,
                  "打开设置"
                )
                .then((selection) => {
                  if (selection === "打开设置") {
                    vscode.commands.executeCommand(
                      "workbench.action.openSettings",
                      "translator"
                    );
                  }
                });

              throw finalError;
            }
          } catch (switchError) {
            // 切换配置失败，尝试直接使用 Microsoft 翻译（不更新配置）
            console.error(
              "切换配置失败，尝试直接使用 Microsoft 翻译:",
              switchError
            );

            try {
              const microsoftTranslator = new MicrosoftTranslator();
              console.log("直接使用 Microsoft 翻译服务进行翻译...");
              const result = await microsoftTranslator.translate(request);

              console.log(
                "Microsoft 翻译成功（切换配置失败但直接调用成功），返回结果"
              );
              return result;
            } catch (directMicrosoftError) {
              // 直接使用 Microsoft 也失败了，这是真正的失败
              console.error(
                "直接使用 Microsoft 翻译也失败:",
                directMicrosoftError
              );
              const finalError = new Error(
                `所有翻译方式都失败：
1. GitHub Copilot 不支持翻译请求
2. 无法切换到 Microsoft 翻译服务: ${
                  switchError instanceof Error
                    ? switchError.message
                    : String(switchError)
                }
3. 直接使用 Microsoft 翻译也失败: ${
                  directMicrosoftError instanceof Error
                    ? directMicrosoftError.message
                    : String(directMicrosoftError)
                }`
              );

              vscode.window
                .showErrorMessage(
                  `翻译失败：所有翻译服务都不可用。请检查网络连接或稍后重试。`,
                  "打开设置"
                )
                .then((selection) => {
                  if (selection === "打开设置") {
                    vscode.commands.executeCommand(
                      "workbench.action.openSettings",
                      "translator"
                    );
                  }
                });

              throw finalError;
            }
          }
        } else if (
          errorMessage.includes("consent") ||
          errorMessage.includes("permission")
        ) {
          // 用户授权问题，先尝试切换到 Microsoft
          console.log("检测到授权问题，尝试切换到 Microsoft 翻译...");
          try {
            await vscode.workspace
              .getConfiguration("translator")
              .update(
                "service",
                "microsoft",
                vscode.ConfigurationTarget.Global
              );

            const microsoftTranslator = new MicrosoftTranslator();
            const result = await microsoftTranslator.translate(request);
            console.log("Microsoft 翻译成功（授权问题自动回退），返回结果");
            return result;
          } catch (fallbackError) {
            // Microsoft 也失败，显示错误
            errorMsg = `需要用户授权 Copilot，且 Microsoft 翻译也失败：${lastError.message}`;
            vscode.window
              .showErrorMessage(errorMsg, "打开设置")
              .then((selection) => {
                if (selection === "打开设置") {
                  vscode.commands.executeCommand(
                    "workbench.action.openSettings",
                    "translator"
                  );
                }
              });
            throw new Error(errorMsg);
          }
        } else if (
          errorMessage.includes("quota") ||
          errorMessage.includes("limit")
        ) {
          // 配额问题，先尝试切换到 Microsoft
          console.log("检测到配额问题，尝试切换到 Microsoft 翻译...");
          try {
            await vscode.workspace
              .getConfiguration("translator")
              .update(
                "service",
                "microsoft",
                vscode.ConfigurationTarget.Global
              );

            const microsoftTranslator = new MicrosoftTranslator();
            const result = await microsoftTranslator.translate(request);
            console.log("Microsoft 翻译成功（配额问题自动回退），返回结果");
            return result;
          } catch (fallbackError) {
            // Microsoft 也失败，显示错误
            errorMsg = `Copilot 配额已用完，且 Microsoft 翻译也失败：${lastError.message}`;
            vscode.window
              .showErrorMessage(errorMsg, "打开设置")
              .then((selection) => {
                if (selection === "打开设置") {
                  vscode.commands.executeCommand(
                    "workbench.action.openSettings",
                    "translator"
                  );
                }
              });
            throw new Error(errorMsg);
          }
        } else {
          // 其他错误，也尝试切换到 Microsoft
          console.log("检测到其他错误，尝试切换到 Microsoft 翻译...");
          try {
            await vscode.workspace
              .getConfiguration("translator")
              .update(
                "service",
                "microsoft",
                vscode.ConfigurationTarget.Global
              );

            const microsoftTranslator = new MicrosoftTranslator();
            const result = await microsoftTranslator.translate(request);
            console.log("Microsoft 翻译成功（其他错误自动回退），返回结果");
            return result;
          } catch (fallbackError) {
            // Microsoft 也失败，显示错误
            const finalErrorMsg =
              errorMsg ||
              `Copilot 翻译失败: ${lastError.message}，且 Microsoft 翻译也失败`;
            vscode.window
              .showErrorMessage(`翻译失败：${finalErrorMsg}`, "打开设置")
              .then((selection) => {
                if (selection === "打开设置") {
                  vscode.commands.executeCommand(
                    "workbench.action.openSettings",
                    "translator"
                  );
                }
              });
            throw new Error(finalErrorMsg);
          }
        }
      } else {
        // 不是 LanguageModelError，但也尝试切换到 Microsoft
        console.log("检测到未知错误，尝试切换到 Microsoft 翻译...");
        try {
          await vscode.workspace
            .getConfiguration("translator")
            .update("service", "microsoft", vscode.ConfigurationTarget.Global);

          const microsoftTranslator = new MicrosoftTranslator();
          const result = await microsoftTranslator.translate(request);
          console.log("Microsoft 翻译成功（未知错误自动回退），返回结果");
          return result;
        } catch (fallbackError) {
          // Microsoft 也失败，显示错误
          const errorMsg = `Copilot 翻译失败，且 Microsoft 翻译也失败：${lastError.message}`;
          vscode.window
            .showErrorMessage(errorMsg, "打开设置")
            .then((selection) => {
              if (selection === "打开设置") {
                vscode.commands.executeCommand(
                  "workbench.action.openSettings",
                  "translator"
                );
              }
            });
          throw new Error(errorMsg);
        }
      }
    }

    throw new Error("无法获取语言模型");
  }

  private async parseChatResponse(
    chatResponse: vscode.LanguageModelChatResponse
  ) {
    try {
      let resultText = "";
      for await (const fragment of chatResponse.text) {
        resultText += fragment;
      }
      return { text: resultText };
    } catch (error) {
      console.error("Error parsing chat response:", error);
      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const model = await this.getModel();
      if (!model) {
        throw new Error("无法获取语言模型");
      }

      const str = this.promptBuilder.build("languageDetectionPrompt");
      // 根据最新的类型定义，options 是可选的，可以不传递
      const chatResponse = await model.sendRequest([
        vscode.LanguageModelChatMessage.User(
          str + "\n" + CommentExtractor.clean(text)
        ),
      ]);
      const res = await this.parseChatResponse(chatResponse);

      if (!res.text) {
        throw new Error("语言检测返回空结果");
      }

      const info: LanguageInfo = JSON.parse(res.text);

      if (!info || !info.code) {
        throw new Error("语言检测结果格式不正确");
      }

      return info.code;
    } catch (error) {
      console.error("Error detecting language:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`语言检测错误: ${errorMessage}`);
      throw error;
    }
  }

  getName(): string {
    return "github copilot";
  }
}
