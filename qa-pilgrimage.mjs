import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('output/v3.2',{recursive:true});
const checks=[],errors=[],url=process.argv[2]||'http://127.0.0.1:4186';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--force_high_performance_gpu']});
const ok=(v,s)=>{if(!v)throw Error(s);checks.push(s);console.log('PASS',s)};
try{
 const p=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(url);await p.waitForFunction(()=>inari.state.ready,null,{timeout:120000});
 ok(await p.evaluate(()=>inari.state.revision==='3.4.1'),'V3.4.1 ready');
 await p.locator('#journey').click();ok(await p.locator('#journeyDialog').isVisible(),'journal opens');
 for(const id of ['wash','shop','charms','fortune','tie','stone','kagura','waterfall','art','art2','art3']){
  await p.evaluate(id=>inari.pilgrimage.travel(id),id);await p.waitForFunction(()=>!inari.state.travelLoading);
  const r=await p.evaluate(id=>{const s=inari.pilgrimage.sites.find(x=>x.id===id),a=inari.player.position;return {d:Math.hypot(a.x-s.x,a.z-s.z),range:s.range,collision:inari.world.physics.collides(a.x,a.y,a.z)}},id);
  ok(!r.collision&&r.d<=r.range+1,id+' has reachable safe arrival');
 }
 await p.evaluate(()=>inari.pilgrimage.travel('shop'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('shop'));
 for(const id of ['sushi','senbei','matcha','mask'])await p.locator('[data-buy="'+id+'"]').click();
 ok(await p.evaluate(()=>['sushi','senbei','matcha','mask'].every(id=>inari.state.pilgrimage.bag[id]===1)),'all food and fox mask purchases recorded');
 await p.screenshot({path:'output/v3.2/shop.png'});await p.locator('#journeyClose').click();
 await p.evaluate(()=>inari.pilgrimage.travel('charms'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('charms'));await p.locator('[data-buy="purple"]').click();
 ok(await p.evaluate(()=>inari.state.pilgrimage.equipped==='purple'),'amulet can be acquired and equipped');await p.screenshot({path:'output/v3.2/charms.png'});
 await p.locator('#journeyClose').click();await p.evaluate(()=>inari.pilgrimage.inventory());await p.getByRole('button',{name:'享用',exact:true}).first().click();await p.waitForFunction(()=>!inari.pilgrimage.busy,null,{timeout:10000});ok(await p.evaluate(()=>inari.state.pilgrimage.bag.sushi===0),'food is consumed and removed from bag');
 await p.evaluate(()=>inari.pilgrimage.travel('wash'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('wash'));await p.getByRole('button',{name:'開始淨手',exact:true}).click();await p.waitForFunction(()=>inari.state.pilgrimage.washed,null,{timeout:15000});ok(true,'four-step hand washing completed');
 await p.evaluate(()=>inari.pilgrimage.travel('fortune'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('fortune'));await p.getByRole('button',{name:'搖筒抽籤 · 100 円',exact:true}).click();await p.locator('.fortune-paper').waitFor({timeout:10000});ok(await p.locator('.fortune-paper dl div').count()===8,'fortune has poem explanation and eight detailed categories');await p.screenshot({path:'output/v3.2/fortune.png'});
 await p.getByRole('button',{name:'到結籤所',exact:true}).click();await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('tie'));await p.getByRole('button',{name:'結籤・放下心事',exact:true}).click();await p.waitForFunction(()=>!inari.pilgrimage.busy,null,{timeout:10000});ok(await p.evaluate(()=>inari.state.pilgrimage.tied===1&&inari.state.pilgrimage.fortune===null),'fortune tied at designated rope');
 await p.evaluate(()=>inari.pilgrimage.travel('stone'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('stone'));await p.locator('#stoneWish').fill('願家人平安');await p.getByRole('button',{name:'許願・舉起重輕石',exact:true}).click();await p.locator('.stone-answer').waitFor({timeout:12000});ok(true,'wish stone gives light or heavy result');await p.locator('#journeyClose').click();
 await p.evaluate(()=>inari.pilgrimage.travel('waterfall'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('waterfall'));await p.getByRole('button',{name:'開始 15 秒靜心修行',exact:true}).click();await p.waitForFunction(()=>!inari.pilgrimage.busy,null,{timeout:22000});ok(await p.evaluate(()=>inari.state.pilgrimage.seen.includes('waterfall')),'virtual waterfall meditation completed');
 await p.evaluate(()=>inari.pilgrimage.travel('kagura'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('kagura'));await p.getByRole('button',{name:'奉納御神樂 · 300 円',exact:true}).click();await p.waitForTimeout(3000);await p.screenshot({path:'output/v3.2/kagura.png'});await p.waitForFunction(()=>!inari.pilgrimage.busy,null,{timeout:30000});ok(await p.evaluate(()=>inari.state.pilgrimage.prayers>=1&&!inari.pilgrimage.stats.mikoError),'kagura dance model loads and offering completes');
 await p.evaluate(()=>{inari.setTime('night');inari.goPlace('yotsu');inari.setView(Math.PI/2-.18,.08,6)});await p.waitForFunction(()=>!inari.state.travelLoading);await p.waitForTimeout(2000);await p.screenshot({path:'output/v3.2/night.png'});ok(await p.evaluate(()=>inari.state.night&&inari.lighting.sun.intensity<.2),'night mode and city illumination enabled');
 await p.evaluate(()=>inari.setTime('day'));ok(await p.evaluate(()=>!inari.state.night&&inari.lighting.sky.visible),'daylight restores');
 await p.setViewportSize({width:390,height:844});await p.locator('#journey').click();await p.screenshot({path:'output/v3.2/mobile-journal.png'});ok(await p.evaluate(()=>document.querySelector('#journeyDialog').getBoundingClientRect().right<=390),'mobile journal fits viewport');await p.locator('#journeyClose').click();
 await p.reload();await p.waitForFunction(()=>inari.state.ready,null,{timeout:120000});ok(await p.evaluate(()=>inari.state.pilgrimage.tied===1&&inari.state.pilgrimage.bag.purple===1),'progress persists after reload');
 ok(!errors.length,'no JavaScript or WebGL errors');
}finally{writeFileSync('output/v3.2/qa.json',JSON.stringify({url,checks,errors,scope:'Chrome on Windows; simulated mobile, not physical iPad'},null,2));await browser.close();}
