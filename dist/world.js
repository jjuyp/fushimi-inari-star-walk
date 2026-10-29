import * as THREE from 'three';
import {MAP,terrainHeight,SurfaceMap,PavedSurface,pathSamples,footprintBox,insidePolygon} from './geography.js';
import {CollisionWorld} from './physics.js';
import {GeometryBuilder,Building,shadowProxy} from './geometry.js';
import {createArchitecture,createToriiBuilder} from './architecture.js';
import {Tree,TreeOptions,loadPreset} from './vendor/ez-tree.js';
import {createDistrict} from './district.js';
import {chunkTerrain} from './terrain-chunks.js';
let seed=20261025;
export function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const range=(a,b)=>a+(b-a)*random();

export async function buildWorld(scene,M,onProgress){
  const physics=new CollisionWorld(),surface=new SurfaceMap(),paving=new PavedSurface(),g=new GeometryBuilder(scene,M,physics),architecture=createArchitecture(g,surface),toriis=createToriiBuilder(g,surface);
  onProgress('依境內圖重建樓門、拜殿與本殿…');
  const byId=new Map(MAP.buildings.map(b=>[b.id,b]));
  architecture.romon(byId.get(105449733));
  architecture.shrine(byId.get(105449674),{open:true});
  architecture.shrine(byId.get(105449716),{main:true});
  architecture.shrine(byId.get(899425893),{main:true,gabled:true});
  const special=new Set([105449733,105449674,105449716,899425893]);
  for(const b of MAP.buildings){
    if(special.has(b.id))continue;const bb=footprintBox(b);if(!bb||bb.w<.7||bb.d<.7)continue;
    if(b.type==='shrine'||b.name.includes('権殿')||b.name.includes('奥社'))architecture.shrine(b,{main:b.name.includes('権殿')});else architecture.simpleBuilding(b);
  }
  // Precinct walls, subsidiary shrine enclosures, and actual side corridors.
  architecture.fence([[42,-18],[58,-19],[60,3],[44,4]],.2,1.35);
  architecture.fence([[58,-34],[98,-36]],.1,1.25);
  architecture.fence([[-19,-20],[-28,-20],[-29,-30]],.1,1.25);
  architecture.fence([[-18,14],[-26,14],[-27,22]],.1,1.25);
  // Main approach is west of Romon, not an invented north/south axis.
  // Public paving follows the graded terrain. A constant-height approach pad
  // previously made a 1.4 m invisible curb at x=-76 and trapped the visitor.
  const entranceGates=MAP.gates.filter(a=>a.p[0]<-30&&a.p[0]>-125&&Math.abs(a.p[1])<35);
  if(entranceGates.length){for(const gate of entranceGates)toriis.torii(...gate.p,Math.max(2.1,gate.width/2.25),-Math.PI/2+.055,{plaque:true});}
  else{toriis.torii(-90,1.7,2.7,-Math.PI/2+.055,{plaque:true});toriis.torii(-42,-.9,2.35,-Math.PI/2+.055,{plaque:true});}
  for(let i=0;i<5;i++)for(const side of [-1,1])architecture.standingLantern(-83+i*11,side*8-1,.9,-Math.PI/2);
  // A low stone water basin at the real hand-washing pavilion west/north of the gate.
  const washB=byId.get(105449723);if(washB){const bb=footprintBox(washB),b=new Building(g,'temizu basin',bb.x,terrainHeight(bb.x,bb.z),bb.z,bb.angle);b.box(M.wall,0,.8,0,3.3,1.2,1.8,0,true);b.box(M.bronze,0,1.42,0,2.9,.025,1.5);for(let i=-1;i<=1;i++){b.box(M.wood,i,1.52,0,.07,.07,2);b.sphere(M.wood,i,1.58,.35,.16,.07,.16);}}
  onProgress('鋪設實際步道與雙列千本鳥居…');
  await new Promise(r=>setTimeout(r,0));
  const senbonPaths=MAP.paths.filter(p=>p.id===260121328||p.id===377968455);let senbonCount=0;
  for(const p of senbonPaths){const expected=p.id===260121328?382:399,ps=pathSamples(p.p,1);const length=ps[ps.length-1].distance;for(const q of pathSamples(p.p,length/(expected-1))){if(toriis.torii(q.x,q.z,.94,Math.atan2(q.dx,q.dz),{base:surface.height(q.x,q.z)-.015,plaque:senbonCount%100===0}))senbonCount++;}}
  const largeApproach=MAP.paths.find(p=>p.id===260121354);
  if(largeApproach)for(const p of pathSamples(largeApproach.p,1.9))toriis.torii(p.x,p.z,1.4,Math.atan2(p.dx,p.dz),{base:surface.height(p.x,p.z)-.015,plaque:true});
  // Mountain loop follows actual OSM route nodes and metre distances.
  const usedSegments=new Set();let mountainCount=0;
  for(const route of MAP.routes){for(let i=1;i<route.p.length;i++){
    const a=route.p[i-1],b=route.p[i],key=[a.join(','),b.join(',')].sort().join('/');if(usedSegments.has(key))continue;usedSegments.add(key);
    const samples=pathSamples([a,b],1.02);
    for(let j=1;j<samples.length;j++){const p=samples[j];if(p.distance<.25)continue;const scale=.92+(Math.sin(p.x*.19+p.z*.08)+1)*.16;if(toriis.torii(p.x,p.z,scale,Math.atan2(p.dx,p.dz),{base:surface.height(p.x,p.z)-.015,plaque:mountainCount%13===0}))mountainCount++;}
  }}
  const nearGates=MAP.gates.filter(a=>a.p[0]>45&&a.p[0]<160&&a.p[1]<-20);
  for(const gate of nearGates){const p=surface.nearPath(...gate.p);toriis.torii(...gate.p,Math.max(.9,Math.min(2,gate.width/2.25)),p.s?Math.atan2(p.s.dx,p.s.dz):0,{plaque:true});}
  // Mountain otsuka stone groupings, rather than generic large temple buildings.
  for(const poi of MAP.pois.filter(p=>['kumataka','sannomine','ninomine','summit','mitsurugi','gozentani'].includes(p.id))){
    const [x,z]=poi.p,y=terrainHeight(x,z);
    for(let i=0;i<24;i++){
      const angle=i*2.39996,r=range(4.2,11.5),xx=x+Math.cos(angle)*r,zz=z+Math.sin(angle)*r;
      const path=surface.nearPath(xx,zz);if(path.distance<(path.s?.width||2)/2+1.1)continue;
      const h=range(.8,1.7),yy=terrainHeight(xx,zz),b=new Building(g,poi.id+' otsuka',xx,yy,zz,range(-.2,.2));
      b.box(M.wall,0,.2,0,.8,.4,.75,0,true);b.box(M.wall,0,.45+h/2,0,.52,h,.38,0,true);b.sphere(M.wall,0,h+.45,0,.26,.2,.19);g.put('plane',M.ink,...b.p(0,.55+h*.5,.198),.2,h*.72,1,0,b.angle);
      if(i%3===0)toriis.torii(xx,zz+.65,.4,0,{base:yy+.2,plaque:true});
    }
    for(const side of [-1,1]){
      let xx=x+side*4,zz=z+4;const near=surface.nearPath(xx,zz);
      if(near.s&&near.distance<near.s.width/2+1){const dx=xx-near.x,dz=zz-near.z,len=Math.hypot(dx,dz)||1,target=near.s.width/2+1.3;xx=near.x+dx/len*target;zz=near.z+dz/len*target;}
      architecture.standingLantern(xx,zz,.65,0);
    }
  }
  const focusFoxes=[[-30,-10],[-29,6],[175,10],[177,17],[240,59],[247,59]];
  for(let i=2;i<focusFoxes.length;i++){const p=focusFoxes[i];architecture.fox(...p,.6,i<4?-.9:0);}
  const district=await createDistrict(g,surface,architecture);
  // Ema, tied omikuji and bamboo are small, reusable objects beside the paths.
  const ritualSites=[[-53,12],[92,-9],[248,77]];
  for(const [x,z]of ritualSites){const y=terrainHeight(x,z);if(physics.collides(x,y,z))continue;const b=new Building(g,'ema and omikuji',x,y,z,-Math.PI/2);
    for(const side of [-1,1])b.column(M.darkWood,side*1.65,1.3,0,.09,2.6);b.box(M.darkWood,0,2.5,0,3.7,.18,.6);for(const h of [.8,1.4,2]){b.box(M.wood,0,h,0,3.3,.05,.05);for(let k=-6;k<=6;k++){b.box(h===2?M.white:M.rope,k*.245,h-.15,.06,.2,.27,.035,0);g.put('plane',M.ink,...b.p(k*.245,h-.15,.081),.055,.18,1,0,b.angle);}}
  }
  // Real ponds and topography.
  const waterMat=new THREE.MeshPhysicalMaterial({color:'#254d49',roughness:.22,metalness:.12,clearcoat:.8,envMapIntensity:.8});
  const waterMeshes=[];
  for(const water of MAP.water){const shape=new THREE.Shape();water.p.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,waterMat);const center=water.p.reduce((a,p)=>[a[0]+p[0]/water.p.length,a[1]+p[1]/water.p.length],[0,0]);mesh.position.y=terrainHeight(...center)+.04;mesh.receiveShadow=true;scene.add(mesh);waterMeshes.push(mesh);}
  const grid=MAP.dem,terrain=new THREE.PlaneGeometry((grid.nx-1)*4,(grid.nz-1)*4,grid.nx-1,grid.nz-1);terrain.rotateX(-Math.PI/2);
  const pos=terrain.attributes.position,uv=terrain.attributes.uv;for(let i=0;i<pos.count;i++){const x=pos.getX(i)+grid.x0+(grid.nx-1)*2,z=pos.getZ(i)+grid.z0+(grid.nz-1)*2;pos.setXYZ(i,x,terrainHeight(x,z),z);uv.setXY(i,x/5,z/5);}terrain.computeVertexNormals();const terrainMesh=chunkTerrain(terrain,grid.nx-1,grid.nz-1,M.forest);scene.add(terrainMesh);
  const westGeo=new THREE.PlaneGeometry(340,430,34,43);westGeo.rotateX(-Math.PI/2);for(let i=0;i<westGeo.attributes.position.count;i++){const p=westGeo.attributes.position,x=p.getX(i)-320,z=p.getZ(i)-85;p.setXYZ(i,x,terrainHeight(x,z),z);westGeo.attributes.uv.setXY(i,x/5,z/5);}westGeo.computeVertexNormals();const townGround=new THREE.MeshStandardMaterial({color:'#989c95',map:M.stone.map,roughness:.97,envMapIntensity:.2}),westGround=new THREE.Mesh(westGeo,townGround);westGround.receiveShadow=true;scene.add(westGround);
  // Stone walkway strips retain physical metre texture scale.
  const vertices=[],uvs=[];
  function tri(a,b,c,ta,tb,tc){vertices.push(...a,...b,...c);uvs.push(...ta,...tb,...tc);}
  for(const path of MAP.paths){
    let accumulated=0;
    for(let i=1;i<path.p.length;i++){
      const a=path.p[i-1],b=path.p[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(!len)continue;
      const n=Math.max(1,Math.ceil(len/(path.steps?.4:2))),nx=-dz/len*path.width/2,nz=dx/len*path.width/2;
      for(let j=0;j<n;j++){
        const t=j/n,t1=(j+1)/n,x=a[0]+dx*t,z=a[1]+dz*t,xx=a[0]+dx*t1,zz=a[1]+dz*t1;
        const y=surface.height(x,z)+.007,yy=surface.height(xx,zz)+.007;
        if(path.steps){const y0=Math.min(y,yy)-.22,y1=Math.max(y,yy);g.box(M.stone,(x+xx)/2,(y0+y1)/2,(z+zz)/2,path.width,y1-y0,len/n+.01,Math.atan2(dx,dz));}
        else{const p0=[x+nx,y,z+nz],p1=[x-nx,y,z-nz],p2=[xx+nx,yy,zz+nz],p3=[xx-nx,yy,zz-nz],v0=(accumulated+t*len)/3,v1=(accumulated+t1*len)/3;tri(p0,p2,p1,[0,v0],[0,v1],[path.width/3,v0]);tri(p1,p2,p3,[path.width/3,v0],[0,v1],[path.width/3,v1]);}
      }
      accumulated+=len;
    }
  }
  const pathGeometry=new THREE.BufferGeometry();pathGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));pathGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));pathGeometry.computeVertexNormals();paving.addGeometry(pathGeometry);const pathMesh=new THREE.Mesh(pathGeometry,M.stone);pathMesh.receiveShadow=true;pathMesh.material.side=THREE.DoubleSide;scene.add(pathMesh);
  // Main courtyard paving is separate from the forest material and actual trail lines.
  for(const patch of [{x:9,z:-5,w:38,d:46},{x:36,z:-6,w:27,d:35},{x:-48,z:-1,w:63,d:13},{x:96,z:-24,w:32,d:34},{x:247,z:62,w:25,d:22}]){
    const geo=new THREE.PlaneGeometry(patch.w,patch.d,Math.ceil(patch.w/2),Math.ceil(patch.d/2));geo.rotateX(-Math.PI/2);const pp=geo.attributes.position,uu=geo.attributes.uv;for(let i=0;i<pp.count;i++){const x=pp.getX(i)+patch.x,z=pp.getZ(i)+patch.z;pp.setXYZ(i,x,surface.height(x,z)+.045,z);uu.setXY(i,x/3,z/3);}geo.computeVertexNormals();paving.addGeometry(geo);const mesh=new THREE.Mesh(geo,M.stone);mesh.receiveShadow=true;scene.add(mesh);
  }
  // Gate feet use the final visible pavement, so raised paving cannot reduce
  // the clearance under a torii's crossbeam and trap the visitor's head.
  toriis.finish(walkHeight);
  onProgress('生成杉林、枝葉與表面細節…');await new Promise(r=>setTimeout(r,0));
  const trees=await plantForest(scene,g,physics,surface,M,MAP.buildings,MAP.water);
  g.finish();
  const placeMap=Object.fromEntries(MAP.pois.map(p=>[p.id,{...p,x:p.p[0],z:p.p[1]}]));
  // Visitor positions are on public paths, not inside the measured building footprint.
  Object.assign(placeMap.gate,{x:-31.5,z:-1.5});Object.assign(placeMap.hall,{x:22.5,z:-5.8});Object.assign(placeMap.haiden,{x:3,z:11.5});
  Object.assign(placeMap.torii,{x:191.5,z:33.939});Object.assign(placeMap.okusha,{x:243.5,z:63.8});Object.assign(placeMap.entrance,{x:-88,z:1});
  function walkHeight(x,z){if(x<-465||x>1265||z<-410||z>180)return NaN;for(const water of MAP.water)if(insidePolygon(x,z,water.p))return NaN;return Math.max(surface.height(x,z),terrainHeight(x,z)+.015,paving.height(x,z)+.012);}
  function safePlace(id){const p=placeMap[id];if(!p)return null;let x=p.x,z=p.z,y=walkHeight(x,z);
    if(!Number.isFinite(y)||physics.collides(x,y,z)){
      let found=false;for(let r=.5;r<12&&!found;r+=.5)for(let i=0;i<24;i++){const a=i/24*Math.PI*2,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r,yy=walkHeight(xx,zz);if(Number.isFinite(yy)&&!physics.collides(xx,yy,zz)){x=xx;z=zz;y=yy;found=true;break;}}
    }
    return{x,y,z};
  }
  function updateVisibility(camera,overview=false,wide=false){
    g.updateInstanceLODs(camera,wide);
    const limit=wide?3000:overview?600:210;
    for(const mesh of g.meshes){const sphere=mesh.isInstancedMesh?mesh.boundingSphere:mesh.geometry.boundingSphere;if(sphere)mesh.visible=(!mesh.isInstancedMesh||mesh.count>0)&&camera.position.distanceTo(sphere.center)-sphere.radius<Math.min(limit,mesh.userData.detailRange||limit);}
    trees.update(camera,wide);
  }
  return{ritualSites:architecture.ritualSites,physics,surface,M,terrainMesh,pathMesh,trees,district,builder:g,seasonal:architecture.seasonal,buildings:architecture.registered,places:placeMap,safePlace,walkHeight,updateVisibility,
    stats:{toriiCount:toriis.count,senbonCount,mountainCount,buildings:architecture.registered.length,colliders:physics.bodies.length,staticInstances:g.count,trees:trees.count,shops:district.shops,stalls:district.stalls,routeMetres:Math.round(MAP.routes.reduce((s,r)=>s+r.length,0))}};
}

async function plantForest(scene,g,physics,surface,M,buildings,waters){
  const forestGroups=new Map(),materials=[],templates=[];
  for(let k=0;k<3;k++){
    const tree=new Tree(new TreeOptions());tree.options.copy(loadPreset(k<2?'Pine Small':'Oak Small'));tree.options.seed=3921+k*734;tree.options.bark.textured=false;
    if(k<2){tree.options.branch.length[0]=26+k*3;tree.options.branch.length[1]=7.3;tree.options.branch.children[0]=35;tree.options.branch.sections[0]=9;tree.options.branch.sections[1]=5;tree.options.branch.segments[0]=8;tree.options.branch.segments[1]=4;tree.options.leaves.count=14;tree.options.leaves.size=2.5;tree.options.leaves.sizeVariance=.4;}
    else{Object.assign(tree.options.branch.length,{0:9,1:6,2:3.5,3:1.6});Object.assign(tree.options.branch.children,{0:5,1:3,2:3});Object.assign(tree.options.branch.segments,{0:8,1:5,2:4,3:3});tree.options.branch.radius[0]=.42;tree.options.leaves.count=7;tree.options.leaves.size=1.1;}
    tree.generate();
    const leaves=new THREE.MeshStandardMaterial({map:tree.leavesMesh.material.map,color:k<2?'#55754b':'#56833c',roughness:1,alphaTest:.48,side:THREE.DoubleSide,envMapIntensity:.35});
    materials.push({material:leaves,kind:k<2?'cedar':'maple'});
    const low=new Tree(new TreeOptions());low.options.copy(tree.options);
    for(let level=0;level<=3;level++){low.options.branch.sections[level]=Math.max(2,Math.ceil(low.options.branch.sections[level]*.35));low.options.branch.segments[level]=Math.max(3,Math.ceil(low.options.branch.segments[level]*.5));}
    low.options.leaves.count=Math.max(3,Math.ceil(tree.options.leaves.count*.45));low.options.leaves.size*=1.55;low.generate();
    templates.push({branches:tree.branchesMesh.geometry,leaves:tree.leavesMesh.geometry,lowBranches:low.branchesMesh.geometry,lowLeaves:low.leavesMesh.geometry,material:leaves});
    // Keep generated branch geometry; replace bark material with the Japanese cedar scan.
    tree.branchesMesh.material.dispose();
  }
  const sites=[];
  for(let i=0;i<1850;i++){
    const x=range(-55,1230),z=range(-405,175);if(x<95&&z>-48)continue;if(x<45&&z>-120)continue;
    const p=surface.nearPath(x,z);if(p.distance<(p.s?.width||2)/2+2.2)continue;
    if(buildings.some(b=>insidePolygon(x,z,b.p)||b.p.some(p=>Math.hypot(x-p[0],z-p[1])<2)))continue;
    if(waters.some(w=>insidePolygon(x,z,w.p)))continue;
    sites.push({x,z,k:random()<.81?Math.floor(random()*2):2,s:range(.63,1.14),angle:range(0,Math.PI*2)});
  }
  const undergrowth=new THREE.MeshStandardMaterial({map:templates[2].material.map,color:'#6f8f42',roughness:1,alphaTest:.48,side:THREE.DoubleSide,envMapIntensity:.3});undergrowth.userData.noShadow=true;
  for(const site of sites)for(let j=0;j<3;j++){
    const x=site.x+range(-3,3),z=site.z+range(-3,3),p=surface.nearPath(x,z);if(p.distance<(p.s?.width||2)/2+.7)continue;
    const h=range(.4,1.15),y=terrainHeight(x,z)+h*.5;for(let k=0;k<3;k++)g.put('plane',undergrowth,x,y,z,h*.9,h,1,range(-.25,.25),site.angle+k*Math.PI/3);
  }
  const dummy=new THREE.Object3D();
  for(const site of sites){const y=terrainHeight(site.x,site.z),key=site.k+':'+Math.floor(site.x/230)+':'+Math.floor(site.z/230)+(site.sakura?':flower':'');if(!forestGroups.has(key))forestGroups.set(key,{sites:[],template:templates[site.k],kind:site.sakura?'sakura':site.k<2?'cedar':'maple'});forestGroups.get(key).sites.push({...site,y});physics.circle('tree trunk',site.x,y+2,site.z,.26*site.s,4);}
  const seasonal=[],lods=[];
  for(const group of forestGroups.values()){
    const mat=group.kind==='sakura'?group.template.material.clone():group.template.material;
    if(group.kind==='sakura')materials.push({material:mat,kind:'sakura'});
    const branches=new THREE.InstancedMesh(group.template.branches,M.bark,group.sites.length),leaves=new THREE.InstancedMesh(group.template.leaves,mat,group.sites.length),lowBranches=new THREE.InstancedMesh(group.template.lowBranches,M.bark,group.sites.length),lowLeaves=new THREE.InstancedMesh(group.template.lowLeaves,mat,group.sites.length);
    for(let i=0;i<group.sites.length;i++){const p=group.sites[i];dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.s);dummy.updateMatrix();branches.setMatrixAt(i,dummy.matrix);leaves.setMatrixAt(i,dummy.matrix);lowBranches.setMatrixAt(i,dummy.matrix);lowLeaves.setMatrixAt(i,dummy.matrix);const c=new THREE.Color(0xffffff);c.offsetHSL(range(-.02,.02),range(-.06,.04),range(-.12,.07));leaves.setColorAt(i,c);lowLeaves.setColorAt(i,c);}
    const proxies=[];for(const mesh of [branches,leaves,lowBranches,lowLeaves]){mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);proxies.push(shadowProxy(mesh,scene));}if(group.kind!=='cedar')seasonal.push(leaves,lowLeaves);const center=new THREE.Vector3();for(const p of group.sites)center.add(new THREE.Vector3(p.x,p.y+10,p.z));center.divideScalar(group.sites.length);lods.push({center,branches,leaves,lowBranches,lowLeaves,sites:group.sites,proxies});
  }
  const frustum=new THREE.Frustum(),clip=new THREE.Matrix4(),sphere=new THREE.Sphere(),lastPosition=new THREE.Vector3(Infinity,0,0),lastQuaternion=new THREE.Quaternion();let lastUpdate=-Infinity,lastWide;
  return{count:sites.length,materials,seasonal,templates,update(camera,wide=false){if(wide===lastWide&&camera.position.distanceToSquared(lastPosition)<.36&&camera.quaternion.angleTo(lastQuaternion)<.015&&performance.now()-lastUpdate<500)return;lastWide=wide;lastPosition.copy(camera.position);lastQuaternion.copy(camera.quaternion);lastUpdate=performance.now();camera.updateMatrixWorld();frustum.setFromProjectionMatrix(clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));for(const lod of lods){const d=camera.position.distanceTo(lod.center),near=d<115,visible=d<(wide?3000:840),winter=!!lod.leaves.userData.seasonalHidden;lod.branches.visible=visible&&near;lod.leaves.visible=visible&&near&&!winter;lod.lowBranches.visible=visible&&!near;lod.lowLeaves.visible=visible&&!near&&!winter;lod.proxies.forEach((m,i)=>m.visible=visible&&(i<2?near:!near)&&(i%2===0||!winter));let count=0;for(let i=0;i<lod.sites.length;i++){const p=lod.sites[i];sphere.center.set(p.x,p.y+10*p.s,p.z);sphere.radius=25*p.s;if(!frustum.intersectsSphere(sphere))continue;const matrix=lod.proxies[0].instanceMatrix.array;for(const m of [lod.branches,lod.leaves,lod.lowBranches,lod.lowLeaves]){for(let k=0;k<16;k++)m.instanceMatrix.array[count*16+k]=matrix[i*16+k];if(m.instanceColor)for(let k=0;k<3;k++)m.instanceColor.array[count*3+k]=lod.proxies[1].instanceColor.array[i*3+k];}count++;}for(const m of [lod.branches,lod.leaves,lod.lowBranches,lod.lowLeaves]){m.count=count;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}}}};
}
