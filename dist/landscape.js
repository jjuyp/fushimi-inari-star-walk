import * as THREE from 'three';
import {loadTexture} from './textures.js';
import {asset} from './materials.js';

// Kyoto basin is a layered, metric-scale procedural background, not a surveyed city model.
export async function createLandscape(scene,lighting,M){
 const group=new THREE.Group();group.name='京都盆地・西山の遠景';scene.add(group);
 const positions=[],uv=[],indices=[],segments=96,radius=3600;
 for(let i=0;i<=segments;i++){const t=i/segments,a=(t-.5)*2.45,x=480-Math.cos(a)*radius,z=-100+Math.sin(a)*radius;positions.push(x,-800,z,x,600,z);uv.push(t,0,t,1);if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+2,k+1,k+3);}}
 const photoGeometry=new THREE.BufferGeometry();photoGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));photoGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));photoGeometry.setIndex(indices);photoGeometry.computeVertexNormals();
 const photoTexture=await loadTexture('v3.1/kyoto-inari-skyline.webp',true);photoTexture.colorSpace=THREE.SRGBColorSpace;photoTexture.anisotropy=4;
 const photoUniforms={weatherHaze:{value:0},photoTint:{value:new THREE.Color('#ffffff')}};
 const photoMat=new THREE.MeshBasicMaterial({map:photoTexture,side:THREE.DoubleSide,fog:false,transparent:true,depthWrite:false,toneMapped:false});photoMat.onBeforeCompile=shader=>{Object.assign(shader.uniforms,photoUniforms);shader.fragmentShader=shader.fragmentShader.replace('void main() {','uniform float weatherHaze;uniform vec3 photoTint;void main() {');shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 diffuseColor.rgb=mix(diffuseColor.rgb*photoTint,vec3(.64,.71,.75),weatherHaze);
 diffuseColor.a*=smoothstep(0.,.035,vMapUv.x)*smoothstep(1.,.965,vMapUv.x)*smoothstep(1.,.88,vMapUv.y);`);};
 const cityPhoto=new THREE.Mesh(photoGeometry,photoMat);cityPhoto.name='伏見稲荷から京都・実景写真';cityPhoto.renderOrder=-3;group.add(cityPhoto);
 const mountainMaterials=[];
 const cloudUniforms={cloudCover:{value:.48},cloudTime:{value:0},cloudShade:{value:new THREE.Color('#e8edf2')},haze:{value:0},skyTint:{value:new THREE.Color('#277ac8')}};
 // Retain physical Rayleigh/Mie sky and add a cloud layer above the horizon.
 const sky=lighting.sky,shader=sky.material;
 Object.assign(shader.uniforms,cloudUniforms);
 shader.fragmentShader=shader.fragmentShader.replace('void main() {',`
 uniform float cloudCover;uniform float cloudTime;uniform vec3 cloudShade;uniform float haze;uniform vec3 skyTint;
 float hashCloud(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float cloudNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashCloud(i),hashCloud(i+vec2(1,0)),f.x),mix(hashCloud(i+vec2(0,1)),hashCloud(i+vec2(1,1)),f.x),f.y);}
 float cloudFbm(vec2 p){return cloudNoise(p)*.54+cloudNoise(p*2.03)*.27+cloudNoise(p*4.07)*.13+cloudNoise(p*8.1)*.06;}
 void main() {`);
 shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );',`
 vec2 cp=direction.xz/max(.10,direction.y)*1.9+vec2(cloudTime*.0018,cloudTime*.0007);
 float clouds=smoothstep(1.-cloudCover,1.19-cloudCover,cloudFbm(cp))*smoothstep(.015,.19,direction.y);
 vec3 litCloud=mix(cloudShade*.65,cloudShade,cloudFbm(cp*.7+vec2(7.)));
 retColor=mix(retColor,skyTint,smoothstep(-.02,.3,direction.y)*.62*(1.-haze)*(1.-clouds*.85));retColor=mix(retColor,litCloud,clouds*.86);retColor=mix(retColor,cloudShade*.72,haze*.5);
 gl_FragColor=vec4(retColor,1.);`);shader.needsUpdate=true;
 let weather='clear',dusk=false;
 const weatherData={clear:{cover:.33,fog:.000105,contrast:1,sun:3.15,fill:.28},cloudy:{cover:.79,fog:.00024,contrast:.7,sun:1.9,fill:.5},rain:{cover:.98,fog:.00055,contrast:.45,sun:.9,fill:.6},mist:{cover:.7,fog:.00105,contrast:.55,sun:1.2,fill:.52}};
 function apply(){const w=weatherData[weather];photoUniforms.weatherHaze.value=weather==='mist'?.85:weather==='rain'?.57:weather==='cloudy'?.15:0;photoUniforms.photoTint.value.set(dusk?'#eab5a0':weather==='rain'?'#b4c4d2':'#ffffff');cloudUniforms.skyTint.value.set(dusk?'#d78e82':'#277ac8');cloudUniforms.cloudCover.value=w.cover;cloudUniforms.haze.value=weather==='rain'?.6:weather==='mist'?.5:0;cloudUniforms.cloudShade.value.set(dusk?'#e6ad88':weather==='rain'?'#92a1b0':'#f1f4f2');scene.fog=new THREE.FogExp2(dusk?'#c0a08c':weather==='clear'?'#b7cbd5':'#a4b6bd',w.fog);lighting.sun.intensity=dusk?w.sun*.74:w.sun;lighting.fill.intensity=w.fill;lighting.sun.shadow.needsUpdate=true;mountainMaterials.forEach((m,i)=>{m.color.set(dusk?['#8c7c80','#ad9797','#c4acaa'][i]:['#718a91','#8ba0a4','#a9b9b9'][i]);m.opacity=weather==='rain'?.35:weather==='mist'?.12:weather==='cloudy'?.7:1;m.transparent=m.opacity<1;});M.stone.roughness=weather==='rain'?.58:.93;M.stone.color.set(weather==='rain'?'#bec7c3':'#dedfd9');}
 apply();
 return{group,weatherData,setWeather(value){if(weatherData[value]){weather=value;apply();}},setDusk(value){dusk=value;apply();},refresh:apply,update(time,player,mode){cloudUniforms.cloudTime.value=time;group.visible=!!player&&(player.y>40||mode==='overview');},stats:{cityBuildings:0,photoBackdrop:true,backdropTextureMiB:21.33},get weather(){return weather}};
}
