import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const offline=process.argv.includes('--offline'),out='output/ppt-revision/page08'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const errors=[],external=[],proof={};
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror',e=>errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url());});
 await p.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186');
 await p.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.setRenderQuality('clear');inari.pilgrimage.travel('kagura')});
 await p.waitForFunction(()=>!inari.state.travelLoading);
 await p.screenshot({path:out+'/approach.png'});
 for(const mode of ['day','night']){
  await p.evaluate(()=>inari.pilgrimage.perform('kagura'));
  await p.selectOption('#kaguraTime',mode);
  await p.getByRole('button',{name:'奉納御神樂 · 300 円',exact:true}).click();
  await p.waitForFunction(()=>inari.pilgrimage.stats.kagura.playing&&inari.pilgrimage.stats.kagura.phase>=2);
  proof[mode]=await p.evaluate(()=>{const {dancer,stats}=inari.pilgrimage.kaguraStage;return {...stats,bells:dancer.bells.visible,fan:dancer.fan.visible,star:inari.player.position.toArray(),torso:dancer.torso.rotation.toArray(),arms:dancer.arms.map(a=>a.shoulder.rotation.toArray()),camera:inari.camera.position.toArray(),coins:inari.pilgrimage.saved.coins}});
  await p.screenshot({path:out+'/'+mode+'-early.png'});
  await p.waitForFunction(()=>inari.pilgrimage.stats.kagura.phase>=5);
  await p.screenshot({path:out+'/'+mode+'-late.png'});
  if(mode==='night'){
   await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);await p.screenshot({path:out+'/night-mobile.png'});
   proof.mobile=await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth);
  }
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!inari.pilgrimage.busy);
 }
 if(proof.day.mode!=='day'||!proof.day.bells||proof.day.fan||proof.day.lights||proof.night.mode!=='night'||proof.night.bells||!proof.night.fan||proof.night.lights!==2||proof.night.coins!==proof.day.coins-300||JSON.stringify(proof.day.arms)===JSON.stringify(proof.night.arms)||!proof.mobile||errors.length||external.length)process.exitCode=1;
}finally{writeFileSync(out+'/qa.json',JSON.stringify({proof,errors,external},null,2));await browser.close();}
