// Capsule-footprint collision with a spatial hash and bounded movement substeps.
// Geometry builders register every wall, column, torii leg, rail and stone plinth.
export class CollisionWorld {
  constructor(cellSize=6){this.cellSize=cellSize;this.cells=new Map();this.bodies=[];this.dynamicBodies=[];this.revision=0;this.radius=.38;this.height=1.7;this.maxStep=.5;}
  insert(body){
    body.id=this.bodies.length;body.c=Math.cos(body.angle||0);body.s=Math.sin(body.angle||0);
    const ex=body.kind==='circle'?body.r:Math.abs(body.c)*body.w/2+Math.abs(body.s)*body.d/2;
    const ez=body.kind==='circle'?body.r:Math.abs(body.s)*body.w/2+Math.abs(body.c)*body.d/2;
    body.bounds=[body.x-ex,body.z-ez,body.x+ex,body.z+ez];this.bodies.push(body);
    const k=this.cellSize;
    for(let x=Math.floor((body.bounds[0]-.5)/k);x<=Math.floor((body.bounds[2]+.5)/k);x++)for(let z=Math.floor((body.bounds[1]-.5)/k);z<=Math.floor((body.bounds[3]+.5)/k);z++){
      const key=x+','+z;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(body);
    }
    return body;
  }
  box(name,x,y,z,w,h,d,angle=0){return this.insert({kind:'box',name,x,z,w,d,angle,y0:y-h/2,y1:y+h/2});}
  circle(name,x,y,z,r,h){return this.insert({kind:'circle',name,x,z,r,angle:0,y0:y-h/2,y1:y+h/2});}
  near(x,z){const base=this.cells.get(Math.floor(x/this.cellSize)+','+Math.floor(z/this.cellSize))||[];let near=null;for(const b of this.dynamicBodies)if(x>b.bounds[0]-.6&&x<b.bounds[2]+.6&&z>b.bounds[1]-.6&&z<b.bounds[3]+.6){near??=[];near.push(b);}return near?base.concat(near):base;}
  penetration(body,x,y,z,r=this.radius,height=this.height){
    if(y+.12>=body.y1||y+height<=body.y0)return null;
    if(body.kind==='roof'){
      const dx=x-body.x,dz=z-body.z,lx=body.c*dx-body.s*dz,lz=body.s*dx+body.c*dz;
      const tFront=1-Math.abs(lz)/(body.d*(lz>=0?body.front:1-body.front));
      const tSide=body.ridge>.99?1:(1-Math.abs(lx)/(body.w/2))/(1-body.ridge);
      const t=Math.max(0,Math.min(1,tFront,tSide)),surface=body.baseY+body.rise*Math.pow(t,1.6)+.42*Math.pow(1-t,6)*Math.pow(Math.min(1,Math.abs(lx)/(body.w/2)),4);
      if(y+.1>surface+.18||y+height<surface-.12)return null;
    }
    if(body.kind==='circle'){
      const dx=x-body.x,dz=z-body.z,len=Math.hypot(dx,dz),min=r+body.r;
      if(len>=min)return null;
      return len>.00001?{x:dx/len*(min-len),z:dz/len*(min-len)}:{x:min,z:0};
    }
    const dx=x-body.x,dz=z-body.z,lx=body.c*dx-body.s*dz,lz=body.s*dx+body.c*dz;
    const qx=Math.max(-body.w/2,Math.min(body.w/2,lx)),qz=Math.max(-body.d/2,Math.min(body.d/2,lz));
    let px=lx-qx,pz=lz-qz,len=Math.hypot(px,pz);
    if(len>=r)return null;
    if(len>.00001){px=px/len*(r-len);pz=pz/len*(r-len);}else{
      const ax=body.w/2-Math.abs(lx),az=body.d/2-Math.abs(lz);
      if(ax<az){px=(lx>=0?1:-1)*(ax+r);pz=0;}else{px=0;pz=(lz>=0?1:-1)*(az+r);}
    }
    return{x:body.c*px+body.s*pz,z:-body.s*px+body.c*pz};
  }
  collides(x,y,z){return this.near(x,z).some(b=>this.penetration(b,x,y,z));}
  move(position,dx,dz,surface){
    const distance=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(distance/.09));
    let x=position.x,z=position.z,y=position.y,hits=0;
    for(let step=0;step<steps;step++){
      let nx=x+dx/steps,nz=z+dz/steps,ny=surface(nx,nz);
      if(!Number.isFinite(ny)||ny-y>this.maxStep){hits++;continue;}
      for(let pass=0;pass<5;pass++){
        let hit=false;
        for(const b of this.near(nx,nz)){
          const push=this.penetration(b,nx,ny,nz);
          if(push){nx+=push.x;nz+=push.z;hit=true;hits++;}
        }
        if(!hit)break;
      }
      ny=surface(nx,nz);
      if(Number.isFinite(ny)&&ny-y<=this.maxStep&&!this.collides(nx,ny,nz)){x=nx;z=nz;y=ny;}
    }
    position.x=x;position.y=y;position.z=z;return hits;
  }
  cameraDistance(origin,direction,maxDistance){
    // Sweep a camera sphere through the real collider profiles, including
    // curved roof surfaces. A roof bounding box is not a solid attic.
    const radius=.23,step=.14;
    for(let t=.45;t<=maxDistance+step;t+=step){
      const q=Math.min(t,maxDistance),x=origin.x+direction.x*q,y=origin.y+direction.y*q,z=origin.z+direction.z*q;
      for(const b of this.near(x,z))if(this.penetration(b,x,y-radius,z,radius,radius*2))return Math.max(.3,q-step-.08);
    }
    return maxDistance;
  }
}
