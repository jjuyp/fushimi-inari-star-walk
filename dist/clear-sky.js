import * as THREE from 'three';

// Ridge rows measured in the existing panorama at a height of 256 px.
// The preview and full-resolution images use the same crop.
const ridge=[56,55,53,53,52,53,55,56,58,57,55,54,53,52,51,52,52,53,52,51,52,51,51,52,54,55,55,55,55,55,56,56,55,53,54,57,59,61,61,63,63,61,59,57,57,56,55,54,54,55,56,57,56,53,51,49,51,54,57,57,56,56,55,54,54,55,55,55,55,56,56,58,60,64,67,67,67,66,66,66,66,67,68,71,73,76,78,80,83,84,85,84,83,82,81,80,83,83,83,81,80,80,79,78,78,77,75,74,73,71,70,69,70,71,71,72,72,71,72,73,73,74,75,76,78,79,79,78];
export function createSkylineMask(){
 const bytes=new Uint8Array(ridge.length*4);
 for(let i=0;i<ridge.length;i++){bytes[i*4]=255-ridge[i];bytes[i*4+3]=255;}
 const tex=new THREE.DataTexture(bytes,ridge.length,1,THREE.RGBAFormat);
 tex.minFilter=tex.magFilter=THREE.LinearFilter;
 tex.needsUpdate=true;
 return tex;
}

export function tuneSunnyTerrain(material,clearDay){
 const original=material.onBeforeCompile.bind(material);
 const originalKey=material.customProgramCacheKey();
 material.onBeforeCompile=shader=>{
  original(shader);
  shader.uniforms.sunnyFields=clearDay;
  shader.vertexShader='varying vec2 vFieldXZ;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFieldXZ=position.xz;');
  shader.fragmentShader='uniform float sunnyFields;varying vec2 vFieldXZ;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  if(sunnyFields>.5){
   float outskirts=max(smoothstep(64.,162.,vFieldXZ.y),smoothstep(160.,355.,-vFieldXZ.x)*smoothstep(-42.,81.,vFieldXZ.y));
   vec2 ground=vec2(dot(vFieldXZ,vec2(.94,.34)),dot(vFieldXZ,vec2(-.34,.94)));
   float parcel=fract(sin(dot(floor(ground/vec2(33.,13.)),vec2(12.9898,78.233)))*43758.5453);
   float rows=.96+.04*sin(ground.y*2.5);
   vec3 grass=mix(vec3(.139,.182,.043),vec3(.241,.307,.089),parcel)*rows;
   diffuseColor.rgb=mix(diffuseColor.rgb*vec3(1.09,1.23,.94),grass,outskirts*.64);
  }`);
 };
 material.customProgramCacheKey=()=>originalKey+':sunnyTerrain';
 material.needsUpdate=true;
}

export const clearSkyFragment=`
vec3 drawClearSky(vec3 ray,vec3 sun,float time){
 float horizon=clamp(ray.y,0.,1.);
 vec3 blue=mix(vec3(.19,.58,1.18),vec3(.006,.181,1.03),pow(smoothstep(-.033,.34,horizon),.59));
 blue=mix(blue,vec3(.072,.338,.94),smoothstep(.23,.84,horizon)*.77);
 float cosSun=clamp(dot(ray,sun),-1.,1.);
 float theta=sqrt(max(0.,2.*(1.-cosSun)));
 vec2 p=ray.xz/(.26+max(.0,ray.y))*3.33+vec2(time*.0017,time*.00048);
 float broad=cloudFbm(p+vec2(6.4,3.2));
 float fine=cloudFbm(p*1.91+vec2(-2.6,9.8));
 float mass=broad*.64+fine*.29+cloudNoise(p*12.)*.07;
 float edge=smoothstep(.564,.646,mass)*smoothstep(-.016,.068,ray.y)*smoothstep(.121,.238,theta);
 float top=cloudFbm(p+vec2(.31,-.24));
 float relief=smoothstep(-.08,.13,broad-top+ray.y*.07);
 vec3 white=mix(vec3(.59,.73,.95),vec3(1.52,1.63,1.76),.67*relief+.33*smoothstep(.40,.69,fine));
 blue=mix(blue,white,edge*.93);
 vec3 side=normalize(cross(vec3(0.,1.,0.),sun));
 vec3 up=cross(sun,side);
 float phi=atan(dot(ray,up),dot(ray,side));
 float streak=pow(.5+.5*cos(phi*12.),14.)*.72+pow(.5+.5*cos(phi*17.+.5),15.)*.28;
 float disk=1.-smoothstep(.009,.014,theta);
 float halo=exp(-theta*28.)*1.55+exp(-theta*10.)*.17;
 float rays=streak*exp(-theta*21.)*smoothstep(.005,.021,theta)*1.22;
 return blue+vec3(1.,.76,.40)*(disk*9.+halo+rays)*(1.-edge*.80);
}`;
