import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const offline=process.argv.includes('--offline'),out='output/ppt-revision/page12'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const errors=[],external=[],proof={};
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror',e=>errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url());});
 await p.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186');
 const ready=()=>p.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});await ready();
 await p.evaluate(()=>inari.setRenderQuality('clear'));
 proof.counts=await p.evaluate(()=>inari.pilgrimage.stats.sideShrines);assert.equal(proof.counts.count,6);assert.equal(proof.counts.tubes,3);assert.deepEqual(proof.counts.missing,[]);assert.ok(proof.counts.ema);
 const walk=await p.evaluate(()=>inari.pilgrimage.sideShrines.shrines.map(site=>{const points=site.approach.slice().reverse(),a={...points[0]};for(const pt of points.slice(1))inari.world.physics.move(a,pt.x-a.x,pt.z-a.z,inari.world.walkHeight);return {id:site.key,clear:Math.hypot(a.x-site.approach[0].x,a.z-site.approach[0].z)<.1};}));proof.walk=walk;assert.ok(walk.every(x=>x.clear));
 async function reach(id){await p.evaluate(id=>inari.pilgrimage.travel(id),id);await p.waitForFunction(()=>!inari.state.travelLoading);}
 async function menu(id){await p.evaluate(id=>inari.pilgrimage.perform(id),id);}
 async function interact(id){await p.waitForFunction(id=>inari.pilgrimage.stats.near===id,id);await p.keyboard.press('KeyE');await p.locator('#journeyDialog[open]').waitFor();}
 await p.evaluate(()=>inari.pilgrimage.journal());await p.getByRole('button',{name:'繪馬與六座小社',exact:true}).click();assert.equal(await p.locator('[data-side-travel]').count(),6);await p.screenshot({path:out+'/directory.png'});await p.keyboard.press('Escape');
 for(const id of ['wealth','bonds','health','sun','study','path']){
  await reach('shrine-'+id);await p.waitForTimeout(400);await p.screenshot({path:out+'/shrine-'+id+'.png'});await interact('shrine-'+id);await p.getByRole('button',{name:'在此參拜',exact:true}).click();
  await p.waitForFunction(()=>inari.avatar.acting.stats.phase==='bow-1'&&inari.avatar.acting.stats.bowDegrees>43);
  if(id==='wealth')await p.screenshot({path:out+'/side-bow.png'});
  await p.waitForFunction(id=>inari.pilgrimage.saved.sidePrayers[id]===1,id);
 }
 for(const [id,label] of [['wealth','財運籤'],['bonds','良緣籤'],['health','健康籤']]){
  await reach('theme-'+id);await interact('theme-'+id);await p.getByRole('button',{name:'搖筒抽'+label+' · 100 円',exact:true}).click();
  const card=p.locator('[data-themed-fortune="'+id+'"]');await card.waitFor();assert.equal(await card.locator('.fortune-poem span').count(),4);await p.screenshot({path:out+'/slip-'+id+'.png'});await p.getByRole('button',{name:'收好籤紙',exact:true}).click();
 }
 await reach('ema');await p.waitForTimeout(400);await p.screenshot({path:out+'/ema-overview.png'});await interact('ema');await p.locator('[data-ema-style="bond"]').click();await p.locator('#emaWish').fill('願一起走過春天');await p.screenshot({path:out+'/ema-write.png'});await p.getByRole('button',{name:'掛上繪馬',exact:true}).click();await p.waitForTimeout(600);await p.screenshot({path:out+'/ema-rack.png'});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);await p.screenshot({path:out+'/ema-rack-mobile.png'});await p.setViewportSize({width:1440,height:1000});
 assert.equal(await p.evaluate(()=>inari.pilgrimage.ema.userBoards.children.length),1);
 await p.reload();await ready();proof.saved=await p.evaluate(()=>({ema:inari.pilgrimage.saved.ema,visible:inari.pilgrimage.ema.userBoards.children.length,prayers:inari.pilgrimage.saved.sidePrayers,themed:Object.keys(inari.pilgrimage.saved.sideFortunes)}));assert.deepEqual(proof.saved.ema,[{style:'bond',wish:'願一起走過春天'}]);assert.equal(proof.saved.visible,1);assert.equal(Object.keys(proof.saved.prayers).length,6);assert.equal(proof.saved.themed.length,3);
 await p.setViewportSize({width:390,height:844});await reach('ema');await menu('ema');await p.screenshot({path:out+'/ema-mobile.png'});await p.keyboard.press('Escape');await p.setViewportSize({width:1440,height:1000});
 proof.lights=[];for(const id of ['art','art2','art3']){
  await reach(id);await p.evaluate(()=>inari.setTime('day'));await menu(id);await p.getByRole('button',{name:'看看夜間燈光',exact:true}).click();await p.waitForTimeout(700);await p.screenshot({path:out+'/night-'+id+'.png'});
  proof.lights.push(await p.evaluate(id=>{const s=inari.pilgrimage.sites.find(s=>s.id===id);return {night:s.artLamp.visible,intensity:s.artLamp.intensity,emissive:s.glowMaterials.every(m=>m.emissiveIntensity>1)};},id));
 }
 assert.ok(proof.lights.every(a=>a.night&&a.emissive&&a.intensity>0));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
}finally{writeFileSync(out+'/qa.json',JSON.stringify({proof,errors,external},null,2));await browser.close();}
