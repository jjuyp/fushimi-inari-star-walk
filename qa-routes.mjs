import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('output/v3',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--enable-unsafe-swiftshader','--no-sandbox',...(process.env.INARI_QA_GPU==='high'?['--force_high_performance_gpu']:[])]});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:4186');await page.waitForFunction(()=>inari.state.ready,{},{timeout:90000});
const report=await page.evaluate(async()=>{
 const{MAP}=await import('/geography.js'),world=inari.world;
 const routes=[...MAP.paths.filter(p=>[260121328,377968455].includes(p.id)).map(p=>({from:String(p.id),to:'senbon-end',p:p.p})),...MAP.routes];
 return routes.map(r=>{
  const first=r.p[0],p={x:first[0],z:first[1],y:world.walkHeight(...first)},failures=[];
  if(world.physics.collides(p.x,p.y,p.z))failures.push({kind:'start-blocked',p:{...p}});
  let metres=0,maxError=0;
  for(let i=1;i<r.p.length;i++){
   const a=r.p[i-1],b=r.p[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/.075);
   for(let k=1;k<=n;k++){
    const targetX=a[0]+(b[0]-a[0])*k/n,targetZ=a[1]+(b[1]-a[1])*k/n,dx=targetX-p.x,dz=targetZ-p.z,len=Math.hypot(dx,dz),max=.12;
    world.physics.move(p,dx/Math.max(1,len/max),dz/Math.max(1,len/max),world.walkHeight);
    const error=Math.hypot(p.x-targetX,p.z-targetZ);maxError=Math.max(maxError,error);
    if(error>1.2){failures.push({kind:'blocked',segment:i,p:{...p},target:[targetX,targetZ],near:world.physics.near(p.x,p.z).filter(body=>{const px=Math.max(body.bounds[0],Math.min(body.bounds[2],p.x)),pz=Math.max(body.bounds[1],Math.min(body.bounds[3],p.z));return Math.hypot(p.x-px,p.z-pz)<1;}).map(b=>b.name).slice(0,12)});break;}
   }
   if(failures.some(f=>f.kind==='blocked'))break;metres+=length;
  }
  return{from:r.from,to:r.to,metres:+metres.toFixed(1),maxError:+maxError.toFixed(3),failures};
 });
});writeFileSync('output/v3/routes.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.some(r=>r.failures.length))process.exitCode=1;
}finally{await browser.close();}
