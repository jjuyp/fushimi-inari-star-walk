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
