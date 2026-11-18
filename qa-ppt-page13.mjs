import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const offline=process.argv.includes('--offline'),out='output/ppt-revision/page13'+(offline?'/offline':'');
const url=offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,routes:[],traces:[],pageErrors:[],remote:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>report.pageErrors.push(e.message));
 if(offline)page.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.remote.push(r.url());});
 await page.goto(url);
 await page.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await page.evaluate(()=>{inari.setRenderQuality('smooth');inari.setSeason('summer');inari.setMode('walk');});
 report.trees=await page.evaluate(()=>({
  removed:inari.world.trees.removed.length,
  precinct:inari.world.trees.removed.filter(t=>typeof t.lane==='number'),
  remaining:inari.world.trees.count
 }));
 if(!offline)report.routes=await page.evaluate(async()=>{
  const {MAP}=await import('/geography.js'),world=inari.world;
  const paths=[...MAP.paths.filter(p=>[260121328,377968455,260121354].includes(p.id)),...MAP.routes];
  return paths.flatMap(path=>[false,true].map(reverse=>{
   const seq=reverse?[...path.p].reverse():path.p,start=seq[0];
   const at={x:start[0],y:world.walkHeight(...start),z:start[1]};
   let travelled=0,maxError=0,blocked=null;
   for(let i=1;i<seq.length&&!blocked;i++){
    const a=seq[i-1],b=seq[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/.075);
    for(let j=1;j<=steps;j++){
     const x=a[0]+(b[0]-a[0])*j/steps,z=a[1]+(b[1]-a[1])*j/steps;
     const dx=x-at.x,dz=z-at.z,d=Math.max(1,Math.hypot(dx,dz)/.13);
     world.physics.move(at,dx/d,dz/d,world.walkHeight);
     const e=Math.hypot(x-at.x,z-at.z);maxError=Math.max(maxError,e);
     if(e>.92){blocked={x,z,actual:{...at}};break;}
     travelled+=length/steps;
    }
   }
   return{id:path.id||path.from,reverse,travelled,maxError,blocked};
  }));
 });
 async function trace(name,x,z,angle,{mobile=false,run=false,look=false}={}){
  if(mobile)await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(([x,z,angle])=>{
   if(!inari.teleport(x,z))return false;
   inari.player.rotation.y=angle+Math.PI;
   inari.setView(angle,.13,4.5);return true;
  },[x,z,angle]));
  await page.waitForTimeout(400);
  const inspector=page.evaluate(async()=>{
   const frames=[],{camera,player,world,state}=inari,before=camera.position.clone();
   let lastPos=camera.position.clone(),lastQ=camera.quaternion.clone();
   const until=performance.now()+3850;
   while(performance.now()<until){
    await new Promise(requestAnimationFrame);
    if(camera.position.distanceToSquared(lastPos)<1e-9&&camera.quaternion.angleTo(lastQ)<1e-6)continue;
    const step=camera.position.distanceTo(lastPos),angle=camera.quaternion.angleTo(lastQ)*180/Math.PI;
    const clearance=world.walkHeight(camera.position.x,camera.position.z);
    const solid=world.physics.near(camera.position.x,camera.position.z).some(b=>world.physics.penetration(b,camera.position.x,camera.position.y-.14,camera.position.z,.14,.28));
    frames.push({step,angle,aboveFloor:camera.position.y-clearance,solid,lane:state.cameraLane,pos:[player.position.x,player.position.z],elevation:state.lookElevation});
    lastPos.copy(camera.position);lastQ.copy(camera.quaternion);
   }
   if(!frames.length)return{frames:0};
   return{frames:frames.length,maxStep:Math.max(...frames.map(f=>f.step)),maxTurn:Math.max(...frames.map(f=>f.angle)),minimumAboveFloor:Math.min(...frames.map(f=>f.aboveFloor)),solids:frames.filter(f=>f.solid).length,lanes:[...new Set(frames.map(f=>f.lane))],motion:Math.hypot(...frames.at(-1).pos.map((p,i)=>p-frames[0].pos[i])),endElevation:frames.at(-1).elevation,tracedDistance:before.distanceTo(camera.position)};
  });
  if(look){
   await page.mouse.move(180,421);await page.mouse.down();
   for(let i=1;i<=80;i++){await page.mouse.move(180+i*3,421-i*2);await page.waitForTimeout(25);}
   await page.mouse.up();
  }else if(mobile){
   const session=await page.context().newCDPSession(page),box=await page.locator('#joystick').boundingBox();
   const x=box.x+box.width/2,y=box.y+box.height/2;
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-35}]});
   await page.waitForTimeout(3600);
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
  }else{
   if(run)await page.keyboard.down('Shift');
   await page.keyboard.down('KeyW');await page.waitForTimeout(3750);await page.keyboard.up('KeyW');
   if(run)await page.keyboard.up('Shift');
  }
  const measured=await Promise.race([inspector,new Promise((_,reject)=>setTimeout(()=>reject(Error('Insufficient rendered frames: '+name)),14000))]);
  report.traces.push({name,...measured});
  await page.screenshot({path:out+'/'+name+'.png'});
 }
 await trace('upper-approach',150.6,.29,-2.024);
 await trace('senbon-north',194,37.65,-2.55,{run:true});
 await trace('senbon-south',206.38,38.92,.872);
 await trace('corridor-exit',167.5,8.52,-2.024);
 await trace('portrait-walk',191.1,33.34,-2.55,{mobile:true});
 await trace('portrait-look-up',200,46.58,-2.49,{mobile:true,look:true});
 assert.deepEqual(report.pageErrors,[]);
 assert.deepEqual(report.remote,[]);
 assert.ok(report.trees.precinct.length>0,'Expected at least one canopy removed from the precinct corridor');
 assert.ok(report.traces.every(t=>t.frames>=12&&t.solids===0&&t.minimumAboveFloor>.17),'Camera entered stone, post or ground');
 assert.ok(report.traces.every(t=>t.maxTurn<9),'An abrupt turn remained');
 assert.ok(report.traces.find(t=>t.name==='portrait-look-up').endElevation>12,'Could not look up beneath the beams');
 assert.ok(report.traces.filter(t=>t.name!=='portrait-look-up').every(t=>t.motion>3.0),'Movement stalled');
 assert.ok(report.routes.every(r=>!r.blocked),'At least one route is blocked');
}finally{
 writeFileSync(out+'/qa.json',JSON.stringify(report,null,2));
 await browser.close();
}
