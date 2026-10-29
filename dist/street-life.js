import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {hasCompressed,loadTexture,dropTexture} from './textures.js';
import {asset} from './materials.js';
import {DISTRICT} from './district-data.js';
import {pathSamples} from './geography.js';
export function createStreetLife(scene,world){
 const loader=new GLTFLoader(),templates=[],actors=[],group=new THREE.Group();group.name='写真肌・服飾の参道商人と旅行者';scene.add(group);let pending=null,clock=0,lastNear=0;
 const stats={modelsLoaded:0,active:0,paused:true,modelStyle:'textured-human',downloadBytes:0,textureMiB:0,geometryMiB:0};
 const routes=DISTRICT.routes.map(r=>pathSamples(r.p,1.5));
 function prepare(gltf,prebuilt=null){
  gltf.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=1.68/size.y,result=new THREE.Group(),geometries=[],oldGeometries=new Set(),oldMaterials=new Set(),oldTextures=new Set();
  const atlas=document.createElement('canvas');atlas.width=prebuilt?1:2048;atlas.height=prebuilt?1:1024;const ctx=atlas.getContext('2d');let tile=0;
  gltf.scene.traverse(o=>{if(!o.isMesh)return;const geometry=new THREE.BufferGeometry();
   // Decode normalized integer glTF attributes before any matrix transforms.
   for(const name of ['position','normal','uv']){const a=o.geometry.attributes[name];if(!a)continue;const data=new Float32Array(a.count*a.itemSize);for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)data[i*a.itemSize+k]=a.getComponent(i,k);geometry.setAttribute(name,new THREE.BufferAttribute(data,a.itemSize));}
   if(o.geometry.index)geometry.setIndex(new THREE.BufferAttribute(o.geometry.index.array.slice(),1));
   geometry.applyMatrix4(o.matrixWorld);geometry.translate(-center.x,-box.min.y,-center.z);geometry.scale(scale,scale,scale);
   const col=tile%4,row=Math.floor(tile/4),x=col*512,y=row*512;ctx.clearRect(x,y,512,512);
   if(o.material.map)ctx.drawImage(o.material.map.image,x,y,512,512);else{ctx.fillStyle='#ffffff';ctx.fillRect(x,y,512,512);}
   const colors=new Float32Array(geometry.attributes.position.count*3),c=o.material.color;for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
   const uv=geometry.attributes.uv,uvPoint=new THREE.Vector2();o.material.map?.updateMatrix();for(let i=0;i<uv.count;i++){uvPoint.set(uv.getX(i),uv.getY(i));if(o.material.map)uvPoint.applyMatrix3(o.material.map.matrix);uv.setXY(i,(col+uvPoint.x)/4,(row+uvPoint.y)/2);}
   geometries.push(geometry);oldGeometries.add(o.geometry);oldMaterials.add(o.material);Object.values(o.material).forEach(v=>{if(v?.isTexture)oldTextures.add(v)});tile++;
  });
  const tx=prebuilt||new THREE.CanvasTexture(atlas);tx.flipY=false;tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;
  const mat=new THREE.MeshStandardMaterial({map:tx,roughness:.85,envMapIntensity:.65,vertexColors:true,alphaTest:.3,side:THREE.DoubleSide});
  const merged=mergeGeometries(geometries,false);merged.computeBoundingSphere();result.add(new THREE.Mesh(merged,mat));geometries.forEach(g=>g.dispose());oldGeometries.forEach(g=>g.dispose());oldMaterials.forEach(m=>m.dispose());oldTextures.forEach(t=>{t.dispose();t.image?.close?.()});return result;
 }
 async function geometryOnlyModel(file){
  // The pre-baked atlas is authoritative. Preserve every geometry accessor,
  // material factor and KHR_texture_transform, but skip decoding the embedded
  // source bitmaps which would immediately be replaced by the shared atlas.
  const original=await(await fetch(asset('v3.1/'+file))).arrayBuffer(),view=new DataView(original),jsonLength=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(original,20,jsonLength)).trim());
  const pixelCanvas=document.createElement('canvas');pixelCanvas.width=pixelCanvas.height=1;const pc=pixelCanvas.getContext('2d');pc.fillStyle='#ffffff';pc.fillRect(0,0,1,1);const pixel=pixelCanvas.toDataURL('image/png');
  for(const image of json.images||[]){delete image.bufferView;delete image.mimeType;image.uri=pixel;}
  const encoded=new TextEncoder().encode(JSON.stringify(json)),padded=Math.ceil(encoded.length/4)*4,rest=new Uint8Array(original,20+jsonLength),output=new ArrayBuffer(20+padded+rest.byteLength),header=new DataView(output);header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,output.byteLength,true);header.setUint32(12,padded,true);header.setUint32(16,0x4e4f534a,true);const bytes=new Uint8Array(output);bytes.fill(32,20,20+padded);bytes.set(encoded,20);bytes.set(rest,20+padded);return loader.parseAsync(output,'');
 }
 async function load(){if(pending||templates.length)return pending;pending=(async()=>{const names=['mei','jordan','amara'],files=['mei-vendor.glb','jordan-visitor.glb','amara-visitor.glb'],maps=await Promise.all(names.map(n=>hasCompressed('v3.1/'+n+'-atlas.png')?loadTexture('v3.1/'+n+'-atlas.png',true):null));for(let i=0;i<files.length;i++){let model=maps[i]?await geometryOnlyModel(files[i]):await loader.loadAsync(asset('v3.1/'+files[i]));templates.push(prepare(model,maps[i]));model=null;}
stats.modelsLoaded=3;for(let i=0;i<26;i++){const root=templates[i<14?0:1+i%2].clone(true),materials=[];root.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();o.material.roughness=.85;o.material.envMapIntensity=.65;const uniforms={lifeTime:{value:0},lifeMove:{value:i<14?0:1},lifePhase:{value:i*1.7}};o.material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader=shader.vertexShader.replace('void main() {','uniform float lifeTime;uniform float lifeMove;uniform float lifePhase;void main() {').replace('#include <begin_vertex>',`#include <begin_vertex>
 float stepPhase=lifeTime*5.+lifePhase;float lower=1.-smoothstep(.65,.95,position.y);float side=position.x<0.?-1.:1.;float stride=sin(stepPhase+side*1.5708)*.16*lifeMove;
 transformed.z+=stride*lower;transformed.y+=abs(cos(stepPhase))*lower*.025*lifeMove;
 transformed.x+=sin(lifeTime*1.4+lifePhase)*.008*smoothstep(.7,1.5,position.y);`);};materials.push({mat:o.material,uniforms});});group.add(root);const route=routes[i%routes.length],index=Math.floor((i*.071%1)*(route.length-1)),p=route[index];actors.push({root,materials,vendor:i<14,x:p.x,z:p.z,y:world.walkHeight(p.x,p.z),index,route,dir:i%2?1:-1,speed:.65+i%4*.07,phase:i});}stats.downloadBytes=3067256;stats.textureMiB=maps.filter(Boolean).length===3?8:32;stats.geometryMiB=templates.reduce((n,t)=>n+Object.values(t.children[0].geometry.attributes).reduce((v,a)=>v+a.array.byteLength,0)+(t.children[0].geometry.index?.array.byteLength||0),0)/1048576;})().catch(e=>{console.warn('Street models unavailable',e);stats.error=e.message;}).finally(()=>pending=null);return pending;}
 function unload(){for(const a of actors){group.remove(a.root);for(const m of a.materials)m.mat.dispose();}actors.length=0;const geos=new Set(),mats=new Set(),textures=new Set();templates.forEach(t=>t.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);}));geos.forEach(g=>g.dispose());mats.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v)});m.dispose()});textures.forEach(t=>t.dispose());templates.length=0;for(const n of ['mei','jordan','amara'])dropTexture('v3.1/'+n+'-atlas.png');stats.modelsLoaded=0;stats.downloadBytes=0;stats.textureMiB=0;stats.geometryMiB=0;}
 return{group,actors,stats,update(dt,time,player,reduced,enabled=true){group.visible=enabled;clock+=dt;const inTown=enabled&&player.x<-25;if(inTown){lastNear=time;load();}else if(time-lastNear>25&&templates.length)unload();if(!actors.length||!enabled){stats.active=0;return;}const stalls=world.district.stallSites.filter(s=>Math.hypot(s.x-player.x,s.z-player.z)<105).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z));let n=0;
 for(const [i,a]of actors.entries()){
  if(a.vendor){const s=stalls[i];a.root.visible=!!s;if(!s)continue;a.x=s.x-Math.sin(s.angle)*.85;a.z=s.z-Math.cos(s.angle)*.85;a.y=world.walkHeight(a.x,a.z);a.root.rotation.y=s.angle;}
  else{const visible=Math.hypot(a.x-player.x,a.z-player.z)<115;a.root.visible=visible;if(!visible)continue;if(!reduced){let p=a.route[a.index],dx=p.x-a.x,dz=p.z-a.z,len=Math.hypot(dx,dz);if(len<.3){a.index+=a.dir;if(a.index<0||a.index>=a.route.length){a.dir*=-1;a.index=THREE.MathUtils.clamp(a.index+a.dir*2,0,a.route.length-1);}p=a.route[a.index];dx=p.x-a.x;dz=p.z-a.z;len=Math.hypot(dx,dz);}if(len>.05&&Math.hypot(a.x-player.x,a.z-player.z)>1){world.physics.move(a,dx/len*dt*a.speed,dz/len*dt*a.speed,world.walkHeight);a.root.rotation.y=Math.atan2(dx,dz);}}}
  a.root.position.set(a.x,a.y+.015,a.z);for(const m of a.materials)m.uniforms.lifeTime.value=reduced?0:time;n++;
 }stats.active=n;stats.paused=!inTown;}};
}
