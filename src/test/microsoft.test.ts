import * as assert from 'assert';
import fetch, { Response } from 'node-fetch';
import { MicrosoftTranslator } from '../microsoft';

const payload = [{ detectedLanguage: { language: 'en' }, translations: [{ text: '你好', to: 'zh-Hans' }] }];

function translatorWith(body: unknown = payload, status = 200) {
    const calls: Array<{ url: URL; options: any }> = [];
    const request = (async (url, options) => {
        calls.push({ url: new URL(String(url)), options });
        return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
    return { translator: new MicrosoftTranslator(request), calls };
}

suite('Microsoft Edge translation', () => {
    test('uses the new endpoint without authentication and sends a string array', async () => {
        const { translator, calls } = translatorWith();
        const result = await translator.translate({ text: 'Hello', to: 'zh-Hans' });
        assert.strictEqual(result.text, '你好');
        assert.strictEqual(result.from, 'en');
        assert.strictEqual(calls.length, 1);
        const { url, options } = calls[0];
        assert.strictEqual(url.origin + url.pathname, 'https://edge.microsoft.com/translate/translatetext');
        assert.strictEqual(url.searchParams.get('isEnterpriseClient'), 'false');
        assert.strictEqual(url.searchParams.get('to'), 'zh-Hans');
        assert.strictEqual(url.searchParams.has('from'), false);
        assert.deepStrictEqual(JSON.parse(options.body), ['Hello']);
        assert.strictEqual(options.headers.Authorization, undefined);
    });

    test('preserves explicit source languages and supports auto-detect', async () => {
        const { translator, calls } = translatorWith();
        await translator.translate({ text: 'Hello', from: 'en', to: 'ja' });
        assert.strictEqual(calls[0].url.searchParams.get('from'), 'en');
        await translator.translate({ text: 'Hello', from: 'auto-detect' });
        assert.strictEqual(calls[1].url.searchParams.has('from'), false);
        assert.strictEqual(await translator.detectLanguage('Hello'), 'en');
    });

    test('rejects invalid input without sending requests', async () => {
        const { translator, calls } = translatorWith();
        await assert.rejects(translator.translate({ text: ' ' }), /Empty text/);
        await assert.rejects(translator.translate({ text: 'Hello', to: 'auto' }), /target language/);
        assert.strictEqual(calls.length, 0);
    });

    test('rejects malformed responses and missing detection', async () => {
        for (const body of [{}, [], [{ translations: [] }]]) {
            await assert.rejects(translatorWith(body).translator.translate({ text: 'Hello' }));
        }
        const { translator } = translatorWith([{ translations: [{ text: 'Hello' }] }]);
        await assert.rejects(translator.detectLanguage('Hello'), /No language detected/);
    });

    test('reports HTTP errors once without echoing server response bodies', async () => {
        const { translator, calls } = translatorWith({ text: 'PRIVATE_INPUT' }, 401);
        await assert.rejects(translator.translate({ text: 'Hello' }), error => {
            assert.ok(error instanceof Error);
            assert.match(error.message, /status: 401/);
            assert.ok(!error.message.includes('PRIVATE_INPUT'));
            return true;
        });
        assert.strictEqual(calls.length, 1);
    });

    test('propagates network errors and reports failed connections', async () => {
        const request = (async () => { throw new Error('network unavailable'); }) as typeof fetch;
        const translator = new MicrosoftTranslator(request);
        await assert.rejects(translator.translate({ text: 'Hello' }), /network unavailable/);
        assert.strictEqual(await translator.testConnection(), false);
    });
});
