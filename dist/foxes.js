import * as THREE from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {MAP,pathSamples} from './geography.js';

export function createFoxes(scene,world){
  const unit=new THREE.SphereGeometry(1,16,12),ear=unit.clone(),dummy=new THREE.Object3D();
  const earVertices=ear.attributes.position;
  for(let i=0;i<earVertices.count;i++){const y=earVertices.getY(i);earVertices.setXYZ(i,earVertices.getX(i)*(1-.62*y),y,earVertices.getZ(i)*(1-.38*y))}ear.computeVertexNormals();
  const orange='#e08437',light='#edaf61',white='#fff0d6',dark='#372620';
  function model(parts){const geometries=[];for(const p of parts){const [shape,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0]=p,g=(shape==='ear'?ear:unit).clone();dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();g.applyMatrix4(dummy.matrix);const c=new THREE.Color(color),data=new Float32Array(g.attributes.position.count*3);for(let i=0;i<data.length;i+=3){const n=g.attributes.normal;const shade=.84+.16*(n.getY(i/3)+1)/2;data[i]=c.r*shade;data[i+1]=c.g*shade;data[i+2]=c.b*shade;}g.setAttribute('color',new THREE.BufferAttribute(data,3));geometries.push(g);}const result=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());return result;}
  const body=model([
    ['sphere',orange,0,.47,-.11,.255,.25,.41],['sphere',light,0,.48,.18,.196,.21,.23],['sphere',white,0,.42,.31,.159,.16,.095]
  ]);
  const head=model([
    ['sphere',orange,0,.18,.04,.315,.263,.276],['sphere',white,0,.091,.163,.296,.13,.195],['sphere',white,0,.10,.264,.145,.097,.133],['sphere',dark,0,.148,.378,.050,.033,.03],['sphere','#674133',0,.072,.374,.055,.022,.011],
    ...[-1,1].flatMap(s=>[['ear',orange,s*.204,.386,.002,.109,.217,.083,0,0,-s*.25],['ear','#a95e43',s*.207,.401,.057,.069,.152,.035,0,0,-s*.25],['sphere','#eaa18a',s*.222,.1,.278,.04,.018,.01]])
  ]);
  const openEyes=model([-1,1].flatMap(s=>[['sphere',dark,s*.133,.205,.286,.036,.047,.025],['sphere','#ffffff',s*.133-.008,.224,.305,.010,.012,.007]]));
  const closedEyes=model([-1,1].flatMap(s=>[-1,0,1].map(i=>['sphere',dark,s*.135+i*.019,.208+(i===0?.012:0),.303,.017,.008,.009,0,0,-i*.48])));
  const openMouth=model([['sphere','#593027',0,.056,.402,.055,.057,.017],['sphere','#eb9185',0,.028,.418,.033,.021,.009]]);
  function makeTail(){
    const curve=new THREE.CatmullRomCurve3([[0,0,0],[0,.03,-.23],[.03,.12,-.49],[.08,.23,-.72],[.085,.30,-.88]].map(p=>new THREE.Vector3(...p)));
    const positions=[],colors=[],indices=[],rings=22,sides=20;
    const copper=new THREE.Color(orange),cream=new THREE.Color(white),c=new THREE.Color();
    for(let j=0;j<=rings;j++){
      const t=j/rings,center=curve.getPoint(t),tangent=curve.getTangent(t),right=new THREE.Vector3(1,0,0).addScaledVector(tangent,-tangent.x).normalize(),normal=new THREE.Vector3().crossVectors(tangent,right);
      const radius=Math.max(.002,(.071*(1-t)+.215*Math.sin(Math.PI*t)**1.33)*(1-.17*t));
      for(let i=0;i<=sides;i++){
        const angle=i/sides*Math.PI*2,cy=Math.sin(angle),cx=Math.cos(angle);
        const p=center.clone().addScaledVector(right,cx*radius).addScaledVector(normal,cy*radius*.95);
        positions.push(p.x,p.y,p.z);
        const boundary=.69+.025*Math.sin(angle*5+.6)+.018*Math.cos(angle*7);
        c.copy(copper).lerp(cream,THREE.MathUtils.smoothstep(t,boundary-.055,boundary+.065)).multiplyScalar(.89+.11*(1-cy)/2);
        colors.push(c.r,c.g,c.b);
        if(i&&j){const k=j*(sides+1)+i,b=k-sides-1;indices.push(b-1,b,k-1,b,k,k-1)}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const tail=makeTail();
  const leg=model([['sphere',orange,0,-.13,0,.078,.172,.082],['sphere','#663d25',0,-.265,.04,.076,.064,.09]]);
  const candidates=[
    {points:[[-96,2.6],[-64,1],[-35,-.5]],speed:.83,phase:0},
    {points:[[-94,-2.6],[-66,-3.1],[-35,-3.8]],speed:.71,phase:.38},
    {points:[[-100,3.8],[-76,3],[-44,1.6]],speed:.95,phase:.77},
    {points:[[0,10],[12,13],[21,11]],speed:.65,phase:.27},
    ...MAP.paths.filter(p=>[260121328,377968455].includes(p.id)).map((p,i)=>({points:p.p,speed:.63+i*.13,phase:.31+i*.32})),
    {points:[[239,62],[247,67],[254,65]],speed:.76,phase:.61},
    {points:MAP.routes.find(r=>r.from==='yotsu').p.slice(0,7),speed:.7,phase:.21},
    ...[['jr',2],['entrance',4],['gate',2],['okusha',3],['yotsu',3]].flatMap(([id,n])=>{const p=world.safePlace(id);if(!p)return[];return Array.from({length:n},(_,i)=>{const x=p.x+(i%2?-1:1)*(2.6+i*.8),z=p.z+(i-1)*2.3;return{points:[[x-4,z-.8],[x,z],[x+4,z+.9]],speed:.55+(i%3)*.10,phase:.34+(i%3)*.17}})})
  ];
  const agents=[];
  for(const [i,c]of candidates.entries()){
    const samples=pathSamples(c.points,1.5).filter(p=>{const y=world.walkHeight(p.x,p.z);return Number.isFinite(y)&&!world.physics.collides(p.x,y,p.z);});
    if(samples.length<3)continue;
    const index=Math.floor(c.phase*(samples.length-1)),p=samples[index];agents.push({id:i,x:p.x,z:p.z,y:world.walkHeight(p.x,p.z),route:samples,index:Math.min(index+1,samples.length-1),direction:1,speed:c.speed,phase:i*1.7,yaw:Math.atan2(p.dx,p.dz),scale:.76+(i%3)*.07,blocked:0,distance:0});
  }
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,envMapIntensity:.5});
  const bodies=new THREE.InstancedMesh(body,material,agents.length),tails=new THREE.InstancedMesh(tail,material,agents.length),legs=new THREE.InstancedMesh(leg,material,agents.length*4),heads=new THREE.InstancedMesh(head,material,agents.length),eyes=new THREE.InstancedMesh(openEyes,material,agents.length),squints=new THREE.InstancedMesh(closedEyes,material,agents.length),mouths=new THREE.InstancedMesh(openMouth,material,agents.length);
  const meshes=[bodies,tails,legs,heads,eyes,squints,mouths];
  for(const m of meshes){m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=false;m.receiveShadow=true;scene.add(m);}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,3,32,32,30);gradient.addColorStop(0,'rgba(28,22,15,.46)');gradient.addColorStop(1,'rgba(28,22,15,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.4,1.7).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),agents.length);shadows.frustumCulled=false;scene.add(shadows);
  const root=new THREE.Matrix4(),local=new THREE.Matrix4(),joint=new THREE.Object3D(),hide=new THREE.Matrix4().makeScale(0,0,0);
  const heartArt=document.createElement('canvas');heartArt.width=heartArt.height=64;
  const ink=heartArt.getContext('2d');ink.beginPath();ink.moveTo(32,54);ink.bezierCurveTo(27,47,5,33,7,19);ink.bezierCurveTo(9,6,24,5,32,17);ink.bezierCurveTo(40,5,55,6,57,19);ink.bezierCurveTo(59,33,37,47,32,54);ink.closePath();ink.fillStyle='#ed797c';ink.fill();ink.lineWidth=2;ink.strokeStyle='#fff1d9';ink.stroke();
  const heartTexture=new THREE.CanvasTexture(heartArt);heartTexture.colorSpace=THREE.SRGBColorSpace;
  const hearts=Array.from({length:3},()=>{const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:heartTexture,transparent:true,depthWrite:false}));sprite.visible=false;scene.add(sprite);return sprite});
  const moods=['wag','stretch','yawn','sleep','roll','nuzzle'],stats={active:0,interactions:0};
  const mix=THREE.MathUtils.lerp,smooth=THREE.MathUtils.smoothstep;
  let interacting=null,companion=null,trail=[],lastTrace=null,followingStride=false;
  for(const a of agents){a.pose='walk';a.elapsed=0;a.remaining=2+a.id*1.39%8;a.emote=0;a.touch=new THREE.Vector3()}
  function turn(a,yaw,dt){a.yaw+=Math.atan2(Math.sin(yaw-a.yaw),Math.cos(yaw-a.yaw))*Math.min(1,dt*8)}
  function setPose(a,pose,length){a.pose=pose;a.elapsed=0;a.remaining=length}
  function nearest(player){let best=null,limit=2.1;for(const a of agents){const d=Math.hypot(a.x-player.x,a.z-player.z);if(d<limit&&Math.abs(a.y-player.y)<.9){limit=d;best=a}}return best}
  function interact(a,kind,player){if(interacting||!a||nearest(player)!==a||!['pet','play'].includes(kind))return false;setPose(a,kind==='pet'?'pet':'play',kind==='pet'?4:5);interacting=a;stats.interactions++;return true}
  function cancel(){if(interacting){setPose(interacting,'walk',4);interacting=null}}
  function positionOf(actor){return{x:actor.x,y:actor.y,z:actor.z};}
  function horizontal(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
  function follow(a,player){
    if(companion||!a||nearest(player)!==a||horizontal(a,player)>1.55)return false;
    cancel();companion=a;trail=[positionOf(player)];lastTrace=positionOf(player);followingStride=false;
    setPose(a,'wag',40);return true;
  }
  function release(){
    if(!companion)return false;
    if(interacting===companion)cancel();
    const a=companion;
    if(!a.route.some(p=>horizontal(a,p)<2)){
      a.route=[positionOf(a),...trail.filter(p=>horizontal(a,p)<4).slice(0,5)];a.index=Math.min(1,a.route.length-1);a.direction=1;
    }
    setPose(a,'wag',3);a.blocked=0;companion=null;trail=[];lastTrace=null;followingStride=false;
    return true;
  }
  function settleNear(a,player,facing){
    const start=facing;
    for(const d of [2.15,1.8,1.35])for(const bias of [Math.PI+.45,Math.PI-.45,Math.PI,1.55,-1.55,0]){
      const angle=start+bias,x=player.x+Math.sin(angle)*d,z=player.z+Math.cos(angle)*d,y=world.walkHeight(x,z);
      if(!Number.isFinite(y)||Math.abs(y-player.y)>.92||world.physics.collides(x,y,z))continue;
      Object.assign(a,{x,y,z,yaw:Math.atan2(player.x-x,player.z-z),blocked:0});return true;
    }
    return false;
  }
  function updateCompanion(a,player,dt,facing){
    if(!lastTrace||horizontal(lastTrace,player)>8.5||Math.abs(lastTrace.y-player.y)>2.8){
      if(!settleNear(a,player,facing)){lastTrace=null;return;}
      trail=[positionOf(player)];lastTrace=positionOf(player);followingStride=false;
    }
    const recent=trail.at(-1);
    if(horizontal(recent,player)>.54){trail.push(positionOf(player));if(trail.length>48)trail.shift();}
    lastTrace.x=player.x;lastTrace.y=player.y;lastTrace.z=player.z;
    const distance=horizontal(a,player);
    followingStride=distance>(followingStride?1.33:1.70);
    if(!followingStride){
      if(a.pose!=='wag'||a.remaining<.5)setPose(a,'wag',40);
      turn(a,Math.atan2(player.x-a.x,player.z-a.z),dt*.65);return;
    }
    while(trail.length>1&&horizontal(trail[0],a)<.61)trail.shift();
    const aim=trail.length===1?player:trail[0],next=trail[1]||player;
    const direction=horizontal(aim,next)>.25?Math.atan2(next.x-aim.x,next.z-aim.z):facing;
    const side=a.id%2 ? -.44 : .44;
    const sx=aim.x+Math.cos(direction)*side,sz=aim.z-Math.sin(direction)*side,sy=world.walkHeight(sx,sz);
    const clear=Number.isFinite(sy)&&Math.abs(sy-aim.y)<.42&&!world.physics.collides(sx,sy,sz);
    const dx=(clear?sx:aim.x)-a.x,dz=(clear?sz:aim.z)-a.z,length=Math.hypot(dx,dz);
    if(length<.04)return;
    const step=Math.min(length,dt*THREE.MathUtils.clamp(distance*1.34,1.55,7.0)),oldX=a.x,oldZ=a.z;
    world.physics.move(a,dx*step/length,dz*step/length,world.walkHeight);
    const moved=Math.hypot(a.x-oldX,a.z-oldZ);
    if(moved>.002){
      if(a.pose!=='walk')setPose(a,'walk',40);
      a.phase+=moved*11;a.distance+=moved;a.blocked=0;
      turn(a,Math.atan2(a.x-oldX,a.z-oldZ),dt);
    }else{
      a.blocked+=dt;
      if(a.blocked>1.05&&trail.length>1){trail.shift();a.blocked=0;}
      else if(distance>12&&a.blocked>2.7)lastTrace=null;
      if(a.pose!=='wag')setPose(a,'wag',40);
    }
  }
  const poseMatrix=new THREE.Matrix4(),bodyScale=new THREE.Vector3(1,1,.75);
  function keepPawsAboveGround(index,ground){
    let lowest=Infinity;
    const parts=[[bodies,index],[heads,index],[tails,index],...Array.from({length:4},(_,leg)=>[legs,index*4+leg])];
    for(const [mesh,slot] of parts){
      mesh.getMatrixAt(slot,poseMatrix);const m=poseMatrix.elements,p=mesh.geometry.attributes.position;
      for(let j=0;j<p.count;j++)lowest=Math.min(lowest,m[1]*p.getX(j)+m[5]*p.getY(j)+m[9]*p.getZ(j)+m[13]);
    }
    const correction=ground+.013-lowest;
    if(Math.abs(correction)<.004)return;
    for(const [mesh,slot] of [...parts,[eyes,index],[squints,index],[mouths,index]]){
      mesh.getMatrixAt(slot,poseMatrix);poseMatrix.elements[13]+=correction;mesh.setMatrixAt(slot,poseMatrix);
    }
  }
  function draw(time,player,enabled){let shown=0;for(const fox of agents){if(!enabled||player&&Math.hypot(fox.x-player.x,fox.z-player.z)>85)continue;const i=shown++;
    const a=fox,p=a.pose,t=a.elapsed,w=smooth(t,0,.5)*smooth(a.remaining,0,.45);
    const nap=p==='sleep'?w:0,bow=p==='stretch'?w:0,roll=p==='roll'?w:0,sit=['pet','wag','yawn','nuzzle'].includes(p)?w:0;
    const play=p==='play'?w:0,hop=play*.17*Math.max(0,Math.sin(t*7)),yawn=p==='yawn'?w:0;
    const closed=nap+sit+bow+roll>.35||Math.sin(time*1.6+a.id*2)>.994;
    dummy.position.set(a.x,a.y+.034,a.z);dummy.rotation.set(0,a.yaw,0);dummy.scale.setScalar(a.scale);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);
    dummy.position.y+=a.scale*(hop-nap*.14+roll*.23);dummy.rotation.set(bow*.27-sit*.14-roll*.08,a.yaw,roll*2.87,'YXZ');dummy.updateMatrix();root.copy(dummy.matrix);local.copy(root).scale(bodyScale);bodies.setMatrixAt(i,local);
    const nuzzle=p==='nuzzle'?w:0;
    joint.position.set(sit*.042*Math.sin(t*3)+nuzzle*.065*Math.sin(t*4)+nap*.09,.54-nap*.305-bow*.13-roll*.30,.27+nuzzle*.075-nap*.07);joint.rotation.set(-.57*yawn+.23*bow+nap*.18-roll*.42,sit*.08*Math.sin(t*4)-nap*.68,.17*sit*Math.sin(t*3)+roll*1.15+nuzzle*.27+nap*.28);joint.scale.setScalar(1.11);joint.updateMatrix();local.multiplyMatrices(root,joint.matrix);heads.setMatrixAt(i,local);
    a.touch.set(0,.42,.09).applyMatrix4(local);eyes.setMatrixAt(i,closed?hide:local);squints.setMatrixAt(i,closed?local:hide);mouths.setMatrixAt(i,(p==='yawn'||p==='play'||p==='roll')&&w>.35?local:hide);
    joint.position.set(nap*.15,.46-nap*.16-roll*.22,-.29+nap*.13);joint.rotation.set(.35-nap*.43-roll*.78,Math.sin(time*(sit||play?7:2)+a.phase)*(.22+sit*.45+play*.44)*(1-nap)+nap*1.95,nap*.28);joint.scale.setScalar(1);joint.updateMatrix();local.multiplyMatrices(root,joint.matrix);tails.setMatrixAt(i,local);
    for(let k=0;k<4;k++){const side=k%2?1:-1,front=k<2?1:-1,stride=p==='walk'?Math.sin(a.phase+(k===0||k===3?0:Math.PI))*.34:0;joint.position.set(side*(.145-nap*.025),.322+(front<0?-sit*.052:0)-nap*.055,front*.195+bow*.10-nap*.05);joint.rotation.set(stride+bow*(front>0?-1.06:.2)+nap*(front>0?-1.45:1.45)+roll*.56*Math.sin(t*6+k)+play*.20*Math.sin(t*7+k),0,0);joint.updateMatrix();local.multiplyMatrices(root,joint.matrix);legs.setMatrixAt(i*4+k,local);}
    if(roll||bow||nap)keepPawsAboveGround(i,a.y);
  }for(const m of [...meshes,shadows]){m.count=m===legs?shown*4:shown;if(shown)m.instanceMatrix.needsUpdate=true}stats.rendered=shown;}
  function update(dt,time,player,reduced=false,enabled=true,facing=0){
    stats.active=0;if(!enabled){draw(time,player,false);for(const sprite of hearts)sprite.visible=false;return}
    for(const a of agents){
      if(a!==companion&&Math.hypot(a.x-player.x,a.z-player.z)>100)continue;
      stats.active++;a.elapsed+=dt;a.remaining-=dt;
      if(a===interacting){if(a.remaining<=0||Math.hypot(a.x-player.x,a.z-player.z)>2.8){cancel();continue}turn(a,Math.atan2(player.x-a.x,player.z-a.z),dt);continue}
      if(a===companion){updateCompanion(a,player,dt,facing);continue;}
      if(a.remaining<=0){if(a.pose==='walk'){const pose=moods[(a.id+a.emote++*5)%moods.length];setPose(a,pose,pose==='sleep'?7:2.6+a.id%4*.33)}else setPose(a,'walk',4+a.id%5)}
      if(reduced||a.pose!=='walk')continue;
      let target=a.route[a.index],dx=target.x-a.x,dz=target.z-a.z,len=Math.hypot(dx,dz);
      if(len<.3){a.index+=a.direction;if(a.index>=a.route.length||a.index<0){a.direction*=-1;a.index=Math.max(0,Math.min(a.route.length-1,a.index+2*a.direction));}target=a.route[a.index];dx=target.x-a.x;dz=target.z-a.z;len=Math.hypot(dx,dz);}
      const oldX=a.x,oldZ=a.z,nearPlayer=Math.hypot(a.x-player.x,a.z-player.z),speed=nearPlayer<.8?0:a.speed;
      if(len>.001)world.physics.move(a,dx/len*speed*dt,dz/len*speed*dt,world.walkHeight);
      const moved=Math.hypot(a.x-oldX,a.z-oldZ);a.distance+=moved;a.phase+=moved*10;a.blocked=moved<.001&&speed>0?a.blocked+dt:0;
      if(moved>.001){const yaw=Math.atan2(a.x-oldX,a.z-oldZ),diff=THREE.MathUtils.euclideanModulo(yaw-a.yaw+Math.PI,Math.PI*2)-Math.PI;a.yaw+=diff*Math.min(1,dt*6);}
      if(a.blocked>1.2){a.direction*=-1;a.index=Math.max(0,Math.min(a.route.length-1,a.index+2*a.direction));a.blocked=0;}
    }
    draw(time,player,true);
    for(const [i,sprite] of hearts.entries()){
      const a=interacting,age=a?.elapsed-.35-i*.32;
      sprite.visible=!!a&&!reduced&&age>=0&&age<2.3;
      if(!sprite.visible)continue;
      const size=(.17+i*.036)*smooth(age,0,.24)*(1-smooth(age,1.65,2.3));
      sprite.scale.set(size,size,1);sprite.material.opacity=1-smooth(age,1.65,2.3);
      sprite.position.copy(a.touch).addScaledVector(THREE.Object3D.DEFAULT_UP,.19+age*.24);sprite.position.x+=(i-1)*.22+Math.sin(age*3+i)*.065;
    }
  }
  draw(0,null,false);return{agents,meshes:[...meshes,shadows],count:agents.length,update,nearest,interact,cancel,follow,release,stats,get companion(){return companion},get interacting(){return interacting}};
}
