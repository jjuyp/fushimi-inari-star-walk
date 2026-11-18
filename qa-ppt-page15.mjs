import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const offline=process.argv.includes('--offline'),out='output/ppt-revision/page15'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,errors:[],external:[]};
const views={
 moon:[85.34,-37.4,Math.PI,.055,5.3],
 entrance:[-61,0,-Math.PI/2,.07,5.1],
 senbon:[161,5.4,-2.024,.055,4.9]
};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));
 if(offline)page.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.external.push(r.url());});
 await page.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186');
 await page.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 const nightReady=()=>page.waitForFunction(()=>inari.state.night&&inari.nightWalk.stats.active>0&&!inari.state.travelLoading);
 await page.evaluate(()=>{inari.setSeason('spring');inari.setRenderQuality('clear');});
 await page.keyboard.press('KeyJ');
 await page.getByRole('button',{name:'日落後・燈籠參道 N'}).click();
 await nightReady();
 report.scene=await page.evaluate(()=>({...inari.nightWalk.stats,gpu:inari.state.gpu,moon:inari.nightWalk.moon.visible,clouds:inari.nightWalk.clouds.visible,wet:inari.nightWalk.wet.visible,fireflies:inari.nightWalk.fireflies.visible}));
 assert.ok(report.scene.lanterns>=70&&report.scene.windowCount>=20&&report.scene.statues>=1);
 assert.ok(report.scene.moon&&report.scene.clouds&&report.scene.wet&&report.scene.fireflies);
 assert.ok(report.scene.active<=5);
 await page.keyboard.press('KeyJ');
 const ambience=page.getByRole('button',{name:'夜間環境音',exact:true});
 await ambience.click();
 await page.waitForFunction(()=>inari.nightAmbience.stats.playing);
 report.audio={enabled:true,playing:true};
 await page.keyboard.press('Escape');
 await page.waitForTimeout(600);
 await page.screenshot({path:out+'/night-hero.png'});
 await page.keyboard.press('KeyC');await page.waitForFunction(()=>inari.state.mode==='photo');
 await page.screenshot({path:out+'/night-photo-mode.png'});
 await page.keyboard.press('KeyP');await page.waitForFunction(()=>inari.state.lastExport?.width>=2560);
 report.photo=await page.evaluate(()=>inari.state.lastExport);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.querySelector('#toast.on'));

 const view=async (name,[x,z,yaw,pitch,d])=>{
  assert.ok(await page.evaluate(([x,z,yaw,pitch,d])=>{if(!inari.teleport(x,z))return false;inari.setView(yaw,pitch,d);inari.player.rotation.y=yaw+Math.PI;return true;},[x,z,yaw,pitch,d]));
  await page.waitForTimeout(450);
  await page.screenshot({path:out+'/night-'+name+'.png'});
 };
 for(const [name,v] of Object.entries(views))await view(name,v);
 await page.evaluate(()=>{inari.setWeather('rain');inari.setSeason('autumn');});
 await view('rain',views.moon);
 report.rain=await page.evaluate(()=>({weather:inari.state.weather,season:inari.state.season,reflection:inari.nightWalk.wet.material.opacity,moon:inari.nightWalk.moon.material.opacity,flies:inari.nightWalk.fireflies.visible}));
 assert.ok(report.rain.reflection>.9&&report.rain.moon<.35&&!report.rain.flies);
 await page.evaluate(()=>inari.setWeather('mist'));
 await view('mist',views.moon);
 report.mist=await page.evaluate(()=>({reflection:inari.nightWalk.wet.material.opacity,moon:inari.nightWalk.moon.material.opacity}));
 assert.ok(report.mist.reflection<.55&&report.mist.moon<.6);
 await page.evaluate(()=>{inari.setWeather('clear');inari.setSeason('spring');});
 await page.setViewportSize({width:390,height:844});
 await page.keyboard.press('KeyN');await nightReady();await page.waitForTimeout(300);
 await page.screenshot({path:out+'/night-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});
 const passage=await page.evaluate(()=>{
  const w=inari.world;
  const paths=[
   [[19.157,-18.423],[23.317,-18.568],[32.394,-18.713],[31.91,-22.553],[50.803,-24.257],[55.4,-24.52]],
   [[85.341,-37.404],[85.441,-32.851],[85.532,-28.286],[85.578,-26.238],[85.943,-20.939]]
  ];
  return paths.flatMap(path=>[path,[...path].reverse()].map(points=>{
   const [x,z]=points[0],p={x,z,y:w.walkHeight(x,z)};let error=0;
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.075);
    for(let j=1;j<=n;j++){
     const xx=a[0]+(b[0]-a[0])*j/n,zz=a[1]+(b[1]-a[1])*j/n,dx=xx-p.x,dz=zz-p.z,div=Math.max(1,Math.hypot(dx,dz)/.15);
     w.physics.move(p,dx/div,dz/div,w.walkHeight);error=Math.max(error,Math.hypot(p.x-xx,p.z-zz));
    }
   }
   return{start:points[0],end:points.at(-1),error};
  }));
 });
 report.passage=passage;
 assert.ok(passage.every(p=>p.error<.35),'A lantern obstructs a mapped passage');
 await page.locator('#light').click();
 await page.waitForFunction(()=>!inari.state.night&&!inari.nightAmbience.stats.playing);
 report.day=await page.evaluate(()=>({lights:inari.nightWalk.stats.active,moon:inari.nightWalk.moon.visible,wet:inari.nightWalk.wet.visible,roughness:inari.world.M.stone.roughness}));
 assert.deepEqual(report.day,{lights:0,moon:false,wet:false,roughness:.93});
 await page.screenshot({path:out+'/day-return.png'});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
}finally{
 writeFileSync(out+'/qa.json',JSON.stringify(report,null,2));
 await browser.close();
}
