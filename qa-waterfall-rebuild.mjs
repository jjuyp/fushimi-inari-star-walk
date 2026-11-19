import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const out='output/waterfall-rebuild',url=process.argv.find(a=>a.startsWith('http'))||pathToFileURL(resolve('伏見稻荷・星旅.html')).href;
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const data={url,errors:[],external:[]};
try{
 const p=await browser.newPage({viewport:{width:1450,height:940},hasTouch:true});
 p.on('pageerror',e=>data.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')data.errors.push(m.text());});
 if(url.startsWith('file:'))p.on('request',r=>{if(!/^(file:|blob:|data:)/.test(r.url()))data.external.push(r.url());});
 await p.goto(url);
 await p.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.setRenderQuality('clear');inari.setSeason('autumn');});
 await p.keyboard.press('Digit8');
 await p.waitForFunction(()=>!inari.state.travelLoading&&inari.state.mode==='walk');
 await p.waitForFunction(()=>inari.pilgrimage.stats.waterfall.detailTexture===true);
 await p.waitForTimeout(2750);
 await p.keyboard.press('KeyI');
 await p.screenshot({path:out+'/entrance.png'});
 await p.keyboard.press('KeyI');
 data.survey=await p.evaluate(()=>{
  const {world,pilgrimage}=inari,f=pilgrimage.sites.find(s=>s.id==='waterfall'),r=f.route;
  const route=[[r.x,8.87],[r.x,8.32],[r.x,7.53],[r.x,6.38],[r.x,5.18],[-2.7,5.10],[-1.65,5.46],[-.32,5.72]];
  function audit(points){
   const target=(u,w)=>{const p=f.position(u,0,w);p.y=world.walkHeight(p.x,p.z);return p;};
   const targets=points.map(a=>target(...a)),a=targets[0].clone(),failed=[];
   let maxRise=0,contacts=0;
   for(const [i,b]of targets.entries()){
    const start=a.clone(),length=start.distanceTo(b),n=Math.ceil(length/.095);
    for(let j=1;j<=n;j++){
     const x=start.x+(b.x-start.x)*j/n,z=start.z+(b.z-start.z)*j/n,prev=a.y;
     contacts+=world.physics.move(a,x-a.x,z-a.z,world.walkHeight);maxRise=Math.max(maxRise,Math.abs(a.y-prev));
     if(Math.hypot(a.x-x,a.z-z)>.115)failed.push([i,j,x,z,a.x,a.z]);
    }
   }
   return {contacts,maxRise,failed,points:targets.map(p=>p.toArray())};
  }
  const pool=f.position(1.9,0,1.7);
  return {route:audit(route),reverse:audit(route.slice().reverse()),landing:audit([[-5.0,8.11],[-5.13,7.54],[-5.47,7.05],[-5.61,6.62],[-5.61,6.1]]),deck:audit([[-.32,5.72],[1.79,5.72],[2.65,5.40],[4.18,5.17],[5.01,4.66],[5.01,4.22],[5.01,3.7]]),routeAnchor:r,poolBlocked:world.physics.collides(pool.x,world.walkHeight(pool.x,pool.z),pool.z),overflow:f.overflow,alt:inari.state.position,stats:pilgrimage.stats.waterfall};
 });
 if(!process.argv.includes('--visual')){
  assert.equal(data.survey.route.failed.length,0);assert.equal(data.survey.reverse.failed.length,0);
  assert.equal(data.survey.deck.failed.length,0);assert.equal(data.survey.landing.failed.length,0);assert.ok(data.survey.poolBlocked);
  assert.ok(data.survey.overflow.every((p,i,list)=>!i||p[1]<list[i-1][1]));
  const start=await p.evaluate(()=>inari.player.position.toArray());
  await p.keyboard.down('KeyW');await p.waitForTimeout(820);await p.keyboard.up('KeyW');
  const forward=await p.evaluate(()=>inari.player.position.toArray());
  data.keyboard={distance:Math.hypot(forward[0]-start[0],forward[2]-start[2]),ascent:forward[1]-start[1]};
  assert.ok(data.keyboard.distance>1.65&&data.keyboard.ascent>.18);
  await p.evaluate(()=>{
   const f=inari.pilgrimage.sites.find(s=>s.id==='waterfall'),p=f.position(-5.61,0,6.1);
   if(!inari.teleport(p.x,p.z))throw Error('Gate landing is blocked');
   inari.pilgrimage.stats.focus=f;
  });
  await p.keyboard.press('KeyI');await p.waitForTimeout(280);await p.screenshot({path:out+'/gate-landing.png'});await p.keyboard.press('KeyI');
  await p.evaluate(()=>{inari.pilgrimage.stats.focus=null;});
  await p.evaluate(()=>{const y=inari.pilgrimage.sites.find(s=>s.id==='waterfall').interaction;inari.teleport(y.x,y.z);});
  await p.waitForFunction(()=>inari.pilgrimage.stats.near==='waterfall');
  await p.keyboard.press('KeyE');
  await p.getByRole('button',{name:'開始 15 秒靜心修行',exact:true}).click();
  await p.waitForFunction(()=>inari.pilgrimage.stats.meditation.seated);
  await p.keyboard.press('KeyI');await p.waitForTimeout(240);await p.screenshot({path:out+'/meditation.png'});await p.keyboard.press('KeyI');
  data.seat=await p.evaluate(()=>({ ...inari.pilgrimage.stats.meditation,audio:{...inari.pilgrimage.stats.waterfallAudio} }));
  assert.ok(Math.abs(data.seat.contactGap)<.008);assert.ok(data.seat.audio.targetGain>.025);
  await p.keyboard.press('Escape');
  await p.waitForFunction(()=>!inari.pilgrimage.busy);
  await p.evaluate(()=>{
   const f=inari.pilgrimage.sites.find(s=>s.id==='waterfall');
   window.waterfallFrameBeforeProof=f.waterfallView.frame;
   f.waterfallView.frame=()=>({look:f.position(4.80,1.23,3.75),eye:f.position(4.40,2.52,7.85)});
   inari.pilgrimage.stats.focus=f;
  });
  await p.keyboard.press('KeyI');await p.waitForTimeout(720);await p.screenshot({path:out+'/basin-and-deck.png'});await p.keyboard.press('KeyI');
  await p.evaluate(()=>{
   const f=inari.pilgrimage.sites.find(s=>s.id==='waterfall');
   f.waterfallView.frame=window.waterfallFrameBeforeProof;
   delete window.waterfallFrameBeforeProof;
   inari.setTime('night');inari.pilgrimage.travel('waterfall');
  });
  await p.waitForFunction(()=>!inari.state.travelLoading);await p.waitForTimeout(960);
  await p.keyboard.press('KeyI');await p.screenshot({path:out+'/night.png'});await p.keyboard.press('KeyI');
  await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>{inari.setTime('day');inari.pilgrimage.travel('waterfall');});
  await p.waitForFunction(()=>!inari.state.travelLoading);await p.waitForTimeout(2880);await p.keyboard.press('KeyI');
  await p.screenshot({path:out+'/mobile.png'});
  await p.evaluate(()=>inari.goPlace('entrance'));
  await p.waitForFunction(()=>!inari.state.travelLoading);
  const updates=await p.evaluate(()=>inari.pilgrimage.stats.waterfall.updates);
  await p.waitForTimeout(380);
  assert.equal(await p.evaluate(()=>inari.pilgrimage.stats.waterfall.updates),updates);
  assert.deepEqual(data.errors,[]);assert.deepEqual(data.external,[]);
 }
}finally{writeFileSync(out+'/qa.json',JSON.stringify(data,null,2));await browser.close();}
