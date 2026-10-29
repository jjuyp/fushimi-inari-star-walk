import * as THREE from 'three';
import {DISTRICT} from './district-data.js';
import {loadTexture} from './textures.js';
import {asset} from './materials.js';
import {Building} from './geometry.js';
import {MAP,terrainHeight,footprintBox,insidePolygon,pathSamples} from './geography.js';

// One shared sign atlas keeps shop lettering sharp without one texture per shop.
export async function createDistrict(g,surface,architecture){
 const M=g.M,labels=['稲荷煎餅','京とうふ','宇治抹茶','伏見人形','いなり寿司','きつね面','甘味処','京みやげ','たこ焼き','みたらし','たい焼き','おみくじ','仁志むら亭','抹茶ソフト','JR 稲荷駅','伏見稲荷駅'];
 const atlas=document.createElement('canvas');atlas.width=atlas.height=2048;const ctx=atlas.getContext('2d');
 labels.forEach((label,i)=>{const x=i%4*512,y=Math.floor(i/4)*512;ctx.fillStyle=i<8?'#e8d9b4':i<12?'#a84225':i<14?'#243f39':'#eee4cd';ctx.fillRect(x,y,512,512);ctx.strokeStyle='#b99654';ctx.lineWidth=8;ctx.strokeRect(x+15,y+15,482,482);ctx.fillStyle=i>=8&&i<14?'#fff3d8':'#32261d';ctx.textAlign='center';ctx.font='bold 66px "Yu Mincho",serif';ctx.save();ctx.translate(x+256,y+325);ctx.scale(1,4.1);ctx.fillText(label,0,0,460);ctx.restore();ctx.font='24px serif';ctx.fillText(i<12?'伏見稲荷 ・ 京都':i<14?'四ツ辻 ・ 稲荷山':'FUSHIMI INARI',x+256,y+318);});
 const texture=new THREE.CanvasTexture(atlas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const signMat=new THREE.MeshStandardMaterial({map:texture,roughness:.87});signMat.userData.noShadow=true;signMat.name='商店街・文字アトラス';
 const signGeos=labels.map((_,i)=>{const geo=new THREE.PlaneGeometry(1,1),uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,(i%4+uv.getX(k))/4,1-(Math.floor(i/4)+1-uv.getY(k))/4);return geo;});
 const sign=(b,index,x,y,z,w,h)=>g.put(signGeos[index],signMat,...b.p(x,y,z),w,h,1,0,b.angle);
 const indigo=new THREE.MeshStandardMaterial({color:'#253f54',roughness:.95}),canvasMat=new THREE.MeshStandardMaterial({color:'#cf5b33',roughness:.95,side:THREE.DoubleSide}),tileMat=new THREE.MeshStandardMaterial({color:'#49514c',roughness:.9,map:M.roof.map});
 const tileCanvas=document.createElement('canvas');tileCanvas.width=tileCanvas.height=512;const tc=tileCanvas.getContext('2d');tc.fillStyle='#38413e';tc.fillRect(0,0,512,512);for(let row=0;row<8;row++)for(let col=0;col<12;col++){const x=col*44-8+(row%2)*2,y=row*64;const grad=tc.createLinearGradient(x,0,x+44,0);grad.addColorStop(0,'#252d2b');grad.addColorStop(.3,'#65706a');grad.addColorStop(.62,'#4b5551');grad.addColorStop(1,'#28322e');tc.fillStyle=grad;tc.fillRect(x,y,42,62);tc.strokeStyle='#171f1d';tc.lineWidth=3;tc.beginPath();tc.moveTo(x,y+60);tc.quadraticCurveTo(x+21,y+66,x+42,y+60);tc.stroke();}const tileTexture=new THREE.CanvasTexture(tileCanvas);tileTexture.colorSpace=THREE.SRGBColorSpace;tileTexture.wrapS=tileTexture.wrapT=THREE.RepeatWrapping;tileTexture.anisotropy=8;tileMat.map=tileTexture;tileMat.bumpMap=tileTexture;tileMat.bumpScale=.018;tileMat.color.set('#b6bbb5');
 const roof=(b,w,d,y)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,y,-d/2,w/2,y,-d/2,-w/2,y,d/2,w/2,y,d/2,-w/2,y+1.6,0,w/2,y+1.6,0],3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,w/2,0,0,d/2,w/2,d/2,0,d/4,w/2,d/4],2));geo.setIndex([0,4,1,1,4,5,4,2,5,5,2,3,0,2,4,1,5,3]);geo.computeVertexNormals();b.mesh(geo,tileMat);geo.dispose();for(const side of [-1,1]){b.box(M.darkWood,0,y-.06,side*d/2,w,.12,.18);b.box(tileMat,0,y+.015,side*d/2,w,.1,.15);b.box(M.bronze,side*(w/2-.15),y-1.5,d/2,.075,3,.075);}b.box(tileMat,0,y+1.65,0,w+.15,.16,.3);};
 const facadeTexture=await loadTexture('v3.1/shop-facade-atlas.webp',true);facadeTexture.colorSpace=THREE.SRGBColorSpace;facadeTexture.anisotropy=8;
 const facadeMat=new THREE.MeshStandardMaterial({map:facadeTexture,roughness:.88,envMapIntensity:.4});facadeMat.userData.noShadow=true;facadeMat.name='実写真・町屋格子と店先';
 const facadeGeos=Array.from({length:4},(_,i)=>{const geo=new THREE.PlaneGeometry(1,1),uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,(i%2+uv.getX(k))/2,1-(Math.floor(i/2)+1-uv.getY(k))/2);return geo;});
 const photo=(b,i,x,y,z,w,h)=>g.put(facadeGeos[i%4],facadeMat,...b.p(x,y,z),w,h,1,0,b.angle);
 const salmon=new THREE.MeshStandardMaterial({color:'#e89b77',roughness:.82}),matcha=new THREE.MeshStandardMaterial({color:'#6d8e43',roughness:.83}),pink=new THREE.MeshStandardMaterial({color:'#e49b9c',roughness:.8});
 function products(b,kind,x,y,z){
  b.box(M.cream,x,y,z,.62,.045,.52);
  if(kind%5===0){for(let j=0;j<2;j++)for(let k=0;k<2;k++){const xx=x+(j-.5)*.23,zz=z+(k-.5)*.22;b.sphere(M.cream,xx,y+.09,zz,.105,.055,.085);b.box(salmon,xx,y+.14,zz,.205,.035,.15);b.box(M.black,xx,y+.14,zz,.055,.055,.155);}}
  else if(kind%5===1){for(let j=0;j<2;j++){b.column(M.wood,x+(j-.5)*.22,y+.08,z,.012,.05,false);for(let k=0;k<3;k++)b.sphere([matcha,M.cream,pink][k],x+(j-.5)*.22,y+.11,z+(k-1)*.14,.072);b.box(M.wood,x+(j-.5)*.22,y+.07,z,.016,.016,.62);}}
  else if(kind%5===2){for(let j=0;j<3;j++)for(let k=0;k<2;k++){const xx=x+(j-1)*.17,zz=z+(k-.5)*.2;b.sphere(M.rope,xx,y+.11,zz,.078,.065,.078);b.box(M.cream,xx,y+.17,zz,.09,.008,.015,.3);b.box(matcha,xx,y+.178,zz,.022,.008,.03);}}
  else if(kind%5===3){for(let k=0;k<3;k++){b.column(matcha,x+(k-1)*.17,y+.15,z,.075,.24,false);b.column(M.goldDark,x+(k-1)*.17,y+.285,z,.079,.025,false);}}
  else{for(let j=0;j<3;j++)for(let k=0;k<2;k++){b.sphere(M.rope,x+(j-1)*.17,y+.07,z+(k-.5)*.2,.078,.02,.078);b.box(M.black,x+(j-1)*.17,y+.09,z+(k-.5)*.2,.05,.01,.03);}}
 }
 let shops=0,stalls=0;const storefronts=[],stallSites=[];
 const nearestRoute=(x,z)=>{let best={distance:Infinity,x,z};for(const route of DISTRICT.routes)for(let i=1;i<route.p.length;i++){const a=route.p[i-1],b=route.p[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),xx=a[0]+dx*t,zz=a[1]+dz*t,d=Math.hypot(xx-x,zz-z);if(d<best.distance)best={distance:d,x:xx,z:zz};}return best;};
 for(const building of DISTRICT.buildings){
  const bb=footprintBox(building);if(!bb||bb.area<7)continue;const y=terrainHeight(bb.x,bb.z),b=new Building(g,String(building.id),bb.x,y,bb.z,bb.angle),height=building.type==='train_station'?3.8:bb.area>140?6.6:5.2;
  if(building.type==='roof'){
   roof(b,bb.w+.6,bb.d+1,3.7);for(const s of [-1,1])for(const t of [-1,1])b.column(M.red,s*(bb.w/2-.4),1.8,t*(bb.d/2-.3),.12,3.6);architecture.registered.push({id:building.id,name:building.name||'駅舎の庇',x:bb.x,z:bb.z,w:bb.w,d:bb.d,angle:bb.angle,open:true,district:true});continue;
  }
  const shape=new THREE.Shape();building.p.forEach((p,i)=>i?shape.lineTo(p[0]-bb.x,-p[1]+bb.z):shape.moveTo(p[0]-bb.x,-p[1]+bb.z));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);g.mesh(geo,M.cream,bb.x,y,bb.z);geo.dispose();roof(b,bb.w+.8,bb.d+1,height);
  let best=null;
  for(let i=1;i<building.p.length;i++){const a=building.p[i-1],c=building.p[i],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);if(length<.1)continue;const x=(a[0]+c[0])/2,z=(a[1]+c[1])/2,angle=Math.atan2(-dz,dx);g.physics.box(String(building.id),x,y+height/2,z,length,height,.2,angle);g.box(M.darkWood,x,y+.35,z,length,.25,.18,angle);g.box(M.darkWood,x,y+height*.52,z,length,.2,.18,angle);let nx=-dz/length,nz=dx/length;if(insidePolygon(x+nx*.2,z+nz*.2,building.p)){nx=-nx;nz=-nz;}
   if(length>3){const front=new Building(g,'photo upper facade',x+nx*.13,y,z+nz*.13,Math.atan2(nx,nz));photo(front,shops%2,0,height*.72,.015,length-.12,height*.45);for(const edge of [-1,1])front.box(M.darkWood,edge*(length/2-.07),height*.72,.045,.12,height*.48,.1);front.box(M.darkWood,0,height*.49,.045,length,.12,.16);}
   const near=surface.nearPath(x+nx,z+nz),route=nearestRoute(x,z),facing=(route.x-x)*nx+(route.z-z)*nz,score=route.distance<20&&facing>1?route.distance-30:near.distance;if(length>2.5&&near.distance<18&&(!best||score<best.distance))best={x,z,nx,nz,length,distance:score};}
  architecture.registered.push({id:building.id,name:building.name||'參道町屋',x:bb.x,z:bb.z,w:bb.w,d:bb.d,angle:bb.angle,open:false,district:true});
  if(building.type==='train_station'){const station=new Building(g,'JR station front',bb.x+bb.d/2+.08,y,bb.z,Math.PI/2);sign(station,14,0,3.1,.1,9,1.2);for(let k=-5;k<=5;k++){station.column(M.red,k*2,1.8,.2,.1,3.6);station.box(M.darkWood,k*2,1.7,.15,1.6,2.5,.08);}continue;}
  if(best&&shops<135){const q=best,front=new Building(g,'shopfront-'+building.id,q.x+q.nx*.18,y,q.z+q.nz*.18,Math.atan2(q.nx,q.nz)),w=Math.min(6.4,q.length-.4),index=shops%8;
   front.box(M.darkWood,0,1.5,.05,w,2.8,.08);photo(front,shops%3===0?3:2,0,1.45,.145,w,2.65);for(const edge of [-1,1])front.box(M.wood,edge*w/2,1.5,.19,.12,2.8,.12);
   front.box(M.wood,0,2.95,.32,w+.35,.13,1.2);sign(front,index,0,3.75,.13,w*.92,.85);
   const cloth=shops%2?indigo:canvasMat;for(let k=0;k<5;k++){front.box(cloth,(k-2)*w/5,2.48,.57,w/5-.03,.8,.035);sign(front,index,(k-2)*w/5,2.55,.6,.28,.32);}
   front.box(M.wood,0,.9,.65,w*.78,.12,.62,0,true);for(let k=0;k<Math.min(5,Math.floor(w/.8));k++)products(front,index,(k-(Math.min(5,Math.floor(w/.8))-1)/2)*.75,1.02,.67);
   storefronts.push({x:front.x,z:front.z,id:building.id});shops++;
  }
 }
 // Festival yatai stand beside public paving, with a clear central walking lane.
 const route={p:DISTRICT.routes.find(r=>r.from==='keihan').p};const marketSamples=[...pathSamples(route.p,7.2),...pathSamples(DISTRICT.routes.find(r=>r.from==='jr').p,6.6)];
 for(const [i,p]of marketSamples.entries())for(const side of [-1,1]){
  const nx=-p.dz*side,nz=p.dx*side,x=p.x+nx*5.3,z=p.z+nz*5.3,y=terrainHeight(x,z),near=surface.nearPath(x,z);
  if(x<-340||x>-65||near.distance<3.6||DISTRICT.buildings.some(b=>insidePolygon(x,z,b.p)||b.p.some(q=>Math.hypot(q[0]-x,q[1]-z)<3))||g.physics.collides(x,y,z))continue;
  const b=new Building(g,'festival-stall-'+stalls,x,y,z,Math.atan2(-nx,-nz));b.box(M.wood,0,1,0,3,.13,1.8,0,true);b.box(M.wood,0,.5,-.5,3,1,1,0,true);
  for(const a of [-1,1])for(const c of [-1,1])b.column(M.wood,a*1.5,1.5,c*.8,.045,3,false);b.box(i%2?indigo:canvasMat,0,2.8,0,3.5,.15,2.3);sign(b,8+stalls%4,0,2.35,1.17,2.9,.7);
  for(const a of [-1,1]){b.column(M.glow,a*1.15,2,1.04,.16,.48,false);b.box(M.black,a*1.15,2.27,1.04,.32,.06,.32);}
  for(let k=-1;k<=1;k++)products(b,stalls,k*.75,1.1,.25);b.box(M.darkWood,0,2.1,-.65,2.6,.1,.35);for(let k=-3;k<=3;k++){b.column(stalls%2?matcha:M.rope,k*.32,2.27,-.65,.085,.25,false);b.column(M.goldDark,k*.32,2.41,-.65,.09,.04,false);}
  g.physics.box('festival canopy',x,y+2.85,z,3.5,.15,2.3,b.angle);stallSites.push({x,z,y,angle:b.angle,kind:stalls%4});stalls++;
 }
 // Station centres are measured OSM points; exits connect to the retained street nodes.
 for(const s of DISTRICT.stations){const y=terrainHeight(...s.p),b=new Building(g,s.name,s.p[0]+10,y,s.p[1],Math.PI/2),jr=s.id==='jr';
  if(!jr){roof(b,13,7,3.8);for(const x of [-5,5])for(const z of [-2.5,2.5])b.column(M.red,x,1.9,z,.16,3.8);sign(b,15,0,3.3,3.55,7,1.1);for(const x of [-3,3])architecture.hangingLantern(b,x,3.2,3,.8);}
  const poi=MAP.pois.find(p=>p.id===s.id),path=DISTRICT.routes.find(r=>r.from===s.id),exit=path.p[0];poi.p=[...exit];
 }
 // Rail tracks remain visual; crossing roads stay traversable in this walking scene.
 for(const rail of DISTRICT.railways)for(const p of pathSamples(rail.p,.75)){
  const angle=Math.atan2(-p.dz,p.dx),y=terrainHeight(p.x,p.z)+.14;
  // Local samples follow terrain continuously; ballast sits above the town paving.
  g.box(M.wall,p.x,y-.045,p.z,.8,.16,2.5,angle);
  for(const side of [-1,1])g.box(M.bronze,p.x-p.dz*.535*side,y+.16,p.z+p.dx*.535*side,.86,.105,.075,angle);
  g.box(M.darkWood,p.x,y+.035,p.z,.18,.1,2.1,angle);
 }
 const cross=new Building(g,'JR crossing',-218,terrainHeight(-218,-89),-89,0);for(const s of [-1,1]){cross.column(M.goldDark,0,1.4,s*5,.08,2.8);for(const a of [-.6,.6])cross.box(M.black,0,2.8,s*5,.12,1.8,.1,a);cross.sphere(M.red,-.2,2.1,s*5+.12,.13);cross.sphere(M.red,.2,2.1,s*5+.12,.13);}
 const canalMat=new THREE.MeshStandardMaterial({color:'#477878',roughness:.35,metalness:.18,envMapIntensity:.7});
 for(const stream of DISTRICT.waterways)for(const p of pathSamples(stream.p,2.5)){const y=terrainHeight(p.x,p.z),near=surface.nearPath(p.x,p.z),angle=Math.atan2(p.dx,p.dz);if(near.distance<4){g.box(M.stone,p.x,y+.09,p.z,stream.width+1,.18,3,angle);continue;}g.put('plane',canalMat,p.x,y+.025,p.z,stream.width,2.6,1,-Math.PI/2,angle);for(const side of [-1,1])g.box(M.wall,p.x-p.dz*stream.width/2*side,y+.1,p.z+p.dx*stream.width/2*side,.3,.35,2.6,angle);}
 // Tea house furniture is at the actual Yotsutsuji junction, facing west into Kyoto basin.
 const teaPoint=MAP.pois.find(p=>p.id==='yotsu').p;
 let teaSpot=null;for(const r of [18,22,26])for(const a of [0,-Math.PI/4,Math.PI/4,-Math.PI/2,Math.PI/2]){if(teaSpot)break;const x=teaPoint[0]+Math.cos(a)*r,z=teaPoint[1]+Math.sin(a)*r,y=terrainHeight(x,z),near=surface.nearPath(x,z),heights=[[-4,-6],[-4,6],[4,-6],[4,6]].map(p=>terrainHeight(x+p[0],z+p[1]));if(near.distance>8&&Math.max(...heights)-Math.min(...heights)<3.6&&!g.physics.collides(x,y,z)&&!MAP.buildings.some(b=>insidePolygon(x,z,b.p)))teaSpot={x,z,y};}
 const t=teaSpot||{x:teaPoint[0]+16,z:teaPoint[1]-12,y:terrainHeight(teaPoint[0]+16,teaPoint[1]-12)},tea=new Building(g,'yotsu-tea',t.x,t.y,t.z,-Math.PI/2);
 tea.box(M.wall,0,-.25,-1,11,.5,6,0,true);tea.box(M.cream,0,2,-1,10,4,5,0,true);architecture.detailedRoof(tea,4,12,8,2.1);sign(tea,12,0,3.25,1.6,6.6,1.2);sign(tea,13,4,1.6,1.65,1.1,1.5);
 for(let i=-2;i<=2;i++){tea.box(M.darkWood,i*1.8,1.6,1.55,1.6,2.4,.08);for(let k=0;k<7;k++)tea.box(M.wood,i*1.8-.68+k*.225,1.6,1.62,.045,2.4,.05);}tea.box(M.wood,0,.16,3.2,11,.3,3.5,0,true);
 for(const x of [-4,-2,0,2,4])tea.column(M.darkWood,x,1.9,2.5,.1,3.8);for(let i=0;i<5;i++)tea.box(indigo,(i-2)*1.65,2.6,2.6,1.6,.8,.04);
 for(const x of [-3,2.5]){tea.box(M.redDark,x,.6,4,3.4,.16,1,0,true);for(const a of [-1,1])tea.box(M.darkWood,x+a*1.2,.27,4,.18,.55,.6);tea.box(M.redEdge,x,.71,4,3.2,.08,.9);}
 const foundationLow=Math.min(...[-5.5,5.5].flatMap(x=>[-3.5,5].map(z=>{const p=tea.p(x,0,z);return terrainHeight(p[0],p[2])-t.y;})))-.3;
 tea.box(M.wall,0,foundationLow/2,1,11,-foundationLow,8,0,true);
 const deck=tea.p(0,0,3.5);surface.pad(deck[0],deck[2],10.5,3.4,t.y+.315,tea.angle);
 const entry=tea.p(0,0,5.2),nearEntry=surface.nearPath(entry[0],entry[2]),dx=entry[0]-nearEntry.x,dz=entry[2]-nearEntry.z,len=Math.hypot(dx,dz),stairAngle=Math.atan2(-dx,-dz),low=surface.height(nearEntry.x,nearEntry.z),high=t.y+.315;
 surface.addSegment([nearEntry.x,nearEntry.z],[entry[0],entry[2]],2.5,true,'tea-approach');
 if(len>.5){const count=Math.max(Math.ceil(len/.28),Math.ceil(Math.abs(high-low)/.14)),midX=(entry[0]+nearEntry.x)/2,midZ=(entry[2]+nearEntry.z)/2,step=(high-low)/count;surface.staircase(midX,midZ,2.5,len,low+step,high+step,stairAngle,count);for(let i=0;i<count;i++){const f=(i+.5)/count,x=nearEntry.x+dx*f,z=nearEntry.z+dz*f,top=low+(high-low)*(i+1)/count,bottom=Math.min(terrainHeight(x,z)-.25,top-.14);g.box(M.stone,x,(top+bottom)/2,z,2.5,top-bottom,len/count+.02,stairAngle);}}
 MAP.pois.push({id:'tea',name:'四辻茶屋・仁志むら亭周邊',p:[deck[0],deck[2]],altitude:t.y+MAP.dem.base});
 const teaFootprint=[[-6,-4],[6,-4],[6,5.2],[-6,5.2],[-6,-4]].map(([x,z])=>{const p=tea.p(x,0,z);return[p[0],p[2]];});
 MAP.buildings.push({id:'yotsu-tea',name:'四辻茶屋（情境重建）',type:'cafe',p:teaFootprint,artistic:true});
 architecture.registered.push({id:'yotsu-tea',name:'四辻茶屋',x:t.x,z:t.z,w:12,d:9.2,angle:tea.angle,open:false,district:false});
 for(let k=0;k<3;k++){const b=new Building(g,'tea display',t.x-3,t.y,t.z+(k-1)*.7,-Math.PI/2);b.g.put('cone',M.rope,...b.p(0,1.35,0),.12,.5,.12,Math.PI,0);b.sphere(M.cream,0,1.65,0,.18,.23,.18);b.g.put('torus',M.cream,...b.p(0,1.9,0),.12,.12,.12,Math.PI/2,0);}
 const board=new Building(g,'yotsu directions',teaPoint[0]+1,terrainHeight(teaPoint[0]+1,teaPoint[1]+4),teaPoint[1]+4,Math.PI/2);board.column(M.darkWood,0,1.2,0,.07,2.4);board.box(M.darkWood,0,1.9,0,1.5,.6,.1);sign(board,12,0,1.9,.06,1.4,.5);
 return{shops,stalls,stallSites,railways:DISTRICT.railways,sign,tea:{x:t.x,z:t.z,deck:[deck[0],deck[2]],approach:[[nearEntry.x,nearEntry.z],[entry[0],entry[2]]]},stations:DISTRICT.stations,storefronts};
}
