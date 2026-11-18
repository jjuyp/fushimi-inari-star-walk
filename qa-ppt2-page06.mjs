import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const baseline=process.argv.includes('--baseline'),offline=process.argv.includes('--offline');
const out='output/ppt-revision-2/page06'+(baseline?'/baseline':offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,errors:[],external:[]};
try{
 const p=await browser.newPage({viewport:{width:1480,height:860},reducedMotion:'reduce'});
 p.on('pageerror',e=>report.errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.external.push(r.url());});
 const url=offline||baseline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4197';
 await p.goto(url);
 await p.waitForFunction(()=>inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.setRenderQuality('clear');inari.goPlace('yotsu');inari.setTime('night');});
 await p.waitForFunction(()=>!inari.state.travelLoading);
 report.junction=await p.evaluate(()=>{
  const {world}=inari,{x,z}=world.places.yotsu,old=world.physics.bodies.filter(b=>b.name==='yotsu directions');
  const aimX=x+1,aimZ=z+4,near=world.surface.nearPath(aimX,aimZ);
  const y=world.walkHeight(near.x,near.z),segment=near.s;
  const starts=[],norm=Math.hypot(segment.dx,segment.dz),dx=segment.dx/norm,dz=segment.dz/norm;
  const traversals=[];
  for(const dir of [-1,1]){
   const x=near.x-2.5*dir*dx,z=near.z-2.5*dir*dz,start=inari.player.position.clone().set(x,world.walkHeight(x,z),z);
   let collisions=0;
   for(let i=0;i<50;i++)collisions+=world.physics.move(start,dx*.1*dir,dz*.1*dir,world.walkHeight);
   traversals.push({dir,collisions,residual:Math.hypot(start.x-near.x-2.5*dir*dx,start.z-near.z-2.5*dir*dz)});
  }
  for(const side of [-1,1]){
   for(const d of [1.8,2.4,3.1,3.8,4.5,5.5]){
    const x=near.x+segment.dx*d*side,z=near.z+segment.dz*d*side,v=world.walkHeight(x,z);
    if(Number.isFinite(v)&&!world.physics.collides(x,v,z)){starts.push({x,z,yaw:Math.atan2(x-aimX,z-aimZ)});break;}
   }
  }
  return {poi:[x,z],oldPosts:old.length,near:[near.x,y,near.z],traversals,clear:!world.physics.collides(near.x,y,near.z),starts,tea:world.district?.tea,building:world.buildings.find(b=>b.id==='yotsu-tea')};
 });
 const view=async ({x,z,yaw},name,pitch=.03,depth=4.4)=>{
  assert.ok(await p.evaluate(({x,z,yaw,pitch,depth})=>{if(!inari.teleport(x,z))return false;inari.setView(yaw,pitch,depth);inari.player.rotation.y=yaw+Math.PI;return true;},{x,z,yaw,pitch,depth}));
  await p.waitForTimeout(700);
  if(!offline)await p.screenshot({path:out+'/'+name+'.png'});
 };
 await view(report.junction.starts[1],'junction-night',.025,4.4);
 if(!baseline){
  assert.equal(report.junction.oldPosts,0);
  assert.ok(report.junction.clear);
  assert.ok(report.junction.traversals.every(v=>v.collisions===0&&v.residual<.05));
  await view(report.junction.starts[0],'junction-reverse');
  await p.locator('#teaBreak').click();
  await p.getByRole('button',{name:'到茶屋前廊'}).click();
  await p.waitForFunction(()=>!inari.state.travelLoading);
  const facade=await p.evaluate(()=>{
   const {x,z}=inari.world.buildings.find(b=>b.id==='yotsu-tea');
   for(const d of [10,9,8,7,6.6,5.7])for(const dz of [0,.8,-.8,1.6,-1.6]){
    const px=x-d,pz=z+dz,y=inari.world.walkHeight(px,pz);
    if(Number.isFinite(y)&&!inari.world.physics.collides(px,y,pz))return{x:px,z:pz,yaw:Math.atan2(px-x,pz-z)};
   }
  });
  await view(facade,'tea-facade-night',-.18,5.8);
  await p.evaluate(()=>inari.setTime('day'));
  await view(facade,'tea-facade-day',-.18,5.8);
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
}finally{await browser.close();writeFileSync(out+'/qa.json',JSON.stringify(report,null,2)+'\n');}
