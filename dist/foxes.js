import * as THREE from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {MAP,pathSamples} from './geography.js';

export function createFoxes(scene,world){
  const unit=new THREE.SphereGeometry(1,32,20),cone=new THREE.ConeGeometry(1,1,4),dummy=new THREE.Object3D();
  const orange='#c76c2c',light='#edbb7b',white='#f4e6ca',dark='#302a22';
  function model(parts){const geometries=[];for(const p of parts){const [shape,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0]=p,g=(shape==='cone'?cone:unit).clone();dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();g.applyMatrix4(dummy.matrix);const c=new THREE.Color(color),data=new Float32Array(g.attributes.position.count*3);for(let i=0;i<data.length;i+=3){data[i]=c.r;data[i+1]=c.g;data[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(data,3));geometries.push(g);}const result=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());return result;}
  const body=model([
    ['sphere',orange,0,.48,-.03,.235,.25,.47],['sphere',light,0,.48,.3,.19,.24,.21],['sphere',white,0,.43,.37,.155,.17,.09],
    ['sphere',orange,0,.76,.48,.245,.22,.245],['sphere',white,-.14,.65,.57,.135,.11,.13],['sphere',white,.14,.65,.57,.135,.11,.13],['sphere',white,0,.67,.73,.12,.085,.205],['sphere',dark,0,.705,.906,.057,.043,.045],
    ['cone',orange,-.155,.995,.43,.12,.31,.12,0,Math.PI/4,-.16],['cone',orange,.155,.995,.43,.12,.31,.12,0,Math.PI/4,.16],
    ['cone','#54372b',-.155,1,.471,.062,.19,.035,0,Math.PI/4,-.16],['cone','#54372b',.155,1,.471,.062,.19,.035,0,Math.PI/4,.16],
    ['sphere',dark,-.155,.786,.665,.032,.04,.025],['sphere',dark,.155,.786,.665,.032,.04,.025],['sphere','#ffffff',-.161,.801,.683,.009,.01,.008],['sphere','#ffffff',.149,.801,.683,.009,.01,.008]
  ]);
  const tail=model([['sphere',orange,0,.02,-.2,.16,.18,.32],['sphere',orange,0,.09,-.48,.215,.21,.32],['sphere',white,0,.17,-.74,.16,.16,.23]]);
  const leg=model([['sphere',orange,0,-.13,0,.068,.19,.075],['sphere',dark,0,-.29,.035,.06,.09,.09]]);
  const candidates=[
    {points:[[-96,2.6],[-64,1],[-35,-.5]],speed:.83,phase:0},
    {points:[[-94,-2.6],[-66,-3.1],[-35,-3.8]],speed:.71,phase:.38},
    {points:[[-100,3.8],[-76,3],[-44,1.6]],speed:.95,phase:.77},
    {points:[[0,10],[12,13],[21,11]],speed:.65,phase:.27},
    ...MAP.paths.filter(p=>[260121328,377968455].includes(p.id)).map((p,i)=>({points:p.p,speed:.63+i*.13,phase:.31+i*.32})),
    {points:[[239,62],[247,67],[254,65]],speed:.76,phase:.61},
    {points:MAP.routes.find(r=>r.from==='yotsu').p.slice(0,7),speed:.7,phase:.21}
  ];
  const agents=[];
  for(const [i,c]of candidates.entries()){
    const samples=pathSamples(c.points,1.5).filter(p=>{const y=world.walkHeight(p.x,p.z);return Number.isFinite(y)&&!world.physics.collides(p.x,y,p.z);});
    if(samples.length<3)continue;
    const index=Math.floor(c.phase*(samples.length-1)),p=samples[index];agents.push({id:i,x:p.x,z:p.z,y:world.walkHeight(p.x,p.z),route:samples,index:Math.min(index+1,samples.length-1),direction:1,speed:c.speed,phase:i*1.7,yaw:Math.atan2(p.dx,p.dz),scale:.76+(i%3)*.07,blocked:0,distance:0});
  }
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,envMapIntensity:.5});
  const bodies=new THREE.InstancedMesh(body,material,agents.length),tails=new THREE.InstancedMesh(tail,material,agents.length),legs=new THREE.InstancedMesh(leg,material,agents.length*4);
  for(const m of [bodies,tails,legs]){m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=false;m.receiveShadow=true;scene.add(m);}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,3,32,32,30);gradient.addColorStop(0,'rgba(28,22,15,.33)');gradient.addColorStop(1,'rgba(28,22,15,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.4,1.7).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),agents.length);shadows.frustumCulled=false;scene.add(shadows);
  const root=new THREE.Matrix4(),local=new THREE.Matrix4(),joint=new THREE.Object3D();
  function draw(time){for(let i=0;i<agents.length;i++){
    const a=agents[i];dummy.position.set(a.x,a.y+.035,a.z);dummy.rotation.set(0,a.yaw,0);dummy.scale.setScalar(a.scale);dummy.updateMatrix();root.copy(dummy.matrix);bodies.setMatrixAt(i,root);shadows.setMatrixAt(i,root);
    joint.position.set(0,.5,-.4);joint.rotation.set(.2,Math.sin(time*2+a.phase)*.18,0);joint.scale.setScalar(1);joint.updateMatrix();local.multiplyMatrices(root,joint.matrix);tails.setMatrixAt(i,local);
    for(let k=0;k<4;k++){const side=k%2?1:-1,front=k<2?1:-1;joint.position.set(side*.145,.35,front*.255);joint.rotation.set(Math.sin(a.phase+(k===0||k===3?0:Math.PI))*.39,0,0);joint.updateMatrix();local.multiplyMatrices(root,joint.matrix);legs.setMatrixAt(i*4+k,local);}
  }for(const m of [bodies,tails,legs,shadows])m.instanceMatrix.needsUpdate=true;}
  function update(dt,time,player,reduced=false){
    if(!reduced)for(const a of agents){
      if(Math.hypot(a.x-player.x,a.z-player.z)>100)continue;
      let target=a.route[a.index],dx=target.x-a.x,dz=target.z-a.z,len=Math.hypot(dx,dz);
      if(len<.3){a.index+=a.direction;if(a.index>=a.route.length||a.index<0){a.direction*=-1;a.index=Math.max(0,Math.min(a.route.length-1,a.index+2*a.direction));}target=a.route[a.index];dx=target.x-a.x;dz=target.z-a.z;len=Math.hypot(dx,dz);}
      const oldX=a.x,oldZ=a.z,nearPlayer=Math.hypot(a.x-player.x,a.z-player.z),speed=nearPlayer<.8?0:a.speed;
      if(len>.001)world.physics.move(a,dx/len*speed*dt,dz/len*speed*dt,world.walkHeight);
      const moved=Math.hypot(a.x-oldX,a.z-oldZ);a.distance+=moved;a.phase+=moved*10;a.blocked=moved<.001&&speed>0?a.blocked+dt:0;
      if(moved>.001){const yaw=Math.atan2(a.x-oldX,a.z-oldZ),diff=THREE.MathUtils.euclideanModulo(yaw-a.yaw+Math.PI,Math.PI*2)-Math.PI;a.yaw+=diff*Math.min(1,dt*6);}
      if(a.blocked>1.2){a.direction*=-1;a.index=Math.max(0,Math.min(a.route.length-1,a.index+2*a.direction));a.blocked=0;}
    }
    draw(time);
  }
  draw(0);return{agents,meshes:[bodies,tails,legs,shadows],count:agents.length,update};
}
