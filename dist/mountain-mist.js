import * as THREE from 'three';
import {terrainHeight} from './geography.js';

function hash(x,y){
 let i=(Math.imul(x,1597334677)^Math.imul(y,3812015801))>>>0;
 i=Math.imul(i^(i>>>15),2246822519)>>>0;
 return ((i^(i>>>13))>>>0)/4294967295;
}
function noise(x,y){
 const j=Math.floor(x),k=Math.floor(y),a=x-j,b=y-k,f=a*a*(3-2*a),g=b*b*(3-2*b);
 const l=hash(j,k)*(1-f)+hash(j+1,k)*f,r=hash(j,k+1)*(1-f)+hash(j+1,k+1)*f;
 return l*(1-g)+r*g;
}
function mistTexture(){
 const w=384,h=160,rgba=new Uint8Array(w*h*4);
 for(let i=0;i<w*h;i++){
  const x=(i%w)/w,y=Math.floor(i/w)/h,u=2*x-1;
  const center=.50+.11*Math.sin(x*5.7)+.045*Math.sin(x*16);
  const shape=Math.max(0,1-u*u)*Math.exp(-Math.pow((y-center)/.19,2));
  const form=noise(x*6.7,y*2.8)*.63+noise(x*17,y*7)*.25+noise(x*42,y*14)*.12;
  rgba.fill(255,i*4,i*4+3);
  rgba[i*4+3]=Math.round(255*Math.pow(shape,1.15)*THREE.MathUtils.smoothstep(form,.15,.69));
 }
 const texture=new THREE.DataTexture(rgba,w,h,THREE.RGBAFormat);
 texture.minFilter=texture.magFilter=THREE.LinearFilter;
 texture.needsUpdate=true;return texture;
}

// Banks are placed along the real terrain and each layer shares one alpha map.
export function createMountainMist(scene){
 const group=new THREE.Group();
 group.name='山霧・谷間與林冠之間';group.visible=false;scene.add(group);
 const texture=mistTexture(),banks=[];
 const layers=[
  [-148,45,128,12,4,.24],[-87,-62,113,13,10,.31],[-52,35,110,12,4,.34],[-32,-99,168,16,11,.46],
  [-34,6,38,6,1.4,.25],[-15,-13,64,11,4,.40],[13,12,58,8,2.4,.38],
  [15,50,96,11,4,.23],[24,105,153,19,12,.29],[43,-47,143,12,6,.30],[64,41,123,14,7,.22],
  [69,-115,160,17,12,.36],[90,90,137,20,13,.34],[108,-12,162,19,12,.26],[122,60,128,16,10,.35],
  [133,-86,150,20,19,.74],[154,21,159,17,12,.69],[177,-135,192,22,22,.67],[190,-35,174,22,14,.77],
  [176,68,157,17,15,.55],[245,-71,185,22,39,.80],[278,-121,199,27,54,.76],[326,44,207,27,44,.76],
  [203,104,154,22,16,.35],[224,17,168,23,14,.38],[253,-65,186,25,23,.54],[281,86,168,23,16,.40],
  [302,-125,165,25,18,.39],[340,2,210,24,21,.47],[395,-66,240,29,28,.52],[435,58,210,35,28,.43],
  [507,-119,260,37,36,.46],[558,84,255,30,33,.52],[695,-221,295,36,22,.45],[781,-143,225,25,26,.50],
  [848,-253,235,34,25,.55],[1024,-82,290,33,22,.60]
 ];
 for(const [i,[x,z,width,height,lift,opacity]] of layers.entries()){
  const material=new THREE.SpriteMaterial({map:texture,color:'#c6d7e8',transparent:true,opacity,depthWrite:false,fog:false});
  const mesh=new THREE.Sprite(material),y=terrainHeight(x,z)+lift;
  mesh.scale.set(width,height,1);mesh.position.set(x,y,z);group.add(mesh);
  banks.push({mesh,x,y,z,opacity,phase:i*2.39996});
 }
 const stats={banks:banks.length,visible:0,active:false};
 let previous=-Infinity;
 function update(active,camera,time,night,reduced){
  group.visible=active;stats.active=active;
  if(!active){stats.visible=0;previous=-Infinity;return;}
  if(time<previous+.07)return;previous=time;stats.visible=0;
  const wind=reduced?0:time;
  for(const {mesh,x,y,z,opacity,phase} of banks){
   const distance=Math.hypot(camera.position.x-x,camera.position.y-y,camera.position.z-z);
   const near=THREE.MathUtils.smoothstep(distance,12,48),far=1-THREE.MathUtils.smoothstep(distance,640,1150);
   mesh.visible=near*far>.01;
   if(!mesh.visible)continue;
   stats.visible++;
   mesh.material.color.set(night?'#6884ae':'#b7cce2');
   mesh.material.opacity=opacity*near*far*(night?.43:1.12)*(.90+.10*Math.sin(wind*.19+phase));
   mesh.position.set(x+Math.sin(wind*.05+phase)*10,y+Math.sin(wind*.07+phase)*1.6,z+Math.cos(wind*.038+phase)*7);
  }
 }
 return{update,stats};
}
