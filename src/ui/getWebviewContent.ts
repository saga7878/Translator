import { randomBytes } from 'crypto';
import { escapeHtml } from '../utils/escapeHtml';
import { getLanguageList } from '../utils/languages';

export function getWebviewContent(original: string, translation: string, from: string, to: string,
    options: { canReplace?: boolean; service?: string; session?: string } = {}) {
    const nonce = randomBytes(16).toString('hex');
    const initial = JSON.stringify({ original, translation, from, to, canReplace: !!options.canReplace,
        session: options.session || 'standalone', service: options.service || 'Microsoft Edge' }).replace(/</g, '\\u003c');
    const common = ['zh-Hans', 'en', 'ja', 'ko', 'zh-Hant', 'fr', 'de', 'es', 'ru'];
    const ordered = getLanguageList().sort((a, b) => (common.includes(a.code) ? common.indexOf(a.code) : 99) - (common.includes(b.code) ? common.indexOf(b.code) : 99));
    const choices = ordered.map(language =>
        `<option value="${escapeHtml(language.code)}">${escapeHtml(language.name)}</option>`).join('');
    return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>翻译</title><style nonce="${nonce}">
:root{color-scheme:light dark;--bg:var(--vscode-editor-background,#181b20);--fg:var(--vscode-editor-foreground,#e6e8ec);--muted:var(--vscode-descriptionForeground,#9298a4);--line:var(--vscode-widget-border,rgba(140,150,165,.22));--soft:var(--vscode-input-background,#22262d);--accent:var(--vscode-textLink-foreground,#4ba3e8);--focus:var(--vscode-focusBorder,#4ba3e8)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:13px/1.6 var(--vscode-font-family,system-ui,sans-serif)}
main{max-width:820px;margin:0 auto;padding:32px 28px 22px}header{display:flex;align-items:center;gap:12px;margin-bottom:26px}.logo{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--line);border-radius:10px;color:var(--accent);font-size:16px;font-weight:600}h1{font-size:22px;line-height:1.25;letter-spacing:-.5px;font-weight:600;margin:0}.subtitle{font-size:11px;color:var(--muted);margin-top:4px}.badge{margin-left:auto;color:var(--muted);font-size:11px;white-space:nowrap}
.workspace{border:1px solid var(--line);border-radius:12px;overflow:hidden}.languages{display:grid;grid-template-columns:1fr 32px 1fr;align-items:center;border-bottom:1px solid var(--line);padding:10px 14px;gap:8px;background:var(--vscode-sideBar-background,var(--bg))}select{font:inherit;color:var(--fg);background:transparent;border:1px solid transparent;border-radius:6px;padding:6px 8px;width:100%;cursor:pointer;min-width:0}select:hover{background:var(--soft)}option{background:var(--bg);color:var(--fg)}button{font:inherit;cursor:pointer;border-radius:6px;transition:background .15s,color .15s}button:disabled{opacity:.42;cursor:default}button:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}.icon-button{border:0;background:transparent;color:var(--muted);width:30px;height:30px;font-size:18px;display:grid;place-items:center}.icon-button:hover:not(:disabled){color:var(--fg);background:var(--soft)}
.section{padding:19px 20px}.section-head{display:flex;align-items:center;justify-content:space-between;height:24px;margin-bottom:10px}.eyebrow{font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.6px}.source-meta{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:11px}textarea{display:block;width:100%;min-height:112px;max-height:330px;resize:vertical;border:0;background:transparent;color:var(--fg);font:14px/1.85 var(--vscode-font-family,system-ui,sans-serif);padding:4px 0 8px;border-radius:3px}textarea::placeholder{color:var(--muted);opacity:.75}textarea:focus{outline:none}.source-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}.detected{color:var(--muted);font-size:11px}.translate-button{padding:5px 11px;border:1px solid var(--line);color:var(--fg);background:transparent;font-size:12px}.translate-button:hover:not(:disabled){background:var(--soft)}
.result-section{border-top:1px solid var(--line);background:var(--vscode-sideBar-background,var(--bg))}.result{white-space:pre-wrap;overflow-wrap:anywhere;min-height:96px;font-size:15px;line-height:1.9;padding:3px 0 15px;user-select:text}.placeholder{color:var(--muted);font-size:13px}.result-actions{display:flex;align-items:center;gap:8px;min-height:32px}.primary{background:var(--vscode-button-background,#176e9c);color:var(--vscode-button-foreground,#fff);border:1px solid transparent;padding:6px 14px;font-size:12px}.primary:hover:not(:disabled){background:var(--vscode-button-hoverBackground,#2186b8)}.secondary{background:transparent;color:var(--fg);border:1px solid var(--line);padding:6px 12px;font-size:12px}.secondary:hover:not(:disabled){background:var(--soft)}.status{display:flex;gap:6px;align-items:center;color:var(--muted);font-size:11px}.status[data-state=error]{color:var(--vscode-errorForeground,#e68a86)}.status[data-state=loading]::before{content:'';width:10px;height:10px;border:1.5px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.error-box{color:var(--vscode-errorForeground,#e68a86);font-size:12px;margin:0 0 14px;line-height:1.7}.error-box button{display:block;margin-top:10px}.hint{color:var(--muted);font-size:11px;margin:14px 2px 0;display:flex;justify-content:space-between;gap:12px}kbd{font:inherit;color:var(--fg)}[hidden]{display:none!important}
@media(max-width:460px){main{padding:22px 14px}header{margin-bottom:20px}.section{padding:16px}.languages{padding:8px}.badge{display:none}.hint{font-size:10px}.result{min-height:100px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style></head><body><main>
<header><div class="logo" aria-hidden="true">译</div><div><h1>翻译</h1><div class="subtitle">少一点切换，多一点顺畅。</div></div><span class="badge" id="service"></span></header>
<div class="workspace"><div class="languages"><select id="from" aria-label="原文语言"><option value="auto">自动识别</option>${choices}</select><button id="swap" class="icon-button" aria-label="交换语言" title="交换语言">⇄</button><select id="to" aria-label="译文语言">${choices}</select></div>
<section class="section"><div class="section-head"><label class="eyebrow" for="originalText">原文</label><div class="source-meta"><span id="count">0 字</span><button id="clear" class="icon-button" aria-label="清空原文" title="清空原文" hidden>×</button></div></div><textarea id="originalText" spellcheck="false" placeholder="输入或粘贴文字，自动翻译…" aria-label="原文"></textarea><div class="source-footer"><span class="detected" id="detected">自动识别原文语言</span><button id="translate" class="translate-button" disabled>翻译 ↵</button></div></section>
<section class="section result-section" aria-label="翻译结果"><div class="section-head"><span class="eyebrow">译文</span><span id="status" class="status" role="status" aria-live="polite"></span></div><div id="result" class="result placeholder" aria-live="polite">译文会显示在这里</div><div id="error" class="error-box" role="alert" hidden><span id="errorText"></span><button id="retry" class="secondary">重试</button></div><div class="result-actions"><button id="copy" class="primary" disabled>复制译文</button><button id="replace" class="secondary" hidden disabled>替换原文</button></div></section></div>
<div class="hint"><span>输入后自动翻译</span><span><kbd id="shortcut">⌘ Enter</kbd> 立即翻译</span></div>
</main><script nonce="${nonce}">
const vscode=acquireVsCodeApi();
const initial=${initial};
function send(message){vscode.postMessage({...message,session:initial.session});}
const $=id=>document.getElementById(id);
let requestId=0, timer, copyTimer, latest='', actualFrom='auto', canReplace=false, busy=false;
const languageNames=Object.fromEntries(Array.from($('to').options).map(o=>[o.value,o.text]));
$('shortcut').textContent=/Mac/i.test(navigator.platform)?'⌘ Enter':'Ctrl Enter';
function status(state,text){$('status').dataset.state=state;$('status').textContent=text;}
function persist(){vscode.setState({original:$('originalText').value,from:$('from').value,to:$('to').value});}
function updateInput(){const text=$('originalText').value;$('count').textContent=Array.from(text).length+' 字';$('clear').hidden=!text;$('translate').disabled=!text.trim()||busy;}
function invalidate(){requestId++;clearTimeout(timer);clearTimeout(copyTimer);latest='';busy=false;$('copy').textContent='复制译文';$('copy').disabled=true;$('replace').disabled=true;$('error').hidden=true;$('result').className='result placeholder';$('result').textContent=$('originalText').value.trim()?'等待翻译…':'译文会显示在这里';status('','');updateInput();persist();}
function submit(){clearTimeout(timer);if(!$('originalText').value.trim())return;const id=++requestId;busy=true;latest='';$('copy').disabled=true;$('replace').disabled=true;$('error').hidden=true;$('result').className='result placeholder';$('result').textContent='正在翻译…';status('loading','翻译中');updateInput();send({command:'translate',id,text:$('originalText').value,from:$('from').value,to:$('to').value});}
function schedule(){invalidate();if($('originalText').value.trim())timer=setTimeout(submit,500);}
function init(data){invalidate();$('originalText').value=data.original||'';$('from').value=data.from||'auto';$('to').value=data.to||'zh-Hans';$('service').textContent=data.service||'Microsoft Edge';canReplace=!!data.canReplace;$('replace').hidden=!canReplace;actualFrom=data.from||'auto';$('detected').textContent=actualFrom==='auto'?'自动识别原文语言':languageNames[actualFrom]||actualFrom;
 if(data.translation){latest=data.translation;$('result').textContent=latest;$('result').className='result';$('copy').disabled=false;$('replace').disabled=!canReplace;status('done','已翻译');}else{$('result').textContent='译文会显示在这里';}updateInput();persist();}
$('originalText').addEventListener('input',schedule);
for(const id of ['from','to'])$(id).addEventListener('change',()=>{actualFrom=$('from').value;$('detected').textContent=actualFrom==='auto'?'自动识别原文语言':languageNames[actualFrom];invalidate();if($('originalText').value.trim())submit();});
$('translate').addEventListener('click',submit);$('retry').addEventListener('click',submit);
$('clear').addEventListener('click',()=>{$('originalText').value='';invalidate();$('originalText').focus();});
$('swap').addEventListener('click',()=>{const source=$('from').value==='auto'?actualFrom:$('from').value;if(source==='auto'){status('','先输入文字，再交换语言');return;}const target=$('to').value;$('to').value=source;$('from').value=target;if(latest)$('originalText').value=latest;actualFrom=target;$('detected').textContent=languageNames[target]||target;invalidate();if($('originalText').value.trim())submit();});
$('copy').addEventListener('click',()=>{if(latest)send({command:'copy',id:requestId,text:latest});});
$('replace').addEventListener('click',()=>{if(latest)send({command:'replace',id:requestId,text:latest});});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();submit();}});
window.addEventListener('message',event=>{const m=event.data;if(m.session&&m.session!==initial.session)return;if(m.command==='init'){init(m);return;}if(m.command==='serviceChanged'){$('service').textContent=m.service;invalidate();if($('originalText').value.trim())submit();return;}if(m.id!==requestId)return;
 if(m.command==='result'){busy=false;latest=m.translation;actualFrom=m.from;$('to').value=m.to;$('detected').textContent=($('from').value==='auto'?'已识别：':'')+(languageNames[m.from]||m.from);$('result').textContent=latest;$('result').className='result';$('copy').disabled=false;$('replace').disabled=!canReplace;status('done','已翻译');updateInput();persist();}
 if(m.command==='error'){busy=false;latest='';$('result').textContent='暂时没有译文';$('result').className='result placeholder';$('errorText').textContent=m.message;$('error').hidden=false;status('error','翻译失败');updateInput();}
 if(m.command==='copied'){$('copy').textContent='已复制 ✓';clearTimeout(copyTimer);copyTimer=setTimeout(()=>$('copy').textContent='复制译文',1600);}
 if(m.command==='replaced'){status(m.ok?'done':'error',m.ok?'已替换原文':'原文已改变，请重新选择');if(m.ok){canReplace=false;$('replace').disabled=true;$('replace').textContent='已替换';}}
});
init(initial);send({command:'ready'});
</script></body></html>`;
}
