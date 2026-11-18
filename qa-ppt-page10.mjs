import assert from 'node:assert/strict';
import {chromium} from '../tidepool-jelly/node_modules/playwright-core/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {OMikuji,pickFortune} from './dist/omikuji.js';

const offline=process.argv.includes('--offline'),out='output/ppt-revision/page10'+(offline?'/offline':'');
mkdirSync(out,{recursive:true});
const errors=[],external=[],proof={};
assert.equal(OMikuji.length,108);
assert.equal(new Set(OMikuji.map(x=>x.poem.join(''))).size,108);
assert.ok(OMikuji.every(x=>x.poem.length===4&&x.poem.every(l=>l.length===5)&&x.meaning&&x.details.length===8));
let deck=null,results=[];
for(let i=0;i<217;i++){const d=pickFortune(deck);deck=JSON.parse(JSON.stringify(d.deck));results.push(d.number);}
assert.equal(new Set(results.slice(0,108)).size,108);assert.equal(new Set(results.slice(108,216)).size,108);
assert.ok(results.every((x,i)=>!i||x!==results[i-1]));proof.catalogue={unique:108,fullCycles:2,adjacentRepeats:0};
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/shang/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--no-sandbox','--force_low_power_gpu']});
try{
 const p=await browser.newPage({viewport:{width:1280,height:1000}});
 p.on('pageerror',e=>errors.push(e.message));
 if(offline)p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url());});
 const url=offline?pathToFileURL(resolve('伏見稻荷・星旅.html')).href:'http://127.0.0.1:4186';
 async function ready(){await p.waitForFunction(()=>window.inari?.state.ready,null,{timeout:120000});}
 async function reach(){await p.evaluate(()=>inari.pilgrimage.travel('fortune'));await p.waitForFunction(()=>!inari.state.travelLoading);await p.evaluate(()=>inari.pilgrimage.perform('fortune'));}
 const draw=p.getByRole('button',{name:'搖筒抽籤 · 100 円',exact:true});
 const slip=p.locator('.fortune-sheet');
 async function drawOne(){await draw.click();await slip.waitFor();return Number(await slip.getAttribute('data-fortune-number'));}
 await p.goto(url);await ready();await reach();await p.screenshot({path:out+'/draw-desk.png'});
 const first=await drawOne();assert.equal(await slip.locator('.fortune-poem span').count(),4);assert.equal(await slip.locator('dl>div').count(),8);
 await p.screenshot({path:out+'/first.png'});
 await p.getByRole('button',{name:'收好籤紙',exact:true}).click();await p.evaluate(()=>inari.pilgrimage.perform('fortune'));const second=await drawOne();assert.notEqual(first,second);
 await p.getByRole('button',{name:'收好籤紙',exact:true}).click();await p.reload();await ready();await reach();
 const third=await drawOne();assert.equal(new Set([first,second,third]).size,3);
 assert.deepEqual(await p.evaluate(()=>inari.pilgrimage.saved.fortuneDeck.used),[first,second,third]);
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:out+'/mobile-slip.png'});
 await p.locator('#journeyDialog').evaluate(d=>{d.scrollTop=d.scrollHeight;});
 proof.mobileActions=await p.evaluate(()=>{const d=document.querySelector('#journeyDialog').getBoundingClientRect();return [...document.querySelectorAll('#journeyBody>.journey-btn')].map(b=>{const r=b.getBoundingClientRect();return{title:b.textContent,visible:r.top>=d.top&&r.bottom<=d.bottom};});});
 assert.ok(proof.mobileActions.some(b=>b.title==='收好籤紙'&&b.visible)&&proof.mobileActions.some(b=>b.title==='再抽一支'&&b.visible));
 await p.screenshot({path:out+'/mobile-slip-bottom.png'});
 await p.getByRole('button',{name:'歷次抽籤',exact:true}).click();assert.equal(await p.locator('.fortune-history button').count(),3);
 await p.screenshot({path:out+'/mobile-history.png'});
 await p.locator('.fortune-history button').last().click();assert.equal(Number(await slip.getAttribute('data-fortune-number')),first);
 await p.getByRole('button',{name:'再抽一支',exact:true}).click();await draw.click();await p.waitForFunction(()=>inari.pilgrimage.busy);await p.keyboard.press('Escape');
 proof.saves=await p.evaluate(()=>({archive:inari.pilgrimage.saved.fortuneArchive,deck:inari.pilgrimage.saved.fortuneDeck,coins:inari.pilgrimage.saved.coins,busy:inari.pilgrimage.busy}));
 assert.equal(proof.saves.archive.length,3);assert.equal(proof.saves.coins,5700);assert.equal(proof.saves.busy,false);
 await p.evaluate(()=>{localStorage.setItem('inari-pilgrimage-v32',JSON.stringify({coins:6000,bag:{},fortune:{index:3,number:13}}));});await p.reload();await ready();await reach();
 await p.getByRole('button',{name:'展開手上的籤',exact:true}).click();assert.equal(await slip.getAttribute('data-fortune-number'),'13');assert.match(await slip.textContent(),/一葉浮溪水/);
 proof.legacy=true;assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
}finally{writeFileSync(out+'/qa.json',JSON.stringify({proof,errors,external},null,2));await browser.close();}
