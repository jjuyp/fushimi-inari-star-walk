import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const offline=process.argv.includes('--offline'),out='output/ppt-revision/page09'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const errors=[],external=[],proof={};
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror',e=>errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url());});
 await p.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186');
 await p.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.setRenderQuality('clear');inari.goPlace('hall');inari.ritual.prepare(inari.player);});
 await p.waitForFunction(()=>!inari.state.travelLoading);
 await p.locator('#pray').click();
 for(let i=1;i<=3;i++){
  await p.waitForFunction(i=>inari.avatar.acting.stats.phase==='bow-'+i&&inari.avatar.acting.stats.bowDegrees>48,i);
  proof['bow'+i]=await p.evaluate(()=>({degrees:inari.avatar.acting.stats.bowDegrees,camera:inari.camera.position.toArray(),pos:inari.player.position.toArray()}));
  await p.screenshot({path:out+'/bow-'+i+'.png'});
  if(i===2){
   await p.waitForFunction(()=>inari.pilgrimage.stats.prayer.claps.length===1);
   await p.screenshot({path:out+'/clap.png'});
   await p.waitForFunction(()=>inari.pilgrimage.stats.prayer.claps.length===2);
  }
 }
 await p.waitForFunction(()=>!inari.pilgrimage.busy);
 proof.claps=await p.evaluate(()=>inari.pilgrimage.stats.prayer.claps);
 proof.finished=await p.evaluate(()=>!inari.pilgrimage.stats.prayer.playing&&inari.avatar.body.rotation.x===0&&inari.avatar.body.position.z===0&&inari.pilgrimage.saved.prayers===1);
 await p.setViewportSize({width:390,height:844});await p.locator('#pray').click();
 await p.waitForFunction(()=>inari.avatar.acting.stats.phase==='bow-1'&&inari.avatar.acting.stats.bowDegrees>48);
 await p.screenshot({path:out+'/bow-mobile.png'});await p.keyboard.press('Escape');
 proof.cancel=await p.evaluate(()=>!inari.pilgrimage.stats.prayer.playing&&!inari.pilgrimage.busy&&inari.pilgrimage.stats.prayer.claps.length===0);
 if(!proof.finished||!proof.cancel||proof.claps.length!==2||!proof.claps.every(e=>e.audio&&e.elapsed-e.target<.16)||errors.length||external.length)process.exitCode=1;
}finally{writeFileSync(out+'/qa.json',JSON.stringify({proof,errors,external},null,2));await browser.close();}
