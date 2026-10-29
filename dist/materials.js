import * as THREE from 'three';
import {initTextureLoader,loadTexture} from './textures.js';
export const asset=name=>globalThis.INARI_ASSETS?.[name]||'./assets/'+name;
export async function createMaterials(renderer){
  await initTextureLoader(renderer);const loader=new THREE.TextureLoader(),cache=new Map();
  async function tx(name,color=false){if(cache.has(name))return cache.get(name);const t=await loadTexture(name,color);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;cache.set(name,t);return t;}
  async function pbr(id,color=0xffffff,tile=3){const [map,normalMap,roughnessMap]=await Promise.all([tx(id+'-color.jpg',true),tx(id+'-normal.jpg'),tx(id+'-rough.jpg')]);return physicalUV(new THREE.MeshStandardMaterial({map,normalMap,roughnessMap,color,roughness:.95,normalScale:new THREE.Vector2(.65,.65),envMapIntensity:.55}),tile);}
  const [wall,bark,wood,forest]=await Promise.all([
    pbr('japanese_stone_wall',0xb8b8ac,3),pbr('japanese_cedar_bark',0xb2a38b,2),pbr('japanese_cedar_planks',0x97816b,3),pbr('forest_floor',0x7d815b,5)
  ]);
  const stone=physicalUV(new THREE.MeshStandardMaterial({envMapIntensity:.55}),3),roof=physicalUV(new THREE.MeshStandardMaterial({envMapIntensity:.55}),2.5);
  const [graniteColor,graniteHeight,cypressColor,cypressHeight]=await Promise.all([tx('granite-paving-color.jpg',true),tx('granite-paving-height.png'),tx('roof-cypress-color.jpg',true),tx('roof-cypress-height.png')]);
  stone.map=graniteColor;stone.normalMap=null;stone.roughnessMap=null;stone.bumpMap=graniteHeight;stone.bumpScale=.016;stone.color.set('#dedfd9');stone.roughness=.93;
  roof.map=cypressColor;roof.normalMap=null;roof.roughnessMap=null;roof.bumpMap=cypressHeight;roof.bumpScale=.035;roof.color.set('#ffffff');roof.roughness=.96;roof.map.repeat.set(2.5,2.5);roof.bumpMap.repeat.set(2.5,2.5);
  const plain=(color,roughness=.8,extra={})=>new THREE.MeshStandardMaterial({color,roughness,envMapIntensity:.5,...extra});
  // A neutral grain mask keeps vermilion lacquer saturated while retaining real wood relief.
  const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=512;const ctx=grainCanvas.getContext('2d');const grainSource=await loader.loadAsync(asset('japanese_cedar_planks-color.jpg'));ctx.drawImage(grainSource.image,0,0,512,512);grainSource.dispose();grainSource.image.close?.();let pixels=ctx.getImageData(0,0,512,512);for(let i=0;i<pixels.data.length;i+=4){const v=205+(pixels.data[i]*.3+pixels.data[i+1]*.5+pixels.data[i+2]*.2)*.19;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;}ctx.putImageData(pixels,0,0);const lacquerGrain=new THREE.CanvasTexture(grainCanvas);lacquerGrain.colorSpace=THREE.SRGBColorSpace;lacquerGrain.wrapS=lacquerGrain.wrapT=THREE.RepeatWrapping;
  const red=physicalUV(new THREE.MeshStandardMaterial({color:0xe14b16,map:lacquerGrain,normalMap:wood.normalMap,normalScale:new THREE.Vector2(.12,.12),roughness:.5,envMapIntensity:.18}),3);
  red.name='稻荷塗・朱紅';
  const M={stone,wall,bark,wood,roof,forest,red,redDark:plain('#a43913',.58),redEdge:plain('#e65622',.52),
    gold:plain('#cda347',.29,{metalness:.83}),goldDark:plain('#93702e',.5,{metalness:.65}),bronze:plain('#344a3a',.46,{metalness:.7}),
    black:plain('#171c19',.56),cream:plain('#e4ddca',.95),white:plain('#eee9df',.92),darkWood:plain('#33261c',.8),
    moss:plain('#405932',1),rope:plain('#baa16d',.93),green:plain('#17583b',.7),blue:plain('#194e67',.65),snow:plain('#e5ebed',.9),skin:plain('#c7aa85',.7),
    glow:plain('#f6d48c',.72,{emissive:'#edb967',emissiveIntensity:.26}),cloth:plain('#e7dfca',1,{side:THREE.DoubleSide})};
  M.roof.side=THREE.DoubleSide;M.snow.side=THREE.DoubleSide;
  const inkCanvas=document.createElement('canvas');inkCanvas.width=128;inkCanvas.height=1024;const c=inkCanvas.getContext('2d');c.fillStyle='#171914';c.textAlign='center';c.font='bold 54px "Yu Mincho",serif';[...'奉納稲荷大神'].forEach((ch,i)=>c.fillText(ch,64,90+i*140));const inkTx=new THREE.CanvasTexture(inkCanvas);inkTx.colorSpace=THREE.SRGBColorSpace;M.ink=new THREE.MeshStandardMaterial({map:inkTx,alphaTest:.4,side:THREE.DoubleSide,roughness:1});
  const date=document.createElement('canvas');date.width=128;date.height=1024;const d=date.getContext('2d');d.fillStyle='#171914';d.textAlign='center';d.font='bold 51px serif';[...'平成二十八年十月吉日'].forEach((ch,i)=>d.fillText(ch,64,65+i*85));const dateTx=new THREE.CanvasTexture(date);dateTx.colorSpace=THREE.SRGBColorSpace;M.date=new THREE.MeshStandardMaterial({map:dateTx,alphaTest:.4,side:THREE.DoubleSide,roughness:1});
  return M;
}
function physicalUV(material,tileMeters){
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
    #ifdef USE_INSTANCING
      vec3 ms=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
      vec3 an=abs(normal);vec2 uvScale=an.y>.5?ms.xz:(an.x>.5?ms.zy:ms.xy);uvScale=max(uvScale,vec2(.04))/${tileMeters.toFixed(2)};
      #ifdef USE_MAP
      vMapUv*=uvScale;
      #endif
      #ifdef USE_NORMALMAP
      vNormalMapUv*=uvScale;
      #endif
      #ifdef USE_ROUGHNESSMAP
      vRoughnessMapUv*=uvScale;
      #endif
    #endif`);};material.customProgramCacheKey=()=>`physical-units-${tileMeters}`;return material;
}
