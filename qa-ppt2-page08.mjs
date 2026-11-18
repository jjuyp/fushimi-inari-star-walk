import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const baseline=process.argv.includes('--baseline'),offline=process.argv.includes('--offline');
const out='output/ppt-revision-2/page08'+(baseline?'/baseline':offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,baseline,errors:[],external:[]};
try{
 const p=await browser.newPage({viewport:{width:1366,height:864}});
 p.on('pageerror',e=>report.errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.external.push(r.url());});
 await p.goto(offline||baseline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4197');
 await p.waitForFunction(()=>inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.setRenderQuality('clear');inari.goPlace('torii');});
 await p.waitForFunction(()=>!inari.state.travelLoading);
 const start=await p.evaluate(()=>{const {world,player}=inari,r=world.toriiCorridor.nearest(player.position.x,player.position.z),yaw=Math.atan2(-r.s.dx,-r.s.dz);
  inari.setView(yaw,.06,5.5);return {at:r.at,id:r.s.lane,yaw,start:player.position.toArray()};});
 await p.waitForTimeout(500);
 const shot=async name=>{if(!offline)await p.screenshot({path:out+'/'+name+'.png'});};
 await shot('torii-entry');
 await p.evaluate(()=>{
  const samples=[];window.corridorTrace=samples;
  function log(t){
   if(window.corridorTrace!==samples)return;
   const {camera,world,state,player}=inari,a=camera.position;
   samples.push({t,v:a.toArray(),star:player.position.toArray(),scale:state.avatarScreenScale,lane:state.cameraLane,elevation:state.lookElevation,clear:!world.physics.near(a.x,a.z).some(b=>world.physics.penetration(b,a.x,a.y-.19,a.z,.18,.36))});requestAnimationFrame(log);
  }
  requestAnimationFrame(log);
 });
 await p.mouse.move(940,430);await p.mouse.down();await p.keyboard.down('KeyW');await p.waitForTimeout(950);
 await p.mouse.move(825,365,{steps:16});await p.waitForTimeout(370);
 await p.mouse.move(1000,415,{steps:20});await p.waitForTimeout(370);
 await p.mouse.move(940,430,{steps:12});await p.waitForTimeout(700);
 await p.keyboard.up('KeyW');await p.mouse.up();
 await p.waitForTimeout(350);await shot('torii-walk');
 await p.mouse.move(950,510);await p.mouse.down();await p.mouse.move(950,245,{steps:17});await p.mouse.up();await p.waitForTimeout(350);
 await shot('torii-up');
 await p.mouse.move(1030,490);await p.mouse.down();await p.mouse.move(625,503,{steps:28});await p.waitForTimeout(450);
 await p.mouse.move(905,503,{steps:24});await p.mouse.up();await p.waitForTimeout(350);
 const samples=await p.evaluate(()=>{const r=window.corridorTrace;window.corridorTrace=null;return r;});
 const step=(a,b)=>Math.hypot(...a.v.map((n,i)=>n-b.v[i]));
 const changes=samples.slice(1).map((b,i)=>({d:step(samples[i],b),dt:b.t-samples[i].t,lane:b.lane}));
 report.corridor={...start,frames:samples.length,maxStep:Math.max(...changes.map(c=>c.d)),largeSteps:changes.filter(c=>c.d>.7&&c.dt<115).length,obstructed:samples.filter(s=>!s.clear).length,laneChanges:changes.filter((c,i)=>c.lane!==samples[i].lane).length,minScale:Math.min(...samples.map(s=>s.scale)),maxUp:Math.max(...samples.map(s=>s.elevation)),distance:Math.hypot(...samples.at(-1).star.map((v,i)=>v-samples[0].star[i]))};
 if(!baseline){
  assert.equal(report.corridor.obstructed,0);
  assert.ok(report.corridor.largeSteps<=3);
  assert.ok(report.corridor.maxUp>27);
  assert.ok(report.corridor.distance>4);
 }
 if(!baseline){
  await p.keyboard.press('KeyM');
  await p.locator('[data-map-area=mountain]').click();await p.mouse.move(1238,520);await p.waitForTimeout(270);
  const markers=p.locator('[data-map-shrine]');assert.equal(await markers.count(),9);
  assert.equal(await p.locator('[data-shrine-stop]').count(),9);
  await shot('shrine-map');
  await p.locator('[data-map-shrine=snow]').focus();
  await p.keyboard.press('Enter');
  await p.waitForFunction(()=>!inari.state.travelLoading&&inari.pilgrimage.stats.near==='shrine-snow');
  report.map={pins:9,teleport:'shrine-snow'};
  await p.evaluate(()=>inari.goPlace('entrance'));
  await p.waitForFunction(()=>!inari.state.travelLoading);
  const closest=await p.evaluate(()=>{
   const {world,foxes}=inari;
   for(const a of foxes.agents.slice().sort((a,b)=>Math.abs(a.x+81)-Math.abs(b.x+81))){
    if(a.x< -92||a.x> -57||Math.abs(a.z)>5)continue;
    for(const [dx,dz] of [[0,1.2],[0,-1.2],[-1.2,0],[1.2,0]]){
     if(!inari.teleport(a.x+dx,a.z+dz))continue;
     inari.setView(-1.55,.055,6.6);return a.id;
    }
   }
  });
  assert.ok(Number.isFinite(closest));
  const follow=p.locator('[data-fox-action=follow]');
  await follow.click();await p.waitForFunction(()=>!!inari.foxes.companion);
  const companion=()=>p.evaluate(()=>{const a=inari.foxes.companion,p=inari.player.position;return{id:a?.id,fox:a?[a.x,a.y,a.z]:null,star:p.toArray(),gap:a?Math.hypot(a.x-p.x,a.z-p.z):null,ground:a?inari.world.walkHeight(a.x,a.z):null};});
  const first=await companion();
  await p.keyboard.down('KeyW');await p.waitForTimeout(3300);await p.keyboard.up('KeyW');await p.waitForTimeout(700);
  const after=await companion();
  await shot('fox-following');
  assert.ok(Math.hypot(after.fox[0]-first.fox[0],after.fox[2]-first.fox[2])>5);
  assert.ok(after.gap<4.4);assert.ok(Math.abs(after.fox[1]-after.ground)<.03);
  await p.evaluate(()=>inari.goPlace('torii'));
  await p.waitForFunction(()=>!inari.state.travelLoading&&Math.hypot(inari.foxes.companion.x-inari.player.position.x,inari.foxes.companion.z-inari.player.position.z)<4);
  const travel=await companion();
  assert.equal(travel.id,first.id);
  await p.waitForTimeout(540);await shot('fox-torii');
  await p.keyboard.press('KeyO');await p.waitForFunction(()=>!inari.foxes.companion);
  report.fox={first,after,travel,released:true};
  await p.setViewportSize({width:390,height:844});
  await p.keyboard.press('KeyM');await p.mouse.move(380,840);await p.waitForTimeout(280);await shot('shrine-map-mobile');
  await p.locator('[data-shrine-stop=study]').click();
  await p.waitForFunction(()=>!inari.state.travelLoading&&inari.pilgrimage.stats.near==='shrine-study');
  report.map.mobileTeleport='shrine-study';
  await p.evaluate(()=>{inari.goPlace('torii');const r=inari.world.toriiCorridor.nearest(inari.player.position.x,inari.player.position.z);inari.setView(Math.atan2(-r.s.dx,-r.s.dz),.06,5.2);});
  await p.waitForFunction(()=>!inari.state.travelLoading);await p.waitForTimeout(400);
  const client=await p.context().newCDPSession(p);
  await client.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  const beforeTouch=await p.evaluate(()=>inari.state.lookElevation);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:228,y:421}]});
  for(const [x,y] of [[224,392],[218,359],[214,331],[209,294],[205,259],[201,234]])await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForTimeout(430);await shot('torii-touch');
  const afterTouch=await p.evaluate(()=>inari.state.lookElevation);
  assert.ok(afterTouch-beforeTouch>21);
  report.touch={beforeTouch,afterTouch};

 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
}finally{await browser.close();writeFileSync(out+'/qa.json',JSON.stringify(report,null,2)+'\n');}
