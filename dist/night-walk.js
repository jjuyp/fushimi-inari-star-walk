import * as T from 'three';
import {GeometryBuilder,curvedRoof} from './geometry.js';
import {MAP,pathSamples} from './geography.js';
import {createArchitecture} from './architecture.js';

const HERO={x:30.24,z:-18.67,yaw:-1.59};
const ROUTES=[
 [[-90,1],[-78,1],[-49,-.32],[-22,-1.55],[-5,-2.6]],
 [[11.868,-17.822],[19.157,-18.423],[23.317,-18.568],[32.394,-18.713],[31.91,-22.553],[50.803,-24.257],[57.061,-24.613]],
 [[50.219,-36.914],[50.803,-24.257],[51.113,-17.678]],
 [[63.866,-37.27],[75.096,-37.326],[85.341,-37.404],[85.441,-32.851],[85.532,-28.286],[85.943,-20.939]],
 ...MAP.paths.filter(p=>[260121354,260121328,377968455].includes(p.id)).map(p=>p.p)
];

function texture(w,h,paint){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 paint(canvas.getContext('2d'),w,h);
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
function randomSeed(seed){
 return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
function blossom(c,x,y,r,fill){
 c.save();c.translate(x,y);c.fillStyle=fill;
 for(let k=0;k<5;k++){c.rotate(Math.PI*2/5);c.beginPath();c.ellipse(0,-r*.48,r*.32,r*.51,0,0,7);c.fill();}
 c.restore();
}
function foxMark(c,x,y,s,fill,ink){
 c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='round';c.lineCap='round';c.lineWidth=2.8;
 c.fillStyle=fill;c.strokeStyle=ink;c.beginPath();c.moveTo(-27,-34);c.quadraticCurveTo(-44,-14,-34,2);c.quadraticCurveTo(-31,17,0,34);c.quadraticCurveTo(31,17,34,2);c.quadraticCurveTo(44,-14,27,-34);c.lineTo(12,-16);c.quadraticCurveTo(0,-21,-12,-16);c.closePath();c.fill();c.stroke();
 for(const sign of [-1,1]){
  c.fillStyle=ink;c.beginPath();c.moveTo(sign*27,-25);c.lineTo(sign*29,-9);c.lineTo(sign*19,-16);c.fill();
  c.beginPath();c.moveTo(sign*23,0);c.quadraticCurveTo(sign*15,-2,sign*10,8);c.quadraticCurveTo(sign*18,4,sign*23,0);c.fill();
  c.beginPath();c.moveTo(sign*29,10);c.lineTo(sign*20,11.5);c.lineTo(sign*26,14.5);c.fill();
 }
 c.beginPath();c.ellipse(0,20,4,3,0,0,7);c.fill();c.restore();
}
function lampPaper(fox=false){
 return texture(256,192,(c,w,h)=>{
  const rnd=randomSeed(602111);
  const light=c.createLinearGradient(0,0,0,h);
  light.addColorStop(0,'#cd7531');light.addColorStop(.18,'#ffd48d');light.addColorStop(.52,'#fff0bc');light.addColorStop(.84,'#ffd178');light.addColorStop(1,'#ad5628');
  c.fillStyle=light;c.fillRect(0,0,w,h);
  for(let y=5;y<h;y+=8){c.fillStyle='rgba(113,56,29,.22)';c.fillRect(0,y,w,1);c.fillStyle='rgba(255,245,199,.25)';c.fillRect(0,y+1,w,1);}
  for(let i=0;i<1200;i++){c.fillStyle=i%3?'#ffeec03a':'#8c532735';c.fillRect(rnd()*w,rnd()*h,2,.55);}
  if(fox)for(let i=0;i<4;i++){
   foxMark(c,32+i*64,90,.60,'#fff1c8','#a6442b');
   blossom(c,20+i*64,139,8,'#b34c35bb');
  }
 });
}
function windowPaper(){
 return texture(96,104,(c,w,h)=>{
  const g=c.createRadialGradient(w*.53,h*.64,5,w*.53,h*.64,w*.76);
  g.addColorStop(0,'#ffdc9f');g.addColorStop(.63,'#e59b4b');g.addColorStop(1,'#8b552c');c.fillStyle=g;c.fillRect(0,0,w,h);
  c.fillStyle='#71391427';c.fillRect(0,33,w,1);c.fillRect(0,70,w,1);
 });
}
function floorGlow(){
 return texture(128,192,(c,w,h)=>{
  const rnd=randomSeed(20509),g=c.createRadialGradient(w/2,h*.48,1,w/2,h*.48,w*.49);
  c.scale(1,h/w);g.addColorStop(0,'rgba(255,182,83,.72)');g.addColorStop(.28,'rgba(245,131,51,.30)');g.addColorStop(.72,'rgba(214,79,24,.105)');g.addColorStop(1,'rgba(185,50,20,0)');
  c.fillStyle=g;c.fillRect(0,0,w,w);
  c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-atop';
  for(let i=0;i<350;i++){c.fillStyle=i%3?'#351a1639':'#ffe0a46b';c.fillRect(rnd()*w,rnd()*h,2+rnd()*13,.7+rnd()*.9);}
 });
}
function moonTexture(){
 return texture(256,256,(c,w,h)=>{
  const rnd=randomSeed(778),x=w/2,y=h/2;
  const halo=c.createRadialGradient(x,y,29,x,y,126);halo.addColorStop(0,'#e8dbd9');halo.addColorStop(.36,'#98b9ef42');halo.addColorStop(1,'#84a6eb00');c.fillStyle=halo;c.fillRect(0,0,w,h);
  c.save();c.beginPath();c.arc(x,y,34,0,7);c.clip();const face=c.createLinearGradient(95,104,161,150);face.addColorStop(0,'#fff7e5');face.addColorStop(1,'#e7c5a8');c.fillStyle=face;c.fillRect(90,90,76,76);
  for(let i=0;i<88;i++){
   const a=rnd()*7,r=rnd()*35,rx=1+rnd()*8;
   c.fillStyle=i%3?'#987f6f30':'#fff9de78';c.beginPath();c.ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,rx,rx*.65,a,0,7);c.fill();
  }
  c.restore();
 });
}
function cloudTexture(){
 return texture(512,196,(c,w,h)=>{
  const rnd=randomSeed(37);
  for(let i=0;i<90;i++){
   const x=45+rnd()*420,y=h*.64+Math.sin(x*.013)*20+(rnd()-.5)*40,r=16+rnd()*83;
   c.save();c.translate(x,y);c.scale(1,.27);
   const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,i%4===0?'#7e9ccd40':'#33466b40');g.addColorStop(1,'#242f6100');c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();
  }
 });
}
function lanternShape(){
 const pts=[];
 for(let i=0;i<=16;i++){
  const t=i/16;
  pts.push(new T.Vector2(.31+.19*Math.sin(t*Math.PI)**.72,t-.5));
 }
 return new T.LatheGeometry(pts,16);
}
function nearRoute(x,z){
 let nearest=Infinity;
 for(const route of ROUTES)for(let i=1;i<route.length;i++){
  const [ax,az]=route[i-1],dx=route[i][0]-ax,dz=route[i][1]-az;
  const t=T.MathUtils.clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1),0,1);
  nearest=Math.min(nearest,Math.hypot(x-ax-dx*t,z-az-dz*t));
 }
 return nearest;
}
export function createNightWalk(scene,world){
 const M=world.M,art=new GeometryBuilder(scene,M,world.physics),sites=[],reflections=[],glowMats=[];
 const layout=world.fixtureLayout;
 const dryStone={roughness:M.stone.roughness,bumpScale:M.stone.bumpScale};
 const paper=(map,color)=>{const m=new T.MeshStandardMaterial({map,color,emissive:'#ffc373',emissiveMap:map,emissiveIntensity:0,roughness:.8});m.userData.noShadow=true;glowMats.push(m);return m;};
 const warm=paper(lampPaper(),0xffffff),printed=paper(lampPaper(true),0xffffff),window=paper(windowPaper(),0xffffff);
 const garment=texture(160,256,(c,w,h)=>{c.fillStyle='#873727';c.fillRect(0,0,w,h);foxMark(c,w/2,h*.40,1.28,'#f0dcc0','#7e392a');blossom(c,w/2,h*.75,26,'#e6c5a3');});
 const banner=new T.MeshStandardMaterial({map:garment,side:T.DoubleSide,roughness:.82});banner.userData.noShadow=true;
 const stem=new T.MeshStandardMaterial({color:'#667a32',roughness:.82}),moss=new T.MeshStandardMaterial({color:'#3d542a',roughness:.96});
 const shape=lanternShape(),cap=curvedRoof(.79,.79,.29,{ridge:.29,curl:.09});
 function point(x,y,z,kind,reach,power){sites.push({x,y,z,kind,reach,power});}
 function woodBox(x,y,z,size,angle=0){
  const w=.52*size,h=.80*size;
  art.box(M.darkWood,x,y+.065,z,w*1.14,.10,w*1.14,angle);
  art.box(warm,x,y+h*.51,z,w*.88,h*.80,w*.88,angle);
  art.box(M.darkWood,x,y+h,z,w*1.14,.075,w*1.14,angle);
  const cx=Math.cos(angle),sz=Math.sin(angle);
  for(const a of [-1,1])for(const b of [-1,1])art.box(M.darkWood,x+cx*a*w*.48+sz*b*w*.48,y+h*.5,z-sz*a*w*.48+cx*b*w*.48,.055*size,h,.055*size,angle);
  for(const t of [.37,.66]){art.box(M.darkWood,x,y+h*t,z,w,.027,w,angle); }
  point(x,y+h*.69,z,'andon',6.2,12*size);
  world.physics.box('夜行行燈',x,y+h*.57,z,w,h*1.14,w,angle);
 }
 function stoneLamp(x,y,z,angle){
  art.box(M.wall,x,y+.10,z,.78,.19,.74,angle);art.box(M.wall,x,y+.23,z,.63,.15,.59,angle);
  art.cylinder(M.wall,x,y+.53,z,.17,.57);art.box(M.wall,x,y+.87,z,.58,.17,.55,angle);
  art.box(warm,x,y+1.10,z,.37,.31,.37,angle);
  for(const a of [-1,1])for(const b of [-1,1])art.box(M.wall,x+a*.23,y+1.11,z+b*.23,.10,.38,.10,angle);
  art.put(cap,M.wall,x,y+1.35,z,1,1,1,0,angle);art.sphere(M.wall,x,y+1.66,z,.074,.126,.074);
  point(x,y+1.16,z,'stone',7.6,23);
  world.physics.box('夜行石燈籠',x,y+.66,z,.64,1.33,.62,angle);
 }
 const anchors=[];let windowCount=0;
 for(const w of world.nightWindows){
  const distance=nearRoute(w.x+w.nx*.5,w.z+w.nz*.5);
  if(distance>7.8||w.bay%7===6)continue;
  art.put('plane',window,w.x+w.nx*.043,w.y,w.z+w.nz*.043,w.width-.018,1.30,1,0,w.angle);
  windowCount++;
  if(w.bay%2===0)anchors.push({...w,distance});
 }
 let wallCount=0;
 for(const w of anchors){
  const x=w.x+w.nx*.52,z=w.z+w.nz*.52,y=w.y+.62;
  if(sites.some(p=>Math.hypot(p.x-x,p.z-z)<2.82))continue;
  const fox=wallCount%4===0,side=fox?.42:.34;
  const rodA=new T.Vector3(w.x-w.nx*.09,y+.73,w.z-w.nz*.09),rodB=new T.Vector3(x,y+.73,z);
  art.beam(M.darkWood,rodA,rodB,.033);art.cylinder(M.darkWood,x,y+.65,z,.024,.21);
  art.put(shape,fox?printed:warm,x,y,z,side*1.44,fox?1:.72,side*1.44,0,w.angle);
  for(const k of [-1,1])art.cylinder(M.darkWood,x,y+k*(fox?.51:.37),z,side*.48,.068);
  if(fox){art.cylinder(M.rope,x,y-.68,z,.037,.25);art.sphere(M.redDark,x,y-.80,z,.062,.08,.062);}
  if(fox&&wallCount%3===0)art.put('plane',banner,w.x+w.nx*.20+w.nz*.96,y-.62,w.z+w.nz*.20-w.nx*.96,.57,1.37,1,0,w.angle);
  point(x,y-.06,z,'paper',8.1,25);
  if(Number.isFinite(world.walkHeight(x,z)))reflections.push({x:x+w.nx*.75,z:z+w.nz*.75,w:2.0,d:2.7,angle:w.angle});
  wallCount++;
 }
 const placed=[];
 for(const [routeIndex,route] of ROUTES.entries()){
  const grand=routeIndex===0;
  for(const [i,p] of pathSamples(route,grand?9.4:routeIndex<4?5.1:10).entries()){
   const flank=(i%2===0?1:-1),gap=grand?(p.x<-20?7.03:5.31):routeIndex<4?1.62:1.89;
   for(const side of [flank,-flank]){
    const stone=routeIndex<4&&i%4===1,radius=stone?.51:.38;
    const spot=layout.beside(world,p,side,radius,gap);
    if(!spot||placed.some(q=>Math.hypot(q.x-spot.x,q.z-spot.z)<2.75))continue;
    const {x,y,z}=spot;
    const a=Math.atan2(p.dx,p.dz);
    if(stone)stoneLamp(x,y,z,a);
    else woodBox(x,y,z,i%3===1?.87:1,a);
    placed.push({x,z});
    layout.record(stone?'夜行石燈籠':'夜行行燈',spot,radius);
    reflections.push({x:x+p.dz*.27*side,z:z-p.dx*.27*side,w:1.38,d:2.62,angle:a});
    if(!grand)break;
   }
  }
 }
 for(const [x,z] of [[85.55,-28.25],[63.86,-37.27],[110.8,-6.0],[177.92,14.34]]){
  const y=world.walkHeight(x,z);if(!Number.isFinite(y))continue;
  for(const side of [-1,1])point(x+side*1.25,y+.82,z,'torii',9.6,40);
  reflections.push({x,z,w:2.7,d:3.4,angle:0});
 }
 let gateLanterns=0;
 const mainTorii=MAP.paths.find(p=>p.id===260121354);
 for(const [i,p] of pathSamples(mainTorii.p,1.9).entries()){
  if(i%6!==0)continue;
  const dx=p.dz*1.38,dz=-p.dx*1.38,a=Math.atan2(p.dx,p.dz);
  for(const side of i%2===0?[-1,1]:[1]){
   const x=p.x+dx*side,z=p.z+dz*side,y=world.walkHeight(p.x,p.z)-.02;
   if(!Number.isFinite(y))continue;
   art.put(shape,printed,x,y+2.48,z,.44,.66,.44,0,a);
   for(const h of [2.14,2.82])art.cylinder(M.darkWood,x,y+h,z,.15,.057);
   art.cylinder(M.darkWood,x,y+3.21,z,.019,.77);
   point(x,y+2.25,z,'gate',8.4,23);gateLanterns++;
  }
  reflections.push({x:p.x,z:p.z,w:2.45,d:3.1,angle:a});
 }
 // Garden details sit on the verges and leave the existing mapped path open.
 const gardenSeeds=[[24.83,-16.74],[30.2,-20.49],[48.94,-25.92],[84,-30.75],[86.91,-29.4],[63.1,-35.4]];
 let gardens=0;
 const rnd=randomSeed(56);
 for(const [x,z] of gardenSeeds){
  const spot=layout.test(world,x,z,.46);if(!spot)continue;
  const {y}=spot;
  layout.record('夜行苔石與竹叢',spot,.46);
  gardens++;
  art.sphere(M.wall,x,y+.15,z,.45,.23,.38);art.sphere(moss,x-.09,y+.29,z-.035,.32,.09,.29);
  for(let i=0;i<5;i++){
   const u=x+(rnd()-.5)*.52,v=z+(rnd()-.5)*.43,h=.95+rnd()*1.03;
   art.cylinder(stem,u,y+h*.5,v,.026,h);
   for(let j=1;j<=4;j++){
    const a=rnd()*6.28,at=y+h*j/5;
    art.cylinder(M.rope,u,at,v,.031,.015);
    art.put('petal',stem,u+Math.cos(a)*.10,at+.05,v+Math.sin(a)*.10,.04,.16,.019,.6,a,.52);
    art.put('petal',stem,u-Math.cos(a)*.13,at+.13,v-Math.sin(a)*.13,.04,.20,.019,-.64,a,-.70);
   }
  }
 }
 const fox=createArchitecture(art,world.surface).fox;
 let statues=0;
 for(const [ax,az,angle] of [[30.05,-20.64,-1.05],[87.18,-30.33,-2.3]]){
  let spot;
  for(let r=0;r<=2.35&&!spot;r+=.27)for(let j=0;j<16;j++){
   const x=ax+r*Math.cos(j*Math.PI/8),z=az+r*Math.sin(j*Math.PI/8),y=world.walkHeight(x,z);
   if(!layout.test(world,x,z,.63))continue;
   const rim=[[-.37,-.37],[-.37,.37],[.37,-.37],[.37,.37]];
   if(rim.some(([dx,dz])=>Math.abs(world.walkHeight(x+dx,z+dz)-y)>.32||world.physics.collides(x+dx,y,z+dz)))continue;
   spot={x,y,z};break;
  }
  if(spot){fox(spot.x,spot.z,.43,angle,spot.y,'pearl');layout.record('夜行石狐',spot,.63);statues++;}
 }
 world.builder.meshes.push(...art.finish());
 const wetMat=new T.MeshBasicMaterial({map:floorGlow(),color:'#ffd28a',transparent:true,opacity:.55,depthWrite:false,blending:T.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-1});
 wetMat.userData.noShadow=true;
 const positions=[],uvs=[];
 for(const q of reflections){
  const cos=Math.cos(q.angle),sin=Math.sin(q.angle);
  const add=(u,v)=>{const x=q.x+cos*(u-.5)*q.w+sin*(v-.5)*q.d,z=q.z-sin*(u-.5)*q.w+cos*(v-.5)*q.d,y=world.walkHeight(x,z);positions.push(x,(Number.isFinite(y)?y:0)+.021,z);uvs.push(u,v);};
  for(let j=0;j<3;j++)for(let k=0;k<3;k++){
   const l=k/3,r=(k+1)/3,b=j/3,t=(j+1)/3;
   add(l,b);add(l,t);add(r,b);add(r,b);add(l,t);add(r,t);
  }
 }
 const wetGeo=new T.BufferGeometry();wetGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));wetGeo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 const wet=new T.Mesh(wetGeo,wetMat);wet.visible=false;wet.renderOrder=3;scene.add(wet);
 const moon=new T.Sprite(new T.SpriteMaterial({map:moonTexture(),transparent:true,depthWrite:false,fog:false}));
 moon.position.set(1250,2270,6900);moon.scale.set(1780,1780,1);moon.visible=false;scene.add(moon);
 const clouds=new T.Group(),cloudMap=cloudTexture();
 for(const [x,y,z,scale,opacity] of [[7600,1370,-650,4300,.68],[3100,1390,6500,5000,.76],[-650,1170,6600,5400,.65],[-3500,1300,-4200,5200,.57]]){
  const o=new T.Sprite(new T.SpriteMaterial({map:cloudMap,transparent:true,opacity,depthWrite:false,fog:false}));o.position.set(x,y,z);o.scale.set(scale,scale*.34,1);clouds.add(o);
 }
 clouds.visible=false;scene.add(clouds);
 const fleckMap=texture(32,32,(c,w,h)=>{
  const g=c.createRadialGradient(w/2,h/2,1,w/2,h/2,w/2);
  g.addColorStop(0,'#fff5d8');g.addColorStop(.39,'#ffe5a998');g.addColorStop(1,'#ffc68000');
  c.fillStyle=g;c.fillRect(0,0,w,h);
 });
 const flickerGeo=new T.BufferGeometry(),fireflies=new T.Points(flickerGeo,new T.PointsMaterial({map:fleckMap,color:'#ffd481',size:.115,transparent:true,opacity:.66,depthWrite:false,blending:T.AdditiveBlending}));
 const flecks=new Float32Array(3*68);flickerGeo.setAttribute('position',new T.BufferAttribute(flecks,3));fireflies.frustumCulled=false;fireflies.visible=false;scene.add(fireflies);
 const lights=Array.from({length:5},()=>{const l=new T.PointLight('#ffb265',0,9,2);l.visible=false;scene.add(l);return l;});
 const rim=new T.DirectionalLight('#87a8f1',.56);rim.position.set(11,17,-8);rim.visible=false;scene.add(rim);
 const litterMat=new T.MeshStandardMaterial({color:'#f1aeb4',roughness:.78,side:T.DoubleSide});
 const litter=new T.InstancedMesh(new T.CircleGeometry(1,5),litterMat,186),dummy=new T.Object3D();litter.count=0;litter.visible=false;
 for(const path of [ROUTES[1],ROUTES[3]])for(const [idx,p] of pathSamples(path,.72).entries()){
  for(const side of [-1,1]){
   if(litter.count>=litter.instanceMatrix.count)break;
   const a=(.58+rnd()*.68)*side,x=p.x-p.dz*a,z=p.z+p.dx*a,y=world.walkHeight(x,z);
   if(!Number.isFinite(y)||world.physics.collides(x,y,z))continue;
   dummy.position.set(x,y+.019,z);dummy.rotation.set(-Math.PI/2,0,idx*2.3999);dummy.scale.set(.025+rnd()*.023,.017+rnd()*.026,1);
   dummy.updateMatrix();litter.setMatrixAt(litter.count++,dummy.matrix);
  }
 }
 litter.computeBoundingSphere();scene.add(litter);
 let night=false,lastUpdate=-Infinity;
 const stats={lanterns:wallCount+placed.length+gateLanterns,wallLanterns:wallCount,pathLanterns:placed.length,gateLanterns,windowCount,gardens,statues,lightBudget:lights.length,active:0};
 function setNight(value){
  night=value;moon.visible=clouds.visible=rim.visible=wet.visible=value;
  M.stone.roughness=value?.47:dryStone.roughness;
  M.stone.bumpScale=value?.012:dryStone.bumpScale;
  for(const mat of glowMats)mat.emissiveIntensity=value?1.38:0;
  window.visible=value;window.emissiveIntensity=value?.92:0;
  for(const l of lights){l.visible=value;l.intensity=0;}
  lastUpdate=-Infinity;
  if(!value){stats.active=0;fireflies.visible=litter.visible=false;}
 }
 function update(time,player,mode,weather,season,reduced){
  if(!night)return;
  const rainy=weather==='rain',foggy=weather==='mist';
  M.stone.roughness=rainy?.28:.47;
  moon.material.opacity=rainy?.19:foggy?.40:1;
  wetMat.opacity=rainy?.96:foggy?.39:.76;
  wet.visible=mode!=='overview';
  clouds.visible=true;
  if(time-lastUpdate>.24){
   lastUpdate=time;
   const scored=mode==='overview'?[]:sites.map(p=>({p,d:Math.hypot(p.x-player.x,p.z-player.z)})).filter(p=>p.d<25).sort((a,b)=>a.d-b.d);
   const lit=[];
   for(const {p} of scored){if(lit.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<2.15))continue;lit.push(p);if(lit.length===lights.length)break;}
   stats.active=lit.length;
   lights.forEach((l,i)=>{const p=lit[i];if(!p){l.intensity=0;return;}l.position.set(p.x,p.y,p.z);l.distance=p.reach;l.intensity=p.power;});
  }
  fireflies.visible=mode==='walk'&&!rainy&&season!=='winter'&&!reduced&&Math.hypot(player.x-50,player.z+28)<75;
  litter.visible=(season==='spring'||season==='autumn')&&mode!=='overview'&&Math.hypot(player.x-50,player.z+28)<78;
  litterMat.color.set(season==='autumn'?'#d37838':'#efb0ae');
  if(fireflies.visible){
   const clock=time*.30;
   for(let i=0;i<flecks.length/3;i++){
    const ix=i*3,x=player.x+Math.sin(i*6.175+clock*.42)*(2.1+(i*13%17)*.61),z=player.z+Math.sin(i*3.48-clock*.33)*(2.4+i%13);
    flecks[ix]=x;flecks[ix+1]=player.y+.72+(i*7%27)*.084+Math.cos(i+clock)*.33;flecks[ix+2]=z;
   }
   flickerGeo.attributes.position.needsUpdate=true;
  }
 }
 setNight(false);
 const y=world.walkHeight(HERO.x,HERO.z);
 return{arrival:{x:HERO.x,y,z:HERO.z},yaw:HERO.yaw,stats,setNight,update,moon,clouds,wet,fireflies};
}
