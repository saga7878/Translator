import * as assert from 'assert';
import { runInNewContext } from 'vm';
import { TranslationService } from '../service/translationService';
import { ITranslator, TranslationRequest } from '../types';
import { getWebviewContent } from '../ui/getWebviewContent';

suite('Translation experience', () => {
    test('uses the translation response for detection and reuses its cache', async () => {
        const calls: TranslationRequest[] = [];
        const backend: ITranslator = { getName: () => 'test', translate: async request => {
            calls.push(request); return { text: '你好', from: 'en', to: request.to };
        } };
        const service = new TranslationService(backend);
        await service.translateForReading('Hello');
        await service.translateForReading('Hello');
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].from, 'auto');
    });

    test('reverses a matching automatic language and changes service immediately', async () => {
        let calls = 0;
        const service = new TranslationService({ getName: () => 'first', translate: async request => {
            calls++; return { text: request.to === 'en' ? 'Hello' : '你好', from: 'zh-Hans', to: request.to };
        } });
        assert.strictEqual((await service.translateForReading('你好')).text, 'Hello');
        assert.strictEqual(calls, 2);
        service.setTranslator({ getName: () => 'second', translate: async () => ({ text: 'new service', from: 'en', to: 'zh-Hans' }) });
        assert.strictEqual((await service.translateForReading('你好')).text, 'new service');
    });

    function client(original = '') {
        const elements: Record<string, any> = {};
        const events: Record<string, Function> = {};
        const messages: any[] = [];
        let timeout = 0;
        const document = { getElementById: (id: string) => elements[id] || (elements[id] = {
            value: '', textContent: '', dataset: {}, options: [{ value: 'en', text: '英语' }, { value: 'zh-Hans', text: '简体中文' }],
            addEventListener(name: string, fn: Function) { this[name] = fn; }, focus() {},
        }), addEventListener() {} };
        const html = getWebviewContent(original, '', 'auto', 'zh-Hans');
        const script = html.match(/<script nonce="[^"]+">([\s\S]+)<\/script>/)[1];
        runInNewContext(script, { document, navigator: { platform: 'MacIntel' },
            acquireVsCodeApi: () => ({ postMessage: (message: any) => messages.push(message), setState() {} }),
            window: { addEventListener: (name: string, fn: Function) => events[name] = fn },
            setTimeout: () => ++timeout, clearTimeout() {},
        });
        return { elements, messages, html, receive: (data: any) => events.message({ data }),
            input(text: string) { elements.originalText.value = text; elements.originalText.input(); },
            submit() { elements.translate.click(); return messages[messages.length - 1]; } };
    }

    test('ignores late results after input changes or is cleared', () => {
        const ui = client(); ui.input('First'); const first = ui.submit();
        ui.input('Second');
        ui.receive({ command: 'result', id: first.id, translation: 'OLD', from: 'en', to: 'zh-Hans' });
        assert.notStrictEqual(ui.elements.result.textContent, 'OLD');
        const second = ui.submit(); ui.elements.clear.click();
        ui.receive({ command: 'result', id: second.id, translation: 'OLD', from: 'en', to: 'zh-Hans' });
        assert.strictEqual(ui.elements.originalText.value, '');
        assert.strictEqual(ui.elements.result.textContent, '译文会显示在这里');
        assert.strictEqual(ui.elements.copy.disabled, true);
    });

    test('ignores responses belonging to a previous panel session', () => {
        const ui = client(); ui.input('Hello'); const request = ui.submit();
        assert.strictEqual(request.session, 'standalone');
        ui.receive({ command: 'result', session: 'previous-panel', id: request.id,
            translation: 'WRONG PANEL', from: 'en', to: 'zh-Hans' });
        assert.notStrictEqual(ui.elements.result.textContent, 'WRONG PANEL');
    });

    test('keeps errors out of the translation and allows retry', () => {
        const ui = client(); ui.input('Hello'); const request = ui.submit();
        ui.receive({ command: 'error', id: request.id, message: 'Offline' });
        assert.strictEqual(ui.elements.status.textContent, '翻译失败');
        assert.strictEqual(ui.elements.error.hidden, false);
        assert.strictEqual(ui.elements.copy.disabled, true);
        ui.elements.retry.click(); const retry = ui.messages[ui.messages.length - 1];
        assert.ok(retry.id > request.id);
        ui.receive({ command: 'result', id: retry.id, translation: '你好', from: 'en', to: 'zh-Hans' });
        assert.strictEqual(ui.elements.result.textContent, '你好');
        assert.strictEqual(ui.elements.copy.disabled, false);
    });

    test('renders code-like input as text without introducing HTML', () => {
        const hostile = '</textarea><script>throw new Error("injected")</script>';
        const ui = client(hostile);
        assert.ok(!ui.html.includes(hostile));
        assert.strictEqual(ui.elements.originalText.value, hostile);
    });
});
