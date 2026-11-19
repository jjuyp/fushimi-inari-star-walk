import * as THREE from 'three';
import {loadTexture} from './textures.js';
import {addWaterfallGrounds,seatPoint} from './waterfall-grounds.js';
import {mergeGeometries,mergeVertices} from './vendor/BufferGeometryUtils.js';

// A small reference-inspired shrine garden. Water, spray and surface normals are
// mathematical animation, not a photograph of moving water or a video texture.
export function createWaterfallScene(site,M,physics){
 const group=site.group,staticRoot=new THREE.Group();staticRoot.name='苔岩と朱の滝行場';group.add(staticRoot);
 const V=(x,y,z)=>new THREE.Vector3(x,y,z),time={value:0},night={value:0};let seed=88339;
 const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,20,14),rod=new THREE.CylinderGeometry(1,1,1,16);
 function mesh(geo,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1,parent=staticRoot){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function box(mat,x,y,z,w,h,d,parent){return mesh(cube,mat,x,y,z,w,h,d,parent);}
 function ball(mat,x,y,z,a,b=a,c=a,parent){return mesh(sphere,mat,x,y,z,a,b,c,parent);}
 function column(mat,x,y,z,r,h,parent){return mesh(rod,mat,x,y,z,r,h,r,parent);}
 function tube(mat,points,r=.04,parent=staticRoot){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>V(...p))),32,r,6,false),mat,0,0,0,1,1,1,parent);}
 function label(text,x,y,z,w,h,vertical=false){const c=document.createElement('canvas');c.width=vertical?256:768;c.height=vertical?1024:192;const g=c.getContext('2d');g.fillStyle='#cdb27f';g.fillRect(0,0,c.width,c.height);for(let j=0;j<260;j++){g.strokeStyle=j%3?'#7b54251a':'#f8e4b525';g.lineWidth=.5+j%3;g.beginPath();g.moveTo(j*13%c.width,0);g.bezierCurveTo(j*13%c.width+8,300,j*13%c.width-5,650,j*13%c.width,c.height);g.stroke();}g.strokeStyle='#6c4d2d';g.lineWidth=8;g.strokeRect(7,7,c.width-14,c.height-14);g.fillStyle='#242e24';g.textAlign='center';g.textBaseline='middle';g.font=vertical?'bold 67px serif':'bold 64px serif';if(vertical){const glyphs=[...text],pitch=(c.height-122)/glyphs.length;g.font='bold '+Math.min(88,pitch*.80)+'px DFKai-SB, KaiTi, serif';glyphs.forEach((v,i)=>g.fillText(v,c.width/2,61+(i+.5)*pitch));}else g.fillText(text,c.width/2,c.height/2,c.width-55);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshStandardMaterial({map:t,roughness:.85});const o=mesh(new THREE.PlaneGeometry(w,h),m,x,y,z);return o;}
 const rockCanvas=document.createElement('canvas');rockCanvas.width=rockCanvas.height=512;const rc=rockCanvas.getContext('2d'),image=rc.createImageData(512,512);
 function texHash(x,y){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}function texNoise(x,y,scale){x/=scale;y/=scale;const a=Math.floor(x),b=Math.floor(y);let u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return(1-v)*((1-u)*texHash(a,b)+u*texHash(a+1,b))+v*((1-u)*texHash(a,b+1)+u*texHash(a+1,b+1));}
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4,grain=(rnd()-.5)*21,gray=76+texNoise(x,y,53)*35+texNoise(x,y,9)*24+grain;image.data[i]=gray*.94;image.data[i+1]=gray*.98;image.data[i+2]=gray;image.data[i+3]=255;}rc.putImageData(image,0,0);const rockMap=new THREE.CanvasTexture(rockCanvas);rockMap.colorSpace=THREE.SRGBColorSpace;rockMap.wrapS=rockMap.wrapT=THREE.RepeatWrapping;rockMap.repeat.set(.8,.8);
 const wet=new THREE.MeshStandardMaterial({map:rockMap,bumpMap:rockMap,bumpScale:.023,roughness:.57,metalness:0,color:'#858b7a',envMapIntensity:.55});
 const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}float fbm(vec2 p){return noise(p)*.58+noise(p*2.03+3.7)*.28+noise(p*4.13)*.14;}`;
 const rockDetail={value:rockMap},hasRockDetail={value:0};
 let requestedRockDetail=false;
 wet.onBeforeCompile=shader=>{
  shader.uniforms.rockDetail=rockDetail;shader.uniforms.hasRockDetail=hasRockDetail;
  const rockVaryings='varying vec3 vRockPoint;varying vec3 vRockNormal;\n';
  shader.vertexShader=rockVaryings+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vec4 rockPosition=vec4(transformed,1.);
  vec3 rockNormal=normal;
  #ifdef USE_INSTANCING
   rockPosition=instanceMatrix*rockPosition;
   rockNormal=mat3(instanceMatrix)*rockNormal;
  #endif
  vRockPoint=rockPosition.xyz;vRockNormal=normalize(rockNormal);`);
  shader.fragmentShader=rockVaryings+'uniform sampler2D rockDetail; uniform float hasRockDetail;\n'+noise+'\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  vec3 n=pow(abs(normalize(vRockNormal)),vec3(4.));
  n/=max(.0001,n.x+n.y+n.z);
  vec3 position=vRockPoint*.43;
  vec3 rockTone=texture2D(rockDetail,position.yz).rgb*n.x
    +texture2D(rockDetail,position.xz).rgb*n.y+texture2D(rockDetail,position.xy).rgb*n.z;
  float mossPatch=fbm(vRockPoint.xz*2.6+vRockPoint.y*.56);
  float moss=smoothstep(.34,.62,mossPatch)*(.22+.78*smoothstep(-.16,.59,vRockNormal.y));
  float ore=fbm(vRockPoint.xy*vec2(22.,31.)+vRockPoint.z*12.);
  float finer=noise(vRockPoint.xy*37.+noise(vRockPoint.yz*13.));
  float ds=max(length(dFdx(vRockPoint)),length(dFdy(vRockPoint)));
  float grainFade=1.-smoothstep(.012,.046,ds);
  float bedding=vRockPoint.y*4.4+vRockPoint.x*.67+vRockPoint.z*1.25;
  float fault=fbm(vec2(bedding*1.25,vRockPoint.z*4.7+vRockPoint.x*2.6));
  float cracks=(1.-smoothstep(.012,.046,abs(fault-.48)))*smoothstep(.21,.78,noise(vRockPoint.xz*4.5));
  vec3 stoneTone=mix(diffuseColor.rgb,rockTone*.78,hasRockDetail*.86);
  stoneTone*=.74+ore*.48+finer*.18*grainFade;stoneTone*=1.-cracks*.36;
  diffuseColor.rgb=mix(stoneTone,vec3(.046,.076,.019)*(.67+ore*.67),moss*.80);`);
 };
 // A deformed rounded block with cut corners gives geological fracture planes,
 // while welded normals keep each irregular bevel smooth instead of low-poly triangles.
 const rockBase=new THREE.BoxGeometry(2,2,2,8,7,7),rp=rockBase.attributes.position;for(let i=0;i<rp.count;i++){let x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),cx=THREE.MathUtils.clamp(x,-.75,.75),cy=THREE.MathUtils.clamp(y,-.67,.67),cz=THREE.MathUtils.clamp(z,-.78,.78),dx=x-cx,dy=y-cy,dz=z-cz,l=Math.hypot(dx,dy,dz)||1;x=cx+dx/l*.245;y=cy+dy/l*.33;z=cz+dz/l*.22;let cut=Math.max(0,x+y*.41+z*.24-1.05);x-=cut*.75;y-=cut*.32;z-=cut*.18;cut=Math.max(0,-x+y*.18-z*.56-1.04);x+=cut*.62;y-=cut*.12;z+=cut*.4;const ox=x,oy=y,oz=z;x+=.065*Math.sin(oy*3.4+oz*2.7);y+=.065*Math.sin(ox*3.1-oz*2.4);z+=.08*Math.sin(ox*3.8+oy*2.7);rp.setXYZ(i,x,y,z);}rockBase.deleteAttribute('normal');rockBase.deleteAttribute('uv');const rockGeo=mergeVertices(rockBase,1e-5);rockBase.dispose();rockGeo.computeVertexNormals();const rockUV=new Float32Array(rockGeo.attributes.position.count*2);for(let i=0;i<rockGeo.attributes.position.count;i++){rockUV[i*2]=rockGeo.attributes.position.getX(i)*.5+.5;rockUV[i*2+1]=rockGeo.attributes.position.getY(i)*.5+.5;}rockGeo.setAttribute('uv',new THREE.BufferAttribute(rockUV,2));
 // One continuous broken escarpment forms the cliff; edge boulders are accents.
 const cliff=new THREE.PlaneGeometry(8.8,5.92,52,46),cp=cliff.attributes.position;for(let i=0;i<cp.count;i++){const x=cp.getX(i)+1.95,y=cp.getY(i)+2.82,ledge=Math.sin(y*3.05+Math.sin(x*1.4)*.45)*.12,crag=Math.sin(x*4.7+y*.8)*.14+Math.sin(x*9.3-y*3.1)*.055,z=-.68-y*.355+ledge+crag-(Math.max(0,Math.abs(x-2.35)-1.4)*.18);cp.setXYZ(i,x,y,z);}cliff.computeVertexNormals();const cliffMesh=mesh(cliff,wet);cliffMesh.name='連続する断面・湿った岩肌';

 const rocks=[];function rock(x,y,z,sx,sy,sz,angle=0){const o=new THREE.Object3D();o.position.set(x,y,z);o.rotation.set(0,angle,0);o.scale.set(sx,sy,sz);o.updateMatrix();rocks.push(o.matrix.clone());}
 // Irregular stepped ledges, with open water channels instead of a flat wall.
 for(const q of [[-.45,.65,-1.0,.85,.5,.5,-.2],[.1,2.15,-1.5,.65,.8,.6,.25],[.15,4.65,-2.5,.6,.7,.5,-.18],[4.85,.75,-.75,.75,.65,.55,.18],[5.05,2.55,-1.65,.48,.75,.6,-.18],[4.65,4.65,-2.5,.7,.6,.5,.12],[1.2,1.35,-1.1,.75,.23,.35,-.18],[3.0,2.85,-1.7,1.15,.22,.4,.14],[3.1,4.7,-2.95,.8,.28,.42,-.23]])rock(...q);

 for(const [x,y,z,sx,sy,sz]of [[3.45,5.38,-3.0,.82,.36,.48],[4.4,3.4,-2.0,.9,.45,.6],[.2,1.15,-.25,1.1,1.15,.85],[-.85,.22,1.1,1.0,.27,.8],[-2.0,.13,2.5,.7,.22,.6],[4.8,.1,2.75,.8,.22,.65],[3.9,.07,3.65,.55,.16,.4]])rock(x,y,z,sx,sy,sz,rnd()*5);
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2,x=1.05+Math.cos(a)*3.95,z=1.4+Math.sin(a)*2.45;if(z>2.8&&x> -1.6&&x<3.7)continue;rock(x,z>2.2?.08:.13+rnd()*.1,z,.33+rnd()*.32,z>2.2?.12+rnd()*.07:.22+rnd()*.1,.3+rnd()*.23,rnd()*6.28);}
 // Shaded strata close the background behind the stair and hide the city horizon.
 for(const [x,y,z,a,b,c] of [[-4.65,1.8,-3.6,2.2,2.4,2.4],[-2.78,2.86,-4.12,2.05,1.82,2.05],[-.9,3.76,-4.19,1.8,1.49,2.17],[.84,4.72,-4.28,1.85,1.19,2.17],[3.31,5.19,-4.33,1.2,.51,1.61],[4.9,4.7,-4.02,1.5,1.24,2.02],[6.13,2.83,-2.72,1.7,2.22,1.56],[5.24,2.0,-.82,1.44,2.01,1.2],[-.57,4.08,-2.56,1.13,1.40,1.17],[.82,3.93,-2.02,1.07,1.41,.94],[-.1,2.01,-1.67,1.12,1.38,.72],[.93,1.6,-1.37,.66,1.22,.68],[2.63,3.035,-1.15,1.15,.19,.39],[5.15,4.38,-1.78,1.08,1.11,.9]])rock(x,y,z,a,b,c,rnd()*.8-.4);
 const stepMat=wet.clone();stepMat.onBeforeCompile=wet.onBeforeCompile;stepMat.color.set('#b3ac91');stepMat.roughness=.78;
 rock(1.36,.16,4.89,.53,.36,.42,.25);
 const lamps=addWaterfallGrounds({site,M,mesh,box,ball,column,tube,label,stone:stepMat,rock,random:rnd}).map(p=>{
  const lamp=new THREE.PointLight('#ffc975',0,4.8,2);
  lamp.position.set(...p);lamp.visible=false;group.add(lamp);return lamp;
 });
 site.block('岩壁',2.16,2.65,-2.6,7.8,5.3,1.2);site.block('左岸岩壁',-4.86,1.2,-.65,1.67,2.45,4.8);
 const rockMesh=new THREE.InstancedMesh(rockGeo,wet,rocks.length);rockMesh.name='濡れた苔岩・分層岩壁';rocks.forEach((m,i)=>rockMesh.setMatrixAt(i,m));rockMesh.castShadow=rockMesh.receiveShadow=true;rockMesh.computeBoundingSphere();staticRoot.add(rockMesh);
 // A continuous shaded bank closes the left-eye-level view. Bushes root in
 // this sloped rock, rather than forming a transparent floating leaf wall.
 function bankHeight(z,x){const v=THREE.MathUtils.clamp((z+4.0)/7.5,0,1),u=THREE.MathUtils.clamp((x+6.0)/1.65,0,1);return .12+(1-v)*2.5+(1-u)*.8+.12*Math.sin(z*2.1+x*1.3);}
 const bankGeo=new THREE.PlaneGeometry(1.65,7.5,14,40),bp=bankGeo.attributes.position;for(let i=0;i<bp.count;i++){const x=bp.getX(i)-5.175,z=bp.getY(i)-.25;bp.setXYZ(i,x,bankHeight(z,x),z);}const bankIndex=bankGeo.index;for(let i=0;i<bankIndex.count;i+=3){const b=bankIndex.getX(i+1);bankIndex.setX(i+1,bankIndex.getX(i+2));bankIndex.setX(i+2,b);}bankGeo.computeVertexNormals();const bank=mesh(bankGeo,wet);bank.material.side=THREE.DoubleSide;bank.name='左岸・連続する濡れた斜面';
 const solidLeaf=new THREE.Shape();solidLeaf.moveTo(0,0);solidLeaf.quadraticCurveTo(-.12,.12,0,.32);solidLeaf.quadraticCurveTo(.12,.12,0,0);const solidLeafGeo=new THREE.ShapeGeometry(solidLeaf,4);const slp=solidLeafGeo.attributes.position;for(let i=0;i<slp.count;i++)slp.setZ(i,Math.sin(slp.getY(i)/.32*Math.PI)*.035);solidLeafGeo.computeVertexNormals();const solidLeafMat=new THREE.MeshStandardMaterial({color:'#345a31',side:THREE.DoubleSide,roughness:.88,envMapIntensity:.25});const bushLeaves=[],twigPoints=[];
 for(const [baseX,baseZ,height]of [[-5.25,2.15,2.4],[-5.15,.4,2.75],[-5.25,-1.35,2.8],[-4.85,-3.05,2.1]]){const baseY=bankHeight(baseZ,baseX);tube(M.darkWood,[[baseX,baseY,baseZ],[baseX+.1,baseY+height*.55,baseZ-.06],[baseX-.12,baseY+height,baseZ-.12]],.065);for(let b=0;b<9;b++){const a=b*2.39996,yy=baseY+height*(.3+b*.075),rad=.34+(b%3)*.13,end=V(baseX+Math.cos(a)*rad,yy+.26,baseZ+Math.sin(a)*rad*.9);tube(M.darkWood,[[baseX,yy-.22,baseZ],[baseX+Math.cos(a)*rad*.5,yy,baseZ+Math.sin(a)*rad*.45],end.toArray()],.018);for(let j=0;j<10;j++){const t=j/10,x=baseX+(end.x-baseX)*t,z=baseZ+(end.z-baseZ)*t,y=yy-.1+t*.36,side=j%2?1:-1;bushLeaves.push({p:V(x+Math.cos(a+1.57)*side*.12,y,z+Math.sin(a+1.57)*side*.12),a:a+side*.7,tilt:.35+(j%3)*.16,s:.8+(j%3)*.14});}}}
 const shrubMesh=new THREE.InstancedMesh(solidLeafGeo,solidLeafMat,bushLeaves.length),shrubDummy=new THREE.Object3D();shrubMesh.name='左岸・枝幹に繋がる灌木葉';for(const [i,l]of bushLeaves.entries()){shrubDummy.position.copy(l.p);shrubDummy.rotation.set(l.tilt,l.a,(i%5-2)*.2);shrubDummy.scale.setScalar(l.s);shrubDummy.updateMatrix();shrubMesh.setMatrixAt(i,shrubDummy.matrix);shrubMesh.setColorAt(i,new THREE.Color().setScalar(.72+(i%4)*.06));}shrubMesh.castShadow=shrubMesh.receiveShadow=true;shrubMesh.computeBoundingSphere();staticRoot.add(shrubMesh);
 const seatMaterial=stepMat;
 const seat=mesh(rockGeo,seatMaterial,seatPoint.x,.225,seatPoint.z,.64,.34,.48);seat.name='修行石・岸の乾いた腰掛け';
 const seatTop=mesh(new THREE.CylinderGeometry(.54,.60,.085,18),seatMaterial,seatPoint.x,seatPoint.y-.0425,seatPoint.z,1,1,.76);
 seatTop.name='修行石・座面';

 // A code-generated wave normal map feeds the physical water material and the
 // real scene environment. No dynamic screen-space reflection or transmission.
 const normalData=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const a=(y*128+x)*4,nx=Math.sin(x*.23+y*.17)*.22+Math.sin(x*.61-y*.31)*.1,ny=Math.cos(y*.27-x*.1)*.22+Math.cos(y*.51+x*.37)*.1;normalData[a]=128+nx*100;normalData[a+1]=128+ny*100;normalData[a+2]=248;normalData[a+3]=255;}const normalMap=new THREE.DataTexture(normalData,128,128,THREE.RGBAFormat);normalMap.wrapS=normalMap.wrapT=THREE.RepeatWrapping;normalMap.minFilter=THREE.LinearMipmapLinearFilter;normalMap.magFilter=THREE.LinearFilter;normalMap.generateMipmaps=true;normalMap.needsUpdate=true;normalMap.repeat.set(2.3,2.0);
 // A tiny one-off procedural woodland environment supplies broken tree/sky
 // reflections to this pool only. It has no camera render or per-frame target.
 const forestFaces=[];
 for(let face=0;face<6;face++){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  const sky=g.createLinearGradient(0,0,0,128);sky.addColorStop(0,face===2?'#9bafae':'#819794');sky.addColorStop(.48,'#425b48');sky.addColorStop(1,'#13291e');g.fillStyle=sky;g.fillRect(0,0,128,128);
  // Branch silhouettes remain connected; clustered leaves leave small sky gaps.
  for(let tree=0;tree<7;tree++){
   const x=tree*21-6+(face%3)*5,root=142,top=12+(tree*17+face*9)%55;
   g.strokeStyle=tree%2?'#13271f':'#243a2a';g.lineWidth=3+tree%3;g.beginPath();g.moveTo(x,root);g.quadraticCurveTo(x-8,80,x+10,top);g.stroke();
   for(let b=0;b<5;b++){const y=top+b*15,side=b%2?1:-1,tip=x+10+side*(16+b*3);g.lineWidth=1.4;g.beginPath();g.moveTo(x+5,y+13);g.quadraticCurveTo(x+side*8,y,tip,y-10);g.stroke();for(let l=0;l<8;l++){const lx=tip+(rnd()-.5)*25,ly=y-10+(rnd()-.5)*18;g.fillStyle=['#1c3726','#2e4c2f','#405c3c','#172e23'][(l+b+face)%4];g.beginPath();g.ellipse(lx,ly,5+rnd()*5,2+rnd()*4,rnd()*3,0,Math.PI*2);g.fill();}}
  }
  if(face===3){g.fillStyle='#11261dea';g.fillRect(0,0,128,128);}forestFaces.push(c);
 }
 const forestReflection=new THREE.CubeTexture(forestFaces);forestReflection.colorSpace=THREE.SRGBColorSpace;forestReflection.needsUpdate=true;
 const poolMaterial=new THREE.MeshPhysicalMaterial({color:'#344f50',normalMap,normalScale:new THREE.Vector2(.12,.12),roughness:.13,metalness:0,clearcoat:.6,clearcoatRoughness:.13,ior:1.333,envMap:forestReflection,envMapIntensity:1.05,transparent:true,opacity:.87,depthWrite:false,side:THREE.DoubleSide});
 poolMaterial.onBeforeCompile=shader=>{shader.uniforms.fallTime=time;shader.uniforms.nightAmount=night;shader.vertexShader='varying vec2 vPoolUV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPoolUV=uv;');shader.fragmentShader='varying vec2 vPoolUV;uniform float fallTime;uniform float nightAmount;\n'+noise+'\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec2 poolP=(vPoolUV-.5)*2.;float shore=1.-smoothstep(.82,.99,length(poolP)+(noise(poolP*13.)-.5)*.035);diffuseColor.a*=shore;float canopy=fbm(poolP*8.+vec2(fallTime*.005,-fallTime*.009));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.024,.045,.046),smoothstep(.38,.68,canopy)*.35);');shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','float reflectedCanopy=fbm(poolP*vec2(5.,9.)+vec2(sin(poolP.y*41.+fallTime*.6)*.045,fallTime*.007));float reflectedSky=smoothstep(.53,.7,reflectedCanopy);float surfaceGlimmer=pow(.5+.5*sin(poolP.y*135.+sin(poolP.x*22.)*2.+fbm(poolP*20.)*6.-fallTime*2.3),11.);float reflectionMask=reflectedSky*(.35+surfaceGlimmer*.65);outgoingLight=mix(outgoingLight,vec3(.18,.24,.25)*(1.-nightAmount*.92),reflectionMask*.56);float foamShore=smoothstep(.80,.90,length(poolP))*(1.-smoothstep(.91,.98,length(poolP)))*smoothstep(.53,.69,fbm(poolP*37.+vec2(fallTime*.05,0.)));outgoingLight=mix(outgoingLight,vec3(.56,.65,.63)*(1.-nightAmount*.9),foamShore*.43);\n#include <opaque_fragment>');};
 const poolGeo=new THREE.CircleGeometry(1,72),poolPositions=poolGeo.attributes.position;for(let i=1;i<poolPositions.count;i++){const x=poolPositions.getX(i),y=poolPositions.getY(i),a=Math.atan2(y,x),r=1+.032*Math.sin(a*7.)+.018*Math.sin(a*19.);poolPositions.setXY(i,x*r,y*r);}const bedMaterial=new THREE.MeshStandardMaterial({map:rockMap,color:'#55634a',roughness:1,envMapIntensity:.15});const bed=mesh(poolGeo,bedMaterial,1.05,.13,1.4,3.89,2.38,1,group);bed.rotation.x=-Math.PI/2;bed.castShadow=false;bed.name='浅瀬の砂礫と濡れた岸辺';
 const pool=mesh(poolGeo,poolMaterial,1.05,.215,1.4,3.85,2.35,1,group);pool.rotation.x=-Math.PI/2;pool.castShadow=false;pool.receiveShadow=true;pool.name='透ける水潭・環境反射と波紋';
 const waterVertex=`varying vec2 vWaterUv;varying vec3 vWaterPoint;uniform float fallTime;void main(){vWaterUv=uv;vec3 p=position;p.x+=sin(p.y*5.+fallTime*4.+p.x*3.)*.018;p.z+=sin(p.y*8.-fallTime*6.)*.012;vWaterPoint=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
 const waterFragment=`precision highp float;varying vec2 vWaterUv;varying vec3 vWaterPoint;uniform float fallTime;uniform float nightAmount;uniform float layerSeed;uniform float flowDensity;uniform float flowRate;uniform float baseLayer;${noise}void main(){vec2 uv=vWaterUv;float ft=fallTime*flowRate;float warp=(noise(vec2(uv.y*6.3-ft*.45,layerSeed))-.5)*.105;float channel=fbm(vec2((uv.x+warp)*13.+layerSeed,uv.y*3.5-ft*2.1));float broken=fbm(vec2((uv.x+warp)*34.+layerSeed,uv.y*39.-ft*13.));float rivulet=smoothstep(.38,.67,channel+broken*.12);float aeration=.38+.62*smoothstep(.25,.75,broken);float edge=smoothstep(0.,.12,uv.x)*(1.-smoothstep(.88,1.,uv.x));float impact=smoothstep(.7,1.,uv.y)*smoothstep(.3,.68,noise(uv*43.-ft*7.));float white=clamp(rivulet*aeration+impact*.42,0.,1.);float channelGap=smoothstep(.16,.35,fbm(vec2(uv.x*7.+layerSeed,uv.y*19.-ft*5.)));float broadFoam=smoothstep(.27,.72,fbm(vec2(uv.x*6.+warp*2.+layerSeed,uv.y*23.-ft*8.)));float baseAmount=(.13+broadFoam*.39+white*.24)*(.48+channelGap*.52);float alpha=edge*mix((.018+white*.71)*channelGap,baseAmount,baseLayer)*flowDensity;vec3 color=mix(vec3(.54,.67,.67),vec3(.94,.985,.99),mix(.55+white*.45,.28+broadFoam*.64,baseLayer));color=mix(color,color*vec3(.34,.45,.63),nightAmount*.7);gl_FragColor=vec4(color,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>}`;
 const sheets=[];
 function sheet(points,width,seedValue,density=1,rate=1,base=0,relief=1){const curve=new THREE.CatmullRomCurve3(points.map(p=>V(...p))),rows=52,cols=10,pos=[],uv=[],idx=[];for(let j=0;j<=rows;j++){const t=j/rows,p=curve.getPoint(t),w=width*(.62+.5*t+.12*Math.sin(t*18+seedValue));for(let i=0;i<=cols;i++){const s=i/cols-.5;pos.push(p.x+s*w,p.y+.045*relief*Math.sin(i*.9+t*30),p.z+.035*relief*Math.sin(i*1.3+t*18));uv.push(i/cols,t);if(j<rows&&i<cols){const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const material=new THREE.ShaderMaterial({uniforms:{fallTime:time,nightAmount:night,layerSeed:{value:seedValue},flowDensity:{value:density},flowRate:{value:rate},baseLayer:{value:base}},vertexShader:waterVertex,fragmentShader:waterFragment,transparent:true,depthWrite:false,side:THREE.DoubleSide});const o=mesh(geo,material,0,0,0,1,1,1,group);o.castShadow=o.receiveShadow=false;o.name='落水・'+seedValue;o.renderOrder=2;sheets.push(o);return o;}
 const upperBase=sheet([[3.12,5.61,-2.48],[3.05,4.8,-1.98],[2.8,3.8,-1.33],[2.7,3.15,-.66]],2.16,38.7,.92,1.0,1);upperBase.name='上段・泡を含む連続した主水量';
 const lowerBase=sheet([[2.72,3.13,-.61],[2.52,2.7,-.15],[2.3,1.65,.57],[2.15,.27,1.42]],2.35,45.8,.94,1.12,1);lowerBase.name='下段・岩へ砕ける主水量';
 const waterfall=sheet([[3.1,5.62,-2.45],[3.05,4.8,-1.95],[2.8,3.8,-1.3],[2.7,3.15,-.63]],.68,1.3,.98,1.0);
 sheet([[3.72,5.5,-2.4],[3.72,4.5,-1.8],[3.5,3.6,-1.2],[3.25,3.12,-.67]],.48,7.1,.78,.88);
 sheet([[2.45,5.3,-2.3],[2.2,4.4,-1.65],[1.65,3.45,-.92],[1.65,3.1,-.55]],.34,4.2,.6,.72);
 sheet([[2.62,3.12,-.58],[2.35,2.7,-.12],[2.1,1.65,.6],[1.7,.27,1.45]],.82,12.2,1.02,1.12);
 sheet([[3.3,3.05,-.65],[3.5,2.4,-.1],[3.55,1.35,.4],[3.3,.27,.98]],.42,22.4,.77,1.07);
 sheet([[1.7,3.07,-.5],[1.4,2.6,.02],[1.25,1.6,.7],[1.3,.28,1.5]],.25,27.2,.55,.83);
 sheet([[2.85,2.72,-.14],[2.78,2.05,.25],[2.6,1.15,.7],[2.55,.27,1.2]],.17,32.1,.36,1.2);
 const feed=sheet([[3.30,5.79,-4.86],[3.23,5.73,-3.82],[3.18,5.67,-2.85],[3.12,5.61,-2.48]],1.43,19.2,.82,.63,.62,.20);feed.name='岩間の流入口';
 const basin=site.basin,[sx,sy,sz]=basin.lip;
 const spout=sheet([[sx,sy,sz],[sx-.031,sy-.12,sz],[sx-.073,basin.y+.17,sz+.01],[sx-.083,basin.y+.003,sz+.02]],.083,18.4,.93,.86,.57,.15);
 spout.name='竹筧・手水鉢への流れ';
 const spoutPool=mesh(new THREE.CircleGeometry(.45,32),poolMaterial,basin.x,basin.y,basin.z,1,1,1,group);
 spoutPool.rotation.x=-Math.PI/2;spoutPool.castShadow=false;
 const outlet=sheet(site.overflow,.27,25.9,.87,.78,.55,.08);
 outlet.name='岸の低い溢流路';
 const overflowShader=new THREE.ShaderMaterial({
  uniforms:{fallTime:time,nightAmount:night},
  vertexShader:'varying vec2 vWaterUv;void main(){vWaterUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',side:THREE.DoubleSide,transparent:true,depthWrite:false,
  fragmentShader:`varying vec2 vWaterUv;uniform float fallTime;uniform float nightAmount;
 ${noise}
 void main(){
  vec2 uv=vWaterUv;
  float ripple=noise(vec2(uv.x*8.,uv.y*52.-fallTime*5.5));
  float edge=smoothstep(0.,.25,uv.x)*(1.-smoothstep(.75,1.,uv.x));
  float fade=smoothstep(0.,.095,uv.y)*(1.-smoothstep(.55,.98,uv.y));
  vec3 water=mix(vec3(.055,.17,.14),vec3(.26,.36,.29),smoothstep(.47,.82,ripple)*.72);
  gl_FragColor=vec4(water*(1.-nightAmount*.69),edge*fade*(.45+ripple*.37));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`
 });
 outlet.material.dispose();outlet.material=overflowShader;
 const foamMaterial=new THREE.ShaderMaterial({uniforms:{fallTime:time,nightAmount:night},transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`precision highp float;varying vec2 vUv;uniform float fallTime;uniform float nightAmount;${noise}void main(){vec2 p=vUv-.5;float r=length(p*vec2(1.,1.1));float cell=fbm(p*26.+vec2(fallTime*.22,-fallTime*.6));float ring=pow(.5+.5*sin(r*85.-fallTime*4.),15.);float alpha=(1.-smoothstep(.15,.49+noise(p*12.)*.035,r))*(.25+smoothstep(.28,.68,cell)*.66)+ring*(1.-smoothstep(.25,.5,r))*.06;gl_FragColor=vec4(mix(vec3(.88,.97,.94),vec3(.3,.43,.52),nightAmount*.6),alpha);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const foam=mesh(new THREE.PlaneGeometry(3.3,2.2),foamMaterial,2.05,.239,1.0,1,1,1,group);foam.rotation.x=-Math.PI/2;foam.castShadow=foam.receiveShadow=false;foam.name='着水の白泡と広がる波紋';foam.renderOrder=3;
 const rippleMaterial=new THREE.ShaderMaterial({uniforms:{fallTime:time},transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`precision highp float;varying vec2 vUv;uniform float fallTime;${noise}void main(){vec2 p=vUv-.5;float n=noise(p*18.+fallTime*.13),d=length(p*vec2(1.,1.5))+(n-.5)*.009,w=pow(.5+.5*sin(d*121.-fallTime*3.3+n*.9),19.);float stream=pow(.5+.5*sin(p.y*154.+sin(p.x*21.+fallTime*.3)*2.-fallTime*3.),12.)*smoothstep(.45,.72,fbm(p*vec2(15.,5.)+fallTime*.025));float a=(w*.12*smoothstep(.26,.71,noise(p*37.-fallTime*.2))+stream*.2)*(1.-smoothstep(.42,.62,length(p)));gl_FragColor=vec4(.75,.85,.85,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const ripples=mesh(new THREE.PlaneGeometry(6.9,4.0),rippleMaterial,1.05,.236,1.4,1,1,1,group);ripples.rotation.x=-Math.PI/2;ripples.castShadow=ripples.receiveShadow=false;group.add(ripples);
 function particles(count,mist,emitter=null){const origin=emitter||[1.95,mist?.35:.3,1.12];const p=new Float32Array(count*3),seeds=new Float32Array(count);for(let i=0;i<count;i++){p[i*3]=rnd();p[i*3+1]=rnd();p[i*3+2]=rnd();seeds[i]=rnd();}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));const material=new THREE.ShaderMaterial({uniforms:{fallTime:time,nightAmount:night},transparent:true,depthWrite:false,vertexShader:`attribute float aSeed;uniform float fallTime;varying float age;void main(){float t=fract(fallTime*${mist?'.11':'.6'}+aSeed);age=t;vec3 p=vec3(${origin[0].toFixed(3)},${origin[1].toFixed(3)},${origin[2].toFixed(3)});p.x+=(position.x-.5)*${mist?'3.0':'1.8'}*(.35+t);p.z+=(position.z-.5)*${mist?'2.1':'1.4'}*(.4+t);p.y+=${mist?'t*.9':'sin(t*3.14159)*(.25+position.y*.75)'};vec4 q=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*q;gl_PointSize=clamp(${mist?'245.':'35.'}/-q.z,${mist?'5.':'1.5'},${mist?'39.':'6.'});}`,fragmentShader:`precision highp float;varying float age;uniform float nightAmount;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*${mist?'13.':'19.'})*sin(age*3.14159)*${mist?'.075':'.46'};gl_FragColor=vec4(mix(vec3(.78,.89,.88),vec3(.3,.4,.5),nightAmount*.6),a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});const o=new THREE.Points(geo,material);o.frustumCulled=false;o.name=mist?'着水の細かな水霧':'弾ける水滴';group.add(o);return o;}
 const spray=particles(165,false),mist=particles(64,true),midSpray=particles(70,false,[2.7,3.1,-.52]),midMist=particles(25,false,[2.7,3.1,-.48]);const midFoam=mesh(new THREE.PlaneGeometry(1.65,.65),foamMaterial,2.7,3.09,-.58,1,1,1,group);midFoam.rotation.x=-Math.PI/2;midFoam.castShadow=midFoam.receiveShadow=false;midFoam.name='中段の着水・白泡';
 // A few dark branch and leaf clusters frame the water instead of a bare skyline.
 const leafCanvas=document.createElement('canvas');leafCanvas.width=leafCanvas.height=256;const lc=leafCanvas.getContext('2d');for(let i=0;i<16;i++){const x=35+(i*43%185),y=28+(i*57%185),angle=(i%7-3)*.3;lc.save();lc.translate(x,y);lc.rotate(angle);const gr=lc.createLinearGradient(-10,0,15,-42);gr.addColorStop(0,'#132d1b');gr.addColorStop(.48,'#345c31');gr.addColorStop(1,'#547746');lc.fillStyle=gr;lc.beginPath();lc.moveTo(0,0);lc.bezierCurveTo(-20,-12,-18,-42,0,-54);lc.bezierCurveTo(18,-40,20,-12,0,0);lc.fill();lc.strokeStyle='#77936a';lc.lineWidth=.9;lc.beginPath();lc.moveTo(0,-3);lc.lineTo(0,-48);lc.stroke();lc.restore();}const leafMap=new THREE.CanvasTexture(leafCanvas);leafMap.colorSpace=THREE.SRGBColorSpace;const leafMaterial=new THREE.MeshStandardMaterial({map:leafMap,alphaTest:.5,side:THREE.DoubleSide,roughness:.95,envMapIntensity:.2});const leafPlanes=[];for(let i=0;i<3;i++){const p=new THREE.PlaneGeometry(1,1);p.rotateY(i*Math.PI/3);leafPlanes.push(p);}const leafGeometry=mergeGeometries(leafPlanes,false);leafPlanes.forEach(p=>p.dispose());const leafPositions=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;if(Math.sin(a)>.5&&Math.abs(Math.cos(a))<.55)continue;leafPositions.push({x:1.05+Math.cos(a)*3.8,y:.25,z:1.4+Math.sin(a)*2.25,sx:.65,sy:.48});}const leafMesh=new THREE.InstancedMesh(leafGeometry,leafMaterial,leafPositions.length),leafDummy=new THREE.Object3D();leafMesh.name='瀧の木陰・枝葉';for(const [i,p]of leafPositions.entries()){leafDummy.position.set(p.x,p.y,p.z);leafDummy.rotation.set(.15*(i%3-1),i*.7,.1*(i%3));leafDummy.scale.set(p.sx,p.sy,p.sx*.8);leafDummy.updateMatrix();leafMesh.setMatrixAt(i,leafDummy.matrix);leafMesh.setColorAt(i,new THREE.Color().setScalar(.6+(i%4)*.09));}leafMesh.castShadow=true;leafMesh.receiveShadow=true;leafMesh.computeBoundingSphere();staticRoot.add(leafMesh);for(const x of [-5.3,4.9]){tube(M.darkWood,[[x,0,-3.5],[x-.1,2.9,-3.6],[x+.2,5.7,-3.7]],.11);tube(M.darkWood,[[x,3.4,-3.6],[x-(x<0?.3:.9),4.8,-3.6],[x-(x<0?.6:1.4),5.3,-3.7]],.055);}
 // Tree meshes share the surrounding forest's geometry and seasonal materials.
 const groves=new Map();
 for(const t of site.grove){
  if(!groves.has(t.template))groves.set(t.template,[]);
  groves.get(t.template).push(t);
 }
 const treeDummy=new THREE.Object3D();
 for(const [template,trees] of groves){
  for(const [geometry,material] of [[template.lowBranches,M.bark],[template.lowLeaves,template.material]]){
   const batch=new THREE.InstancedMesh(geometry,material,trees.length);
   trees.forEach((tree,i)=>{
    treeDummy.position.set(tree.u,site.ground(tree.u,tree.w)-.10,tree.w);
    treeDummy.rotation.set(0,tree.yaw,0);treeDummy.scale.setScalar(tree.scale);
    treeDummy.updateMatrix();batch.setMatrixAt(i,treeDummy.matrix);
   });
   batch.castShadow=batch.receiveShadow=true;batch.computeBoundingSphere();batch.name='瀧行場・根付いた杉と紅葉';staticRoot.add(batch);
  }
 }
 // Merge immutable repeated architecture by material, retaining mesh normals and UVs.
 staticRoot.updateMatrixWorld(true);const batches=new Map(),inverse=staticRoot.matrixWorld.clone().invert();staticRoot.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o===seat||o===seatTop||o.material?.transparent)return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);});
 for(const list of batches.values()){if(list.length<2)continue;const geometries=[];for(const o of list){let g=o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}geometries.push(g);}const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;const combined=new THREE.Mesh(merged,list[0].material);combined.castShadow=combined.receiveShadow=true;combined.name='滝行場・静的部材合批';staticRoot.add(combined);list.forEach(o=>o.parent.remove(o));}
 const stats={waterSheets:sheets.length,mistParticles:64,sprayParticles:260,rocks:rocks.length,proceduralWater:true,reflectionFaceSize:128,reflectionFaces:6,active:false,updates:0,meditationSeat:true};
 return{group,waterfall,pool,seat:seatTop,stats,meditation:{position:seatPoint,sittingHeight:seatPoint.y,frame(aspect,seated){
  const portrait=aspect<.8;
  return seated?{look:site.position(.94,2.37,1.82),eye:site.position(portrait?2.35:2.68,2.85,portrait?13.1:10.8)}
  :{look:site.position(portrait?-1.28:-.65,1.73,2.26),eye:site.position(portrait?-3.5:-4.30,portrait?2.30:2.72,portrait?18.9:15.35)};
 }},update(dt,now,player,active=false,mode='walk'){const p=player?.position||player,d=p?Math.hypot(p.x-site.x,p.z-site.z):Infinity;stats.active=group.visible&&d<46&&mode!=='overview';
 for(const lamp of lamps){const lit=stats.active&&d<19&&M.glow.emissiveIntensity>2;lamp.visible=lit;lamp.intensity=lit?7.8:0;}
 if(!stats.active)return;
 if(!requestedRockDetail){
  requestedRockDetail=true;
  loadTexture('v3.7/waterfall-slate.webp',true).then(texture=>{
   if(!texture)return;
   texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;texture.needsUpdate=true;
   rockDetail.value=texture;hasRockDetail.value=1;stats.detailTexture=true;
  }).catch(()=>{stats.detailTexture=false;});
 }
 time.value=now;night.value=Math.max(0,Math.min(1,(M.glow.emissiveIntensity-1.6)/1.2));poolMaterial.envMapIntensity=1.05*(1-night.value*.89);normalMap.offset.set(now*.008,now*.012);stats.reflectionIntensity=poolMaterial.envMapIntensity;stats.updates++;spray.visible=midSpray.visible=d<28;mist.visible=midMist.visible=d<22;},dispose(){group.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared&&!site.grove.some(t=>[t.template.lowBranches,t.template.lowLeaves].includes(o.geometry)))o.geometry.dispose();});rockMap.dispose();normalMap.dispose();forestReflection.dispose();}};
}

// Water ambience uses a small procedural noise buffer and runs independently of
// pressing the meditation button. Browsers are unlocked by the first gesture.
export function createWaterfallAmbience(site){
 let ctx=null,source=null,gain=null,panner=null,unlocked=false,lastDistance=Infinity,lastMode='overview',lastUpdate=0,lastNear=0,suspending=false,disposed=false;
 const stats={unlocked:false,graphReady:false,distance:Infinity,targetGain:0,contextState:'locked'};
 function unlock(){if(disposed)return;unlocked=true;stats.unlocked=true;try{if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();ctx.resume().then(()=>{if(lastDistance>=28||lastMode==='overview')ctx.suspend().catch(()=>{});}).catch(()=>{});}else if(lastDistance<28&&lastMode!=='overview'){ctx.resume().catch(()=>{});}if(lastDistance<28&&lastMode!=='overview')ensure();}catch(e){stats.error=e.message;}}
 function ensure(){if(source||!ctx||disposed)return;const n=Math.floor(ctx.sampleRate*3),buffer=ctx.createBuffer(2,n,ctx.sampleRate);for(let channel=0;channel<2;channel++){const a=buffer.getChannelData(channel);let brown=0;for(let i=0;i<n;i++){const white=Math.random()*2-1;brown=(brown+.018*white)/1.018;a[i]=channel?brown*4:white*.32;}}
 source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const split=ctx.createChannelSplitter(2),low=ctx.createBiquadFilter(),air=ctx.createBiquadFilter(),lowGain=ctx.createGain(),airGain=ctx.createGain();low.type='lowpass';low.frequency.value=850;air.type='highpass';air.frequency.value=900;lowGain.gain.value=.65;airGain.gain.value=.5;gain=ctx.createGain();gain.gain.value=0;panner=ctx.createStereoPanner();source.connect(split);split.connect(low,1);split.connect(air,0);low.connect(lowGain).connect(gain);air.connect(airGain).connect(gain);gain.connect(panner).connect(ctx.destination);source.start();stats.graphReady=true;stats.bufferBytes=2*n*4;}
 function visibility(){if(document.hidden){stats.targetGain=0;stats.actualGain=0;if(gain&&ctx)gain.gain.setValueAtTime(0,ctx.currentTime);ctx?.suspend().catch(()=>{});}else if(unlocked&&lastDistance<28&&lastMode!=='overview')ctx?.resume().catch(()=>{});}
 document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',visibility);
 return{stats,update(player,active=false,mode='walk'){const p=player?.position||player;if(!p||disposed)return;const now=performance.now()/1000;if(now-lastUpdate<.12)return;lastUpdate=now;lastMode=mode;lastDistance=Math.hypot(p.x-site.x,p.z-site.z);stats.distance=+lastDistance.toFixed(2);const close=lastDistance<28&&mode!=='overview'&&!document.hidden,target=close?Math.pow(1-Math.min(1,lastDistance/28),1.6)*(active?.26:.2):0;stats.targetGain=+target.toFixed(4);if(close){lastNear=now;if(unlocked){ensure();if(ctx?.state==='suspended')ctx.resume().catch(()=>{});}}if(gain&&ctx){gain.gain.setTargetAtTime(target,ctx.currentTime,.45);panner.pan.setTargetAtTime(Math.max(-.7,Math.min(.7,(site.x-p.x)/14)),ctx.currentTime,.5);if(!close&&now-lastNear>7&&ctx.state==='running'&&!suspending){suspending=true;ctx.suspend().finally(()=>suspending=false);}}stats.contextState=ctx?.state||'locked';stats.actualGain=gain?.gain.value||0;},dispose(){disposed=true;document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);try{source?.stop();}catch{}ctx?.close();}};
}
