import * as THREE from 'three';
import {KTX2Loader} from './vendor/KTX2Loader.js';
const rawLoader=new THREE.TextureLoader(),cache=new Map();let decoder=null,manifest={},rendererRef=null,pending=0,timer;
const url=name=>globalThis.INARI_ASSETS?.[name]||'./assets/'+name;
export const textureStats={compressed:0,raw:0,gpuMiB:0,savedMiB:0,enabled:false};
export async function initTextureLoader(renderer){rendererRef=renderer;if(globalThis.INARI_ASSETS||location.protocol==='file:'||new URLSearchParams(location.search).get('textures')==='raw')return;try{manifest=await(await fetch('./assets/ktx-manifest.json')).json();textureStats.enabled=true}catch{}}
function getDecoder(){clearTimeout(timer);if(!decoder)decoder=new KTX2Loader().setTranscoderPath('./vendor/basis/').setWorkerLimit(1).detectSupport(rendererRef);return decoder;}
export function hasCompressed(name){return textureStats.enabled&&!!manifest[name];}
export async function loadTexture(name,color=false){
 const key=name+':'+color;if(cache.has(key))return cache.get(key);
 const promise=(async()=>{let t;
  if(hasCompressed(name)){pending++;try{t=await getDecoder().loadAsync(url(manifest[name]));textureStats.compressed++;const bytes=t.mipmaps.reduce((n,m)=>n+m.data.byteLength,0),plain=t.image.width*t.image.height*4*4/3;textureStats.gpuMiB+=bytes/1048576;textureStats.savedMiB+=(plain-bytes)/1048576;t.userData.compressionBytes=bytes;t.userData.compressionSavings=plain-bytes;}
   catch(e){if(name.includes('-atlas.png'))return null;console.warn('GPU texture fallback:',name);t=await rawLoader.loadAsync(url(name));textureStats.raw++;}
   finally{pending--;clearTimeout(timer);timer=setTimeout(()=>{if(!pending&&decoder){decoder.dispose();decoder=null;}},5000);}
  }else{t=await rawLoader.loadAsync(url(name));textureStats.raw++;}
  if(!t)return null;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=Math.min(8,rendererRef?.capabilities.getMaxAnisotropy()||4);return t;
 })();cache.set(key,promise);return promise;
}
export function dropTexture(name,color=true){const key=name+':'+color,p=cache.get(key);if(p)p.then(t=>{if(t?.userData.compressionBytes){textureStats.compressed--;textureStats.gpuMiB-=t.userData.compressionBytes/1048576;textureStats.savedMiB-=t.userData.compressionSavings/1048576;}});cache.delete(key);}
