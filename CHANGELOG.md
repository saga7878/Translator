# Changelog

All notable changes to VS Code Translator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🚀 计划中

- AI 翻译支持
- 更多翻译服务商集成
- 文档批量翻译功能

## [0.1.5] - 2026-10-21

### 改进

- 简化翻译面板，适配深浅色主题和窄窗口，可直接选择、交换语言。
- 新增快速翻译快捷键：macOS 为 Option + Command + T，Windows / Linux 为 Ctrl + Alt + T。
- 复制和替换直接使用当前译文；原文改变后阻止误替换。
- 改善自动翻译、失败重试和加载状态，避免旧结果覆盖新内容。
- 切换翻译服务立即生效，重复打开面板保留当前内容。

## [0.1.4] - 2026-10-21

### 修复

- 更新 Microsoft Edge 翻译接口，修复无法获取认证令牌导致翻译失败的问题。
- 恢复自动识别语言和中英互译。
- 为翻译请求增加超时处理，避免请求长时间挂起。

## [0.1.1] - 2024-12-03

- 新增注释文本清理功能
  - 支持清理代码注释中的注释符号，便于翻译
  - 支持多种注释格式：
    - 单行注释 (//、#、--、;)
    - 多行注释 (/**/、/** */、<!-- -->、""")
  - 自动识别是否为注释文本，非注释文本保持原样

## [0.1.0] - 2024-11-23

### ✨ 新增

- 全新的翻译命令
  - 翻译悬停 (`translator.translateHover`)
  - 翻译面板 (`translator.translate`)
  - 翻译并替换 (`translator.translateAndReplace`)
  - 复制翻译结果 (`translator.copy`)
  - 替换为翻译结果 (`translator.replace`)

### ⌨️ 快捷键

- 添加多个快捷键支持
  - `Ctrl/Cmd + Shift + T`: 翻译悬停
  - `Ctrl/Cmd + Shift + V`: 翻译面板
  - `Ctrl/Cmd + Shift + R`: 翻译并替换
  - `Ctrl/Cmd + Shift + C`: 复制翻译结果
  - `Ctrl/Cmd + Shift + E`: 替换为翻译结果

### ⚙️ 配置

- 新增多项配置选项
  - 最小翻译文本长度设置
  - 源语言/目标语言选择
  - 悬停翻译开关
  - 悬停延迟时间
  - 翻译缓存超时设置

### 🌍 语言支持

- 支持多种语言互译
  - 中文（简体）
  - 英语
  - 日语
  - 韩语
  - 法语
  - 德语
  - 西班牙语
  - 俄语

### 🔄 依赖更新

- 添加 `arvin-trans` 翻译库支持
- 添加 `humps` 工具库
- 升级 `node-fetch` 到 3.3.2 版本

## [0.0.4] - 2021-08-11

### 🐛 修复

- 修复 Markdown 文件中图片显示问题

### 🔄 变更

- 简化翻译配置选项
- 优化用户界面交互
- 增加翻译菜单

## [0.0.3] - 2021-01-12

- 初始版本发布

[Unreleased]: https://github.com/saga7878/Translator/compare/v0.0.6...HEAD
[0.0.6]: https://github.com/saga7878/Translator/compare/v0.0.4...v0.0.6
[0.0.4]: https://github.com/saga7878/Translator/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/saga7878/Translator/releases/tag/v0.0.3