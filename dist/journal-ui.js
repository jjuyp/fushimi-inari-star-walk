// Illustrated journal home. Artwork is separate from live text, prices and actions.
export const JOURNAL_ROUTES=[
 ['wash','Digit1','1',0],['shop','Digit2','2',1],['charms','Digit3','3',2],['fortune','Digit4','4',3],['tie','Digit5','5',4],['stone','Digit6','6',5],['kagura','Digit7','7',6],['waterfall','Digit8','8',7],['art','Digit9','9',8],['art2','Digit0','0',9],['art3','Minus','−',10]
];
export const JOURNAL_ACTIONS=[['bag','KeyB','B',11,'隨身袋・享用與配戴'],['night','KeyN','N',12,'日落後・燈籠參道'],['nightview','KeyV','V',13,'四辻・眺望京都夜景'],['pray','KeyH','H',14,'本殿・二禮二拍手一禮']];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function plaque(name,id,code,key,icon,kind='travel'){
 const position=(icon%4)*100/3+'% '+Math.floor(icon/4)*100/3+'%';
 return '<button class="journal-plaque" data-'+kind+'="'+id+'" aria-keyshortcuts="'+escape(key==='−'?'-':key)+'" title="'+escape(name)+' · '+escape(key)+'"><span class="journal-icon" aria-hidden="true" style="background-position:'+position+'"></span><span class="journal-label">'+escape(name)+'</span><kbd class="journal-key">'+escape(key)+'</kbd><span class="journal-chevron" aria-hidden="true">›</span></button>';
}
export function journalMarkup(sites,coins,fortune){
 return '<header class="journal-hero"><div class="journal-wallet"><span>旅費</span><strong>'+coins.toLocaleString()+'</strong><span>円</span></div><p class="journal-currency-note">遊戲代幣・非真實價格</p><p class="journal-invitation">淨手、祈願，沿朱紅鳥居收集一段自己的山中時光。</p></header><div class="journal-route-grid">'+JOURNAL_ROUTES.map(([id,code,key,icon])=>{const s=sites.find(s=>s.id===id);return plaque(s.name,id,code,key,icon)}).join('')+'</div><p class="journal-caption">原創藝術裝置、山林之瀧與神樂舞台是遊戲體驗增設；實際重輕石位於奧社奉拜所。<span class="journal-sources"><a href="https://inari.jp/trip/map01/" target="_blank" rel="noopener">大社導覽</a>・<a href="https://inari.jp/grace/omamori/" target="_blank" rel="noopener">官方授與品</a></span></p><div class="journal-actions">'+JOURNAL_ACTIONS.map(([id,code,key,icon,name])=>plaque(name,id,code,key,icon,'journal-action')).join('')+'</div>'+(fortune?'<button class="journal-fortune-link" data-journal-action="fortune" aria-keyshortcuts="K">展讀已抽到的籤 <kbd>K</kbd></button>':'')+'<p class="journal-key-guide"><kbd>J</kbd> 開關手帖　·　按牌上的快捷鍵前往　·　<kbd>Esc</kbd> 返回</p><div class="journal-footer-art" aria-hidden="true"></div>';
}
export function bindJournalShortcuts({dialog,journal,close,travel,actions,busy}){
 const routes=new Map(JOURNAL_ROUTES.map(([id,code])=>[code,id])),actionKeys=new Map(JOURNAL_ACTIONS.map(([id,code])=>[code,id]));actionKeys.set('KeyK','fortune');
 const handler=e=>{if(e.repeat||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||busy())return;const editor=e.target?.closest?.('input,textarea,select,[contenteditable="true"]');if(editor&&editor.getClientRects().length)return;if(editor)document.querySelector('#scene')?.focus({preventScroll:true});const other=document.querySelector('dialog[open]');if(other&&!(other===dialog&&dialog.classList.contains('journal-home')))return;
  let fn;if(e.code==='KeyJ')fn=()=>dialog.open?close():journal();else if(routes.has(e.code))fn=()=>travel(routes.get(e.code));else if(actionKeys.has(e.code))fn=()=>actions[actionKeys.get(e.code)]?.();if(!fn)return;e.preventDefault();e.stopImmediatePropagation();fn();};
 addEventListener('keydown',handler);return()=>removeEventListener('keydown',handler);
}
