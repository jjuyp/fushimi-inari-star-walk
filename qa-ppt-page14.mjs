import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const offline=process.argv.includes('--offline'),out='output/ppt-revision/page14'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,errors:[],external:[]};
try{
 const page=await browser.newPage({viewport:{width:1320,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));
 if(offline)page.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.external.push(r.url());});
 await page.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186');
 await page.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await page.evaluate(()=>{inari.setMode('walk');inari.setSeason('summer');inari.setTime('dusk');inari.setRenderQuality('clear');});
 report.passage=await page.evaluate(()=>{
   const w=inari.world,points=[[85.341,-37.404],[85.441,-32.851],[85.532,-28.286],[85.578,-26.238],[85.943,-20.939]];
   const gap=w.physics.bodies.filter(b=>b.name==='fence'&&b.x>57.8&&b.x<98.2&&Math.abs(b.z-(-34-(b.x-58)*.05))<.28);
   function traverse(path){
     const p={x:path[0][0],z:path[0][1],y:w.walkHeight(...path[0])};let maxError=0;
     for(let i=1;i<path.length;i++){
       const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.075);
       for(let j=1;j<=n;j++){
         const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;
         w.physics.move(p,x-p.x,z-p.z,w.walkHeight);maxError=Math.max(maxError,Math.hypot(p.x-x,p.z-z));
       }
     }
     return{maxError,end:{...p}};
   }
   return{unwantedColliders:gap.length,forward:traverse(points),reverse:traverse([...points].reverse())};
 });
 report.railings=await page.evaluate(()=>{
   const w=inari.world,spans=w.physics.bodies.filter(b=>b.name==='fence');
   const groups=[
     {name:'honden',test:b=>b.x>40},
     {name:'romon-north',test:b=>b.x<0&&b.z<0},
     {name:'romon-south',test:b=>b.x<0&&b.z>0},
     {name:'shrine-rails',test:b=>/ rail$/.test(b.name),spans:w.physics.bodies}
   ];
   return groups.map(group=>{
     const chosen=(group.spans||spans).filter(group.test),probes=[];
     for(const b of chosen){
       const normal=b.d>b.w?{x:b.c,z:-b.s}:{x:b.s,z:b.c};
       for(const side of [-1,1]){
         const dx=normal.x*side,dz=normal.z*side,x=b.x+dx*1.1,z=b.z+dz*1.1,y=w.walkHeight(x,z);
         if(!Number.isFinite(y)||w.physics.collides(x,y,z))continue;
         const p={x,y,z};let hits=0;
         for(let i=0;i<38;i++)hits+=w.physics.move(p,-dx*.07,-dz*.07,w.walkHeight);
         const distance=(p.x-b.x)*dx+(p.z-b.z)*dz;
         probes.push({distance,hits});
       }
     }
     return{name:group.name,segments:chosen.length,attempted:probes.length,crossed:probes.filter(p=>p.distance<-.06).length,contacts:probes.filter(p=>p.hits>0).length};
   });
 });
 await page.evaluate(()=>{inari.teleport(85.34,-37.40);inari.setView(Math.PI,.09,5);inari.player.rotation.y=0;});
 await page.waitForTimeout(450);await page.screenshot({path:out+'/open-approach.png'});
 await page.keyboard.down('KeyW');await page.waitForTimeout(2200);await page.keyboard.up('KeyW');
 report.actualPosition=await page.evaluate(()=>inari.state.position);
 await page.screenshot({path:out+'/walk-through.png'});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{inari.teleport(85.34,-37.40);inari.setView(Math.PI,.09,5.2);inari.player.rotation.y=0;});
 await page.waitForTimeout(400);await page.screenshot({path:out+'/open-approach-mobile.png'});
 await page.setViewportSize({width:1320,height:900});
 await page.evaluate(()=>{inari.teleport(55,-18);inari.setView(-1.72,.13,4.0);});
 await page.waitForTimeout(450);await page.screenshot({path:out+'/retained-fence.png'});
 assert.equal(report.passage.unwantedColliders,0);
 assert.ok(report.passage.forward.maxError<.35&&report.passage.reverse.maxError<.35,'Mapped stair side path is blocked');
 assert.ok(report.actualPosition.z>-34.8,'Keyboard walk failed to cross the former fence');
 assert.ok(report.railings.every(g=>g.attempted>0&&g.contacts>0&&g.crossed===0),'Retained fence still allows crossing');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
}finally{
 writeFileSync(out+'/qa.json',JSON.stringify(report,null,2));
 await browser.close();
}
