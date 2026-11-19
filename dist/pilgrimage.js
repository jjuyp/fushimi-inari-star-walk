import * as THREE from 'three';
import {createWaterfallScene,createWaterfallAmbience} from './waterfall-scene.js';
import {fitWaterfallSite} from './waterfall-grounds.js';
import {createWaterfallMeditation} from './waterfall-meditation.js';
import {journalMarkup,bindJournalShortcuts} from './journal-ui.js';
import {createWashAnimation} from './wash-animation.js';
import {createKaguraStage} from './kagura-stage.js';
import {createOmokaru} from './omokaru-stone.js';
import {createSideShrines,thematicFortunes} from './side-shrines.js';
import {currentStampDate,goshuinCard,goshuinGallery,hasGoshuin} from './goshuin.js';
import {createEmaRack,EMA_STYLES} from './ema-rack.js';
import {PRAYER_DURATION,PRAYER_LABELS,samplePrayer} from './prayer-timeline.js';
import {createPilgrimageArt} from './pilgrimage-art.js';
import{STREET_GOODS}from'./market-catalog.js';
import {OMikuji,pickFortune} from './omikuji.js';
import{createMarketSites}from'./market-sites.js';
import {MAP,footprintBox,pathSamples} from './geography.js';

// Original fictional poems and designs; no real transactions or predictions.
export const FORTUNES=[
 ['大吉','朝霧散千嶺，初陽照遠川。耕耘終有穫，莫負此時緣。','積累已漸成熟，宜踏實前進，也要珍惜同行的人。','可成，仍須努力','貴人將至','坦誠可得良緣','勤學有進','穩健經營見益','留意作息','晴日出行為宜','近處細尋'],
 ['吉','竹影搖窗月，清泉繞石流。心寬天地闊，緩步亦登樓。','不必與人爭快，按自己的節奏完成眼前之事。','漸成','稍待即至','相互體諒','反覆溫習有成','守信為上','適度休養','從容安排','往來處可尋'],
 ['中吉','春雨催新綠，微風送晚香。耐心持一念，花自向陽開。','成果需要時間。將大願分成小步，日日實踐。','稍遲可成','勿急','以誠相待','補足弱項','量入為出','身心並養','結伴較宜','稍後有音訊'],
 ['小吉','一葉浮溪水，前途幾道彎。看山仍有路，莫怨步行難。','遇上轉折時先看清方向，接受朋友的提醒。','有阻而可通','途中有變','多聽少猜','打好基礎','謹慎議約','少熬夜','備妥所需','問熟識之人'],
 ['末吉','寒枝藏嫩蕊，夜色待晨光。且把心田理，來春見滿芳。','此刻宜整理與準備，切勿因一時緩慢而放棄。','晚成','尚須等待','順其自然','持續用功','避免衝動','安定心神','擇日再行','慢慢尋得'],
 ['凶','逆水舟行緩，浮雲暫掩星。收帆觀岸勢，雨過自天青。','先停下腳步檢查計畫。壞運勢只是遊戲中的提醒，不決定人生。','重新規劃','暫未有信','避免口角','調整方法','勿冒進','有疑慮請求助專業','留意安全','切勿執著'],
 ['大凶','夜雨侵孤徑，寒風動薄衣。且尋簷下坐，天霽再言歸。','遇到困難可以休息與求助。籤上文字不代表真實命運，請善待自己。','暫緩為宜','不必強求','先照顧自己','回到基本','守住現有','規律生活','延後安排','放下亦安心']
];
const labels=['願望','待人','緣分','學業','商事','健康','旅行','失物'];
export const GOODS=[
 {id:'sushi',name:'稻荷壽司',price:350,desc:'金黃豆皮包住醋飯與芝麻；兩枚裝，坐下慢慢品嚐。',color:'#bc712c'},
 {id:'senbei',name:'狐狸稻荷仙貝',price:250,desc:'帶有狐狸耳朵與烘烤紋理的香脆仙貝。',color:'#c98a43'},
 {id:'matcha',name:'宇治抹茶',price:450,desc:'陶碗盛裝，翠綠茶面與細緻泡沫；可持在手上飲用。',color:'#638744'},
 {id:'mask',name:'白狐面具',price:800,desc:'象牙白漆面、朱紅耳尖、細金紋與紅色繫帶；可佩戴拍照。',color:'#f2ebd9'},
 {id:'red',name:'稻荷守・朱',price:600,desc:'朱色織錦袋、金色稻穗、雙重結繩。寓意健康與諸願成就。',color:'#a73d32'},
 {id:'purple',name:'稻荷守・紫',price:600,desc:'紫色菱紋織錦、金邊與白色結繩。寓意平安與健康。',color:'#594475'},
 {id:'business',name:'商賣繁昌守',price:600,desc:'深綠織錦、金色稻穗與朱繩。寓意誠信經營、商事順遂。',color:'#305e49'},
 {id:'study',name:'學業守',price:500,desc:'靛藍織錦、銀白星點與金色流蘇。寓意勤學與專注。',color:'#344c73'},
 {id:'travel',name:'旅行安全守',price:500,desc:'青綠旅行吊牌、鳥居紋與橙色結繩。寓意旅途平安。',color:'#3b8582'},
 ...STREET_GOODS
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPilgrimage({scene,world,player,avatar,ritual,snacks,lighting,landscape,state,toast,goPlace,setMode,setTime,togglePhoto,resetInput,visitNightWalk,nightAmbience,flora}){
 const M=world.M,art=createPilgrimageArt(M,world.physics),groups=[],sites=[],clock={time:0},stats={near:null,active:null,night:false,visits:0};
 let saved={coins:6000,bag:{},fortune:null,fortuneArchive:[],fortuneDeck:null,ema:[],sidePrayers:{},sideFortunes:{},goshuin:{},tied:0,washed:false,prayers:0,seen:[],equipped:null};
 try{const s=JSON.parse(localStorage.getItem('inari-pilgrimage-v32'));if(s&&typeof s==='object'){saved={...saved,...s,coins:Number.isFinite(s.coins)?Math.max(0,s.coins):6000,bag:s.bag||{}};}}catch{}
 function save(){try{localStorage.setItem('inari-pilgrimage-v32',JSON.stringify(saved));}catch{}state.pilgrimage=saved;}
 save();
 const launcher=document.createElement('button');launcher.id='journey';launcher.className='ui';launcher.textContent='⛩ 參拜手帖';document.body.append(launcher);
 const interact=document.createElement('button');interact.id='siteAction';interact.className='ui';interact.hidden=true;document.body.append(interact);
 const dialog=document.createElement('dialog');dialog.id='journeyDialog';dialog.innerHTML='<div class="dialog-head"><div><span class="eyebrow">INARI · A PILGRIM’S JOURNAL</span><h2 id="journeyTitle"></h2></div><button id="journeyClose" aria-label="關閉參拜手帖">×</button></div><div id="journeyBody"></div>';document.body.append(dialog);
 const title=dialog.querySelector('h2'),body=dialog.querySelector('#journeyBody');let mealReturn=null,action=null,held=null,night=false,nightBackup=null,audio=null,waterSound=null;const tones=[];
 function open(name,html){resetInput();dialog.classList.toggle('journal-home',name==='稻荷山・參拜手帖');dialog.classList.remove('market-showcase','fortune-showcase','fortune-desk','shrine-desk','ema-desk','goshuin-book');title.textContent=name;body.innerHTML=html;if(stats.previewSite){const s=stats.previewSite;button('近看現場細節',()=>{close();stats.focus=s;setTimeout(()=>{if(!action&&stats.focus===s)stats.focus=null;},10000);});}if(!dialog.open)dialog.showModal();}
 function returnJournalFocus(){if(dialog.contains(document.activeElement))document.querySelector('#scene')?.focus({preventScroll:true});}
 function close(){dialog.close();resetInput();returnJournalFocus();}
 dialog.querySelector('#journeyClose').onclick=close;dialog.addEventListener('close',()=>{resetInput();returnJournalFocus();});
 function button(text,fn,parent=body){const b=document.createElement('button');b.className='journey-btn';b.textContent=text;b.onclick=fn;parent.append(b);return b;}
 const sphere=new THREE.SphereGeometry(1,24,16),box=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,24);
 const mats=new Map();function mat(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.75}));return mats.get(color);}
 function mesh(g,geo,m,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);return o;}
 function plaque(g,text,x,y,z,w=2.5,h=.65){const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#eee3c9';ctx.fillRect(0,0,768,192);ctx.strokeStyle='#a6874e';ctx.lineWidth=10;ctx.strokeRect(9,9,750,174);ctx.fillStyle='#3b352a';ctx.font='48px serif';ctx.textAlign='center';ctx.fillText(text,384,115);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return mesh(g,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),x,y,z);}
 function addSite(id,name,place,dx,dz,range=6){const p=world.places[place],s={id,name,place,x:p.x+dx,z:p.z+dz,range};
 if(id==='shop'){
  const start={x:s.x,z:s.z},trees=world.physics.bodies.filter(b=>/trunk/.test(b.name));
  const footprint=[[0,0],[-2.6,0],[2.6,0],[-2.6,-1.6],[2.6,-1.6],[-2.6,1.6],[2.6,1.6],[1.7,5.3],[-1,5.3]];
  let best=null;
  for(let r=0;r<=60&&!best;r+=1.5)for(let j=0;j<32;j++){
   const a=j/32*Math.PI*2,x=start.x+Math.cos(a)*r,z=start.z+Math.sin(a)*r,y=world.walkHeight(x,z);
   if(!Number.isFinite(y))continue;
   const blocked=footprint.some(([dx,dz])=>{
    const xx=x+dx,zz=z+dz,h=world.walkHeight(xx,zz);
    return !Number.isFinite(h)||Math.abs(h-y)>1.8||world.physics.collides(xx,h,zz);
   });
   if(blocked||trees.some(t=>Math.hypot(t.x-x,t.z-z)<5||Math.hypot(t.x-x-1.7,t.z-z-5.3)<8))continue;
   best={x,z};break;
  }
  if(best)Object.assign(s,best);
  s.clearPlacement=!!best;
 }
 if(/^art(?:2|3)?$/.test(id)){const spot=world.fixtureLayout.near(world,s.x,s.z,1.98,17);if(spot){Object.assign(s,spot);world.fixtureLayout.record(name,spot,1.98);}}
 s.y=world.walkHeight(s.x,s.z);if(!Number.isFinite(s.y))s.y=p.y||0;const g=new THREE.Group();g.position.set(s.x,s.y,s.z);g.name=name;scene.add(g);s.group=g;sites.push(s);groups.push(g);return s;}
 function collider(s,x,z,w,h,d){world.physics.box(s.name,s.x+x,s.y+h/2,s.z+z,w,h,d);}
 const wash=addSite('wash','手水舎・淨手','gate',-6,-12,9);
 const washB=MAP.buildings.find(b=>b.id===105449723);if(washB){const bb=footprintBox(washB);wash.x=bb.x;wash.z=bb.z;wash.y=world.walkHeight(bb.x,bb.z);wash.group.position.set(wash.x,wash.y,wash.z);}
 mesh(wash.group,box,M.wall,0,.65,0,2.3,1.1,1.3);let water=mesh(wash.group,box,new THREE.MeshStandardMaterial({color:'#70b6bf',transparent:true,opacity:.72,roughness:.18,metalness:.2}),0,1.23,0,2,.05,1);collider(wash,0,0,2.3,1.3,1.3);
 let ladle=new THREE.Group();wash.group.add(ladle);mesh(ladle,cylinder,M.wood,.3,1.4,.2,.05,.08,.05);const stick=mesh(ladle,box,M.wood,.3,1.38,.65,.05,.05,1.1);mesh(ladle,cylinder,M.rope,.3,1.4,.1,.17,.13,.17);plaque(wash.group,'手水 · 心を清める',0,2.1,0);
 const shop=addSite('shop','參道茶食・白狐小舖','entrance',-18,-12,10);
 mesh(shop.group,box,M.darkWood,0,.65,0,4,1.3,1.4);mesh(shop.group,box,M.wood,0,1.35,0,4.3,.12,1.7);collider(shop,0,0,4,1.45,1.4);plaque(shop.group,'稲荷寿司 · 茶 · 狐面',0,2.7,0,4);
 const charms=addSite('charms','授與所・御守','hall',-7,7,10);mesh(charms.group,box,M.wood,0,.7,0,3.2,1.4,1);collider(charms,0,0,3.2,1.4,1);plaque(charms.group,'授与所 · 願いを結ぶ',0,2.7,0,3.4);
 const fortunes=addSite('fortune','御神籤・抽籤','hall',-10,-8,8);mesh(fortunes.group,box,M.darkWood,0,.8,0,1.8,1.6,1);mesh(fortunes.group,cylinder,M.redEdge,0,1.9,0,.27,.6,.27);plaque(fortunes.group,'おみくじ · 御神籤',0,2.7,0);collider(fortunes,0,0,1.8,1.6,1);
 const tie=addSite('tie','結籤所・結下心事','gate',-10,3,7);for(const x of [-1.6,1.6])mesh(tie.group,cylinder,M.darkWood,x,1.25,0,.06,2.5,.06);for(const h of [.9,1.5,2.1])mesh(tie.group,box,M.rope,0,h,0,3.2,.03,.03);plaque(tie.group,'結籤所',0,2.8,0);
 const tiedGroup=new THREE.Group();tie.group.add(tiedGroup);function tiedDisplay(){tiedGroup.clear();for(let i=0;i<Math.min(saved.tied,36);i++){const p=mesh(tiedGroup,box,M.white,-1.4+(i%12)*.25,.82+Math.floor(i/12)*.6,.04,.18,.16,.04);p.rotation.z=.3;}}tiedDisplay();
 const stone=addSite('stone','奧社奉拜所・重輕石','okusha',11,8.2,9);
 const kagura=addSite('kagura','中央舞台・御神樂','haiden',2.75,-2.55,12);
 const fall=fitWaterfallSite(addSite('waterfall','山林之瀧・坐石修行','yotsu',0,0,2),world,flora);
 const artSites=[addSite('art','光の稲穂・攝影裝置','gate',7,9,8),addSite('art2','狐の輪・攝影裝置','okusha',7,7,8),addSite('art3','星の窓・京都眺望','yotsu',-1,0,8)];
 const gold=new THREE.MeshStandardMaterial({color:'#ba904a',metalness:.65,roughness:.3});
 artSites.forEach((s,i)=>{mesh(s.group,cylinder,M.wall,0,.15,0,1.2,.3,1.2);const ring=mesh(s.group,new THREE.TorusGeometry(1.15,.055,10,64),gold,0,1.8,0);for(let j=0;j<7;j++){const a=j/7*Math.PI*2;mesh(s.group,sphere,gold,Math.cos(a)*.85,1.8+Math.sin(a)*.85,.05,.08,.17,.06);}plaque(s.group,['光の稲穂','狐の輪','星の窓'][i]+' · 原創藝術',0,.6,.25,2,.4);collider(s,0,0,2.3,.4,2.3);});
 const artRefs={};for(const s of sites){if(s.id==='kagura'||s.id==='stone')continue;const a=art.build(s,artSites.indexOf(s));artRefs[s.id]=a;}water=artRefs.wash.water;ladle=artRefs.wash.ladle;tie.group.add(tiedGroup);artSites[2].group.rotation.y=Math.PI/2;
 const omokaru=createOmokaru(stone,world);stone.cameraTarget=omokaru.cameraTarget;stats.stone=omokaru.stats;
 const kaguraStage=createKaguraStage(kagura,M,world.physics);kagura.cameraTarget=kaguraStage.cameraTarget;stats.kagura=kaguraStage.stats;stats.prayer=ritual.stats;
 const washing=createWashAnimation({player,avatar,site:wash,ladle,world});stats.wash=washing.stats;wash.cameraOffset=washing.cameraOffset;wash.cameraTarget=washing.focus;wash.cameraFraming=washing.framing;
 const waterfallScene=createWaterfallScene(fall,M,world.physics),waterfallAmbience=createWaterfallAmbience(fall),meditation=createWaterfallMeditation({player,avatar,site:fall,scene:waterfallScene,world});fall.waterfallView=waterfallScene.meditation;stats.waterfall=waterfallScene.stats;stats.waterfallAudio=waterfallAmbience.stats;stats.meditation=meditation.stats;

 const lamps=new THREE.Group();scene.add(lamps);
 for(const route of MAP.routes){
  const track=pathSamples(route.p,10.5);
  for(let i=1;i<Math.min(4,track.length-1);i++){
   const p=track[i],layout=world.fixtureLayout,spot=layout.beside(world,p,i%2?1:-1,.42,1.62);
   if(!spot)continue;
   const {x,y,z}=spot;mesh(lamps,box,M.wall,x,y+.23,z,.40,.46,.40);mesh(lamps,box,M.glow,x,y+.64,z,.26,.26,.26);mesh(lamps,box,M.wall,x,y+.83,z,.49,.10,.49);
   world.physics.box('山路石燈',x,y+.45,z,.40,.90,.40);layout.record('山路石燈',spot,.42);
  }
 }
 const vista=world.places.yotsu,heroLamps=[-2.5,2.5].map(d=>{const spot=world.fixtureLayout.near(world,vista.x+.3,vista.z+d,.98,6.5);if(!spot)return null;const {x,y,z}=spot;world.physics.circle('觀景石燈籠',x,y+1,z,.62,2.3);world.fixtureLayout.record('觀景石燈籠',spot,.98);return art.nightLantern(scene,x,y,z);}).filter(Boolean);heroLamps.forEach(l=>l.setNight(false));const glowLights=[];for(let i=0;i<1;i++){const l=new THREE.PointLight('#ffbe61',0,15,2);scene.add(l);glowLights.push(l);}
 const sideShrines=createSideShrines(world,scene),ema=createEmaRack(world,scene);sites.push(...sideShrines.shrines,...sideShrines.fortuneSites);if(ema){ema.refresh(saved.ema);sites.push(ema);}
 stats.sideShrines={count:sideShrines.shrines.length,tubes:sideShrines.fortuneSites.length,missing:sideShrines.missing,ema:ema?.stats};let sideFocus=null,arrivalSite=null;
 const nightSky=new THREE.Mesh(new THREE.SphereGeometry(16000,24,16),new THREE.MeshBasicMaterial({color:'#071225',side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(nightSky);nightSky.visible=false;nightSky.renderOrder=-4;const starPoints=new Float32Array(320*3);for(let i=0;i<320;i++){const a=i*2.39996,y=.15+(i*.618%1)*.82,r=Math.sqrt(1-y*y);starPoints[i*3]=Math.cos(a)*r*12000;starPoints[i*3+1]=y*12000;starPoints[i*3+2]=Math.sin(a)*r*12000;}const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(starPoints,3));const starField=new THREE.Points(sg,new THREE.PointsMaterial({color:'#e2e9ff',size:1.6,sizeAttenuation:false,fog:false}));starField.visible=false;scene.add(starField);
 const cityLights=new THREE.Group();scene.add(cityLights);const lp=new Float32Array(1100*3);for(let i=0;i<1100;i++){const a=(i*.61803398875%1-.5)*1.9,r=1700+(i*37%1800);lp[i*3]=480-Math.cos(a)*r;lp[i*3+1]=-430+(i*13%330);lp[i*3+2]=-100+Math.sin(a)*r;}const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));cityLights.add(new THREE.Points(lg,new THREE.PointsMaterial({color:'#ffd59a',size:2,sizeAttenuation:false,transparent:true,opacity:.9,fog:false})));cityLights.visible=false;
 function setNight(v){if(v===night)return;night=v;stats.night=v;heroLamps.forEach(l=>l.setNight(v));nightSky.visible=v;starField.visible=v;cityLights.visible=v;if(v){nightBackup={sun:lighting.sun.intensity,fill:lighting.fill.intensity,fog:scene.fog,env:scene.environmentIntensity,exposure:window.inari.renderer?.toneMappingExposure};lighting.sky.visible=false;lighting.sun.intensity=.1;lighting.fill.intensity=.3;lighting.fill.color.set('#748ab7');scene.environmentIntensity=.06;scene.fog=new THREE.FogExp2('#101d31',.00022);M.glow.emissiveIntensity=2.8;scene.traverse(o=>{const m=o.material;if(m?.alphaTest>0){m.userData.artNightAlpha??={coverage:m.alphaToCoverage,test:m.alphaTest};m.alphaToCoverage=false;m.alphaTest=Math.max(.6,m.alphaTest);m.needsUpdate=true;}});landscape.setNight?.(true);}else{lighting.sky.visible=true;lighting.fill.color.set('#c1d7ef');lighting.sun.intensity=nightBackup.sun;lighting.fill.intensity=nightBackup.fill;scene.environmentIntensity=nightBackup.env;scene.fog=nightBackup.fog;M.glow.emissiveIntensity=state.dusk?1.6:.26;scene.traverse(o=>{const m=o.material,a=m?.userData.artNightAlpha;if(a){m.alphaToCoverage=a.coverage;m.alphaTest=a.test;m.needsUpdate=true;}});landscape.setNight?.(false);}state.night=v;}
 function amulet(g,item,scale=1){const obj=art.amulet(item);obj.scale.setScalar(scale);g.add(obj);return g;}
 GOODS.filter(x=>['red','purple','business','study','travel'].includes(x.id)).forEach((item,i)=>{const g=amulet(new THREE.Group(),item);g.position.set(-1.25+i*.56,1.3,.25);charms.group.add(g);});
 function product(id){return art.product(GOODS.find(x=>x.id===id));}
 // Product previews are baked once at build time; no second WebGL context on entry.
 for(const [i,id]of ['sushi','senbei','matcha','mask'].entries()){const g=product(id);g.position.set(-1.4+i*.9,1.3,.3);shop.group.add(g);}
 // Batch only immutable display meshes. Interactive stones, ladles, water and tied papers stay independent.
 for(const s of sites.filter(s=>!['wash','stone','waterfall'].includes(s.id))){
  s.group.updateWorldMatrix(true,true);const inverse=s.group.matrixWorld.clone().invert(),batches=new Map();
  s.group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.material?.transparent||o.parent===tiedGroup)return;for(let node=o.parent;node&&node!==s.group;node=node.parent)if(node===kaguraStage.dancer.root||node===ema?.userBoards||node===s.pivot)return;const key=o.geometry.uuid+o.material.uuid+o.castShadow+o.receiveShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);});
  for(const list of batches.values()){if(list.length<2)continue;const first=list[0],batch=new THREE.InstancedMesh(first.geometry,first.material,list.length);batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.name='靜態展示合批';list.forEach((o,i)=>{batch.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));o.parent.remove(o);});batch.computeBoundingSphere();s.group.add(batch);}
 }
 function equip(id){if(held){player.remove(held);held.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&!o.geometry.userData.shared&&!([sphere,box,cylinder].includes(o.geometry)))o.geometry.dispose();});}held=null;saved.equipped=id;if(id){held=product(id);held.position.set(id==='mask'?.42:.65,id==='mask'?1.18:.65,.28);held.scale.setScalar(id==='mask'?.7:GOODS.findIndex(x=>x.id===id)>3?.45:1);player.add(held);}save();}
 if(saved.equipped&&saved.bag[saved.equipped])equip(saved.equipped);
 function spend(n){if(saved.coins<n){toast('旅費不足，可在手帖補領遊戲旅費。');return false;}saved.coins-=n;save();return true;}
 function money(){return '<p class="wallet">旅費 '+saved.coins.toLocaleString()+' 円 <small>遊戲代幣・非真實價格</small></p>';}
 function shopUI(kind,market=null){const list=market?market.catalog.goods.map(id=>GOODS.find(x=>x.id===id)).filter(Boolean):GOODS.filter(x=>kind==='charms'?['red','purple','business','study','travel'].includes(x.id):['sushi','senbei','matcha','mask'].includes(x.id));if(market)stats.previewSite=null;open(market?market.name:kind==='charms'?'授與所・選一份祝福':'參道茶食・白狐小舖',money()+(market?'<div class="market-store-heading"><span>'+esc(market.catalog.name)+'</span><p>'+esc(market.source.sign)+' · '+(market.source.id.startsWith('yatai-')?'祭典屋台':'參道町屋')+'</p></div>':'')+'<p class="muted">遊戲內旅費交易。選一份點心或祝福，放進隨身袋，再繼續散步。</p><div class="goods-grid">'+list.map(x=>'<article><div class="product-preview"><img src="'+art.thumbnail(x)+'" alt="'+x.name+'的立體款式"></div><h3>'+x.name+'</h3><p>'+x.desc+'</p><button class="journey-btn" data-buy="'+x.id+'">'+(kind==='charms'?'授與':'購買')+' · '+x.price+' 円</button></article>').join('')+'</div>');dialog.classList.toggle('market-showcase',!!market);if(market?.catalog.fortune)button('抽御神籤 · 100 円',fortuneUI);body.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const x=GOODS.find(x=>x.id===b.dataset.buy);if(spend(x.price)){saved.bag[x.id]=(saved.bag[x.id]||0)+1;equip(x.id);const receipt={shop:market?.id||kind,item:x.id,price:x.price};stats.lastPurchase=receipt;if(market){market.sales++;window.inari?.streetLife?.reactToSale(market.source.id)}saved.purchases=[...(saved.purchases||[]).slice(-23),receipt];save();shopUI(kind,market);toast('已取得 '+x.name+'，已放進隨身袋。');}});}
 function inventory(){open('隨身袋與旅費',money()+'<p>選擇手持或配戴，留在旅行照片裡。壽司、仙貝與抹茶可在此享用；其他參道小食包好外帶。</p>');for(const x of GOODS)if(saved.bag[x.id]>0){const row=document.createElement('article');row.className='bag-row';row.innerHTML='<strong>'+x.name+' × '+saved.bag[x.id]+'</strong>';body.append(row);button('手持／配戴',()=>{equip(x.id);toast('已配戴 '+x.name);},row);if(['sushi','senbei','matcha'].includes(x.id))button(x.id==='matcha'?'喝抹茶':'享用',()=>{const previous=saved.equipped;saved.bag[x.id]--;mealReturn=previous!==x.id&&saved.bag[previous]>0?previous:null;equip(x.id);startAction('eat',7.4,()=>{equip(mealReturn);mealReturn=null;toast(x.id==='matcha'?'抹茶的回甘，留在山風裡。':'慢慢享用，收好包裝再繼續散步。');});close();save();},row);}button('收起手持物',()=>{equip(null);snacks.choose('none');});button('補領旅費 + 3,000 円',()=>{saved.coins+=3000;save();inventory();});}
 function fortuneReading(f){if(!f)return null;if(f.cycle&&OMikuji[f.number-1])return OMikuji[f.number-1];const old=FORTUNES[f.index];if(!old)return null;return{number:Number(f.number)||1,grade:old[0],motif:'旅途舊籤',poem:old[1].split(/[，。]/).filter(Boolean),meaning:old[2],details:old.slice(3)};}
 function archivedFortunes(){return Array.isArray(saved.fortuneArchive)?saved.fortuneArchive:[];}
 function fortuneUI(){
  if(action)return;
  stats.previewSite=null;
  const drawn=Array.isArray(saved.fortuneDeck?.used)?saved.fortuneDeck.used.length:0;
  const msg=drawn===108?'下次抽籤將開始新一輪。':drawn?`本輪已抽過 ${drawn} 番，還有 ${108-drawn} 番。`:'抽完一輪前，每番只會出現一次。';
  open('御神籤・搖筒問心',money()+'<div class="fortune-intro"><span aria-hidden="true">✿</span><p>一百零八番籤詩</p><small>'+msg+'</small></div><p>靜心想一件事，再抽一張籤。籤紙會留在紀錄裡，下次仍可以抽新的。</p>');
  dialog.classList.add('fortune-desk');dialog.scrollTop=0;
  button('搖筒抽籤 · 100 円',()=>{
   if(saved.coins<100){toast('旅費不足，可在手帖補領遊戲旅費。');return;}
   startAction('draw',2.8,()=>{
    if(!spend(100))return;
    const history=archivedFortunes().slice();
    if(saved.fortune&&!saved.fortune.cycle&&!history.some(f=>f.index===saved.fortune.index&&!f.cycle))history.push(saved.fortune);
    const draw=pickFortune(saved.fortuneDeck||{last:saved.fortune?.number});
    saved.fortune={number:draw.number,cycle:draw.cycle};saved.fortuneDeck=draw.deck;saved.fortuneArchive=[...history,saved.fortune];
    save();showFortune();
   });
  });
  if(saved.fortune)button('展開手上的籤',()=>showFortune());
  if(archivedFortunes().length)button('歷次抽籤',fortuneHistory);
 }
 function fortuneHistory(){
  stats.previewSite=null;open('御神籤・歷次紀錄','<div class="fortune-history"></div>');dialog.classList.add('fortune-desk');dialog.scrollTop=0;
  const list=body.querySelector('.fortune-history');
  for(const f of archivedFortunes().slice().reverse()){
   const card=fortuneReading(f);if(!card)continue;
   const row=button('第 '+card.number+' 番 ・ '+card.grade+(f.tied?' ・ 已結籤':''),()=>showFortune(f),list);
   const label=document.createElement('small');label.textContent=card.motif;row.append(label);
  }
  button('回到抽籤',fortuneUI);
 }
 function showFortune(reading=saved.fortune){
  const f=reading,a=fortuneReading(f);if(!a)return fortuneUI();
  const active=f===saved.fortune||!!(f.cycle&&f.cycle===saved.fortune?.cycle&&f.number===saved.fortune?.number);
  stats.previewSite=null;
  const labelsHtml=labels.map((l,i)=>'<div><dt>'+l+'</dt><dd>'+a.details[i]+'</dd></div>').join('');
  open('展讀御神籤','<article class="fortune-paper fortune-sheet" data-fortune-number="'+a.number+'"><header><span class="fortune-blossom" aria-hidden="true">✿</span><small>稻荷・星旅　原創御神籤</small><p class="fortune-number">第 '+a.number+' 番</p><h3>'+a.grade+'</h3><span class="fortune-motif">'+a.motif+'</span></header><div class="fortune-poem">'+a.poem.map(x=>'<span>'+x+'</span>').join('')+'</div><p class="fortune-meaning">'+a.meaning+'</p><dl>'+labelsHtml+'</dl><p class="fortune-seal" aria-hidden="true">稻荷<br>星旅</p></article><p class="muted fortune-note">遊戲原創籤紙。你也可以把手上的籤繫在結籤所。</p>');
  dialog.classList.add('fortune-showcase');dialog.scrollTop=0;
  button('收好籤紙',()=>{close();toast('籤紙已存入參拜手帖。');});
  if(active&&!f.tied)button('到結籤所',()=>{close();travel('tie');});
  button('再抽一支',fortuneUI);if(archivedFortunes().length)button('歷次抽籤',fortuneHistory);
 }
 function stopSound(){try{waterSound?.stop();}catch{}waterSound=null;for(const o of tones){try{o.stop();}catch{}}tones.length=0;}
 function ritualSound(type,duration){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();if(type==='wash'){const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=type==='wash'?2200:900;gain.gain.value=.22;src.connect(filter).connect(gain).connect(audio.destination);src.start();src.stop(audio.currentTime+duration);waterSound=src;}if(type==='kagura')for(let i=0;i<8;i++){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*2.5;o.type='sine';o.frequency.value=[587,659,784,880][i%4];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+2.2);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+2.3);tones.push(o);}}catch{}}
 function startAction(type,duration,done){if(action)return false;avatar.acting.reset();if(type==='waterfall'){if(Math.hypot(player.position.x-fall.interaction.x,player.position.z-fall.interaction.z)>2.1){toast('請走過木門，靠近水潭前的修行石。');return false;}meditation.begin();setMode('walk');window.inari.setView(.55,.18,9);}if(type==='wash'){if(!washing.begin()){toast('請先到手水盆前的空位，再開始淨手。');return false;}setMode('walk');window.inari.setView(.7,.12,5);}if(type==='eat'){setMode('walk');avatar.acting.beginMeal(held,saved.equipped)}if(type==='kagura'){setMode('walk');for(const dx of [-2.3,2.3,-3.2,3.2]){const x=kagura.x+dx,z=kagura.z+4.1,y=world.walkHeight(x,z);if(Number.isFinite(y)&&!world.physics.collides(x,y,z)){player.position.set(x,y,z);player.rotation.y=Math.atan2(kagura.x-x,kagura.z-z);break}}}resetInput();ritualSound(type,duration);action={type,duration,left:duration,done};stats.active=type;progress.classList.toggle('prayer-camera',type==='pray'||type==='sidepray');const id={wash:'wash',draw:'fortune',stone:'stone',tie:'tie',kagura:'kagura',waterfall:'waterfall'}[type];stats.focus=type==='sidepray'?sideFocus:type==='pray'?{id:'pray',x:ritual.site.position[0],y:ritual.site.floor+.9,z:ritual.site.position[2],angle:ritual.site.angle}:sites.find(s=>s.id===id)||null;close();return true;}
 const hands=new THREE.Group();player.add(hands);for(const side of [-1,1])mesh(hands,sphere,mat('#e9c74f'),side*.35,.85,.35,.09,.09,.09);hands.visible=false;const droplets=new THREE.Group();wash.group.add(droplets);for(let i=0;i<16;i++)mesh(droplets,sphere,mat('#a3dbe2'),Math.sin(i*2)*.25,1+i*.02,.3,.015,.05,.015);droplets.visible=false;
 const progress=document.createElement('div');progress.id='ritualProgress';progress.hidden=true;progress.setAttribute('role','status');document.body.append(progress);
 const actionNames={wash:['舀水・淨左手','淨右手','以掌心承水漱口','淨左手・沖洗杓柄'],pray:['投下賽錢','搖鈴・二鞠躬','二拍手・靜心祈願','一鞠躬'],draw:['靜心','輕搖籤筒','取出籤棒','展開籤紙'],stone:['先許下心願','估量石頭重量','雙手慢慢舉石','感受輕與重'],tie:['摺好籤紙','輕繞橫繩','將籤紙繫好','把心事交給山風'],eat:['拿好・聞一聞香氣','靠近嘴巴・慢慢享用','咀嚼・感受回甘','吃完了・收好包裝'],waterfall:['靜心合掌','聽水聲','緩緩呼吸','感謝與回禮'],kagura:['奉納心意','鈴聲起・舞袖展','祈禱・靜觀','感謝與回禮']};
 function emaUI(){
  if(!ema)return;stats.previewSite=null;
  open(ema.name,'<p>選一塊木牌，寫下想祈願的事，再用紅繩掛到架上。</p><div class="ema-choices"></div><figure class="ema-caption"><img alt="選定繪馬的圖案"><figcaption></figcaption></figure><form class="ema-editor"><label for="emaWish">寫下心願</label><textarea id="emaWish" required maxlength="36" rows="3" placeholder="願家人平安…"></textarea><p class="ema-counter" role="status">0／36 字 · 僅存於這台裝置</p><button class="journey-btn" type="submit">掛上繪馬</button></form>');
  dialog.classList.add('ema-desk');dialog.scrollTop=0;
  const choice=body.querySelector('.ema-choices'),preview=body.querySelector('.ema-caption img'),cap=body.querySelector('.ema-caption figcaption'),form=body.querySelector('.ema-editor'),input=body.querySelector('#emaWish');let style='study';
  for(const [id,name] of EMA_STYLES){const b=button(name,()=>{style=id;refresh();},choice);b.type='button';b.dataset.emaStyle=id;}
  function refresh(){const [,name]=EMA_STYLES.find(row=>row[0]===style);preview.src=ema.pictures[style];cap.textContent=input.value.trim()||name;choice.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.emaStyle===style));});body.querySelector('.ema-counter').textContent=[...input.value].length+'／36 字 · 僅存於這台裝置';}
  input.addEventListener('input',refresh);refresh();
  form.onsubmit=e=>{e.preventDefault();const wish=input.value.trim().replace(/\s+/g,' ').slice(0,36);if(!wish){input.focus();return;}saved.ema=[...(Array.isArray(saved.ema)?saved.ema:[]),{style,wish}].slice(-60);ema.refresh(saved.ema);save();close();stats.emaDetail=true;previewSiteView(ema,9000);toast('繪馬已掛上。願你把這份心意帶在身邊。');};
 }
 function goshuinBook(){
  stats.previewSite=null;open('御朱印帳',goshuinGallery(saved.goshuin));dialog.classList.add('goshuin-book');dialog.scrollTop=0;
  for(const card of body.querySelectorAll('[data-goshuin]')){
   const site=sideShrines.shrines.find(s=>s.key===card.dataset.goshuin);
   card.disabled=!site;
   if(site)card.onclick=()=>hasGoshuin(saved.goshuin,site.key)?showGoshuin(site):travel(site.id);
  }
 }
 function showGoshuin(site){
  const date=saved.goshuin?.[site.key];if(!hasGoshuin(saved.goshuin,site.key))return;
  stats.previewSite=null;open(site.name+'・御朱印','<div class="goshuin-feature">'+goshuinCard(site.shrine,date)+'</div><p class="goshuin-caption">遊戲原創御朱印・'+date+'</p><div class="goshuin-footer"></div>');
  dialog.classList.add('goshuin-book');dialog.scrollTop=0;button('回御朱印帳',goshuinBook,body.querySelector('.goshuin-footer'));
 }
 function completeSidePrayer(site){
  saved.sidePrayers={...saved.sidePrayers,[site.key]:(saved.sidePrayers?.[site.key]||0)+1};
  const newlyCollected=!hasGoshuin(saved.goshuin,site.key);
  if(newlyCollected)saved.goshuin={...saved.goshuin,[site.key]:currentStampDate()};
  save();toast(newlyCollected?'已收藏 '+site.name+' 的御朱印。':'已在 '+site.name+' 參拜。');
  if(newlyCollected)showGoshuin(site);
 }
 function sideShrineUI(site){
  const d=site.shrine;stats.previewSite=null;
  open(d.name,'<p class="shrine-sigil" style="--shrine-ink:'+d.color+'">'+d.mark+'</p><h3 class="shrine-deity">'+d.deity+'</h3><p class="shrine-wish">'+d.wish+'</p><p>面向小社，行兩禮、兩拍手、最後一禮。</p><p class="muted">遊戲中的想像小社，祈願主題參考日本各地的神社信仰。</p>');
  dialog.classList.add('shrine-desk');
  button('在此參拜',()=>{const {x,y,z}=site.stand;if(world.physics.collides(x,y,z)||action)return;player.position.set(x,y,z);player.rotation.y=Math.atan2(site.x-x,site.z-z);sideFocus=site;setMode('walk');ritual.pray(false);startAction('sidepray',PRAYER_DURATION,()=>completeSidePrayer(site));});
  if(hasGoshuin(saved.goshuin,site.key))button('展開御朱印',()=>showGoshuin(site));
  if(d.fortune)button('抽'+d.fortune,()=>themedUI(d));
 }
 function themedUI(d){
  const cards=thematicFortunes(d.id);if(!cards.length||action)return;stats.previewSite=null;
  open(d.fortune+'・'+d.name,money()+'<p class="shrine-sigil" style="--shrine-ink:'+d.color+'">'+d.mark+'</p><h3 class="shrine-deity">'+d.deity+'</h3><p class="shrine-wish">'+d.wish+'</p><p>從小社旁的籤筒抽取專屬籤詩。</p>');dialog.classList.add('shrine-desk');
  button('搖筒抽'+d.fortune+' · 100 円',()=>{if(saved.coins<100){toast('旅費不足。');return;}startAction('draw',2.8,()=>{if(!spend(100))return;const draw=pickFortune(saved.sideFortunes?.[d.id]?.deck,cards.length);saved.sideFortunes={...saved.sideFortunes,[d.id]:{deck:draw.deck,number:draw.number}};save();showThemed(d,draw.number);});});
  const last=saved.sideFortunes?.[d.id]?.number;if(last)button('展開上次的'+d.fortune,()=>showThemed(d,last));
 }
 function showThemed(d,number){
  const a=thematicFortunes(d.id)[number-1];if(!a)return;stats.previewSite=null;
  const tags={wealth:['收支','合作','累積'],bonds:['相識','溝通','相處'],health:['日常','身心','提醒']}[d.id];
  open(d.fortune,'<article class="fortune-paper fortune-sheet thematic-slip" data-themed-fortune="'+d.id+'" style="--shrine-ink:'+d.color+'"><header><span class="fortune-blossom">'+d.mark+'</span><small>'+d.name+'・原創'+d.fortune+'</small><p class="fortune-number">第 '+number+' 番</p><h3>'+a[0]+'</h3><span class="fortune-motif">'+d.wish+'</span></header><div class="fortune-poem">'+a[1].split('/').map(line=>'<span>'+line+'</span>').join('')+'</div><p class="fortune-meaning">'+a[2]+'</p><dl>'+tags.map((tag,i)=>'<div><dt>'+tag+'</dt><dd>'+a[i+3]+'</dd></div>').join('')+'</dl></article><p class="muted">遊戲原創籤詩，作為散步時的心意。</p>');dialog.classList.add('fortune-showcase');dialog.scrollTop=0;button('收好籤紙',close);button('再抽一支',()=>themedUI(d));
 }
 function sideDirectory(){
  stats.previewSite=null;open('繪馬與九座小社','<p>走訪九座遊戲小社，完成參拜便可收集御朱印。財運、良緣與健康小社有專屬籤筒。</p><div class="side-directory"></div>');dialog.classList.add('shrine-desk');
  const list=body.querySelector('.side-directory');for(const side of sideShrines.shrines){const b=button(side.name+'・'+side.wish,()=>travel(side.id),list);b.dataset.sideTravel=side.id;}if(ema)button('前往繪馬掛所',()=>travel(ema.id),list);
 }
 function perform(id){const s=sites.find(x=>x.id===id);if(!s)return;stats.previewSite=s;const p=s.interaction||s,d=Math.hypot(player.position.x-p.x,player.position.z-p.z);if(d>s.range+1){toast('請先走近 '+s.name);return;}if(s.market)return shopUI('food',s);if(s.id==='ema')return emaUI();if(s.id.startsWith('shrine-'))return sideShrineUI(s);if(s.id.startsWith('theme-'))return themedUI(s.shrine);if(id==='shop'||id==='charms')return shopUI(id);if(id==='fortune')return fortuneUI();if(id==='wash'){open(s.name,'<p>依序淨左手、右手，以左掌承水漱口，再淨左手與杓柄。小星星會在水盆前持杓，依序沖洗雙手、以掌心承水，再沖淨杓柄。</p>');button('開始淨手',()=>startAction('wash',12,()=>{saved.washed=true;save();toast('手水完成，帶著清淨的心前往參拜。');}));}else if(id==='tie'){if(!saved.fortune){toast('先抽一支籤，再帶籤紙到這裡。');return;}open(s.name,'<p>把籤紙繫在指定的結籤繩上，不綁在樹枝或建築。</p>');button('結籤・放下心事',()=>startAction('tie',4,()=>{const prior=saved.fortune;saved.fortuneArchive=archivedFortunes().map(f=>prior?.cycle===f.cycle&&prior?.number===f.number?{...f,tied:true}:f);saved.fortune=null;saved.tied++;save();tiedDisplay();toast('籤紙已繫上，願你安心繼續前行。');}));}else if(id==='stone'){open(s.name,'<p>面向石柱上的圓石，在心中許願，再選一顆用雙手慢慢舉起。比預想輕象徵願望可期，比預想重則提醒自己繼續努力。</p><label>寫下心願（僅留在此畫面）<input id="stoneWish" maxlength="100" placeholder="願家人平安…"></label>');for(const [i,label] of [[0,'許願・舉起左石'],[1,'許願・舉起右石']])button(label,()=>{if(!omokaru.begin(i,player)){toast('請走到石柱前的空位。');return;}setMode('walk');startAction('stone',6,()=>{const n=new Uint32Array(1);crypto.getRandomValues(n);open('重輕石・心的回答','<p class="stone-answer">'+(n[0]%2?'比預想中輕，願你把握機緣。':'比預想中重，願你積蓄力量，慢慢實踐。')+'</p><p>這是遊戲中的許願體驗。</p>');});});}else if(id==='waterfall'){open(s.name,'<p>坐在岸邊的修行石上，雙手合掌，靜聽瀑布落入水潭。</p>');button('開始 15 秒靜心修行',()=>startAction('waterfall',15,()=>{saved.seen.push('waterfall');save();toast('水聲漸遠，把安定帶回旅程。');}));}else if(id==='kagura'){open(s.name,money()+'<p>在中央舞台觀賞巫女獻舞。日間以金鈴與五色垂帶獻舞，夜間以折扇演出，由燈籠和舞台燈照亮。</p><label>演出時段<select id="kaguraTime"><option value="day"'+(!night?' selected':'')+'>白天・鈴舞</option><option value="night"'+(night?' selected':'')+'>夜間・扇舞</option></select></label><label>祈願內容<select id="prayerIntent"><option>家內安全</option><option>商賣繁昌</option><option>身體健全</option><option>學業成就</option><option>心願成就</option><option>神恩感謝</option></select></label>');button('奉納御神樂 · 300 円',()=>{const intent=body.querySelector('#prayerIntent').value;if(spend(300)){setTime(body.querySelector('#kaguraTime').value);startAction('kagura',24,()=>{saved.prayers++;save();toast('御神樂奉納完成・'+intent);});}});}else if(id.startsWith('art')){open(s.name,'<p>以稻穗、狐與星光為靈感的原創攝影藝術裝置。靠近選擇角度，把小星星與旅途中收集的御守一起拍進照片。</p>');button('進入攝影模式',()=>{close();togglePhoto();});button(night?'切回日光':'看看夜間燈光',()=>{close();setTime(night?'day':'night');stats.focus=s;setTimeout(()=>{if(!action&&stats.focus===s)stats.focus=null;},12000);});}}

 function safeArrival(s){if(s.arrival)return s.arrival;if(s.id==='stone')for(const [dx,dz]of [[0,4.4],[-1.2,4.1],[1.2,4.45],[0,5.5]]){const x=s.x+dx,z=s.z+dz,y=world.walkHeight(x,z);if(Number.isFinite(y)&&!world.physics.collides(x,y,z))return{x,y,z};}for(let r=2.8;r<12;r+=.6)for(let i=0;i<24;i++){const a=i/24*Math.PI*2+Math.PI/2,x=s.x+Math.cos(a)*r,z=s.z+Math.sin(a)*r,y=world.walkHeight(x,z);if(Number.isFinite(y)&&!world.physics.collides(x,y,z))return{x,y,z};}return world.safePlace(s.place);}
 function previewSiteView(site,length){stats.focus=site;window.inari.setView(site.angle,.12,5);const focus=Symbol();site.viewToken=focus;setTimeout(()=>{if(!action&&stats.focus===site&&site.viewToken===focus)stats.focus=null;},length);}
 function travel(id){const s=sites.find(s=>s.id===id);if(!s)return;close();goPlace(s.place);const p=safeArrival(s);player.position.set(p.x,p.y,p.z);window.inari.setView(Math.atan2(p.x-s.x,p.z-s.z),.16,6);if(id==='ema'||id.startsWith('shrine-')||id.startsWith('theme-')){arrivalSite=s;player.rotation.y=Math.atan2(s.x-p.x,s.z-p.z);stats.emaDetail=false;if(id==='ema'||id.startsWith('shrine-'))previewSiteView(s,12000);}if(id==='waterfall'){window.inari.setView(fall.angle,.12,5.5);player.rotation.y=fall.angle+Math.PI;stats.focus=fall;}stats.visits++;toast(id==='waterfall'?'沿石階走到水潭前的修行石。':'已來到 '+s.name);}
 const journalActions={bag:inventory,fortune:()=>{if(saved.fortune)showFortune();else if(archivedFortunes().length)fortuneHistory();},night:()=>{close();visitNightWalk();},nightview:()=>{close();setTime('night');goPlace('yotsu');},pray:()=>{close();goPlace('hall');toast('走近賽錢箱，按「投幣・搖鈴參拜」。');}};
 function journal(){if(action)return;stats.previewSite=null;open('稻荷山・參拜手帖',journalMarkup(sites,saved.coins,saved.fortune));body.querySelectorAll('[data-travel]').forEach(b=>b.onclick=()=>travel(b.dataset.travel));body.querySelectorAll('[data-journal-action]').forEach(b=>b.onclick=()=>journalActions[b.dataset.journalAction]?.());button('繪馬與九座小社',sideDirectory);button('御朱印帳',goshuinBook);if(nightAmbience.stats.supported){const sound=button('夜間環境音',async()=>{const on=await nightAmbience.toggle();sound.setAttribute('aria-pressed',String(on));toast(on?'夜間環境音已開啟':'夜間環境音已關閉');});sound.setAttribute('aria-pressed',String(nightAmbience.stats.enabled));}}
 bindJournalShortcuts({dialog,journal,close,travel,actions:journalActions,busy:()=>!!action});launcher.title='參拜手帖 · J';launcher.setAttribute('aria-keyshortcuts','J');dialog.setAttribute('aria-labelledby','journeyTitle');
 launcher.onclick=journal;interact.onclick=()=>{if(stats.near)perform(stats.near);};
 addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&!dialog.open&&!document.querySelector('dialog[open]')&&stats.near)perform(stats.near);if(e.code==='Escape'&&action){cancel();toast('已結束體驗');}});
 const market=createMarketSites(world,scene);sites.push(...market.sites);Object.assign(stats,{marketCount:market.sites.length,marketTotal:market.total,unreachableMarkets:market.unreachable});
 function cancel(){arrivalSite=null;ritual.stop?.();if(sideFocus)sideFocus.pivot.rotation.x=0;sideFocus=null;const ate=action?.type==='eat';avatar.acting.reset();if(ate){equip(mealReturn);mealReturn=null}washing.reset();meditation.reset();omokaru.reset();action=null;stats.active=null;stats.focus=null;stopSound();avatar.body.rotation.x=0;progress.hidden=true;ladle.rotation.z=0;}
 return{art,market,kaguraStage,omokaru,sideShrines,ema,waterfallScene,waterfallAmbience,meditation,cancel,stats,sites,saved,journal,travel,perform,inventory,showFortune,setNight,pray(){if(action||!ritual.near(player.position)||!ritual.prepare(player))return;ritual.pray();setMode('walk');startAction('pray',PRAYER_DURATION,()=>{saved.prayers++;save();toast('二禮二拍手一禮・參拜完成。');});},update(dt,time,mode){clock.time=time;art.update(time);for(const a of artSites){const lit=night&&(mode==='overview'||Math.hypot(player.position.x-a.x,player.position.z-a.z)<92);for(const m of a.glowMaterials)m.emissiveIntensity=lit?1.17:0;a.artLamp.intensity=lit?9.4:0;a.artLamp.visible=lit;}waterfallScene.update(dt,time,player,action?.type==='waterfall',mode);waterfallAmbience.update(player,action?.type==='waterfall',mode);let nearest=null,dist=Infinity;for(const s of sites){const d=Math.hypot(player.position.x-s.x,player.position.z-s.z);s.group.visible=d<125||mode==='overview';const reach=s.interaction?Math.hypot(player.position.x-s.interaction.x,player.position.z-s.interaction.z):d;if(reach<s.range&&reach<dist){nearest=s;dist=reach;}}if(arrivalSite&&(mode!=='walk'||Math.hypot(player.position.x-arrivalSite.arrival.x,player.position.z-arrivalSite.arrival.z)>1.0))arrivalSite=null;if(arrivalSite)nearest=arrivalSite;if(stats.focus&&stats.focus.id!=='waterfall')nearest=stats.focus;stats.near=mode==='walk'&&!action?nearest?.id:null;interact.hidden=!stats.near||!!document.querySelector('dialog[open]');if(stats.near)interact.textContent!==nearest.name+' · E'&&(interact.textContent=nearest.name+' · E');launcher.hidden=mode==='photo';launcher.disabled=!!action;
 const isKagura=action?.type==='kagura',kaguraNear=mode!=='overview'&&Math.hypot(player.position.x-kagura.x,player.position.z-kagura.z)<58;
 document.body.classList.toggle('kagura-scene',isKagura);document.body.classList.toggle('prayer-scene',action?.type==='pray'||action?.type==='sidepray');document.body.classList.toggle('omokaru-scene',action?.type==='stone'); const informalDance=!action&&kaguraNear&&time%170<24;
 kaguraStage.update(isKagura?action.duration-action.left:time%170,night,kaguraNear,isKagura||informalDance);
 if(night){for(let i=0;i<glowLights.length;i++){const l=glowLights[i];l.position.set(player.position.x+Math.sin(i*2.1)*5,player.position.y+2.8,player.position.z+Math.cos(i*2.1)*5);l.visible=true;l.intensity=5;} }else for(const l of glowLights){l.visible=false;l.intensity=0;}
 hands.visible=false;if(hands.visible)hands.children.forEach((h,i)=>{h.position.x=(i?1:-1)*(action.type==='pray'?.12+Math.abs(Math.sin(time*5))*.2:.23);});droplets.visible=false;if(droplets.visible)droplets.children.forEach((o,i)=>o.position.y=1.25-(time*1.2+i*.07)% .7);
 if(!action){avatar.acting.hold(held,saved.equipped);if(!avatar.acting.gesture)avatar.body.rotation.x=0;progress.hidden=true;return;}action.left-=dt;const elapsed=action.duration-action.left,f=elapsed/action.duration;progress.hidden=false;progress.textContent=(['pray','sidepray'].includes(action.type)?PRAYER_LABELS[samplePrayer(elapsed).phase]:(action.type==='eat'&&saved.equipped==='matcha'?['雙手托杯・聞一聞茶香','杯緣貼唇・慢慢輕啜','吞嚥・感受回甘','喝完了・放下茶碗']:action.type==='kagura'&&night?['奉納心意','燈映・折扇展','踏步・旋舞','合扇・回禮']:actionNames[action.type])[Math.min(3,Math.floor(f*4))])+'　'+Math.max(0,Math.ceil(action.left))+' 秒 · Esc 結束';if(action.type==='pray'||action.type==='sidepray')ritual.clap(elapsed);else avatar.body.rotation.x=action.type==='waterfall'?.12:0;if(sideFocus)sideFocus.pivot.rotation.x=action.type==='sidepray'&&elapsed>1.2&&elapsed<2?Math.sin(elapsed*16)*.15:0;if(action.type==='wash')washing.update(elapsed);else ladle.rotation.z=0;water.scale.y=.015+(action.type==='wash'?Math.sin(elapsed*9)*.0008:0);if(action.type==='waterfall')meditation.update(elapsed);if(action.type==='eat')avatar.acting.updateMeal(elapsed);else avatar.acting.ritual(action.type==='sidepray'?'pray':action.type,elapsed,action.type==='stone'?omokaru.update(elapsed):null);
 if(action.left<=0){if(action.type==='pray'||action.type==='sidepray'){ritual.stop();if(sideFocus)sideFocus.pivot.rotation.x=0;sideFocus=null;}avatar.acting.reset();if(action.type==='waterfall')meditation.reset();if(action.type==='wash')washing.reset();if(action.type==='stone')omokaru.reset();const done=action.done;action=null;stats.active=null;stats.focus=null;stopSound();avatar.body.rotation.x=0;ladle.rotation.z=0;progress.hidden=true;done?.();}},get busy(){return !!action;}};
}
