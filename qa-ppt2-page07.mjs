import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const placementOnly=process.argv.includes('--placement'),views=process.argv.includes('--views');
const offline=process.argv.includes('--offline'),out='output/ppt-revision-2/page07'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,errors:[],external:[],awards:[]};
try{
 const p=await browser.newPage({viewport:{width:1520,height:1080},reducedMotion:'reduce'});
 p.on('pageerror',e=>report.errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.external.push(r.url());});
 await p.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4197');
 const ready=()=>p.waitForFunction(()=>inari?.state.ready,null,{timeout:120000});
 await ready();
 await p.evaluate(()=>inari.setRenderQuality('clear'));
 report.placement=await p.evaluate(()=>{
  const {pilgrimage,world}=inari;
  const list=pilgrimage.sideShrines.shrines.map(s=>{
   const retail=Math.min(...world.district.storefronts.map(front=>{
    const dx=s.x-front.x,dz=s.z-front.z,a=Math.sin(front.angle),b=Math.cos(front.angle),u=Math.abs(dx*b-dz*a),v=dx*a+dz*b;
    return Math.hypot(Math.max(0,u-front.width/2-1.45),Math.max(-1.2-v,v-7,0));
   }));
   const approach=s.approach;
   const player=inari.player.position.clone().set(approach.at(-1).x,approach.at(-1).y,approach.at(-1).z);
   let hits=0;
   for(const step of approach.slice().reverse())hits+=world.physics.move(player,step.x-player.x,step.z-player.z,world.walkHeight);
   return {id:s.key,x:s.x,z:s.z,retail,hits,residual:Math.hypot(player.x-approach[0].x,player.z-approach[0].z),standClear:!world.physics.collides(s.stand.x,s.stand.y,s.stand.z)};
  });
  return {...pilgrimage.stats.sideShrines,list};
 });
 if(views){
  for(const id of ['harvest','snow','foxguard']){
   await p.evaluate(id=>inari.pilgrimage.travel('shrine-'+id),id);
   await p.waitForFunction(id=>!inari.state.travelLoading&&inari.pilgrimage.stats.near==='shrine-'+id,id);
   await p.waitForTimeout(350);await p.screenshot({path:out+'/shrine-'+id+'.png'});
  }
  await p.evaluate(()=>inari.goPlace('keihan'));
  await p.waitForFunction(()=>!inari.state.travelLoading);
  await p.waitForTimeout(400);await p.screenshot({path:out+'/shop-street.png'});
 }
 if(!placementOnly&&!views){
  assert.equal(report.placement.count,9);assert.equal(report.placement.tubes,3);assert.deepEqual(report.placement.missing,[]);
  assert.ok(report.placement.list.every(s=>s.retail>3.15&&s.hits===0&&s.residual<.09&&s.standClear));
  assert.ok(report.placement.list.find(s=>s.id==='wealth').x>-73);
  const photo=async name=>{if(!offline)await p.screenshot({path:out+'/'+name+'.png'});};
  const openBook=async()=>{await p.keyboard.press('KeyJ');await p.getByRole('button',{name:'御朱印帳',exact:true}).click();};
  await openBook();await p.locator('.goshuin-empty').first().waitFor();assert.equal(await p.locator('.goshuin-empty').count(),9);
  async function fromBook(id){
   await p.locator('[data-goshuin="'+id+'"]').click();
   await p.waitForFunction(id=>!inari.state.travelLoading&&inari.pilgrimage.stats.near==='shrine-'+id,id);
  }
  async function startPrayer(){
   await p.keyboard.press('KeyE');
   await p.getByRole('button',{name:'在此參拜',exact:true}).click();
   await p.waitForFunction(()=>inari.pilgrimage.stats.active==='sidepray');
  }
  await fromBook('wealth');await photo('wealth-relocated');await startPrayer();await p.keyboard.press('Escape');
  await p.waitForFunction(()=>!inari.pilgrimage.busy);assert.equal(await p.evaluate(()=>inari.pilgrimage.saved.goshuin.wealth),undefined);
  await openBook();
  for(const {id} of report.placement.list){
   await fromBook(id);if(['harvest','snow','foxguard'].includes(id))await photo('shrine-'+id);
   await startPrayer();
   await p.locator('.goshuin-feature img').waitFor({timeout:26000});
   await p.locator('.goshuin-feature img').evaluate(img=>img.decode());
   report.awards.push(await p.evaluate(id=>({id,date:inari.pilgrimage.saved.goshuin[id],claps:inari.ritual.stats.claps.length}),id));
   if(id==='harvest')await photo('first-award');
   await p.getByRole('button',{name:'回御朱印帳'}).click();
  }
  assert.ok(report.awards.every(s=>s.claps===2&&/^\d{4}-\d\d-\d\d$/.test(s.date)));
  await p.locator('.goshuin-entry img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  assert.equal(await p.locator('.goshuin-empty').count(),0);
  await photo('full-album');
  await p.setViewportSize({width:390,height:844});await photo('mobile-album');
  await p.locator('[data-goshuin=bonds]').click();
  await p.locator('.goshuin-feature img').evaluate(img=>img.decode());
  await photo('mobile-detail');
  await p.reload();await ready();await openBook();
  assert.equal(await p.locator('.goshuin-entry img').count(),9);
  assert.equal(await p.evaluate(()=>Object.keys(inari.pilgrimage.saved.goshuin).length),9);
  report.persistent=true;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
}finally{
 await browser.close();writeFileSync(out+(placementOnly?'/placement.json':views?'/views.json':'/qa.json'),JSON.stringify(report,null,2)+'\n');
}
