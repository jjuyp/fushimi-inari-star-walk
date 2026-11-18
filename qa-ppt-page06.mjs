import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const offline=process.argv.includes('--offline');
const out='output/ppt-revision/page06'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
const errors=[],external=[],checks={};
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror',e=>errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url())});
 await p.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186');
 await p.waitForFunction(()=>window.inari?.state?.ready,null,{timeout:120000});
 await p.evaluate(()=>inari.goPlace('entrance'));
 await p.waitForFunction(()=>!inari.state.travelLoading);
 const fixture=await p.evaluate(()=>{
  const {foxes,player,world}=inari;
  const choices=[...foxes.agents].sort((a,b)=>Math.hypot(a.x-player.position.x,a.z-player.position.z)-Math.hypot(b.x-player.position.x,b.z-player.position.z));
  for(const a of choices)for(let i=0;i<16;i++){
   const angle=i*Math.PI/8,x=a.x+Math.sin(angle)*1.29,z=a.z+Math.cos(angle)*1.29;
   const y=world.walkHeight(x,z);
   if(!Number.isFinite(y)||Math.abs(y-a.y)>.25||world.physics.collides(x,y,z)||foxes.nearest({x,y,z})!==a)continue;
   if(Math.hypot(a.x-player.position.x,a.z-player.position.z)>25)return null;
   inari.teleport(x,z);a.pose='wag';a.remaining=30;a.elapsed=1;inari.setView(angle+1.15,.12,3.8);
   return {id:a.id,foxCount:foxes.count,meshCount:foxes.meshes.length};
  }
  return null;
 });
 if(!fixture)throw Error('No valid fox approach near entrance');
 checks.population=fixture;
 await p.locator('[data-fox-action="pet"]').waitFor();
 await p.evaluate(()=>{window.foxKeyProbe=[];addEventListener('keydown',e=>foxKeyProbe.push({code:e.code,target:e.target.tagName,phase:inari.foxes.interacting?.pose}));});
 await p.keyboard.press('y');
 checks.key=await p.evaluate(()=>({events:foxKeyProbe,active:inari.foxes.interacting?.pose,mode:inari.state.mode,busy:inari.pilgrimage.busy,actorBusy:inari.avatar.acting.busy,focus:document.activeElement?.tagName}));
 await p.waitForFunction(()=>inari.foxes.interacting?.pose==='pet'&&inari.foxes.interacting.elapsed>.9);
 checks.pet=await p.evaluate(()=>inari.avatar.acting.stats.active==='fox');
 await p.screenshot({path:out+'/pet.png'});
 await p.keyboard.press('Escape');
 await p.waitForFunction(()=>!inari.foxes.interacting);
 checks.poses=[];
 const presentation=await p.addStyleTag({content:'.ui,#hudContext,#joystick,#touchPhoto,#toast{visibility:hidden!important}'});
 await p.evaluate(()=>{inari.player.visible=false});
 for(const pose of ['wag','nuzzle','stretch','yawn','sleep','roll']){
  await p.evaluate(({pose,id})=>{const a=inari.foxes.agents.find(a=>a.id===id);a.pose=pose;a.remaining=3;a.elapsed=1.1;a.yaw=pose==='roll'?1.8:.75;inari.setView(.57,.1,3.45)},{pose,id:fixture.id});
  await p.waitForTimeout(320);
  await p.screenshot({path:out+'/fox-'+pose+'.png'});
  checks.poses.push(await p.evaluate(id=>inari.foxes.agents.find(a=>a.id===id).pose,fixture.id));
 }
 await presentation.evaluate(e=>e.remove());
 await p.evaluate(()=>{inari.player.visible=true});
 await p.setViewportSize({width:390,height:844});
 await p.locator('[data-fox-action="play"]').click();
 await p.waitForFunction(()=>inari.foxes.interacting?.pose==='play'&&inari.foxes.interacting.elapsed>1);
 await p.screenshot({path:out+'/play-mobile.png'});
 checks.play=await p.evaluate(()=>inari.foxes.interacting?.pose==='play');
 await p.evaluate(()=>inari.goPlace('hall'));
 checks.travelCancels=await p.evaluate(()=>!inari.foxes.interacting);
 if(!checks.pet||!checks.play||!checks.travelCancels||new Set(checks.poses).size!==6||errors.length||external.length)process.exitCode=1;
}finally{
 writeFileSync(out+'/qa.json',JSON.stringify({checks,errors,external},null,2));
 await browser.close();
}
