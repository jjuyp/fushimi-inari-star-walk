export function createHudFolders({routeStrip,gestureStrip,resetInput,editor}){
 const key='inari-hud-drawers-v1';
 const preferences={routes:false,actions:false};
 let quiet=false,mode='overview',previous='';
 try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const id of Object.keys(preferences))preferences[id]=saved[id]===true;}catch{}
 const root=document.createElement('div');
 root.id='hudFolders';root.className='ui';
 root.setAttribute('role','group');root.setAttribute('aria-label','介面摺疊');
 const controls={};
 for(const [id,label,element] of [['routes','傳送',routeStrip],['actions','動作',gestureStrip]]){
  const button=document.createElement('button');
  button.type='button';button.dataset.fold=id;
  button.setAttribute('aria-controls',element.id);
  button.innerHTML='<i aria-hidden="true"></i><span>'+label+'</span>';
  button.onclick=()=>{preferences[id]=!preferences[id];try{localStorage.setItem(key,JSON.stringify(preferences));}catch{};resetInput();update(mode);};
  root.append(button);controls[id]={button,element,label};
 }
 const clean=document.createElement('button');clean.type='button';clean.dataset.fold='quiet';
 clean.innerHTML='<i aria-hidden="true"></i><span></span>';
 clean.title='純景模式 · I';clean.setAttribute('aria-keyshortcuts','I');
 clean.onclick=()=>setQuiet(!quiet);root.append(clean);
 document.body.append(root);
 function setQuiet(value){
  quiet=value;resetInput();
  const seasons=document.querySelector('#hudSeasons');
  if(value&&!seasons.hidden)document.querySelector('#seasonControl').click();
  update(mode);
 }
 function update(value){
  mode=value;
  const editing=editor.editing;
  const showQuiet=quiet&&!editing;
  const routeTop=Number.parseFloat(routeStrip.style.getPropertyValue('--hud-y'));
  const next=[mode,editing,showQuiet,preferences.routes,preferences.actions,routeStrip.dataset.hudEnabled,gestureStrip.dataset.hudEnabled,routeTop,innerHeight].join(':');
  if(previous===next)return;
  previous=next;
  document.body.classList.toggle('hud-quiet',showQuiet);
  root.hidden=mode==='photo'||editing;
  for(const [id,{element,button,label}] of Object.entries(controls)){
   const enabled=element.dataset.hudEnabled!=='false';
   const collapsed=preferences[id]&&enabled&&!editing;
   element.classList.toggle('hud-folded',collapsed);
   element.inert=collapsed||(!enabled&&!editing)||showQuiet;
   button.setAttribute('aria-expanded',String(!collapsed));
   button.setAttribute('aria-label',(collapsed?'展開':'收起')+(id==='routes'?'快速傳送列':'小星星動作列'));
   button.querySelector('span').textContent=label;
   button.hidden=showQuiet||!enabled||(id==='actions'&&mode!=='walk');
  }
  const caption=showQuiet?'顯示介面':'純景';
  if(clean.querySelector('span').textContent!==caption)clean.querySelector('span').textContent=caption;
  clean.setAttribute('aria-pressed',String(showQuiet));
  const routeShown=routeStrip.dataset.hudEnabled!=='false'&&!preferences.routes&&!showQuiet;
  const bottom=routeShown&&Number.isFinite(routeTop)&&routeTop>innerHeight*.55?Math.max(12,innerHeight-routeTop+7):12;
  root.style.setProperty('--hud-folder-bottom',bottom+'px');
 }
 document.addEventListener('keydown',e=>{
  if(e.code!=='KeyI'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,textarea,select,[contenteditable]')||document.querySelector('dialog[open]')||mode==='photo')return;
  e.preventDefault();e.stopImmediatePropagation();setQuiet(!quiet);
 },true);
 update(mode);
 return{update,get stats(){return{quiet,routes:preferences.routes,actions:preferences.actions}}};
}
