import * as THREE from 'three';
import {terrainHeight} from './geography.js';
// Sweep the boom through actual wall/roof profiles and ground, then search a
// safe orbit arc. Steep stairs need a sloped boom, not a horizontal zoom-in.
export function createCameraRig(physics){
 const direction=new THREE.Vector3(),candidate=new THREE.Vector3(),best=new THREE.Vector3();
 const offsets=[0,.18,-.18,.4,-.4,.7,-.7,1.05,-1.05,1.57,-1.57,2.1,-2.1,Math.PI];
 let previousYaw=null,lastKey=null,lastTarget=new THREE.Vector3(Infinity,0,0),lastResult=null;
 function solve(target,yaw,pitch,distance,tunnel=false){
  const dynamic=physics.dynamicBodies.some(b=>Math.hypot(b.x-target.x,b.z-target.z)<25)?physics.revision:0,key=[yaw,pitch,distance,tunnel,dynamic].join(':');
  if(key===lastKey&&lastTarget.distanceToSquared(target)<.0001&&lastResult)return lastResult;lastKey=key;lastTarget.copy(target);
  const min=2.8,wanted=Math.max(min,distance);let score=-Infinity,bestYaw=yaw,bestDistance=0;
  function probe(a,p,turn){
   direction.set(Math.sin(a)*Math.cos(p),Math.sin(p),Math.cos(a)*Math.cos(p)).normalize();let d=physics.cameraDistance(target,direction,wanted);
   for(let t=.5;t<d;t+=.25){const x=target.x+direction.x*t,z=target.z+direction.z*t;if(target.y+direction.y*t<terrainHeight(x,z)+.28){d=Math.max(.3,t-.25);break;}}
   candidate.copy(target).addScaledVector(direction,d);if(candidate.y<terrainHeight(candidate.x,candidate.z)+.3)return false;
   const continuity=previousYaw===null?0:Math.abs(Math.atan2(Math.sin(a-previousYaw),Math.cos(a-previousYaw))),q=Math.min(d,wanted)*3-Math.abs(turn)*1.15-continuity*.35+(d>=min?15:0);
   if(q>score){score=q;best.copy(candidate);bestYaw=a;bestDistance=d;}return d>=wanted-.15;
  }
  const preferred=tunnel?Math.max(-.05,Math.min(.07,pitch)):pitch;
  if(!probe(yaw,preferred,0)){for(const p of tunnel?[preferred,.06]:[preferred,Math.max(.12,pitch),.42])for(const turn of offsets)if(probe(yaw+turn,p,turn)&&turn===0)break;}
  if(bestDistance<min){for(let i=0;i<32;i++){const turn=(i<16?i:i-32)*Math.PI/16,a=yaw+turn,x=target.x+Math.sin(a)*wanted,z=target.z+Math.cos(a)*wanted,slope=Math.atan2(terrainHeight(x,z)+.95-target.y,wanted);for(const p of [slope,slope-.12,slope+.12,-.22,.22])probe(a,THREE.MathUtils.clamp(p,-.65,.65),turn);}}
  if(score===-Infinity){direction.set(Math.sin(yaw),.25,Math.cos(yaw)).normalize();const d=physics.cameraDistance(target,direction,wanted);best.copy(target).addScaledVector(direction,d);bestDistance=d;}
  previousYaw=bestYaw;lastResult={position:best,yaw:bestYaw,distance:bestDistance,obstructed:bestDistance<min};return lastResult;
 }
 return{solve,reset(){previousYaw=null;lastKey=null}};
}

export function createCorridorCamera(world){
 const rail=world.toriiCorridor,math=THREE.MathUtils;
 const before={},after={},point={};
 const view=new THREE.Vector3(),free=new THREE.Vector3(),ray=new THREE.Vector3(),unit=new THREE.Vector3();
 let lane=null,blend=0,orbitYaw=null;
 const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

 function find(player,gateCount,dt,reset=false){
  if(reset){lane=null;blend=0;orbitYaw=null;}
  const hit=rail.nearest(player.x,player.z,lane);
  const active=hit&&hit.distance<hit.s.width+1.48&&gateCount>=(blend>.15?2:4);
  const weight=active?1-math.smoothstep(hit.distance,hit.s.width*.72,hit.s.width+1.48):0;
  blend=reset?weight:math.lerp(blend,weight,1-Math.exp(-dt*(active?7.5:5.8)));
  lane=hit;
  if(!lane||blend<.035){orbitYaw=null;return null;}
  lane.blend=blend;
  rail.sample(lane,-1.45,before);
  rail.sample(lane,1.45,after);
  lane.angle=Math.atan2(after.x-before.x,after.z-before.z);
  return lane;
 }
 function movementYaw(yaw,lane){
  if(!lane)return yaw;
  const along=lane.angle+(Math.cos(yaw-lane.angle)<0?Math.PI:0);
  const delta=angleDelta(along,yaw);
  // While walking along the tunnel, the path heading changes gently at bends.
  // Sideways input remains available when the player deliberately turns there.
  const weight=.84*lane.blend*(1-math.smoothstep(Math.abs(delta),.40,1.02));
  return yaw+delta*weight;
 }
 function position(target,yaw,pitch,distance,lane,dt){
  orbitYaw=orbitYaw===null?yaw:orbitYaw+angleDelta(yaw,orbitYaw)*(1-Math.exp(-dt*11));
  const angle=orbitYaw-lane.angle,along=Math.cos(angle),side=Math.sin(angle);
  const last=lane.s.segments.at(-1),end=last.start+last.len;
  const fromOpening=Math.min(lane.at,end-lane.at);
  const reach=math.lerp(2.6,math.clamp(distance,3.25,4.35),math.smoothstep(fromOpening,0,5));
  const sweep=Math.sign(along)*(1-(1-Math.abs(along))**2.05);
  rail.sample(lane,reach*sweep,point);
  const sideLimit=lane.s.width-.38,lateral=side*sideLimit;
  const x=point.x+Math.cos(lane.angle)*lateral,z=point.z-Math.sin(lane.angle)*lateral;
  const floor=world.walkHeight(x,z);
  view.set(x,(Number.isFinite(floor)?floor:target.y-1)+1.43+Math.min(.32,Math.max(0,pitch)*.27),z);
  if(lane.blend<.999){
   const p=Math.max(.045,pitch),d=Math.min(distance,7.3);
   free.set(target.x+Math.sin(orbitYaw)*Math.cos(p)*d,target.y+Math.sin(p)*d,target.z+Math.cos(orbitYaw)*Math.cos(p)*d);
   limit(target,free);
   view.lerp(free,1-lane.blend);
  }
  return limit(target,view);
 }
 function limit(target,destination){
  ray.copy(destination).sub(target);
  const length=ray.length();
  if(length<.01)return destination;
  unit.copy(ray).divideScalar(length);
  let clear=world.physics.cameraDistance(target,unit,length);
  for(let d=.38;d<clear;d+=.22){
   const floor=world.walkHeight(target.x+unit.x*d,target.z+unit.z*d);
   if(Number.isFinite(floor)&&target.y+unit.y*d<floor+.29){clear=d-.20;break;}
  }
  return destination.copy(target).addScaledVector(unit,clear);
 }
 return{find,position,limit,movementYaw};
}
