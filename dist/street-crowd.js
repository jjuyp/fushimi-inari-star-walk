import * as T from'three';
import{createChibiPeople}from'./chibi-people.js';
import{DISTRICT}from'./district-data.js';
import{pathSamples}from'./geography.js';
import{yieldToUI}from'./asset-queue.js';

export const CROWD_MOTION_SETS=[
 {id:'stroll',name:'散步與觀景',poses:['idle','wave','map','walk']},
 {id:'photo',name:'拍照與留念',poses:['photo','phone','map','idle']},
 {id:'respect',name:'參拜與問候',poses:['pray','bow','idle','wave']},
 {id:'market',name:'逛街與交流',poses:['point','chat','bag','idle']}
];
export function createStreetLife(scene,world){
 const group=new T.Group();group.name='原創・花和服と帽子の小さな旅人';scene.add(group);const actors=[],routes=DISTRICT.routes.map(r=>pathSamples(r.p,1.5));let factory=null,pending=null,clock=0,lastAssign=-10;
 const stats={modelsLoaded:0,active:0,paused:true,modelStyle:'original-chibi-rig',downloadBytes:0,textureMiB:0,geometryMiB:0,motionSets:4,decisions:0,routeChanges:0,avoidances:0,states:{},updates:0};
 const seed=new Uint32Array(1);crypto.getRandomValues(seed);let randomState=seed[0]||49171;function random(){randomState^=randomState<<13;randomState^=randomState>>>17;randomState^=randomState<<5;return(randomState>>>0)/4294967296}
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,4,32,32,31);gradient.addColorStop(0,'rgba(38,33,23,.46)');gradient.addColorStop(1,'rgba(38,33,23,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const shadowTexture=new T.CanvasTexture(shadowCanvas),shadows=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),32),matrix=new T.Object3D();shadows.frustumCulled=false;group.add(shadows);shadows.count=0;
 function safePoint(route,index,lane){for(let step=0;step<route.length;step++){const p=route[(index+step)%route.length];for(const offset of[lane,0,-lane]){const x=p.x-p.dz*offset,z=p.z+p.dx*offset,y=world.walkHeight(x,z);if(Number.isFinite(y)&&!world.physics.collides(x,y,z)&&actors.every(a=>a.vendor||Math.hypot(a.x-x,a.z-z)>.9))return{x,y,z,index:(index+step)%route.length}}}return world.safePlace('entrance')}
 async function load(){if(pending)return pending;if(factory)return;pending=(async()=>{await yieldToUI();factory=createChibiPeople();await yieldToUI();for(let i=0;i<32;i++){const vendor=i<14,variant=vendor?i%2:i%4,avatar=factory.create(variant),routeIndex=i%routes.length,route=routes[routeIndex],lane=(random()-.5)*3.9,index=Math.floor(random()*(route.length-1)),p=safePoint(route,index,lane),a={id:i,root:avatar.root,avatar,vendor,variant,routeIndex,route,index:p.index||0,dir:random()<.5?-1:1,lane,speed:.5+random()*.42,x:p.x,y:p.y,z:p.z,phase:random()*6.28,state:vendor?'idle':'walk',remaining:2+random()*7,elapsed:0,setIndex:i%4,site:null,stuck:0,moves:0,decisions:0,forced:false};group.add(a.root);a.root.position.set(a.x,a.y,a.z);actors.push(a)}stats.modelsLoaded=4;stats.textureMiB=256*256*4*4/3/1048576;stats.geometryMiB=factory.templates.reduce((n,t)=>n+Object.values(t.geometry.attributes).reduce((s,a)=>s+a.array.byteLength,0)+(t.geometry.index?.array.byteLength||0),0)/1048576;stats.triangles=factory.templates.map(t=>t.triangles);})().finally(()=>pending=null);return pending}
 function decide(a,pose=null,duration=null){const set=CROWD_MOTION_SETS[a.setIndex];if(pose)a.state=pose;else if(a.vendor)a.state=['idle','wave','chat','point','bow'][Math.floor(random()*5)];else if(a.state!=='walk'&&random()<.73)a.state='walk';else a.state=set.poses[Math.floor(random()*set.poses.length)];a.remaining=duration|| (a.state==='walk'?3+random()*10:2.8+random()*4);a.elapsed=0;a.speed=.5+random()*.5;a.decisions++;stats.decisions++;a.aim=null;if(!a.vendor){if(a.state==='point'){const near=world.market?.sites.filter(s=>Math.hypot(s.source.x-a.x,s.source.z-a.z)<12).sort((s,t)=>Math.hypot(s.source.x-a.x,s.source.z-a.z)-Math.hypot(t.source.x-a.x,t.source.z-a.z))[0];if(near)a.aim={x:near.source.x,z:near.source.z}}else if(['photo','pray','bow'].includes(a.state))a.aim=world.places.gate}}
 function assignVendors(player){const near=world.district.stallSites.filter(s=>Math.hypot(s.x-player.x,s.z-player.z)<85).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z)).slice(0,14),claimed=new Set();for(const a of actors.filter(a=>a.vendor)){if(a.site&&!near.includes(a.site))a.site=null;if(a.site)claimed.add(a.site)}for(const a of actors.filter(a=>a.vendor&&!a.site)){a.site=near.find(s=>!claimed.has(s));if(a.site)claimed.add(a.site)}}
 function turn(a,angle,dt){a.root.rotation.y+=Math.atan2(Math.sin(angle-a.root.rotation.y),Math.cos(angle-a.root.rotation.y))*Math.min(1,dt*6)}
 function chooseVisit(a,time){
  a.visitAfter=time+14+random()*19;
  const candidates=[];
  for(const site of world.market?.sites||[]){
   if(!site.approachRoute?.length||actors.some(c=>c.visit?.site===site))continue;
   const [x,y,z]=site.approachRoute[0],distance=Math.hypot(x-a.x,z-a.z);
   if(distance<.55||distance>7||Math.hypot(site.x-a.x,site.z-a.z)<1.2)continue;
   const steps=Math.ceil(distance/.35);let clear=true;
   for(let i=1;i<=steps;i++){const xx=T.MathUtils.lerp(a.x,x,i/steps),zz=T.MathUtils.lerp(a.z,z,i/steps),yy=world.walkHeight(xx,zz);if(!Number.isFinite(yy)||world.physics.collides(xx,yy,zz)){clear=false;break}}
   if(clear)candidates.push({site,cost:distance+site.approachRoute.length*.45+random()*2.5});
  }
  if(!candidates.length)return false;
  const {site}=candidates.sort((x,y)=>x.cost-y.cost)[0];
  a.visit={site,points:site.approachRoute,step:0,returning:false,stepping:true,blocked:0};
  decide(a,'walk',60);return true;
 }
 function walk(a,dt,player){const visit=a.visit,p=a.route[a.index],destination=visit?.points[visit.step];let x=destination?.[0]??p.x-p.dz*a.lane,z=destination?.[2]??p.z+p.dx*a.lane,dx=x-a.x,dz=z-a.z,len=Math.hypot(dx,dz);
  if(visit&&len<.38){visit.step+=visit.returning?-1:1;if(visit.returning&&visit.step<0){a.visit=null;decide(a,'walk',5+random()*7)}else if(!visit.returning&&visit.step>=visit.points.length){visit.stepping=false;decide(a,random()<.5?'point':'chat',6+random()*7);a.aim=visit.site.source;stats.marketVisits=(stats.marketVisits||0)+1}return 0}
  if(len<.35){a.index+=a.dir;if(a.index<0||a.index>=a.route.length){a.dir*=-1;a.index=T.MathUtils.clamp(a.index+a.dir*2,0,a.route.length-1);decide(a,'idle',1.5+random()*2)}
   if(random()<.3){const choices=[];for(let r=0;r<routes.length;r++)if(r!==a.routeIndex)for(let i=0;i<routes[r].length;i++)if(Math.hypot(routes[r][i].x-a.x,routes[r][i].z-a.z)<2)choices.push({r,i});if(choices.length){const c=choices[Math.floor(random()*choices.length)];a.routeIndex=c.r;a.route=routes[c.r];a.index=c.i;a.dir=random()<.5?-1:1;stats.routeChanges++}}
   return 0;
  }
  dx/=len;dz/=len;let wait=false;
  for(let i=0;i<=actors.length;i++){const other=i===actors.length?player:actors[i];if(other===a||i<actors.length&&(other.vendor||!other.root.visible))continue;const ox=a.x-other.x,oz=a.z-other.z,d=Math.hypot(ox,oz);if(d>.001&&d<1.15){const strength=(1.15-d)*3;dx+=(ox+oz*.65)/d*strength;dz+=(oz-ox*.65)/d*strength;stats.avoidances++;if(i===actors.length&&d<.85){dx=ox/d;dz=oz/d}if(d<.34)wait=true}}
  if(wait){if(visit&&((visit.blocked+=dt)>2)){a.visit=null;decide(a,'idle',2)}else if(!visit&&a.remaining>1.4)a.remaining=1.4;return 0}const norm=Math.hypot(dx,dz);if(norm<.001)return 0;dx/=norm;dz/=norm;const beforeX=a.x,beforeZ=a.z;world.physics.move(a,dx*dt*a.speed,dz*dt*a.speed,world.walkHeight);const distance=Math.hypot(a.x-beforeX,a.z-beforeZ);if(distance<.003){a.stuck+=dt;if(a.stuck>1.1){a.visit=null;a.dir*=-1;a.lane*=-1;a.index=T.MathUtils.clamp(a.index+a.dir*2,0,a.route.length-1);decide(a,'map',2+random()*2);a.stuck=0}}else{if(visit)visit.blocked=0;a.stuck=0;turn(a,Math.atan2(dx,dz),dt);a.phase+=distance*9;a.moves++}return distance;
 }
 function update(dt,time,player,reduced,enabled=true){clock=time;const nearTown=enabled&&player.x<70&&player.x>-600;group.visible=nearTown;stats.paused=!nearTown;if(!nearTown){stats.active=0;return}if(!factory){load();return}stats.updates++;if(time-lastAssign>.8){lastAssign=time;assignVendors(player)}let active=0,shadowCount=0;const states={};
  for(const a of actors){if(a.vendor){a.root.visible=!!a.site;if(!a.site)continue;a.x=a.site.x-Math.sin(a.site.angle)*1.22;a.z=a.site.z-Math.cos(a.site.angle)*1.22;a.y=world.walkHeight(a.x,a.z);if(!Number.isFinite(a.y))a.y=a.site.y;turn(a,a.site.angle,dt)}else a.root.visible=Math.hypot(a.x-player.x,a.z-player.z)<100;
   if(!a.root.visible)continue;if(a.aim)turn(a,Math.atan2(a.aim.x-a.x,a.aim.z-a.z),dt);active++;a.remaining-=dt;a.elapsed+=dt;
   if(!a.vendor&&!a.visit&&!reduced){a.visitAfter??=time+1+random()*8;if(time>=a.visitAfter)chooseVisit(a,time)}
   if(a.remaining<=0){if(a.visit&&!a.visit.stepping){a.visit.stepping=true;a.visit.returning=true;a.visit.step=a.visit.points.length-1;decide(a,'walk',60)}else{a.visit=null;decide(a)}}
   let pose=a.vendor&&a.state==='point'?'serve':a.state;if(pose==='walk'&&!a.vendor){const distance=reduced?0:walk(a,dt,player);if(distance<.0001)pose='idle'}
   // No visible oscillation when motion reduction is requested, but retain each
   // person's independent state and posture rather than reverting to an A-pose.
   a.root.position.set(a.x,a.y+.008,a.z);const ease=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t)},amount=pose==='bow'?Math.sin(Math.PI*T.MathUtils.clamp(a.elapsed/Math.min(3,a.elapsed+a.remaining),0,1)):!['walk','idle'].includes(pose)?ease(a.elapsed/.85)*ease(a.remaining/.6):1;a.avatar.pose(pose,reduced?a.id:time+a.id*1.73,a.phase,amount,reduced?1:1-Math.exp(-dt*9));states[pose]=(states[pose]||0)+1;
   if(!a.shadowNormal||time>(a.shadowNext||0)){a.shadowNormal||=new T.Vector3();const step=.18,gx=(world.walkHeight(a.x+step,a.z)-world.walkHeight(a.x-step,a.z))/(step*2),gz=(world.walkHeight(a.x,a.z+step)-world.walkHeight(a.x,a.z-step))/(step*2);a.shadowNormal.set(Number.isFinite(gx)?-gx:0,1,Number.isFinite(gz)?-gz:0).normalize();a.shadowNext=time+.3}matrix.position.set(a.x,a.y+.025,a.z);matrix.quaternion.setFromUnitVectors(T.Object3D.DEFAULT_UP,a.shadowNormal);matrix.rotateX(-Math.PI/2);matrix.scale.set(.9,.68,1);matrix.updateMatrix();shadows.setMatrixAt(shadowCount++,matrix.matrix);
  }shadows.count=shadowCount;shadows.instanceMatrix.needsUpdate=true;stats.active=active;stats.states=states;
 }
 const playerMotion={x:0,z:0};function avoidPlayer(player,dx,dz){playerMotion.x=dx;playerMotion.z=dz;if(!group.visible)return playerMotion;const length=Math.hypot(dx,dz);for(const a of actors){if(a.vendor||!a.root.visible||Math.abs(a.y-player.y)>1.2)continue;const ox=player.x-a.x,oz=player.z-a.z,d=Math.hypot(ox,oz),next=Math.hypot(ox+playerMotion.x,oz+playerMotion.z);if(next>=.8||next>=d||d<.001)continue;const nx=ox/d,nz=oz/d,dot=playerMotion.x*nx+playerMotion.z*nz;if(dot<0){playerMotion.x-=nx*dot;playerMotion.z-=nz*dot;if(Math.hypot(playerMotion.x,playerMotion.z)<length*.15){playerMotion.x=-nz*length*.7;playerMotion.z=nx*length*.7}stats.playerYields=(stats.playerYields||0)+1}}return playerMotion}
 return{group,actors,stats,prefetch:load,update,avoidPlayer,motionSets:CROWD_MOTION_SETS,perform(index,pose,duration=4){const a=actors[index];if(!a)return false;a.visit=null;a.visitAfter=clock+duration+2;decide(a,pose,duration);return true},reactToSale(site){const a=actors.find(a=>a.vendor&&a.site?.id===site);if(a)decide(a,'point',2.5)},get factory(){return factory}};
}
