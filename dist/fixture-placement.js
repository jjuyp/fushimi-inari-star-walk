const CELL=12;
const APPROACH_PLATES=[
 {a:[-110,1],b:[-78,1],width:13},
 {a:[-78,1],b:[-20,-1.64],width:13},
 {a:[-25,-2.6],b:[-4,-2.6],width:9},
 {a:[-2,-4],b:[21,-4],width:7}
];

export function createFixtureLayout(surface){
 const cells=new Map(),fixtures=[];
 const key=(x,z)=>x+':'+z;
 for(const lane of [...surface.paths,...APPROACH_PLATES]){
  const {a,b,width}=lane,dx=b[0]-a[0],dz=b[1]-a[1],length2=dx*dx+dz*dz;
  if(!length2)continue;
  const pad=width*.5+4;
  for(let x=Math.floor((Math.min(a[0],b[0])-pad)/CELL);x<=Math.floor((Math.max(a[0],b[0])+pad)/CELL);x++)
   for(let z=Math.floor((Math.min(a[1],b[1])-pad)/CELL);z<=Math.floor((Math.max(a[1],b[1])+pad)/CELL);z++){
    const k=key(x,z);
    if(!cells.has(k))cells.set(k,[]);
    cells.get(k).push({a,dx,dz,length2,width});
   }
 }
 function margin(x,z,radius=0){
  let nearest=Infinity;
  for(const {a,dx,dz,length2,width} of cells.get(key(Math.floor(x/CELL),Math.floor(z/CELL)))||[]){
   const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length2));
   nearest=Math.min(nearest,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)-width*.5-radius);
  }
  return nearest;
 }
 function test(world,x,z,radius){
  const y=world.walkHeight(x,z);
  if(!Number.isFinite(y)||margin(x,z,radius)<.10)return null;
  if(world.physics.near(x,z).some(b=>world.physics.penetration(b,x,y,z,radius+.10,2.1)))return null;
  for(const [dx,dz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]]){
   const ground=world.walkHeight(x+dx,z+dz);
   if(!Number.isFinite(ground)||Math.abs(y-ground)>.38)return null;
  }
  return {x,y,z};
 }
 function beside(world,p,side,radius,minimum,maximum=minimum+3.25){
  const floor=world.walkHeight(p.x,p.z);
  for(const slide of [0,-.65,.65,-1.3,1.3])for(let gap=minimum;gap<=maximum+.01;gap+=.30){
   const x=p.x-p.dz*gap*side+p.dx*slide,z=p.z+p.dx*gap*side+p.dz*slide;
   const place=test(world,x,z,radius);
   if(place&&Math.abs(place.y-floor)<1.1)return place;
  }
  return null;
 }
 function near(world,x,z,radius,max=5.5){
  for(let r=0;r<=max;r+=.42)for(let i=0;i<20;i++){
   const a=i*Math.PI/10,place=test(world,x+Math.cos(a)*r,z+Math.sin(a)*r,radius);
   if(place)return place;
  }
  return null;
 }
 function record(name,place,radius){
  const measured=margin(place.x,place.z,radius);
  fixtures.push({name,x:place.x,y:place.y,z:place.z,radius,margin:Number.isFinite(measured)?measured:null});
 }
 return{margin,test,beside,near,record,fixtures};
}
