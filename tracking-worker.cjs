const {uIOhook,UiohookKey}=require('uiohook-napi');
const accepted=new Set(Object.entries(UiohookKey).filter(([name])=>/^([A-Z]|[0-9]|Numpad[0-9]|NumpadEnter|NumpadDecimal|Space|Enter|Backspace|Delete|Tab|Comma|Period|Slash|Backslash|Semicolon|Quote|Minus|Equal|Backquote|BracketLeft|BracketRight)$/.test(name)).map(([,value])=>value));
let last=0;uIOhook.on('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||!accepted.has(e.keycode))return;const now=Date.now();if(now-last>70){last=now;process.send?.({type:'activity',at:now})}});
try{uIOhook.start();process.send?.({type:'ready'})}catch{process.send?.({type:'error'});process.exit(1)}
process.on('message',m=>{if(m?.type==='stop'){try{uIOhook.stop()}catch{}process.exit(0)}});process.on('disconnect',()=>{try{uIOhook.stop()}catch{}process.exit(0)});
