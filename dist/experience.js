import * as THREE from 'three';
import {createMaterials} from './materials.js';
import {buildWorld} from './world.js';
import {createLighting,SceneRenderer} from './rendering.js';
import {createPlayer} from './player.js';
import {createFlora} from './flora.js';
import {createFoxes} from './foxes.js';
import {createLandscape} from './landscape.js';
import {textureStats} from './textures.js';
import {createResidency} from './residency.js';
import {createMusic} from './music.js';
import {createStreetLife} from './street-life.js';
import {createWildlife} from './wildlife.js';
import {createTrains} from './trains.js';
import {createRitual} from './ritual.js';
import {createCameraRig} from './camera-rig.js';
import {createSnacks} from './snacks.js';
import {createFoliageDepth} from './foliage-depth.js';
import {MAP,terrainHeight} from './geography.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const touchDevice=navigator.maxTouchPoints>0,mobile=innerWidth<600;
const state={ready:false,version:3,revision:'3.1.1',mode:'overview',season:'spring',weather:'clear',dusk:false,fps:0,frameCap:60,photos:0};
window.inari={state};
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('on');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('on'),2600);}
async function init(){
  const canvas=$('#scene');
  canvas.tabIndex=0;
  // Scene edges are multisampled in the HDR target. The final fullscreen
  // canvas blit does not need a second multisampled framebuffer.
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  const nativeRatio=Math.max(1,devicePixelRatio);
  renderer.setPixelRatio(nativeRatio);renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.87;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.08,22000);
  const updateLoading=text=>$('#loading small').textContent=text;
  updateLoading('載入 PBR 木材、檜皮、石材與林地…');
  const M=await createMaterials(renderer),lighting=createLighting(scene,renderer);
  const world=await buildWorld(scene,M,updateLoading),avatar=createPlayer(scene,M),player=avatar.group,pipeline=new SceneRenderer(renderer,scene,camera);
  const flora=createFlora(scene,M,world),foxes=createFoxes(scene,world);
  const landscape=await createLandscape(scene,lighting,M);
  const snacks=createSnacks(player,M),cameraRig=createCameraRig(world.physics),trains=createTrains(scene,world),ritual=createRitual(scene,world),streetLife=createStreetLife(scene,world),wildlife=createWildlife(scene,world),residency=createResidency(world);
  scene.traverse(o=>{for(const mat of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){if(mat.alphaTest>0&&!mat.transparent){mat.alphaToCoverage=true;mat.needsUpdate=true;}}});
  pipeline.foliageDepth=createFoliageDepth(scene,world,flora);
  const qualityLevels={clear:{label:'平滑',ratio:nativeRatio,samples:4,aa:'smaa',ao:false},fine:{label:'精緻',ratio:Math.max(nativeRatio,Math.min(3,nativeRatio*1.5)),samples:4,aa:'smaa',ao:false},smooth:{label:'流暢',ratio:1,samples:2,aa:'fxaa',ao:false}};
  let renderQuality='clear';try{const stored=localStorage.getItem('inari-render-quality-v23');if(qualityLevels[stored])renderQuality=stored;}catch{}
  function setRenderQuality(value,persist=true){
    const q=qualityLevels[value];if(!q)return;renderQuality=value;renderer.setPixelRatio(q.ratio);pipeline.setSamples(q.samples);pipeline.setAntialias(q.aa);pipeline.enabled=q.ao;pipeline.resize();
    Object.assign(state,{renderQuality:value,quality:value,aaSamples:pipeline.samples,antialias:'MSAA + '+q.aa.toUpperCase(),resolutionLocked:true});$('#quality span').textContent=q.label;$('#quality').setAttribute('aria-label','畫質：'+q.label+'，點擊切換');
    if(persist)try{localStorage.setItem('inari-render-quality-v23',value)}catch{}
  }
  setRenderQuality(renderQuality,false);
  Object.assign(state,world.stats,flora.stats,{foxCount:foxes.count,trees:world.trees.count+flora.sites.length,colliders:world.physics.bodies.length});
  let mode='overview',season='spring',dusk=false,photoReturn='walk',yaw=-.86,pitch=.43,distance=172,walkDistance=8;
  let snap=true,fullMountain=false,photoRadius=8,movePhase=0,frameCount=0,lastTime=performance.now(),lastPerf=lastTime;
  const overviewCenter=new THREE.Vector3(36,7,-9),target=new THREE.Vector3(),smoothTarget=new THREE.Vector3(),lookTarget=new THREE.Vector3(),desired=new THREE.Vector3(),offset=new THREE.Vector3(),direction=new THREE.Vector3();
  const start=world.safePlace('entrance');player.position.set(start.x,start.y,start.z);player.rotation.y=Math.PI/2;
  const forestTexture=M.forest.map,snowCanvas=document.createElement('canvas');snowCanvas.width=snowCanvas.height=256;const snowContext=snowCanvas.getContext('2d');snowContext.fillStyle='#f3f5f7';snowContext.fillRect(0,0,256,256);for(let i=0;i<12000;i++){const gray=215+Math.random()*35;snowContext.fillStyle=`rgb(${gray},${gray},${gray})`;snowContext.fillRect(Math.random()*256,Math.random()*256,1,1);}const snowTexture=new THREE.CanvasTexture(snowCanvas);snowTexture.colorSpace=THREE.SRGBColorSpace;snowTexture.wrapS=snowTexture.wrapT=THREE.RepeatWrapping;
  const seasons={
    spring:{name:'春',tag:'春 / HARU',text:'滿開櫻花沿著參道，花瓣落在腳邊。',cedar:'#5e794d',maple:'#87a957',sakura:'#fff0f6',particle:'#fff1f6'},
    summer:{name:'夏',tag:'夏 / NATSU',text:'杉木深綠，山路間透著日光。',cedar:'#43643c',maple:'#427a30',sakura:'#4d7937',particle:'#e4dc9d'},
    autumn:{name:'秋',tag:'秋 / AKI',text:'掌狀楓葉轉紅，小狐狸漫步在落葉間。',cedar:'#536d40',maple:'#ef651a',sakura:'#dca046',particle:'#ef8336'},
    winter:{name:'冬',tag:'冬 / FUYU',text:'薄雪覆上檜皮，朱紅仍然鮮明。',cedar:'#667963',maple:'#85765f',sakura:'#a39480',particle:'#f4f6f8'}
  };
  const particleCount=mobile?190:400,particlePositions=new Float32Array(particleCount*3),particleSpeeds=new Float32Array(particleCount);
  for(let i=0;i<particleCount;i++){particlePositions[i*3]=Math.random()*80-40;particlePositions[i*3+1]=Math.random()*24;particlePositions[i*3+2]=Math.random()*80-40;particleSpeeds[i]=.35+Math.random()*.8;}
  const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
  const particleMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{tint:{value:new THREE.Color('#fff1f6')},sprite:{value:flora.atlases.petal},seasonKind:{value:0},weatherKind:{value:0},time:{value:0}},vertexShader:'uniform float time;varying float v;void main(){vec3 p=position;p.x+=sin(time*.5+position.y)*.5;vec4 q=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*q;gl_PointSize=clamp(220./-q.z,2.,18.);v=.5+.5*sin(position.y+time);}',fragmentShader:'uniform vec3 tint;uniform sampler2D sprite;uniform float seasonKind;uniform float weatherKind;varying float v;void main(){if(weatherKind>.5){if(abs(gl_PointCoord.x-.5)>.055)discard;gl_FragColor=vec4(.72,.83,.9,.55);}else if(seasonKind>1.5){float d=length(gl_PointCoord-.5);if(d>.46)discard;gl_FragColor=vec4(tint,smoothstep(.46,.2,d)*.8);}else{vec4 p=texture2D(sprite,gl_PointCoord);if(p.a<.25)discard;gl_FragColor=vec4(p.rgb*tint,p.a*.85);}}'});
  const particles=new THREE.Points(particleGeometry,particleMaterial);particles.frustumCulled=false;scene.add(particles);
  function setSeason(value){
    if(!seasons[value])return;season=value;state.season=value;const s=seasons[value];
    $$('[data-season]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.season===value)));
    $('#seasonTag').textContent=s.tag;$('#seasonText').textContent=s.text;$('#photoSeason').textContent=s.name+' · 伏見稻荷';
    for(const p of world.trees.materials)p.material.color.set(s[p.kind]);
    flora.setSeason(value);particleMaterial.uniforms.sprite.value=value==='autumn'?flora.atlases.maple:flora.atlases.petal;particleMaterial.uniforms.seasonKind.value=value==='winter'?2:0;
    world.trees.seasonal.forEach(mesh=>{mesh.userData.seasonalHidden=value==='winter';mesh.visible=value!=='winter';});world.seasonal.forEach(mesh=>mesh.visible=value==='winter');
    M.forest.map=value==='winter'?snowTexture:forestTexture;M.forest.normalScale.setScalar(value==='winter'?.15:.65);M.forest.color.set(value==='winter'?'#e1e5e8':value==='autumn'?'#9c8766':'#7d815b');
    M.roof.color.set('#ffffff');particleMaterial.uniforms.tint.value.set(s.particle);
    lighting.setSeason(value);landscape.refresh();lighting.updateShadow(player.position,mode==='overview',true);
  }
  const weatherNames={clear:'晴朗',cloudy:'多雲',rain:'雨景',mist:'山霧'};
  function setWeather(value){if(!weatherNames[value])return;state.weather=value;landscape.setWeather(value);particleMaterial.uniforms.weatherKind.value=value==='rain'?1:0;$('#weather span').textContent=weatherNames[value];$('#weather').setAttribute('aria-label','天氣：'+weatherNames[value]+'，點擊切換');}
  function setMode(value){
    mode=value;state.mode=value;snap=true;resetInput();cameraRig.reset();
    document.body.classList.toggle('walking',value==='walk');document.body.classList.toggle('photograph',value==='photo');
    $('#photoUI').hidden=value!=='photo';$('#walkHint').hidden=value!=='walk';$('#overview span').textContent=value==='overview'?'散步':'全景';
    camera.fov=value==='overview'?42:58;camera.updateProjectionMatrix();
    if(value==='overview'){fullMountain=false;yaw=-.86;pitch=.43;distance=innerWidth<600?250:172;player.visible=true;}
    else if(value==='walk'){pitch=.055;walkDistance=8;player.visible=true;}
    else{photoRadius=Math.max(2.5,Math.min(22,camera.position.distanceTo(player.position)));$('#zoom').value=photoRadius;player.visible=$('#showStar').checked;}
    lighting.updateShadow(player.position,value==='overview',true);locationUpdate();
  }
  function enterWalk(){yaw=-Math.PI/2+.055;setMode('walk');toast(touchDevice?'左下搖桿移動，空白處滑動環視':'WASD 散步 · 拖曳環視 · C 攝影');}
  function togglePhoto(){if(mode==='photo'){player.visible=true;setMode(photoReturn);return;}photoReturn=mode;const previousYaw=yaw,previousPitch=pitch;setMode('photo');yaw=previousYaw;pitch=previousPitch;}
  let travelToken=0;
  function warmPlace(){const token=++travelToken;state.travelLoading=true;$('#travelLoading').hidden=false;residency.prefetch(player.position).finally(()=>{if(token===travelToken){state.travelLoading=false;$('#travelLoading').hidden=true;}});}
  function goPlace(id){const p=world.safePlace(id);if(!p)return;player.position.set(p.x,p.y,p.z);yaw=-Math.PI/2+.055;if(id==='torii'){const n=world.surface.nearPath(p.x,p.z);if(n.s)yaw=Math.atan2(-n.s.dx,-n.s.dz);}else if(id==='okusha')yaw=-2.27;else if(id==='tea')yaw=-Math.PI/2;else if(id==='yotsu')yaw=Math.PI/2-.18;else if(p.x>350){const n=world.surface.nearPath(p.x,p.z);if(n.s)yaw=Math.atan2(-n.s.dx,-n.s.dz);}player.rotation.y=yaw+Math.PI;setMode('walk');if(id==='gate'){pitch=-.12;walkDistance=13;}if(id==='hall'){pitch=-.18;walkDistance=5;}if(id==='jr'||id==='keihan'){const route=window.inari.districtData.DISTRICT.routes.find(r=>r.from===id),a=route.p[0],b=route.p[1];yaw=Math.atan2(a[0]-b[0],a[1]-b[1]);}if(id==='yotsu'){pitch=.08;walkDistance=6;}player.rotation.y=yaw+Math.PI;warmPlace();toast('已來到 '+world.places[id].name);}
  function recoverPath(){
    resetInput();const candidates=[];
    for(let radius=0;radius<=9;radius+=.6)for(let i=0;i<16;i++){const a=i*Math.PI/8,n=world.surface.nearPath(player.position.x+Math.cos(a)*radius,player.position.z+Math.sin(a)*radius);if(!n.s)continue;const y=world.walkHeight(n.x,n.z);if(Number.isFinite(y)&&!world.physics.collides(n.x,y,n.z))candidates.push({x:n.x,z:n.z,y,d:Math.hypot(n.x-player.position.x,n.z-player.position.z)});}
    candidates.sort((a,b)=>a.d-b.d);const p=candidates[0]||world.safePlace('entrance');player.position.set(p.x,p.y,p.z);snap=true;canvas.focus({preventScroll:true});toast('已回到附近的安全參道');
  }
  function locationUpdate(){
    if(mode==='overview'){$('#locationName').textContent=fullMountain?'稻荷山・主參拜環線':'伏見稻荷大社・境內';$('#locationSub').textContent='拖曳旋轉 · 滾輪縮放 · M 地圖';return;}
    let nearest=null,d=Infinity;for(const p of Object.values(world.places)){const l=Math.hypot(player.position.x-p.x,player.position.z-p.z);if(l<d){nearest=p;d=l;}}
    $('#locationName').textContent=d<55?nearest.name:'稻荷山參道';$('#locationSub').textContent=`標高 ${Math.round(player.position.y+MAP.dem.base)} m · 沿實際參拜路線散策`;
  }
  $('#start').onclick=enterWalk;$('.brand').onclick=e=>{e.preventDefault();setMode('overview')};$('#overview').onclick=()=>mode==='overview'?enterWalk():setMode('overview');$('#photo').onclick=togglePhoto;$('#touchPhoto').onclick=togglePhoto;$('#exitPhoto').onclick=togglePhoto;
  $$('[data-season]').forEach(b=>b.onclick=()=>setSeason(b.dataset.season));$$('[data-place]').forEach(b=>b.onclick=()=>goPlace(b.dataset.place));$('#home').onclick=()=>goPlace('entrance');
  $('#unstuck').onclick=recoverPath;
  $('#rescue').onclick=recoverPath;
  $('#zoom').oninput=e=>photoRadius=Number(e.target.value);$('#showStar').onchange=e=>{player.visible=e.target.checked;avatar.shadow.visible=e.target.checked;};
  $('#quality').onclick=()=>{const next={clear:'fine',fine:'smooth',smooth:'clear'}[renderQuality];setRenderQuality(next);toast(next==='fine'?'精緻：超取樣 ＋ SMAA 輪廓平滑':next==='smooth'?'流暢：1× 解析度 ＋ FXAA':'平滑：原生解析度 ＋ SMAA 輪廓平滑');};
  $('#light').onclick=()=>{dusk=!dusk;state.dusk=dusk;lighting.setDusk(dusk);landscape.setDusk(dusk);M.glow.emissiveIntensity=dusk?1.6:.26;$('#light span').textContent=dusk?'夕照':'日光'};
  $('#weather').onclick=()=>{const values=Object.keys(weatherNames);setWeather(values[(values.indexOf(state.weather)+1)%values.length]);toast(weatherNames[state.weather]+' · 山景與光線同步變化');};
  $('#pray').onclick=()=>{ritual.pray();toast('投下心意，搖鈴祈願。')};
  $('#teaBreak').onclick=()=>{resetInput();$('#teaDialog').showModal();};
  $('#goTea').onclick=()=>{$('#teaDialog').close();goPlace('tea');};
  $$('[data-snack]').forEach(button=>button.onclick=()=>{snacks.choose(button.dataset.snack);state.snack=button.dataset.snack;$('#teaDialog').close();toast(button.dataset.snack==='ice'?'抹茶霜淇淋 · 慢慢看京都山景':button.dataset.snack==='dango'?'三色糰子 · 歇一歇再出發':'已收起點心');});
  $$('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#help').onclick=()=>{resetInput();$('#helpDialog').showModal()};
  if($('#fullscreen'))$('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>toast('此瀏覽器未提供全螢幕'))};
  let mapArea='precinct';
  function drawMap(){
    const bounds=mapArea==='station'?[-445,-265,480,350]:mapArea==='precinct'?[-115,-128,425,240]:[-130,-420,1380,610],svg=$('#geographicMap'),ns='http://www.w3.org/2000/svg';svg.setAttribute('viewBox',bounds.join(' '));svg.replaceChildren();
    const add=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;};
    add('rect',{x:bounds[0],y:bounds[1],width:bounds[2],height:bounds[3],fill:'#e8e9db'});
    for(const p of MAP.water)add('polygon',{points:p.p.map(p=>p.join(',')).join(' '),fill:'#a8c3bd'});
    for(const p of MAP.paths)add('polyline',{points:p.p.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#aba58c','stroke-width':mapArea==='precinct'?1.1:2.2});
    for(const r of MAP.routes)add('polyline',{points:r.p.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#a33a22','stroke-width':mapArea==='precinct'?1.3:3});
    for(const p of MAP.paths.filter(p=>p.id===260121328||p.id===377968455))add('polyline',{points:p.p.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#c3280b','stroke-width':2});
    for(const b of MAP.buildings)add('polygon',{points:b.p.map(p=>p.join(',')).join(' '),fill:'#965e45',stroke:'#663c2e','stroke-width':.5});
    if(mapArea==='station'){const{DISTRICT}=window.inari.districtData;for(const b of DISTRICT.buildings)add('polygon',{points:b.p.map(p=>p.join(',')).join(' '),fill:'#b5a18a',stroke:'#82705a','stroke-width':.4});for(const r of DISTRICT.routes)add('polyline',{points:r.p.map(p=>p.join(',')).join(' '),fill:'none',stroke:r.from==='jr'?'#3f8563':'#b75327','stroke-width':3});for(const rail of DISTRICT.railways)add('polyline',{points:rail.p.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#555b53','stroke-width':1,'stroke-dasharray':'3 2'});}
    const radius=mapArea==='mountain'?8:3,font=mapArea==='mountain'?16:6;
    for(const p of MAP.pois){const e=add('circle',{cx:p.p[0],cy:p.p[1],r:radius,fill:'#b6230e',stroke:'#fff','stroke-width':radius*.35,'data-poi':p.id,tabindex:'0',role:'button','aria-label':'前往 '+p.name});e.onclick=()=>{$('#mapDialog').close();goPlace(p.id)};e.onkeydown=ev=>{if(ev.key==='Enter')e.onclick()};const t=add('text',{x:p.p[0]+radius*1.4,y:p.p[1]-radius*1.4,'font-size':font,fill:'#28382e','font-family':'Microsoft JhengHei, sans-serif','paint-order':'stroke',stroke:'#eef0e2','stroke-width':font*.18});t.textContent=p.name;}
    const p=player.position;add('circle',{id:'mapPlayer',cx:p.x,cy:p.z,r:radius*1.2,fill:'#e7bd39',stroke:'#173a2b','stroke-width':radius*.4});
    add('line',{x1:bounds[0]+bounds[2]*.05,y1:bounds[1]+bounds[3]*.88,x2:bounds[0]+bounds[2]*.05+100,y2:bounds[1]+bounds[3]*.88,stroke:'#314438','stroke-width':radius*.4});const scale=add('text',{x:bounds[0]+bounds[2]*.05,y:bounds[1]+bounds[3]*.88-font,'font-size':font,fill:'#314438'});scale.textContent='100 m';
    $('#mapCoords').textContent=`北 ↑ · 緯度 ${(MAP.origin[0]-p.z/111320).toFixed(6)} · 經度 ${(MAP.origin[1]+p.x/(111320*Math.cos(MAP.origin[0]*Math.PI/180))).toFixed(6)}`;
  }
  function showMap(){resetInput();drawMap();$('#mapDialog').showModal();}
  $('#map').onclick=showMap;$$('[data-map-area]').forEach(b=>b.onclick=()=>{mapArea=b.dataset.mapArea;$$('[data-map-area]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawMap()});
  $('#mountainView').onclick=()=>{$('#mapDialog').close();setMode('overview');fullMountain=true;distance=innerWidth<600?1750:1510;yaw=-.95;pitch=.65;locationUpdate();};
  for(const poi of MAP.pois){const b=document.createElement('button');b.textContent=poi.name;b.onclick=()=>{$('#mapDialog').close();goPlace(poi.id)};$('#mapPlaces').append(b);}
  let photos=[];try{photos=JSON.parse(localStorage.getItem('inari-postcards-v2')||'[]');if(!Array.isArray(photos))photos=[];}catch{}
  function renderAlbum(){$('#empty').hidden=photos.length>0;$('#photos').replaceChildren();for(const [i,p]of photos.entries()){const a=document.createElement('a');a.href=p.url;a.download=`稻荷星旅-V3.1-${p.season}-${i+1}.jpg`;const image=new Image();image.src=p.url;image.alt=p.title;a.append(image);const label=document.createElement('span');label.textContent=p.title+' ↓ 下載';a.append(label);$('#photos').append(a);}state.photos=photos.length;}
  $('#album').onclick=()=>{resetInput();renderAlbum();$('#gallery').showModal()};
  function shoot(){
    if(mode!=='photo')return;const ratio=renderer.getPixelRatio(),samples=pipeline.samples,size=renderer.getSize(new THREE.Vector2()),scale=Math.max(1,2560/Math.max(innerWidth,innerHeight));renderer.setPixelRatio(1);renderer.setSize(Math.round(innerWidth*scale),Math.round(innerHeight*scale),false);pipeline.setSamples(4);pipeline.resize();pipeline.render(false,true);
    const exportCanvas=document.createElement('canvas');exportCanvas.width=canvas.width;exportCanvas.height=canvas.height;const ctx=exportCanvas.getContext('2d');ctx.drawImage(canvas,0,0);renderer.setSize(size.x,size.y,false);renderer.setPixelRatio(ratio);pipeline.setSamples(samples);pipeline.resize();
    const h=exportCanvas.height*.05;ctx.fillStyle='#f2eee4f2';ctx.fillRect(0,exportCanvas.height-h,exportCanvas.width,h);ctx.fillStyle='#2d3b31';ctx.font=`${Math.max(13,h*.34)}px serif`;ctx.fillText('稻荷・星旅  /  FUSHIMI INARI',h*.5,exportCanvas.height-h*.34);ctx.textAlign='right';ctx.fillText(seasons[season].name+' · '+(dusk?'夕照':'日光'),exportCanvas.width-h*.5,exportCanvas.height-h*.34);
    photos.unshift({url:exportCanvas.toDataURL('image/jpeg',.9),title:seasons[season].name+' · '+$('#locationName').textContent,season:seasons[season].name});photos=photos.slice(0,6);try{localStorage.setItem('inari-postcards-v2',JSON.stringify(photos));}catch{while(photos.length>1){photos.pop();try{localStorage.setItem('inari-postcards-v2',JSON.stringify(photos));break;}catch{}}}
    state.photos=photos.length;state.lastExport={width:exportCanvas.width,height:exportCanvas.height};$('#flash').classList.remove('on');void $('#flash').offsetWidth;$('#flash').classList.add('on');toast('已收藏到旅行相簿 · 點相簿照片可下載');
  }
  $('#shutter').onclick=shoot;
  const music=createMusic($('#sound'),toast);$('#nextMusic').onclick=()=>{music.next();toast('切換下一首日式抒情曲')};$('#musicVolume').oninput=e=>music.audio.volume=Number(e.target.value);
  const keys=new Set(),pointers=new Map();let joyX=0,joyY=0,joyId=null,pinch=0,joyRun=false;
  function resetInput(){keys.clear();joyX=joyY=0;joyId=null;joyRun=false;$('#joystick').classList.remove('running');pointers.clear();pinch=0;$('#stick').style.transform='';}
  addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput()});
  addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||$('dialog[open]'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyC')togglePhoto();if(e.code==='KeyP')shoot();if(e.code==='KeyM')showMap();if(e.code==='KeyR')goPlace('entrance');if(e.code==='Escape'&&mode==='photo')togglePhoto();});addEventListener('keyup',e=>keys.delete(e.code));
  function zoomBy(factor){if(mode==='overview')distance=THREE.MathUtils.clamp(distance*factor,75,2200);else if(mode==='photo'){photoRadius=THREE.MathUtils.clamp(photoRadius*factor,2.5,22);$('#zoom').value=photoRadius;}else walkDistance=THREE.MathUtils.clamp(walkDistance*factor,3.5,15);}
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
  canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){yaw-=dx*.0045;pitch=THREE.MathUtils.clamp(pitch+dy*.0035,mode==='overview'?.18:-1.2,1.18);}else if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch>1)zoomBy(pinch/d);pinch=d;}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(e.deltaY*.0008));},{passive:false});
  const joy=$('#joystick');
  const controlDefaults={size:112,left:4,bottom:16};let controlConfig={...controlDefaults};
  try{controlConfig={...controlConfig,...JSON.parse(localStorage.getItem('inari-controls-v31')||'{}')}}catch{}
  function applyControls(persist=true){
    const size=THREE.MathUtils.clamp(+controlConfig.size||112,76,180),left=THREE.MathUtils.clamp(+controlConfig.left||4,1,70),bottom=THREE.MathUtils.clamp(+controlConfig.bottom||16,12,65);
    const x=Math.min(innerWidth-size-95,innerWidth*left/100),y=Math.max(78,Math.min(innerHeight-size-135,innerHeight*bottom/100));
    document.documentElement.style.setProperty('--joy-size',size+'px');document.documentElement.style.setProperty('--joy-left',Math.max(8,x)+'px');document.documentElement.style.setProperty('--joy-bottom',y+'px');
    for(const [id,value] of [['Size',size],['Left',left],['Bottom',bottom]]){$('#joy'+id).value=value;$('#joy'+id+'Value').textContent=Math.round(value)+(id==='Size'?' px':' %');}
    if(persist)try{localStorage.setItem('inari-controls-v31',JSON.stringify(controlConfig))}catch{}
  }
  $('#controlSettings').onclick=()=>{resetInput();$('#controlsDialog').showModal()};
  for(const [id,key] of [['Size','size'],['Left','left'],['Bottom','bottom']])$('#joy'+id).oninput=e=>{controlConfig[key]=+e.target.value;applyControls()};
  $('#resetControls').onclick=()=>{controlConfig={...controlDefaults};applyControls()};applyControls(false);addEventListener('resize',()=>applyControls(false));
  function joystick(e){const r=joy.getBoundingClientRect(),radius=r.width*.36;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;joyRun=y < -1.35;joy.classList.toggle('running',joyRun);const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}joyX=x;joyY=y;$('#stick').style.transform=`translate(${x*r.width*.29}px,${y*r.width*.29}px)`;}
  joy.addEventListener('pointerdown',e=>{if(joyId!==null)return;joyId=e.pointerId;joy.setPointerCapture(e.pointerId);joystick(e);e.preventDefault()});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joystick(e)});for(const event of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(event,e=>{if(e.pointerId!==joyId)return;joyId=null;joyX=joyY=0;joyRun=false;joy.classList.remove('running');$('#stick').style.transform=''});
  function isTunnel(){return world.physics.near(player.position.x,player.position.z).filter(b=>b.kind==='circle'&&b.name.startsWith('torii-')&&Math.hypot(b.x-player.position.x,b.z-player.position.z)<3.3).length>2;}
  let nextFrameTime=0;
  function frame(now){
    if(document.hidden||state.travelLoading){lastTime=now;return;}
    // Keep the requested 60 FPS target instead of spending GPU on 100+ surplus frames.
    if(now<nextFrameTime-.25)return;nextFrameTime=now+1000/60-Math.max(0,now-nextFrameTime)%(1000/60);
    const elapsed=(now-lastTime)/1000,dt=Math.min(.15,Math.max(.001,elapsed));lastTime=now;frameCount++;
    if(now-lastPerf>1200){state.fps=Math.round(frameCount/((now-lastPerf)/1000));frameCount=0;lastPerf=now;locationUpdate();}
    let moving=false;$('#pray').hidden=mode!=='walk'||!ritual.near(player.position);trains.update(dt,player.position,reduced,mode!=='overview');ritual.update(dt);streetLife.update(dt,now/1000,player.position,reduced,mode!=='overview');wildlife.update(dt,now/1000,player.position,reduced,mode!=='overview');
    $('#teaBreak').hidden=mode!=='walk'||Math.hypot(player.position.x-world.places.yotsu.x,player.position.z-world.places.yotsu.z)>45;
    if(mode==='walk'&&!$('dialog[open]')){let mx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joyX,mz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joyY,len=Math.hypot(mx,mz);
      if(len>.06){mx/=Math.max(1,len);mz/=Math.max(1,len);const moveYaw=Math.atan2(camera.position.x-target.x,camera.position.z-target.z),dx=mx*Math.cos(moveYaw)+mz*Math.sin(moveYaw),dz=-mx*Math.sin(moveYaw)+mz*Math.cos(moveYaw),speed=joyRun||keys.has('ShiftLeft')||keys.has('ShiftRight')?6.2:3.1,oldX=player.position.x,oldZ=player.position.z;const hits=world.physics.move(player.position,dx*speed*dt,dz*speed*dt,world.walkHeight);state.collisionHits=(state.collisionHits||0)+hits;moving=Math.hypot(player.position.x-oldX,player.position.z-oldZ)>.001;
        if(moving){movePhase+=dt*speed*3;const angle=Math.atan2(dx,dz),diff=THREE.MathUtils.euclideanModulo(angle-player.rotation.y+Math.PI,Math.PI*2)-Math.PI;player.rotation.y+=diff*Math.min(1,dt*14);}}
    }
    avatar.shadow.visible=player.visible;avatar.animate(now/1000,movePhase,moving,player.position.y,reduced);
    const tunnel=mode!=='overview'&&isTunnel();
    if(mode==='overview'){target.copy(fullMountain?new THREE.Vector3(560,90,-100):overviewCenter);offset.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);if(!reduced&&!pointers.size)yaw+=dt*.006;}
    else{target.copy(player.position);target.y+=tunnel?1.05:1.18;
      const d=mode==='photo'?photoRadius:tunnel?Math.min(4.7,walkDistance):walkDistance;
      const solved=cameraRig.solve(target,yaw,Math.max(.04,pitch),d,tunnel);offset.copy(solved.position).sub(target);
      state.cameraBoom=solved.distance;state.cameraObstructed=solved.obstructed;
    }
    if(snap)smoothTarget.copy(target);else smoothTarget.lerp(target,1-Math.exp(-dt*18));desired.copy(smoothTarget).add(offset);
    if(mode==='overview')desired.y=Math.max(desired.y,terrainHeight(desired.x,desired.z)+.6);
    if(snap){camera.position.copy(desired);snap=false;}else camera.position.lerp(desired,reduced?1:1-Math.exp(-dt*14));
    if(mode!=='overview'){
      direction.copy(camera.position).sub(target);const len=direction.length();
      if(len>.01){direction.divideScalar(len);const d=world.physics.cameraDistance(target,direction,len);if(d<len-.02||d<2.6||camera.position.y<terrainHeight(camera.position.x,camera.position.z)+.3)camera.position.copy(desired);}
      // Last-resort avatar occlusion uses a small silhouette, never an invisible star.
      const actual=camera.position.distanceTo(target);const scale=actual<2.6?Math.max(.48,actual/2.6):1;avatar.body.scale.setScalar(scale);avatar.feet.forEach(f=>f.visible=scale>.75);state.avatarScreenScale=scale;
    }else{avatar.body.scale.setScalar(1);avatar.feet.forEach(f=>f.visible=true);}
    // Looking up changes the aim, independently of the collision-safe boom.
    // Lowering an orbit camera into the ground used to trigger a downward fallback.
    lookTarget.copy(smoothTarget);
    if(mode!=='overview'&&pitch<0){const horizontal=Math.hypot(camera.position.x-smoothTarget.x,camera.position.z-smoothTarget.z);lookTarget.y+=Math.tan(-pitch)*horizontal;}
    camera.lookAt(lookTarget);state.lookElevation=THREE.MathUtils.radToDeg(Math.atan2(lookTarget.y-camera.position.y,Math.hypot(lookTarget.x-camera.position.x,lookTarget.z-camera.position.z)));
lighting.updateShadow(player.position,mode==='overview');particles.position.set(player.position.x,Math.max(0,player.position.y),player.position.z);
    if(!reduced){for(let i=0;i<particleCount;i++){particlePositions[i*3+1]-=dt*particleSpeeds[i]*(state.weather==='rain'?9:season==='summer'?.05:season==='autumn'?1.2:.6);if(particlePositions[i*3+1]<-.5)particlePositions[i*3+1]=24;}particleGeometry.attributes.position.needsUpdate=true;}particleMaterial.uniforms.time.value=now/1000;landscape.update(reduced?0:now/1000,player.position,mode);
    foxes.update(dt,now/1000,player.position,reduced);flora.update(camera);world.updateVisibility(camera,mode==='overview',fullMountain);residency.update(camera,mode,fullMountain);state.residency=residency.stats;state.textures=textureStats;state.streetLife=streetLife.stats;state.wildlife=wildlife.stats;renderer.info.reset();pipeline.render(mode==='overview');state.drawCalls=renderer.info.render.calls;state.triangles=renderer.info.render.triangles;state.position={x:+player.position.x.toFixed(3),y:+player.position.y.toFixed(3),z:+player.position.z.toFixed(3)};state.camera={x:+camera.position.x.toFixed(2),y:+camera.position.y.toFixed(2),z:+camera.position.z.toFixed(2)};state.pixelRatio=renderer.getPixelRatio();
  }
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);pipeline.resize();if(mode==='overview'&&!fullMountain)distance=innerWidth<600?250:172;});
  setSeason('spring');setMode('overview');updateLoading('正在準備陰影與輪廓平滑…');await pipeline.ready;camera.position.set(-75,75,104);camera.lookAt(overviewCenter);await renderer.compileAsync(scene,camera);await renderer.compileAsync(pipeline.foliageDepth.scene,camera);
  Object.assign(window.inari,{state,world,renderer,camera,player,flora,foxes,trains,ritual,streetLife,wildlife,residency,music,pipeline,landscape,lighting,recoverPath,setSeason,setWeather,setMode,goPlace,shoot,setDusk(value){if(dusk!==value)$('#light').click()},setView(valueYaw,valuePitch,valueDistance){yaw=valueYaw;pitch=valuePitch;if(mode==='overview')distance=valueDistance;else if(mode==='photo')photoRadius=valueDistance;else walkDistance=valueDistance;snap=true;},get photos(){return photos},teleport(x,z){const y=world.walkHeight(x,z);if(Number.isFinite(y)&&!world.physics.collides(x,y,z)){player.position.set(x,y,z);snap=true;return true;}return false;},get cameraTarget(){return target},setRenderQuality,setQuality(value){if(typeof value==='string')setRenderQuality(value);else{renderer.setPixelRatio(Math.max(1,Math.min(2.5,value)));pipeline.resize();}}});
  window.inari.districtData=await import('./district-data.js');
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');state.gpu=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  frame(performance.now());state.ready=true;$('#loading').classList.add('ready');setTimeout(()=>$('#loading')?.remove(),1000);renderer.setAnimationLoop(frame);
}
init().catch(error=>{console.error(error);$('#loading')?.remove();$('#failure').hidden=false;$('#failure pre').textContent=error.stack||error.message;});
