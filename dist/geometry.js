import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from './vendor/BufferGeometryUtils.js';
// Independent shadow instances keep off-camera casters intact when the visible
// instance list is compacted. A zero-instance main pass adds no pixels/vertices.
export function shadowProxy(mesh,scene){
 const proxy=new THREE.InstancedMesh(mesh.geometry,mesh.material,mesh.instanceMatrix.count);
 proxy.instanceMatrix=new THREE.InstancedBufferAttribute(mesh.instanceMatrix.array.slice(),16);if(mesh.instanceColor)proxy.instanceColor=new THREE.InstancedBufferAttribute(mesh.instanceColor.array.slice(),3);
 proxy.count=mesh.count;proxy.castShadow=true;proxy.receiveShadow=false;proxy.name='shadow-only';proxy.userData.shadowOnly=true;proxy.computeBoundingSphere();proxy.matrixAutoUpdate=false;proxy.onBeforeRender=()=>{proxy.userData.savedCount=proxy.count;proxy.count=0;};proxy.onAfterRender=()=>{proxy.count=proxy.userData.savedCount;};mesh.castShadow=false;scene.add(proxy);return proxy;
}
export class GeometryBuilder{
  constructor(scene,materials,physics){this.scene=scene;this.M=materials;this.physics=physics;this.groups=new Map();this.custom=new Map();this.meshes=[];this.count=0;this._dummy=new THREE.Object3D();this.primitives={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,16),sphere:new THREE.SphereGeometry(1,12,8),petal:new THREE.SphereGeometry(1,8,5),cone:new THREE.ConeGeometry(1,1,12),plane:new THREE.PlaneGeometry(1,1),torus:new THREE.TorusGeometry(1,.12,7,20)};}
  chunk(x,z,span=140){return Math.floor((x+70)/span)+','+Math.floor((z+100)/span);}
  put(type,material,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,color=null){
    const geo=typeof type==='string'?this.primitives[type]:type,key=geo.uuid+material.uuid+this.chunk(x,z);let group=this.groups.get(key);if(!group){group={geo,material,matrices:[],colors:[]};this.groups.set(key,group);}
    const o=this._dummy;o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.updateMatrix();group.matrices.push(o.matrix.clone());group.colors.push(color);this.count++;
  }
  box(m,x,y,z,w,h,d,ry=0,color){this.put('box',m,x,y,z,w,h,d,0,ry,0,color);}
  cylinder(m,x,y,z,r,h,ry=0){this.put('cylinder',m,x,y,z,r,h,r,0,ry);}
  sphere(m,x,y,z,sx,sy=sx,sz=sx){this.put('sphere',m,x,y,z,sx,sy,sz);}
  beam(m,a,b,r){const d=new THREE.Vector3().subVectors(b,a),o=this._dummy;o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.scale.set(r,a.distanceTo(b),r);o.updateMatrix();const geo=this.primitives.cylinder,key=geo.uuid+m.uuid+this.chunk(o.position.x,o.position.z);let g=this.groups.get(key);if(!g){g={geo,material:m,matrices:[],colors:[]};this.groups.set(key,g)}g.matrices.push(o.matrix.clone());g.colors.push(null);this.count++;}
  mesh(geometry,material,x=0,y=0,z=0,ry=0){
    let g=geometry.clone();const o=this._dummy;o.position.set(x,y,z);o.rotation.set(0,ry,0);o.scale.set(1,1,1);o.updateMatrix();g.applyMatrix4(o.matrix);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
    // Preserve exact position/normal/UV tuples. Never weld hard normals or UV seams.
    if(!g.index){const indexed=mergeVertices(g,1e-7);g.dispose();g=indexed;}
    g.computeBoundingSphere();const center=g.boundingSphere.center;
    const detailRange=geometry.userData.detailRange||600;
    const key=material.uuid+this.chunk(center.x,center.z,70)+':'+detailRange;if(!this.custom.has(key))this.custom.set(key,{material,geometries:[],detailRange});this.custom.get(key).geometries.push(g);
  }
  finish(){
    for(const g of this.groups.values()){
      const mesh=new THREE.InstancedMesh(g.geo,g.material,g.matrices.length);for(let i=0;i<g.matrices.length;i++){mesh.setMatrixAt(i,g.matrices[i]);if(g.colors[i])mesh.setColorAt(i,new THREE.Color(g.colors[i]));}
      mesh.castShadow=g.material!==this.M.ink&&g.material!==this.M.date&&!g.material.userData.noShadow;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.name='batch-'+g.matrices.length;
      mesh.userData.originalMatrices=mesh.instanceMatrix.array.slice();mesh.userData.originalColors=mesh.instanceColor?.array.slice()||null;mesh.matrixAutoUpdate=false;mesh.updateMatrix();
      if(mesh.castShadow){mesh.userData.shadowProxy=shadowProxy(mesh,this.scene);mesh.userData.shadowProxy.instanceMatrix.array=mesh.userData.originalMatrices;if(mesh.instanceColor)mesh.userData.shadowProxy.instanceColor.array=mesh.userData.originalColors;}
      g.geo.computeBoundingBox();const size=g.geo.boundingBox.getSize(new THREE.Vector3()),ranges=new Float32Array(g.matrices.length);
      for(let i=0;i<g.matrices.length;i++){const e=g.matrices[i].elements;const sx=Math.hypot(e[0],e[1],e[2]),sy=Math.hypot(e[4],e[5],e[6]),sz=Math.hypot(e[8],e[9],e[10]),max=Math.max(size.x*sx,size.y*sy,size.z*sz);ranges[i]=g.material.userData.noShadow?105:max<.55?65:max<1.6?115:max<2.6?190:450;}
      const radii=new Float32Array(g.matrices.length);for(let i=0;i<radii.length;i++){const e=g.matrices[i].elements;radii[i]=Math.max(size.x*Math.hypot(e[0],e[1],e[2]),size.y*Math.hypot(e[4],e[5],e[6]),size.z*Math.hypot(e[8],e[9],e[10]))+2;}mesh.userData.instanceRadii=radii;
      mesh.userData.instanceRanges=ranges;this.scene.add(mesh);this.meshes.push(mesh);
    }
    for(const g of this.custom.values()){const merged=mergeGeometries(g.geometries,false);if(!merged)throw Error('Geometry batch attribute mismatch');merged.computeBoundingSphere();const mesh=new THREE.Mesh(merged,g.material);mesh.userData.detailRange=g.detailRange;mesh.castShadow=mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;mesh.updateMatrix();this.scene.add(mesh);this.meshes.push(mesh);g.geometries.forEach(p=>p.dispose());}
    this.groups.clear();this.custom.clear();
    return this.meshes;
  }
  updateInstanceLODs(camera,wide=false){
    if(!this.lastLODPosition){this.lastLODPosition=new THREE.Vector3(Infinity,0,0);this.lastLODQuaternion=new THREE.Quaternion();this.frustum=new THREE.Frustum();this.clipMatrix=new THREE.Matrix4();this.sphere=new THREE.Sphere();}
    const now=performance.now();if(wide===this.lastWide&&camera.position.distanceTo(this.lastLODPosition)<.6&&camera.quaternion.angleTo(this.lastLODQuaternion)<.015&&now-(this.lastLODTime||0)<500)return;
    camera.updateMatrixWorld();this.frustum.setFromProjectionMatrix(this.clipMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    this.lastLODPosition.copy(camera.position);this.lastLODQuaternion.copy(camera.quaternion);this.lastLODTime=now;this.lastWide=wide;
    for(const mesh of this.meshes){if(!mesh.isInstancedMesh)continue;const original=mesh.userData.originalMatrices,ranges=mesh.userData.instanceRanges,colors=mesh.userData.originalColors,output=mesh.instanceMatrix.array;let active=0;
      for(let i=0;i<ranges.length;i++){const start=i*16,dx=original[start+12]-camera.position.x,dy=original[start+13]-camera.position.y,dz=original[start+14]-camera.position.z,range=wide?(ranges[i]>=190?4000:0):ranges[i];if(dx*dx+dy*dy+dz*dz>range*range)continue;this.sphere.center.set(original[start+12],original[start+13],original[start+14]);this.sphere.radius=mesh.userData.instanceRadii[i];if(!this.frustum.intersectsSphere(this.sphere))continue;
        for(let k=0;k<16;k++)output[active*16+k]=original[start+k];if(colors)for(let k=0;k<3;k++)mesh.instanceColor.array[active*3+k]=colors[i*3+k];active++;
      }
      mesh.count=active;mesh.instanceMatrix.needsUpdate=true;if(colors)mesh.instanceColor.needsUpdate=true;
    }
  }
}
// Local architectural coordinates: front is +Z. All colliders share the same transform.
export class Building{
  constructor(builder,id,x,y,z,angle=0){Object.assign(this,{g:builder,id,x,y,z,angle,c:Math.cos(angle),s:Math.sin(angle)});}
  p(x,y,z){return[this.x+this.c*x+this.s*z,this.y+y,this.z-this.s*x+this.c*z];}
  box(m,x,y,z,w,h,d,ry=0,solid=false){const p=this.p(x,y,z);this.g.box(m,...p,w,h,d,this.angle+ry);if(solid)this.g.physics.box(this.id,...p,w,h,d,this.angle+ry);}
  column(m,x,y,z,r,h,solid=true){const p=this.p(x,y,z);this.g.cylinder(m,...p,r,h);if(solid)this.g.physics.circle(this.id,...p,r,h);}
  sphere(m,x,y,z,sx,sy=sx,sz=sx){this.g.put('sphere',m,...this.p(x,y,z),sx,sy,sz,0,this.angle);}
  mesh(geo,m,x=0,y=0,z=0,ry=0){this.g.mesh(geo,m,...this.p(x,y,z),this.angle+ry);}
  tube(m,points,r=.06,segments=32){const ps=points.map(p=>new THREE.Vector3(...this.p(...p)));const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),segments,r,6,false);geo.userData.detailRange=r<.07?85:155;this.g.mesh(geo,m,0,0,0);geo.dispose();}
}
export function curvedRoof(w,d,h,{ridge=.68,front=.5,curl=.35}={}){
  const p=[],uv=[],indices=[],rows=18,cols=28;
  const point=(side,t,u)=>{const width=w/2*(1-(1-ridge)*t),depth=d*(side>0?front:1-front)*(1-t);return[u*width,h*Math.pow(t,1.6)+curl*Math.pow(1-t,6)*Math.pow(Math.abs(u),4),side*depth];};
  function patch(fn){let start=p.length/3;for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,u=i/cols*2-1,q=fn(t,u);p.push(...q);uv.push(q[0]/2.4,(t*d)/2.4);}
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let a=start+j*(cols+1)+i,b=a+cols+1;const ax=p[(a+1)*3]-p[a*3],az=p[(a+1)*3+2]-p[a*3+2],bx=p[b*3]-p[a*3],bz=p[b*3+2]-p[a*3+2];if(az*bx-ax*bz>0)indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);}}
  patch((t,u)=>point(1,t,u));patch((t,u)=>point(-1,t,u));
  if(ridge<.99)for(const side of [-1,1])patch((t,u)=>[side*w/2*(1-(1-ridge)*t),h*Math.pow(t,1.6)+curl*Math.pow(1-t,6)*Math.pow(Math.abs(u),4),u*d/2*(1-t)]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function curtain(w,h){const positions=[],uv=[],idx=[];for(let j=0;j<=1;j++)for(let i=0;i<=64;i++){const x=i/64*w-w/2,y=-j*h+(j?.05*Math.sin(i/64*Math.PI):0),z=Math.sin(i/64*Math.PI*18)*.045;positions.push(x,y,z);uv.push(i/64,j);}for(let i=0;i<64;i++)idx.push(i,i+65,i+1,i+1,i+65,i+66);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
