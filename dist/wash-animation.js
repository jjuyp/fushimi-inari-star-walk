import * as THREE from 'three';

// Small articulated rig reuses primitive geometry and the avatar's gold material.
export function createWashAnimation({player,avatar,site,ladle,world}){
 const rig=new THREE.Group();rig.name='小星星・手水動作';player.add(rig);rig.visible=false;
 const gold=avatar.body.children[0].material,ball=new THREE.SphereGeometry(1,16,10),tube=new THREE.CylinderGeometry(1,1,1,10);
 const v=(x,y,z)=>new THREE.Vector3(x,y,z),up=v(0,1,0),forward=v(0,0,1),arms=[];
 function mesh(g,geo,material,scale){const m=new THREE.Mesh(geo,material);m.scale.copy(scale);g.add(m);return m;}
 for(const side of [-1,1]){const upper=mesh(rig,tube,gold,v(.055,1,.055)),lower=mesh(rig,tube,gold,v(.05,1,.05)),elbow=mesh(rig,ball,gold,v(.065,.065,.065)),palm=mesh(rig,ball,gold,v(.115,.065,.14));palm.name=side<0?'左手掌':'右手掌';arms.push({side,upper,lower,elbow,palm});}
 const streamRoot=new THREE.Group();streamRoot.name='手水・杓水與掌心水滴';site.group.add(streamRoot);streamRoot.visible=false;
 const waterMat=new THREE.MeshBasicMaterial({color:'#b4e5ed',transparent:true,opacity:.74,depthWrite:false}),stream=mesh(streamRoot,tube,waterMat,v(.018,1,.018));
 const drops=[];for(let i=0;i<14;i++)drops.push(mesh(streamRoot,ball,waterMat,v(.014,.034,.014)));
 const rest={position:ladle.position.clone(),quaternion:ladle.quaternion.clone()},left=v(-.24,1.18,.79),right=v(.32,1.28,.45),leftHand=left.clone(),rightHand=right.clone(),bowl=v(-.2,1.48,.8),direction=new THREE.Vector3(),grip=new THREE.Vector3(),localBowl=new THREE.Vector3();
 let active=false,hiddenHeld=[],elapsed=0;
 const stats={active:false,phase:null,flow:false,handedness:'right',elapsed:0};
 const cameraOffset=v(4.7,1.55,-.42),focus=v(site.x,site.y+1.0,site.z+.92);
 const framingCamera=new THREE.PerspectiveCamera(),ray=new THREE.Vector3(),end=new THREE.Vector3(),projected=new THREE.Vector3();
 let frameKey='',frameResult=cameraOffset.clone();
 function framing(aspect,fov){
  const key=aspect.toFixed(3)+':'+fov;if(key===frameKey)return frameResult;frameKey=key;
  const portrait=aspect<.8,star=player.position;
  const subjects=[v(star.x,star.y+.18,star.z),v(star.x-.61,star.y+.95,star.z),v(star.x+.61,star.y+.95,star.z),v(star.x,star.y+1.65,star.z),v(site.x,site.y+1.55,site.z+.83),v(site.x-.96,site.y+1.24,site.z-.42),v(site.x+.96,site.y+1.24,site.z+.44)];
  framingCamera.aspect=aspect;framingCamera.fov=fov;framingCamera.updateProjectionMatrix();
  let best=-Infinity;
  for(const distance of portrait?[6.4,7.2,8.1,8.8]:[4.6,5.15,5.7])for(const angle of [1.27,-1.27,1.52,-1.52,1.08,-1.08,1.78,-1.78,.9,-.9])for(const rise of portrait?[1.6,2.25]:[1.45,1.8]){
   end.copy(focus).add(v(Math.sin(angle)*distance,rise,Math.cos(angle)*distance));
   const ground=world.walkHeight(end.x,end.z);if(!Number.isFinite(ground)||end.y<ground+.7)continue;
   ray.copy(end).sub(focus);const full=ray.length();if(world.physics.cameraDistance(focus,ray.normalize(),full)<full-.06)continue;
   framingCamera.position.copy(end);framingCamera.lookAt(focus);framingCamera.updateMatrixWorld();
   let visibility=0,overflow=0;
   for(const [i,p] of subjects.entries()){
    ray.copy(end).sub(p);const len=ray.length();if(world.physics.cameraDistance(p,ray.normalize(),len)>=len-.08)visibility+=(i<5?4:1);
    projected.copy(p).project(framingCamera);overflow+=Math.max(0,Math.abs(projected.x)-(portrait?.71:.8))*4+Math.max(0,Math.abs(projected.y)-.76)*3;
   }
   const front=THREE.MathUtils.clamp((star.z-end.z)/distance,-.65,.65);
   const score=visibility-overflow*5+front*1.65-distance*.18;
   if(score>best){best=score;frameResult.copy(end).sub(focus)}
  }
  if(active)player.rotation.y=Math.PI-Math.sign(frameResult.x)*.26;
  return frameResult;
 }
 let reach=0;
 function link(m,a,b,r){m.position.copy(a).add(b).multiplyScalar(.5);direction.copy(b).sub(a);m.scale.set(r,direction.length(),r);m.quaternion.setFromUnitVectors(up,direction.normalize());}
 function poseArm(a,hand){const shoulder=v(a.side*.47,.96,.08),elbow=v(a.side*.56,(hand.y+.96)*.5-.06,hand.z*.48);link(a.upper,shoulder,elbow,.055);link(a.lower,elbow,hand,.05);a.elbow.position.copy(elbow);a.palm.position.copy(hand);a.palm.rotation.set(-.14,0,a.side*.15);}
 function toSite(point){player.updateMatrixWorld(true);site.group.updateMatrixWorld(true);return site.group.worldToLocal(player.localToWorld(point.clone()));}
 function begin(){let stand=null;for(const distance of [1.92,1.82,2.02,1.7])for(const x of [0,.20,-.20]){const y=world.walkHeight(site.x+x,site.z+distance);if(!stand&&Number.isFinite(y)&&!world.physics.collides(site.x+x,y,site.z+distance))stand=v(site.x+x,y,site.z+distance);}if(!stand)return false;
  reach=Math.max(0,stand.z-site.z-1.52);frameKey='';frameResult.copy(cameraOffset);player.position.copy(stand);player.rotation.y=Math.PI;player.visible=true;avatar.body.scale.setScalar(1);avatar.feet.forEach(f=>f.visible=true);
  hiddenHeld=player.children.filter(o=>o!==avatar.body&&o!==rig&&!avatar.feet.includes(o)&&o.visible);hiddenHeld.forEach(o=>o.visible=false);
  active=true;rig.visible=true;document.body.classList.add('washing-scene');elapsed=0;Object.assign(stats,{active:true,phase:'left',flow:false,elapsed:0});
  // Pick a side view that clears the pavilion posts and roof before moving the camera.
  for(const candidate of [v(4.7,1.55,-.42),v(-4.7,1.55,-.42),v(4.35,1.7,.5),v(-4.35,1.7,.5)]){const end=focus.clone().add(candidate),blocked=world.physics.near(end.x,end.z).some(b=>world.physics.penetration(b,end.x,end.y-.23,end.z,.23,.46));if(!blocked&&end.y>world.walkHeight(end.x,end.z)+.35){cameraOffset.copy(candidate);break;}}
  update(0);return true;
 }
 function update(t){if(!active)return;elapsed=t;stats.elapsed=+t.toFixed(3);const stage=Math.min(3,Math.floor(t/3)),u=(t%3)/3,smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
  leftHand.copy(left);rightHand.copy(right);let holder=1,flow=true;
  if(stage===0){stats.phase='left';if(t<1.35){const scoop=smooth(t/1.35);rightHand.set(.3,1.12+Math.sin(scoop*Math.PI)*.09,.55+.1*Math.sin(scoop*Math.PI));flow=false;}else leftHand.y+=Math.sin(t*7)*.025;}
  if(stage===1){stats.phase='right';holder=0;const transfer=smooth(u/.2);leftHand.lerp(v(-.32,1.28,.45),transfer);rightHand.lerp(v(.24,1.18,.79),transfer);flow=u>.23;}
  if(stage===2){stats.phase='mouth';const cup=smooth((u-.3)/.35);leftHand.lerp(v(-.08,.96,.4),cup);rightHand.lerp(v(.38,1.25,.44),cup);flow=u<.3;}
  if(stage===3){stats.phase=u<.45?'left-final':u<.8?'handle':'return';leftHand.y+=Math.sin(t*7)*.02;flow=u<.78;}
  leftHand.z+=reach*(stage===2&&u>.3?.13:.62);rightHand.z+=reach*.55;
  poseArm(arms[0],leftHand);poseArm(arms[1],rightHand);grip.copy(holder?rightHand:leftHand);const receiving=holder?leftHand:rightHand;
  bowl.copy(receiving).add(v(holder?.02:-.02,.25,.03));if(stage===0&&t<1.35){const q=smooth(t/1.35);bowl.set(.03,1.42-Math.sin(q*Math.PI)*.46,1.12+reach);}
  if(stage===2&&u>.3)bowl.set(.28,1.38,.88);
  if(stage===3&&u>=.45){bowl.set(.1,1.87,.65);grip.set(.1,1.1,.65);leftHand.set(-.02,1.12,.65);rightHand.set(.15,1.28,.65);poseArm(arms[0],leftHand);poseArm(arms[1],rightHand);}
  localBowl.copy(toSite(bowl));ladle.position.copy(localBowl);direction.copy(toSite(grip)).sub(localBowl).normalize();ladle.quaternion.setFromUnitVectors(forward,direction);
  if(stage===0&&t<.45){const q=smooth(t/.45);ladle.position.lerpVectors(rest.position,localBowl,q);ladle.quaternion.slerpQuaternions(rest.quaternion,ladle.quaternion.clone(),q);}
  if(stage===3&&u>.8){const q=smooth((u-.8)/.2);ladle.position.lerp(rest.position,q);ladle.quaternion.slerp(rest.quaternion,q);leftHand.lerp(v(-.45,.83,.22),q);rightHand.lerp(v(.45,.83,.22),q);poseArm(arms[0],leftHand);poseArm(arms[1],rightHand);}
  streamRoot.visible=flow;stats.flow=flow;stats.handedness=holder?'right':'left';
  if(flow){const source=ladle.position.clone().add(v(0,.02,0)),destination=toSite(stage===3&&u>=.45?v(.1,1.1,.65):receiving);link(stream,source,destination,.016);for(let i=0;i<drops.length;i++){const f=(t*2.5+i/drops.length)%1;drops[i].position.copy(destination);drops[i].position.x+=Math.sin(i*2.4)*.1*f;drops[i].position.z+=Math.cos(i*2.4)*.08*f;drops[i].position.y-=f*.45;}}
  avatar.body.rotation.x=.1+Math.sin(t*2)*.012;
 }
 function reset(){active=false;document.body.classList.remove('washing-scene');rig.visible=streamRoot.visible=false;ladle.position.copy(rest.position);ladle.quaternion.copy(rest.quaternion);avatar.body.rotation.x=0;hiddenHeld.forEach(o=>o.visible=true);hiddenHeld=[];Object.assign(stats,{active:false,phase:null,flow:false});}
 return{begin,update,reset,rig,streamRoot,stats,cameraOffset,focus,framing};
}
