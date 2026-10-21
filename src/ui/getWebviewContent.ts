import { CommentExtractor } from "../utils/commont";
import { escapeHtml } from "../utils/escapeHtml";

function getWebviewContent(original: string, translation: string, from: string, to: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translator Pannel</title>
    <style>
        :root {
            --card-bg: var(--vscode-editor-background);
            --card-border: var(--vscode-widget-border);
            --card-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            --hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            --input-bg: var(--vscode-input-background);
            --input-border: var(--vscode-input-border);
            --input-focus-border: var(--vscode-focusBorder);
            --text-primary: var(--vscode-editor-foreground);
            --text-secondary: var(--vscode-descriptionForeground);
            --button-bg: var(--vscode-button-background);
            --button-fg: var(--vscode-button-foreground);
            --button-hover-bg: var(--vscode-button-hoverBackground);
            --selection-bg: var(--vscode-selection-background);
            --selection-fg: var(--vscode-selection-foreground, var(--vscode-editor-foreground));
            --transition-duration: 0.2s;
        }

        body {
            padding: 16px;
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif);
            line-height: 1.6;
            font-size: var(--vscode-font-size, 13px);
            color: var(--text-primary);
            background-color: transparent;
        }

        ::selection {
            background-color: var(--selection-bg);
            color: var(--selection-fg);
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            opacity: 0;
            transform: translateY(10px);
            animation: fadeIn 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .card {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: var(--card-shadow);
            transition: all var(--transition-duration) ease-out;
        }

        .card:hover {
            box-shadow: var(--hover-shadow);
            border-color: var(--input-border);
        }

        .label {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .text-area {
            width: 100%;
            min-height: 100px;
            padding: 12px;
            font-size: var(--vscode-font-size, 13px);
            font-family: inherit;
            color: var(--text-primary);
            background-color: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 4px;
            resize: vertical;
            box-sizing: border-box;
            transition: all var(--transition-duration) ease;
        }

        .text-area:focus {
            outline: none;
            border-color: var(--input-focus-border);
            box-shadow: 0 0 0 1px var(--input-focus-border);
        }

        .text-area::placeholder {
            color: var(--text-secondary);
            opacity: 0.6;
        }

        .language-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
            font-size: 11px;
            color: var(--text-secondary);
        }

        .actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .copy-button {
            background-color: var(--button-bg);
            color: var(--button-fg);
            border: none;
            padding: 4px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all var(--transition-duration) ease;
            min-width: 60px;
        }

        .copy-button:hover {
            background-color: var(--button-hover-bg);
        }

        .copy-button:active {
            transform: scale(0.96);
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            opacity: 0;
            transition: opacity var(--transition-duration);
        }

        .status.show {
            opacity: 1;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--text-secondary);
        }

        .status.typing .status-dot {
            animation: blink 1.4s infinite;
        }

        .status.translating .status-dot {
            animation: pulse 1s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
        }

        @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0.5; }
        }

        .translated-mark {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: var(--vscode-charts-green);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .translated-mark.show {
            opacity: 1;
        }

        .translated-mark::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: var(--vscode-charts-green);
        }

        @media (max-width: 480px) {
            body {
                padding: 12px;
            }
            
            .card {
                padding: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="label">
                <span>原文</span>
                <div class="status" id="status">
                    <span class="status-dot"></span>
                    <span id="status-text">空闲</span>
                </div>
            </div>
            <textarea class="text-area" id="originalText" 
                placeholder="在此输入要翻译的文本...">${CommentExtractor.clean((original))}</textarea>
            <div class="language-info">
                <span>来源语言：<span id="fromLang">${from}</span></span>
            </div>
        </div>
        <div class="card">
            <div class="label">
                <span>译文</span>
                <div class="translated-mark" id="translatedMark">已翻译</div>
            </div>
            <textarea class="text-area" id="translationText" 
                placeholder="翻译结果将在这里显示..." 
                readonly>${CommentExtractor.clean((translation))}</textarea>
            <div class="language-info">
                <span>目标语言：<span id="toLang">${to}</span></span>
                <div class="actions">
                    <button class="copy-button" onclick="copyTranslation()">copy</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        let translateTimeout;
        const originalText = document.getElementById('originalText');
        const status = document.getElementById('status');
        const statusText = document.getElementById('status-text');
        const translatedMark = document.getElementById('translatedMark');

        function translate() {
            const text = document.getElementById('originalText').value;
                vscode.postMessage({
                    command: 'translate',
                    text: text
            });
        }

        function updateStatus(state) {
            status.className = 'status show ' + state;
            translatedMark.className = 'translated-mark';
            
            switch(state) {
                case 'typing':
                    statusText.textContent = '正在输入...';
                    break;
                case 'translating':
                    statusText.textContent = '翻译中...';
                    break;
                case 'translated':
                    statusText.textContent = '空闲';
                    status.className = 'status';
                    translatedMark.className = 'translated-mark show';
                    break;
                default:
                    statusText.textContent = '空闲';
                    status.className = 'status';
            }
        }

        function debounceTranslate(text) {
            updateStatus('typing');
            clearTimeout(translateTimeout);
            
            if (!text.trim()) {
                updateStatus('');
                document.getElementById('translationText').value = '';
                return;
            }

            translateTimeout = setTimeout(() => {
                updateStatus('translating');
                vscode.postMessage({
                    command: 'translate',
                    text: text
                });
            }, 800);
        }

        originalText.addEventListener('input', (e) => {
            debounceTranslate(e.target.value);
        });

        function copyTranslation() {
            const translation = document.getElementById('translationText').value;
            if (!translation.trim()) return;

            navigator.clipboard.writeText(translation).then(() => {
                const button = document.querySelector('.copy-button');
                button.textContent = 'Copied';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 1500);
                
                vscode.postMessage({
                    command: 'showInfo',
                    text: '已复制到剪贴板'
                });
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateTranslation':
                    document.getElementById('translationText').value = message.translation;
                    document.getElementById('fromLang').textContent = message.from;
                    document.getElementById('toLang').textContent = message.to;
                    updateStatus('translated');
                    break;
            }
        });
        
    </script>
</body>
</html>`;
}

export { getWebviewContent };