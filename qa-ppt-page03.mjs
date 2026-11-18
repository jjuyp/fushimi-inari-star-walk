import{chromium}from'../tidepool-jelly/node_modules/playwright-core/index.mjs';
import{mkdirSync,writeFileSync}from'node:fs';
const out='output/ppt-revision/page03';mkdirSync(out,{recursive:true});const checks=[],errors=[],data={foods:[],gestures:[]};
function ok(v,s){if(!v)throw Error(s);checks.push(s);console.log('PASS',s)}
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',hasTouch:true});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto('http://127.0.0.1:4186');await p.waitForFunction(()=>inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.goPlace('entrance');inari.player.rotation.y=0;inari.setRenderQuality('clear')});await p.waitForFunction(()=>!inari.state.travelLoading);
 for(const id of ['sushi','senbei','matcha']){
  await p.evaluate(id=>{inari.pilgrimage.saved.bag[id]=2;inari.pilgrimage.inventory()},id);
  const row=p.locator('.bag-row').filter({hasText:id==='sushi'?'稻荷壽司':id==='senbei'?'仙貝':'抹茶'});await row.getByRole('button',{name:id==='matcha'?'喝抹茶':'享用',exact:true}).click();
  ok(await p.evaluate(()=>inari.pilgrimage.busy&&inari.avatar.acting.stats.active==='eat'),'real inventory starts '+id+' animation');
  for(const phase of ['raise',id==='matcha'?'sip':'bite','chew','happy']){
   await p.waitForFunction(phase=>inari.avatar.acting.stats.phase===phase,phase,{timeout:16000});await p.waitForTimeout(phase==='raise'?500:phase==='bite'?600:250);
   const state=await p.evaluate(()=>({...inari.avatar.acting.stats,gear:inari.pilgrimage.saved.equipped,scale:inari.state.avatarScreenScale}));data.foods.push({id,phase,state});await p.screenshot({path:out+'/'+id+'-'+phase+'.png'});
  }
  await p.waitForFunction(()=>!inari.pilgrimage.busy,null,{timeout:15000});ok(await p.evaluate(id=>inari.pilgrimage.saved.bag[id]===1&&inari.avatar.acting.stats.active===null&&inari.avatar.acting.stats.mouthOpen===0&&!inari.pilgrimage.saved.equipped,id),id+' consumes exactly one and restores face and hands');
 }
 for(const[id,key]of [['wave','z'],['jump','Space'],['think','x'],['surprise','f'],['rest','t'],['reward','g']]){
  await p.keyboard.press(key);ok(await p.evaluate(id=>inari.avatar.acting.stats.active===id,id),key+' starts '+id);await p.waitForTimeout(id==='rest'?2400:id==='reward'?2300:id==='jump'?750:1000);data.gestures.push(await p.evaluate(()=>({...inari.avatar.acting.stats})));await p.screenshot({path:out+'/'+id+'.png'});await p.keyboard.press('Escape');ok(await p.evaluate(()=>!inari.avatar.acting.busy&&inari.avatar.acting.stats.mouthOpen===0),id+' cancels cleanly');
 }
 await p.keyboard.press('t');await p.waitForTimeout(2200);await p.keyboard.down('w');await p.waitForTimeout(350);await p.keyboard.up('w');ok(await p.evaluate(()=>!inari.avatar.acting.busy),'walking wakes resting star');
 await p.evaluate(()=>{inari.pilgrimage.saved.bag.matcha=2;inari.pilgrimage.inventory()});await p.locator('.bag-row').filter({hasText:'抹茶'}).getByRole('button',{name:'喝抹茶',exact:true}).click();await p.waitForTimeout(1300);await p.keyboard.press('Escape');ok(await p.evaluate(()=>!inari.pilgrimage.busy&&!inari.avatar.acting.busy&&inari.pilgrimage.saved.bag.matcha===1),'Escape cancels drinking without double consumption');
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{inari.pilgrimage.saved.bag.sushi=1;inari.pilgrimage.inventory()});await p.locator('.bag-row').filter({hasText:'稻荷壽司'}).getByRole('button',{name:'享用',exact:true}).tap();await p.waitForFunction(()=>inari.avatar.acting.stats.phase==='bite',null,{timeout:16000});await p.screenshot({path:out+'/mobile-sushi.png'});ok(await p.evaluate(()=>inari.state.avatarScreenScale===1&&document.documentElement.scrollWidth===innerWidth),'portrait meal retains full character scale without page overflow');await p.keyboard.press('Escape');
 await p.locator('#controlSettings').tap();await p.locator('[data-star-gesture="wave"]').tap();ok(await p.evaluate(()=>inari.avatar.acting.stats.active==='wave'&&!document.querySelector('#controlsDialog[open]')),'mobile control menu starts gesture');await p.keyboard.press('Escape');
 ok(!errors.length,'no JS or WebGL errors');data.gpu=await p.evaluate(()=>inari.state.gpu);
}finally{writeFileSync(out+'/qa.json',JSON.stringify({checks,errors,data,scope:'Page03 live inventory, poses, cancellation, simulated portrait touch; independent art score separately'},null,2));await browser.close()}
