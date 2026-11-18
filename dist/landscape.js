import * as THREE from 'three';
import {createMountainMist} from './mountain-mist.js';
import {loadTexture} from './textures.js';
import {asset} from './materials.js';
import {MAP,terrainHeight} from './geography.js';
import {createSkylineMask,clearSkyFragment,tuneSunnyTerrain} from './clear-sky.js';

// Kyoto basin is a layered, metric-scale procedural background, not a surveyed city model.
export async function createLandscape(scene,lighting,M){
 const mountainMist=createMountainMist(scene);
 const group=new THREE.Group();group.name='京都盆地・西山の遠景';scene.add(group);
 // Keep the existing photograph and texture allocation. A continuous periodic UV
 // extension closes the entire horizon; source edges never fade into empty sky.
 // The added directions are mirrored scenery, not new surveyed 360° photography.
 const positions=[],uv=[],indices=[],segments=192,radius=3600;
 for(let i=0;i<=segments;i++){const a=-Math.PI+i/segments*Math.PI*2,x=480-Math.cos(a)*radius,z=-100+Math.sin(a)*radius,sourceU=.5+a/Math.PI,u=sourceU<0?-sourceU:sourceU>1?2-sourceU:sourceU;positions.push(x,-800,z,x,600,z);uv.push(u,0,u,1);if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+2,k+1,k+3);}}
 const photoGeometry=new THREE.BufferGeometry();photoGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));photoGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));photoGeometry.setIndex(indices);photoGeometry.computeVertexNormals();
 const photoTexture=await loadTexture('v3.4/kyoto-preview.webp',true);photoTexture.colorSpace=THREE.SRGBColorSpace;photoTexture.anisotropy=4;
 const clearDay={value:0},sunnyGround={value:0};const roofBase=M.roof.color.clone(),sunnyRoof=new THREE.Color(1.68,1.29,.99);tuneSunnyTerrain(M.forest,sunnyGround);
 const photoUniforms={clearDay,skylineMask:{value:createSkylineMask()},nightAmount:{value:0},weatherHaze:{value:0},photoTint:{value:new THREE.Color('#ffffff')}};
 const photoMat=new THREE.MeshBasicMaterial({map:photoTexture,side:THREE.DoubleSide,fog:false,transparent:true,depthWrite:false,toneMapped:false});photoMat.onBeforeCompile=shader=>{Object.assign(shader.uniforms,photoUniforms);shader.fragmentShader=shader.fragmentShader.replace('void main() {','uniform float clearDay;uniform sampler2D skylineMask;uniform float nightAmount;uniform float weatherHaze;uniform vec3 photoTint;void main() {');shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float skyEdge=texture2D(skylineMask,vec2(vMapUv.x,.5)).r;
 float ridgeFade=1.-smoothstep(skyEdge-.014,skyEdge+.004,vMapUv.y);
 float upperHill=smoothstep(.42,.74,vMapUv.y);
 vec3 alpine=diffuseColor.rgb*mix(vec3(1.07,1.09,1.11),vec3(.44,.85,1.27),upperHill);
 diffuseColor.rgb=mix(mix(diffuseColor.rgb,alpine,clearDay)*photoTint,vec3(.64,.71,.75),weatherHaze);
 diffuseColor.a*=mix(1.,ridgeFade,clearDay);
 diffuseColor.a*=1.-nightAmount*smoothstep(.62,.88,vMapUv.y);
 diffuseColor.a*=1.-smoothstep(.80,1.,vMapUv.y);`);};
 const cityPhoto=new THREE.Mesh(photoGeometry,photoMat);cityPhoto.name='京都実景・継ぎ目のない環状延伸';cityPhoto.renderOrder=-3;group.add(cityPhoto);
 // A decorative skirt joins the actual DEM boundary before descending into
 // the distant basin. It does not change walk heights or add collision bodies.
 const dem=MAP.dem,x0=dem.x0,z0=dem.z0,x1=x0+(dem.nx-1)*dem.step,z1=z0+(dem.nz-1)*dem.step,cx=(x0+x1)/2,cz=(z0+z1)/2,edge=[];
 for(let side=0;side<4;side++)for(let j=0;j<64;j++){const t=j/64;edge.push(side===0?[x0+(x1-x0)*t,z0]:side===1?[x1,z0+(z1-z0)*t]:side===2?[x1-(x1-x0)*t,z1]:[x0,z1-(z1-z0)*t]);}edge.push(edge[0]);
 const skirtPositions=[],skirtUV=[],skirtColors=[],skirtT=[],skirtIndex=[],columns=edge.length,rings=8,white=new THREE.Color('#ffffff'),forest=new THREE.Color('#8baf99'),distant=new THREE.Color('#b2c6c8');
 for(let r=0;r<=rings;r++)for(let i=0;i<columns;i++){const t=r/rings,[ex,ez]=edge[i],dx=ex-cx,dz=ez-cz,d=Math.hypot(dx,dz),a=Math.atan2(dz,dx),radius=d+(3100-d)*t,s=t*t*(3-2*t),height=terrainHeight(ex,ez)*(1-s)-320*s+(Math.sin(a*5+.3)*34+Math.sin(a*11)*12)*Math.sin(t*Math.PI)**2;
  skirtPositions.push(cx+dx/d*radius,height-.08,cz+dz/d*radius);skirtUV.push((cx+dx/d*radius)/5,(cz+dz/d*radius)/5);skirtT.push(t);const color=white.clone().lerp(forest,Math.min(1,t*3)).lerp(distant,Math.max(0,(t-.4)/.6));skirtColors.push(color.r,color.g,color.b);
  if(r<rings&&i<columns-1){const a=r*columns+i,b=a+1,c=a+columns;skirtIndex.push(a,b,c,b,c+1,c);}}
 const skirtGeometry=new THREE.BufferGeometry();skirtGeometry.setAttribute('position',new THREE.Float32BufferAttribute(skirtPositions,3));skirtGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(skirtUV,2));skirtGeometry.setAttribute('color',new THREE.Float32BufferAttribute(skirtColors,3));skirtGeometry.setAttribute('aSkirtT',new THREE.Float32BufferAttribute(skirtT,1));skirtGeometry.setIndex(skirtIndex);skirtGeometry.computeVertexNormals();
 const skirtMaterial=M.forest.clone();skirtMaterial.vertexColors=true;skirtMaterial.transparent=true;skirtMaterial.depthWrite=false;skirtMaterial.onBeforeCompile=shader=>{shader.vertexShader='attribute float aSkirtT;varying float vSkirtT;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSkirtT=aSkirtT;');shader.fragmentShader='varying float vSkirtT;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=1.-smoothstep(.65,1.,vSkirtT);');};skirtMaterial.customProgramCacheKey=()=> 'landscape-perimeter-v351';
 tuneSunnyTerrain(skirtMaterial,sunnyGround);
 const skirt=new THREE.Mesh(skirtGeometry,skirtMaterial);skirt.name='地形外周・盆地への連続した裾野';skirt.renderOrder=-2;group.add(skirt);
 const mountainMaterials=[];
 const cloudUniforms={cloudCover:{value:.48},cloudTime:{value:0},cloudShade:{value:new THREE.Color('#e8edf2')},haze:{value:0},skyTint:{value:new THREE.Color('#277ac8')}};
 // Retain physical Rayleigh/Mie sky and add a cloud layer above the horizon.
 const sky=lighting.sky,shader=sky.material;
 Object.assign(shader.uniforms,cloudUniforms,{clearDay});
 shader.fragmentShader=shader.fragmentShader.replace('void main() {',`
 uniform float cloudCover;uniform float cloudTime;uniform vec3 cloudShade;uniform float haze;uniform vec3 skyTint;uniform float clearDay;
 float hashCloud(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float cloudNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashCloud(i),hashCloud(i+vec2(1,0)),f.x),mix(hashCloud(i+vec2(0,1)),hashCloud(i+vec2(1,1)),f.x),f.y);}
 float cloudFbm(vec2 p){return cloudNoise(p)*.54+cloudNoise(p*2.03)*.27+cloudNoise(p*4.07)*.13+cloudNoise(p*8.1)*.06;}
 ${clearSkyFragment}
 void main() {`);
 shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );',`
 if(clearDay>.5){retColor=drawClearSky(direction,normalize(vSunDirection),cloudTime);}else{
 vec2 cp=direction.xz/max(.10,direction.y)*1.9+vec2(cloudTime*.0018,cloudTime*.0007);
 float clouds=smoothstep(1.-cloudCover,1.19-cloudCover,cloudFbm(cp))*smoothstep(.015,.19,direction.y);
 vec3 litCloud=mix(cloudShade*.65,cloudShade,cloudFbm(cp*.7+vec2(7.)));
 retColor=mix(retColor,skyTint,smoothstep(-.02,.3,direction.y)*.62*(1.-haze)*(1.-clouds*.85));retColor=mix(retColor,litCloud,clouds*.86);retColor=mix(retColor,cloudShade*.72,haze*.5);
 }
 gl_FragColor=vec4(retColor,1.);`);shader.needsUpdate=true;
 let weather='clear',season='spring',dusk=false,night=false,fullPending=false,fullReady=false;
 function prefetch(){if(fullPending||fullReady)return;fullPending=true;loadTexture('v3.1/kyoto-inari-skyline.webp',true).then(t=>{photoMat.map=t;photoMat.needsUpdate=true;fullReady=true;}).catch(e=>console.warn('Skyline preview retained',e)).finally(()=>fullPending=false);}

 const weatherData={clear:{cover:.33,fog:.00007,contrast:1,sun:4.50,fill:1.17},cloudy:{cover:.79,fog:.00024,contrast:.7,sun:1.9,fill:.5},rain:{cover:.98,fog:.00055,contrast:.45,sun:.9,fill:.6},mist:{cover:.68,fog:.00372,contrast:.55,sun:.87,fill:.73}};
 function applyClearDay(){clearDay.value=weather==='clear'&&!dusk&&!night?1:0;sunnyGround.value=season==='winter'?0:clearDay.value;lighting.setClearDay(clearDay.value===1);M.roof.color.copy(roofBase);if(clearDay.value)M.roof.color.multiply(sunnyRoof);}
 function apply(){const w=weatherData[weather];applyClearDay();photoUniforms.weatherHaze.value=weather==='mist'?.85:weather==='rain'?.57:weather==='cloudy'?.15:0;photoUniforms.photoTint.value.set(dusk?'#eab5a0':weather==='rain'?'#b4c4d2':'#ffffff');cloudUniforms.skyTint.value.set(dusk?'#d78e82':'#277ac8');cloudUniforms.cloudCover.value=w.cover;cloudUniforms.haze.value=weather==='rain'?.6:weather==='mist'?.73:0;cloudUniforms.cloudShade.value.set(dusk?'#e6ad88':weather==='rain'?'#92a1b0':weather==='mist'?'#c1cfdd':'#f1f4f2');scene.fog=new THREE.FogExp2(dusk?'#c0a08c':weather==='clear'?'#b7cbd5':weather==='mist'?'#a4b9c9':'#a4b6bd',w.fog);lighting.sun.intensity=dusk?(weather==='clear'?3.15:w.sun)*.74:w.sun;lighting.fill.intensity=dusk&&weather==='clear'?.28:w.fill;lighting.sun.shadow.needsUpdate=true;mountainMaterials.forEach((m,i)=>{m.color.set(dusk?['#8c7c80','#ad9797','#c4acaa'][i]:['#718a91','#8ba0a4','#a9b9b9'][i]);m.opacity=weather==='rain'?.35:weather==='mist'?.12:weather==='cloudy'?.7:1;m.transparent=m.opacity<1;});M.stone.roughness=weather==='rain'?.58:.93;M.stone.color.set(weather==='rain'?'#bec7c3':'#dedfd9');}
 apply();
 return{group,weatherData,mist:mountainMist.stats,prefetch,setNight(value){night=value;applyClearDay();photoUniforms.nightAmount.value=value?1:0;photoUniforms.photoTint.value.set(value?'#46617a':dusk?'#eab5a0':'#ffffff');photoUniforms.weatherHaze.value=value?0:weather==='mist'?.85:0;},setWeather(value){if(weatherData[value]){weather=value;apply();}},setDusk(value){dusk=value;apply();},refresh(value){if(value)season=value;apply();},update(time,player,mode,camera,reduced){mountainMist.update(weather==='mist',camera,time,night,reduced);if(player&&(player.y>22||player.x>300||mode==='overview'&&clearDay.value===1))prefetch();cloudUniforms.cloudTime.value=reduced?0:time;group.visible=!!player;},stats:{cityBuildings:0,photoBackdrop:true,backdropTextureMiB:21.33,backdropDegrees:360,terrainSkirt:true,backdropExtension:'periodic-mirrored-photo'},get weather(){return weather}};
}
