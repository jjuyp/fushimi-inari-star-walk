import * as THREE from 'three';
import {MAP,insidePolygon,terrainHeight,pathSamples} from './geography.js';

// Five notched petals and a palmate, serrated maple silhouette stay distinct
// even when the canopy uses cards. These are generated assets, not oak tinting.
export function seasonalAtlases(){
  const make=draw=>{const c=document.createElement('canvas');c.width=c.height=512;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
  const blossom=make(c=>{
    let s=7281;const rnd=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
    for(let j=0;j<23;j++){
      const a=j*2.39996,r=j?Math.sqrt(rnd())*164:0,x=256+Math.cos(a)*r,y=256+Math.sin(a)*r,size=25+rnd()*19;
      for(let k=0;k<5;k++){
        c.save();c.translate(x,y);c.rotate(k*Math.PI*.4+a*.12);const grad=c.createLinearGradient(0,0,0,-size);grad.addColorStop(0,'#edb4c7');grad.addColorStop(.6,'#fff3f6');grad.addColorStop(1,'#ffe3eb');c.fillStyle=grad;c.beginPath();c.moveTo(0,2);c.bezierCurveTo(-size*.8,-size*.3,-size*.65,-size*1.15,-size*.14,-size);c.lineTo(0,-size*.82);c.lineTo(size*.14,-size);c.bezierCurveTo(size*.65,-size*1.15,size*.8,-size*.3,0,2);c.fill();c.restore();
      }
      c.fillStyle='#c9587c';c.beginPath();c.arc(x,y,3.8,0,Math.PI*2);c.fill();
      for(let k=0;k<9;k++){const aa=k*Math.PI*2/9;c.strokeStyle='#c79059';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(aa)*size*.27,y+Math.sin(aa)*size*.27);c.stroke();c.fillStyle='#f4ce70';c.beginPath();c.arc(x+Math.cos(aa)*size*.27,y+Math.sin(aa)*size*.27,1.8,0,7);c.fill();}
    }
  });
  const maple=make(c=>{
    c.translate(256,275);const tips=[[-170,88],[-115,-25],[-164,-97],[-61,-70],[-78,-198],[-5,-112],[18,-252],[65,-113],[139,-203],[115,-65],[226,-95],[160,9],[221,83],[85,68],[14,121],[-42,70]];
    c.fillStyle='#fff9de';c.strokeStyle='#b8ad81';c.lineWidth=2;c.beginPath();c.moveTo(...tips[0]);for(let i=1;i<=tips.length;i++){const a=tips[i-1],b=tips[i%tips.length];for(let j=1;j<=5;j++){const t=j/5,dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),tooth=j<5&&j%2?8:0;c.lineTo(a[0]+dx*t-dy/l*tooth,a[1]+dy*t+dx/l*tooth);}}c.closePath();c.fill();c.stroke();
    c.strokeStyle='#a49565';c.lineWidth=3;for(const i of [0,2,4,6,8,10,12]){c.beginPath();c.moveTo(0,70);c.lineTo(tips[i][0]*.95,tips[i][1]*.95);c.stroke();}c.lineWidth=7;c.beginPath();c.moveTo(5,80);c.quadraticCurveTo(17,135,41,175);c.stroke();
  });
  const petal=make(c=>{c.translate(256,256);c.fillStyle='#ffdae7';c.beginPath();c.moveTo(0,170);c.bezierCurveTo(-175,10,-145,-200,-30,-168);c.lineTo(0,-132);c.lineTo(30,-168);c.bezierCurveTo(145,-200,175,10,0,170);c.fill();});
  return{blossom,maple,petal};
}

export function createFlora(scene,M,world){
  const atlases=seasonalAtlases(),template=world.trees.templates[2],sites=[],dummy=new THREE.Object3D();let seed=30481;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const valid=(x,z)=>{
    if(x<-445||x>350||z<-145||z>140||sites.some(p=>Math.hypot(p.x-x,p.z-z)<5.4))return false;
    const near=world.surface.nearPath(x,z);if(near.distance<(near.s?.width||2)/2+1.1)return false;
    if(MAP.water.some(w=>insidePolygon(x,z,w.p)))return false;
    if(MAP.buildings.some(b=>insidePolygon(x,z,b.p)||b.p.some(p=>Math.hypot(p[0]-x,p[1]-z)<2.2)))return false;
    const y=world.walkHeight(x,z);return Number.isFinite(y)&&!world.physics.collides(x,y,z);
  };
  const plant=(x,z,kind)=>{if(!valid(x,z))return;const p={x,z,y:terrainHeight(x,z),kind,scale:.48+rnd()*.19,angle:rnd()*6.28};sites.push(p);world.physics.circle(kind+' trunk',x,p.y+2,z,.19,4);};
  // Flower-lined approach: crowns sit beside the corridor; trunks never narrow it.
  for(let x=-114;x<-25;x+=7.5)for(const side of [-1,1])for(const offset of [8.5,14])plant(x,side*offset-1,'cherry');
  for(const path of MAP.paths.filter(p=>p.p.some(p=>p[0]>-35&&p[0]<325&&p[1]>-120&&p[1]<125))){
    for(const p of pathSamples(path.p,10.5))for(const side of [-1,1]){
      const d=path.width/2+3.1+rnd()*2;plant(p.x-p.dz*d*side,p.z+p.dx*d*side,sites.length%4===0?'maple':'cherry');
      if(sites.length>=118)break;
    }
    if(sites.length>=118)break;
  }
  // Replace the background deciduous cards with actual palmate maple outlines.
  for(const p of world.trees.materials)if(p.kind==='maple'){p.material.map=atlases.maple;p.material.needsUpdate=true;}
  for(const route of world.district.stations.map(st=>MAP.paths.find(p=>p.name==='車站參拜路線'&&Math.hypot(p.p[0][0]-st.p[0],p.p[0][1]-st.p[1])<60)).filter(Boolean))for(const p of pathSamples(route.p,11))for(const side of [-1,1]){const d=8.5;plant(p.x-p.dz*d*side,p.z+p.dx*d*side,sites.length%4===0?'maple':'cherry');}
  const cherryMat=new THREE.MeshStandardMaterial({map:atlases.blossom,color:'#ffffff',alphaTest:.34,side:THREE.DoubleSide,roughness:.93,envMapIntensity:.55});
  const mapleMat=new THREE.MeshStandardMaterial({map:atlases.maple,color:'#75a84e',alphaTest:.4,side:THREE.DoubleSide,roughness:1,envMapIntensity:.45});
  const meshes=[];
  for(const kind of ['cherry','maple']){
    const ps=sites.filter(p=>p.kind===kind),mat=kind==='cherry'?cherryMat:mapleMat,branches=new THREE.InstancedMesh(template.branches,M.bark,ps.length),leaves=new THREE.InstancedMesh(template.leaves,mat,ps.length),lowBranches=new THREE.InstancedMesh(template.lowBranches,M.bark,ps.length),lowLeaves=new THREE.InstancedMesh(template.lowLeaves,mat,ps.length);
    for(let i=0;i<ps.length;i++){const p=ps[i];dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.set(p.scale*1.04,p.scale,p.scale*1.04);dummy.updateMatrix();p.matrix=dummy.matrix.clone();for(const m of [branches,leaves,lowBranches,lowLeaves])m.setMatrixAt(i,p.matrix);const c=new THREE.Color(kind==='cherry'?'#fff7fa':'#ffffff');c.offsetHSL((rnd()-.5)*.025,0,(rnd()-.5)*.12);p.color=c;leaves.setColorAt(i,c);lowLeaves.setColorAt(i,c);}
    for(const mesh of [branches,leaves,lowBranches,lowLeaves]){mesh.castShadow=false;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);}meshes.push({kind,branches,leaves,lowBranches,lowLeaves,sites:ps});
  }
  const litterMat=new THREE.MeshStandardMaterial({map:atlases.petal,color:'#fff0f6',alphaTest:.32,side:THREE.DoubleSide,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const litter=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),litterMat,3200);let count=0;
  for(const p of sites)for(let j=0;j<38&&count<3200;j++){
    const angle=rnd()*Math.PI*2,r=Math.sqrt(rnd())*5.3,x=p.x+Math.cos(angle)*r,z=p.z+Math.sin(angle)*r,y=world.walkHeight(x,z);if(!Number.isFinite(y)||world.physics.collides(x,y,z))continue;
    const near=world.surface.nearPath(x,z);if(near.distance>(near.s?.width||2)/2+2)continue;
    dummy.position.set(x,y+.085,z);dummy.rotation.set(-Math.PI/2,0,rnd()*6.28);const size=.045+rnd()*.09;dummy.scale.set(size,size,1);dummy.updateMatrix();litter.setMatrixAt(count++,dummy.matrix);
  }
  litter.count=count;litter.computeBoundingSphere();litter.receiveShadow=true;scene.add(litter);
  let season='spring';
  function setSeason(value){
    season=value;cherryMat.map=value==='spring'?atlases.blossom:value==='autumn'?atlases.maple:template.material.map;cherryMat.color.set(value==='spring'?'#fff7fc':value==='autumn'?'#e75b18':'#76a346');cherryMat.needsUpdate=true;
    mapleMat.color.set(value==='autumn'?'#ee641d':'#79a94c');litterMat.map=value==='autumn'?atlases.maple:atlases.petal;litterMat.color.set(value==='autumn'?'#df5c18':'#fff0f6');litterMat.needsUpdate=true;litter.visible=value==='spring'||value==='autumn';
    for(const p of meshes){p.leaves.visible=value!=='winter';p.lowLeaves.visible=value!=='winter';}
  }
  let lastLOD=-Infinity;
  return{atlases,sites,meshes,litter,setSeason,stats:{cherryTrees:sites.filter(p=>p.kind==='cherry').length,mapleTrees:sites.filter(p=>p.kind==='maple').length,groundPetals:count},update(camera){
    litter.visible=(season==='spring'||season==='autumn')&&camera.position.y<150;if(performance.now()-lastLOD<550)return;lastLOD=performance.now();
    for(const group of meshes){let near=0,far=0;for(const p of group.sites){const distance=Math.hypot(p.x-camera.position.x,p.y+4-camera.position.y,p.z-camera.position.z);if(distance>600)continue;const close=distance<65,branches=close?group.branches:group.lowBranches,leaves=close?group.leaves:group.lowLeaves,index=close?near++:far++;branches.setMatrixAt(index,p.matrix);leaves.setMatrixAt(index,p.matrix);leaves.setColorAt(index,p.color);}group.branches.count=group.leaves.count=near;group.lowBranches.count=group.lowLeaves.count=far;for(const m of [group.branches,group.leaves,group.lowBranches,group.lowLeaves]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}}
  }};
}
