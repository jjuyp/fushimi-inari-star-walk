import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const offline=process.argv.includes('--offline'),out='output/ppt-revision-2/page03'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,errors:[],external:[]};
try{
 const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'});
 p.on('pageerror',e=>report.errors.push(e.stack||e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.external.push(r.url());});
 await p.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4197');
 await p.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.setRenderQuality('clear');inari.setMode('walk');});
 report.layout=await p.evaluate(()=>{
  const {world,pilgrimage,nightWalk}=inari,fixtures=world.fixtureLayout.fixtures;
  const kinds=Object.entries(fixtures.reduce((acc,f)=>(acc[f.name]=(acc[f.name]||0)+1,acc),{}));
  const conflicts=fixtures.filter(f=>f.margin!==null&&f.margin<.1);
  const fixturesNearEntrance=fixtures.filter(f=>f.x<-23&&f.x>-100&&Math.abs(f.z)<15);
  return {kinds,conflicts,clearMin:Math.min(...fixtures.filter(f=>f.margin!==null).map(f=>f.margin)),count:fixtures.length,rows:[fixturesNearEntrance.filter(f=>f.z>3).length,fixturesNearEntrance.filter(f=>f.z< -3).length],shrines:pilgrimage.stats.sideShrines,night:nightWalk.stats};
 });
 assert.ok(report.layout.kinds.filter(([n])=>n.includes('攝影')||n.includes('眺望')).length===3);
 assert.ok(report.layout.rows.every(n=>n>=4));
 assert.equal(report.layout.conflicts.length,0);
 assert.equal(report.layout.shrines.count,6);assert.equal(report.layout.shrines.tubes,3);assert.ok(report.layout.shrines.ema);
 const preview=async ([x,z,yaw,pitch,d],name)=>{
  assert.ok(await p.evaluate(([x,z,yaw,pitch,d])=>{if(!inari.teleport(x,z))return false;inari.setView(yaw,pitch,d);inari.player.rotation.y=yaw+Math.PI;return true},[x,z,yaw,pitch,d]),name+' camera start blocked');
  await p.waitForTimeout(500);await p.screenshot({path:out+'/'+name+'.png'});
 };
 await preview([-72,.95,-1.55,-.07,5.4],'approach');
 await preview([-27,-1.51,-1.60,-.10,5.2],'romon');
 await preview([-72,.95,-1.55,-.07,5.4],'before-night');
 await p.evaluate(()=>inari.setTime('night'));
 await preview([-72,.95,-1.55,-.07,5.4],'approach-night');
 await preview([84.91,-37.40,3.10,.04,5.0],'tamayama-night');
 await p.setViewportSize({width:390,height:844});
 await preview([-67,.20,-1.55,-.08,5.5],'portrait');
 await p.setViewportSize({width:1600,height:900});
 report.paths=await p.evaluate(()=>{
  const w=inari.world;
  const routes=[
   [[-100,1],[-78,1],[-49,-.32],[-29,-1.55]],
   [[85.341,-37.404],[85.441,-32.851],[85.532,-28.286],[85.578,-26.238],[85.943,-20.939]],
   [[19.157,-18.423],[23.317,-18.568],[32.394,-18.713],[31.91,-22.553],[50.803,-24.257],[55.4,-24.52]]
  ];
  return routes.flatMap((list,i)=>[list,[...list].reverse()].map((nodes,reverse)=>{
   const [x,z]=nodes[0],at={x,z,y:w.walkHeight(x,z)};let error=0;
   for(let j=1;j<nodes.length;j++){
    const a=nodes[j-1],b=nodes[j],count=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.1);
    for(let k=1;k<=count;k++){const x=a[0]+(b[0]-a[0])*k/count,z=a[1]+(b[1]-a[1])*k/count,dx=x-at.x,dz=z-at.z,r=Math.max(1,Math.hypot(dx,dz)/.15);w.physics.move(at,dx/r,dz/r,w.walkHeight);error=Math.max(error,Math.hypot(at.x-x,at.z-z));}
   }
   return{route:i,reverse,error};
  }));
 });
 await p.evaluate(()=>{inari.teleport(-70,1);inari.setView(-1.55,.07,5);});
 await p.keyboard.down('KeyW');await p.waitForTimeout(2550);await p.keyboard.up('KeyW');
 report.walked=await p.evaluate(()=>inari.player.position.x+70);
 assert.ok(report.paths.every(x=>x.error<.40),'At least one mapped route was obstructed');
 assert.ok(report.walked>4);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
}finally{writeFileSync(out+'/qa.json',JSON.stringify(report,null,2));await browser.close();}
