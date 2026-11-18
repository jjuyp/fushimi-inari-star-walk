import {MAP} from './geography.js';

const APPROACH=260121354;
const SENBON=new Set([260121328,377968455]);
const CELL=8;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

export function createToriiCorridor(){
 const lanes=[...MAP.paths.filter(p=>p.id===APPROACH||SENBON.has(p.id)),...MAP.routes];
 const cells=new Map();
 for(const lane of lanes){
  const segments=[],width=lane.id===APPROACH?1.35:1,points=lane.p;
  let end=0;
  for(let i=1;i<points.length;i++){
   const [x,z]=points[i-1],dx=points[i][0]-x,dz=points[i][1]-z,len=Math.hypot(dx,dz);
   if(len<.001)continue;
   const s={x,z,dx,dz,len,width,lane:lane.id??lane.from,index:segments.length,start:end,segments};
   end+=len;segments.push(s);
   for(let ix=Math.floor((Math.min(x,x+dx)-12)/CELL);ix<=Math.floor((Math.max(x,x+dx)+12)/CELL);ix++)
    for(let iz=Math.floor((Math.min(z,z+dz)-12)/CELL);iz<=Math.floor((Math.max(z,z+dz)+12)/CELL);iz++){
     const key=ix+','+iz;
     if(!cells.has(key))cells.set(key,[]);
     cells.get(key).push(s);
    }
  }
 }
 function nearest(x,z,previous=null){
  let best=null,bestDistance=Infinity;
  for(const s of cells.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){
   const t=clamp(((x-s.x)*s.dx+(z-s.z)*s.dz)/(s.len*s.len),0,1),px=s.x+s.dx*t,pz=s.z+s.dz*t;
   const distance=Math.hypot(x-px,z-pz);
   const weighted=distance+(previous&&s.lane!==previous.s.lane ? .29 : 0);
   if(weighted<bestDistance){bestDistance=weighted;best={x:px,z:pz,distance,at:s.start+t*s.len,s};}
  }
  return best;
 }
 function sample(hit,offset,out){
  const segments=hit.s.segments,d=hit.at+offset;
  let i=hit.s.index;
  while(i>0&&d<segments[i].start)i--;
  while(i<segments.length-1&&d>segments[i].start+segments[i].len)i++;
  const s=segments[i],t=(d-s.start)/s.len;
  out.x=s.x+t*s.dx;out.z=s.z+t*s.dz;return out;
 }
 return{nearest,sample};
}

// Cover the walker's head, camera and upslope branches, using both detail
// levels so a tree can't reappear inside the passage when its LOD switches.
export function crownRadius(template,height){
 let radius2=0;
 for(const geometry of [template.branches,template.leaves,template.lowBranches,template.lowLeaves]){
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)if(positions.getY(i)<height){
   const x=positions.getX(i),z=positions.getZ(i);
   radius2=Math.max(radius2,x*x+z*z);
  }
 }
 return Math.sqrt(radius2);
}
