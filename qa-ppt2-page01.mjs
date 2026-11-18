import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const offline=process.argv.includes('--offline'),out='output/ppt-revision-2/page01'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const report={offline,errors:[],external:[],weather:[]};
try{
 const page=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Shader'))report.errors.push(m.text());});
 if(offline)page.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))report.external.push(r.url());});
 await page.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4197');
 await page.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await page.evaluate(()=>inari.setRenderQuality('clear'));
 await page.waitForTimeout(1450);
 await page.screenshot({path:out+'/overview.png'});
 for(const [i,yaw,pitch,d] of [[1,2.35,.23,156],[2,2.56,.23,150],[3,2.80,.25,132],[4,2.95,.25,135]]){
  await page.evaluate(([yaw,pitch,d])=>inari.setView(yaw,pitch,d),[yaw,pitch,d]);
  await page.waitForTimeout(440);
  await page.screenshot({path:out+'/framing-'+i+'.png'});
 }
 const collect=()=>page.evaluate(()=>({weather:inari.state.weather,sky:inari.lighting.sky.material.uniforms.clearDay.value,sun:inari.lighting.sky.material.uniforms.sunPosition.value.toArray(),intensity:inari.lighting.sun.intensity,skyVisible:inari.lighting.sky.visible}));
 report.weather.push(await collect());
 await page.evaluate(()=>inari.setWeather('cloudy'));await page.waitForTimeout(550);
 await page.screenshot({path:out+'/cloudy-check.png'});report.weather.push(await collect());
 await page.evaluate(()=>{inari.setWeather('clear');inari.goPlace('gate');});
 await page.waitForFunction(()=>!inari.state.travelLoading);await page.evaluate(()=>{inari.teleport(-60,-.3);inari.setView(-1.52,-.13,6.4)});await page.waitForTimeout(500);
 await page.screenshot({path:out+'/walking.png'});report.weather.push(await collect());
 await page.evaluate(()=>inari.setTime('night'));await page.waitForTimeout(450);report.weather.push(await collect());
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{inari.setTime('day');inari.setMode('overview');});await page.waitForTimeout(650);
 await page.screenshot({path:out+'/portrait.png'});
 await page.evaluate(()=>inari.setTime('dusk'));report.dusk=await collect();assert.equal(report.dusk.sky,0);assert.ok(Math.abs(report.dusk.intensity-2.331)<.001);
 assert.deepEqual(report.weather.map(x=>x.sky),[1,0,1,0]);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
}finally{writeFileSync(out+'/qa.json',JSON.stringify(report,null,2));await browser.close();}
