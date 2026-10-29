import {MAP} from './map-data.js';
import {DISTRICT} from './district-data.js';
// Extend the same metric map west to both railway stations; original precinct data is untouched.
MAP.paths.push(...DISTRICT.roads);
for(const station of DISTRICT.stations)MAP.pois.push({...station,p:[station.p[0]+9,station.p[1]],altitude:33});
for(const route of DISTRICT.routes)MAP.paths.push({id:route.id,p:route.p,width:4.6,steps:false,name:'車站參拜路線'});
export {MAP};
export function terrainHeight(x,z){
  const g=MAP.dem,fx=Math.max(0,Math.min(g.nx-1.001,(x-g.x0)/g.step)),fz=Math.max(0,Math.min(g.nz-1.001,(z-g.z0)/g.step));
  const ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz;
  const a=g.h[iz*g.nx+ix],b=g.h[iz*g.nx+ix+1],c=g.h[(iz+1)*g.nx+ix],d=g.h[(iz+1)*g.nx+ix+1];return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
}
export function insidePolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
}return inside;}
export function pathLength(points){let sum=0;for(let i=1;i<points.length;i++)sum+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return sum;}
// Sample the exact rendered paving triangles, including overlaps at junctions.
// Analytic centreline heights alone can be lower than an adjacent paving strip.
export class PavedSurface{
  constructor(){this.cells=new Map();}
  addGeometry(geometry){const pos=geometry.attributes.position,index=geometry.index,n=index?index.count:pos.count;
    for(let i=0;i<n;i+=3){const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;
      const t={ax:pos.getX(a),az:pos.getZ(a),ay:pos.getY(a),bx:pos.getX(b),bz:pos.getZ(b),by:pos.getY(b),cx:pos.getX(c),cz:pos.getZ(c),cy:pos.getY(c)};
      t.den=(t.bz-t.cz)*(t.ax-t.cx)+(t.cx-t.bx)*(t.az-t.cz);if(Math.abs(t.den)<1e-8)continue;
      for(let x=Math.floor(Math.min(t.ax,t.bx,t.cx)/4);x<=Math.floor(Math.max(t.ax,t.bx,t.cx)/4);x++)for(let z=Math.floor(Math.min(t.az,t.bz,t.cz)/4);z<=Math.floor(Math.max(t.az,t.bz,t.cz)/4);z++){const key=x+','+z;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(t);}
    }
  }
  height(x,z){let highest=-Infinity;for(const t of this.cells.get(Math.floor(x/4)+','+Math.floor(z/4))||[]){const a=((t.bz-t.cz)*(x-t.cx)+(t.cx-t.bx)*(z-t.cz))/t.den,b=((t.cz-t.az)*(x-t.cx)+(t.ax-t.cx)*(z-t.cz))/t.den,c=1-a-b;if(a>=-1e-7&&b>=-1e-7&&c>=-1e-7)highest=Math.max(highest,a*t.ay+b*t.by+c*t.cy);}return highest;}
}
export function pathSamples(points,spacing){
  const total=pathLength(points),n=Math.max(1,Math.round(total/spacing)),out=[];let i=1,consumed=0;
  for(let k=0;k<=n;k++){
    const distance=k/n*total;
    while(i<points.length-1&&consumed+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1])<distance){consumed+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);i++;}
    const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),t=len?Math.max(0,Math.min(1,(distance-consumed)/len)):0;
    out.push({x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/(len||1),dz:(b[1]-a[1])/(len||1),distance});
  }
  return out;
}
export function footprintBox(building){
  const ps=building.p;let best=null;
  for(let i=1;i<ps.length;i++){
    const dx=ps[i][0]-ps[i-1][0],dz=ps[i][1]-ps[i-1][1];if(Math.hypot(dx,dz)<1)continue;
    const a=Math.atan2(-dz,dx),c=Math.cos(a),s=Math.sin(a);let x0=Infinity,z0=Infinity,x1=-Infinity,z1=-Infinity;
    for(const p of ps){const x=c*p[0]-s*p[1],z=s*p[0]+c*p[1];x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
    const area=(x1-x0)*(z1-z0);if(!best||area<best.area){const lx=(x0+x1)/2,lz=(z0+z1)/2;best={x:c*lx+s*lz,z:-s*lx+c*lz,w:x1-x0,d:z1-z0,angle:a,area};}
  }
  return best;
}
export class SurfaceMap{
  constructor(){this.pads=[];this.paths=[];this.grid=new Map();this.steps=[];
    for(const path of MAP.paths){for(let i=1;i<path.p.length;i++)this.addSegment(path.p[i-1],path.p[i],path.width,path.steps,path.id);}
  }
  key(x,z){return Math.floor(x/8)+','+Math.floor(z/8);}
  addSegment(a,b,width,steps=false,id=null){
    const s={a,b,width,steps,id,dx:b[0]-a[0],dz:b[1]-a[1],length:Math.hypot(b[0]-a[0],b[1]-a[1])};if(s.length<.01)return;
    this.paths.push(s);
    for(let x=Math.floor((Math.min(a[0],b[0])-width/2-1)/8);x<=Math.floor((Math.max(a[0],b[0])+width/2+1)/8);x++)for(let z=Math.floor((Math.min(a[1],b[1])-width/2-1)/8);z<=Math.floor((Math.max(a[1],b[1])+width/2+1)/8);z++){
      const key=x+','+z;if(!this.grid.has(key))this.grid.set(key,[]);this.grid.get(key).push(s);
    }
  }
  nearPath(x,z){
    let best={distance:Infinity};for(const s of this.grid.get(this.key(x,z))||[]){let t=Math.max(0,Math.min(1,((x-s.a[0])*s.dx+(z-s.a[1])*s.dz)/(s.length*s.length))),px=s.a[0]+s.dx*t,pz=s.a[1]+s.dz*t,d=Math.hypot(x-px,z-pz);if(d<best.distance)best={distance:d,x:px,z:pz,t,s};}
    return best;
  }
  projectOnPath(x,z,id){let best={distance:Infinity};for(const s of this.paths){if(s.id!==id)continue;const t=Math.max(0,Math.min(1,((x-s.a[0])*s.dx+(z-s.a[1])*s.dz)/(s.length*s.length))),px=s.a[0]+s.dx*t,pz=s.a[1]+s.dz*t,d=Math.hypot(x-px,z-pz);if(d<best.distance)best={x:px,z:pz,distance:d,s};}return best;}
  pad(x,z,w,d,y,angle=0){this.pads.push({x,z,w,d,y,c:Math.cos(angle),s:Math.sin(angle)});}
  height(x,z){
    let y=terrainHeight(x,z),p=this.nearPath(x,z);
    if(p.distance<(p.s?.width||0)/2+.15){y=terrainHeight(p.x,p.z)+.12;if(p.s.steps)y=Math.round(y/.13)*.13;}
    for(const pad of this.pads){const dx=x-pad.x,dz=z-pad.z;if(Math.abs(pad.c*dx-pad.s*dz)<pad.w/2&&Math.abs(pad.s*dx+pad.c*dz)<pad.d/2)y=Math.max(y,pad.y);}
    for(const s of this.steps){const dx=x-s.x,dz=z-s.z,lx=s.c*dx-s.s*dz,lz=s.s*dx+s.c*dz;if(Math.abs(lx)<s.w/2&&Math.abs(lz)<s.d/2){const t=Math.max(0,Math.min(1,(s.d/2-lz)/s.d));y=s.low+Math.floor(t*s.count)/s.count*(s.high-s.low);}}
    return y+.015;
  }
  staircase(x,z,w,d,low,high,angle=0,count=12){this.steps.push({x,z,w,d,low,high,angle,c:Math.cos(angle),s:Math.sin(angle),count});}
}
