import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const offline=process.argv.includes('--offline'),out='output/ppt-revision/page11'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const errors=[],external=[],proof={};
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror',e=>errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url());});
 await p.goto(offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186');
 await p.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});
 await p.evaluate(()=>{inari.setRenderQuality('clear');inari.pilgrimage.travel('stone')});
 await p.waitForFunction(()=>!inari.state.travelLoading);
 await p.waitForTimeout(500);await p.screenshot({path:out+'/arrival.png'});
 async function start(side){await p.evaluate(()=>inari.pilgrimage.perform('stone'));await p.getByRole('button',{name:'許願・舉起'+(side===0?'左石':'右石'),exact:true}).click();await p.waitForFunction(s=>inari.pilgrimage.stats.stone.side===s&&inari.pilgrimage.stats.stone.rise>.33,side);}
 const snapshot=()=>p.evaluate(()=>{const o=inari.pilgrimage.omokaru,{x,y,z}=inari.player.position;return{...o.stats,rockY:o.stones.map(s=>s.position.y),hands:inari.avatar.acting.stats.contact,playerClear:!inari.world.physics.collides(x,y,z),camera:inari.camera.position.toArray()};});
 await start(0);proof.left=await snapshot();await p.screenshot({path:out+'/lift-left.png'});
 assert.ok(proof.left.rockY[0]>2.015&&proof.left.rockY[1]===1.685&&proof.left.hands>.95&&proof.left.playerClear);
 await p.waitForFunction(()=>!inari.pilgrimage.busy);
 await p.locator('.stone-answer').waitFor();assert.equal(await p.locator('#stoneWish').count(),0);
 await p.keyboard.press('Escape');
 await p.setViewportSize({width:390,height:844});await start(1);proof.right=await snapshot();await p.screenshot({path:out+'/lift-right-mobile.png'});
 assert.ok(proof.right.rockY[1]>2.015&&proof.right.rockY[0]===1.685&&proof.right.hands>.95&&proof.right.playerClear);
 await p.keyboard.press('Escape');proof.reset=await snapshot();assert.equal(proof.reset.side,null);assert.deepEqual(proof.reset.rockY,[1.685,1.685]);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
}finally{writeFileSync(out+'/qa.json',JSON.stringify({proof,errors,external},null,2));await browser.close();}
