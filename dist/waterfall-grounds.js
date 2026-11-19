import * as THREE from 'three';
import {terrainHeight} from './geography.js';

const angle=-.56492;
const locus={x:816.19,z:-221.19,y:122.43};
const sin=Math.sin(angle),cos=Math.cos(angle);
export function waterfallJunction(x,z){
 const dx=x-locus.x,dz=z-locus.z;
 const u=cos*dx-sin*dz,w=sin*dx+cos*dz;
 return u>-5.7&&u<5.1&&w>6.5&&w<12.7;
}
const routeX=-3.10, bottom=8.32, top=4.52, width=2.52, steps=10;
export const seatHeight=.565;
export const seatPoint=new THREE.Vector3(-.32,seatHeight,4.64);

// The branch begins at the outer edge of the real path at Yotsutsuji.
export function fitWaterfallSite(site,world,flora){
 const {x,y,z}=locus,s=sin,c=cos;
 const position=(u,v,w)=>new THREE.Vector3(x+c*u+s*w,y+v,z-s*u+c*w);
 const ground=(u,w)=>{const p=position(u,0,w);return terrainHeight(p.x,p.z)-y;};
 const foot=position(routeX,0,bottom),path=world.surface.nearPath(foot.x,foot.z);
 const base=world.walkHeight(path.x,path.z)-y;
 Object.assign(site,{x,y,z,angle,position,ground,route:{base,bottom,top,width,steps,x:routeX,path:[path.x,path.z]}});
 site.group.position.set(x,y,z);site.group.rotation.y=angle;
 const first=position(routeX,0,7.53);
 site.arrival={x:first.x,z:first.z,get y(){return world.walkHeight(first.x,first.z);}};
 site.pad=(u,w,a,d,h)=>{
  const p=position(u,h,w);world.surface.pad(p.x,p.z,a,d,p.y,angle);
 };
 site.block=(name,u,v,w,a,b,d,yaw=0)=>{
  const p=position(u,v,w);world.physics.box('山林之瀧・'+name,p.x,p.y,p.z,a,b,d,angle+yaw);
 };

 const groundMesh=new THREE.PlaneGeometry(21,18,56,48).rotateX(-Math.PI/2);
 const point=groundMesh.attributes.position,uv=groundMesh.attributes.uv;
 for(let i=0;i<point.count;i++){
  const u=point.getX(i)+.3,w=point.getZ(i)+.35,real=ground(u,w);
  const edge=Math.max((Math.abs(u)-6.45)/3.55,(w-5.9)/2.8,(-w-4.1)/3.8,0);
  const t=THREE.MathUtils.smoothstep(edge,0,1);
  const a=THREE.MathUtils.smoothstep(w,4.35,8.25);
  const landing=(u<-1.7?base*.93:base*.78)*a;
  const berm=THREE.MathUtils.smoothstep(-w,2.5,6.9)*1.7;
  const embankment=THREE.MathUtils.smoothstep(Math.abs(u),4.7,7.8)*.48;
  const local=THREE.MathUtils.lerp(landing+berm+embankment-.055,real-.016,t);
  const p=position(u,local,w);
  point.setXYZ(i,p.x,p.y,p.z);uv.setXY(i,p.x/4,p.z/4);
 }
 groundMesh.computeVertexNormals();world.paving.addGeometry(groundMesh);
 const gravel=world.M.forest.clone();gravel.color.set('#a19b82');gravel.roughness=.94;
 const terrace=new THREE.Mesh(groundMesh,gravel);terrace.name='山林之瀧・接續山坡與參道的礫土地面';terrace.receiveShadow=true;
 site.group.parent.add(terrace);world.builder.meshes.push(terrace);
 site.clearing=terrace;
 site.localFloor=(u,w)=>{
  const p=position(u,0,w);return world.walkHeight(p.x,p.z)-y;
 };
 for(const p of flora?.garden?.sites||[])if(Math.hypot(p.x-x,p.z-z)<9.0)p.reserved=true;
 const dz=(bottom-top)/steps;
 for(let i=0;i<steps;i++){
  const local=position(routeX,0,bottom-(i+.5)*dz);
  world.surface.pad(local.x,local.z,width,dz+.014,y+THREE.MathUtils.lerp(base+.09,.018,(i+1)/steps),angle);
 }
 // The pool is shallow at the lip, but visitors use the bank and boardwalk.
 for(const [u,w,a,d] of [[.92,2.22,5.25,2.22],[1.74,.61,4.9,1.4],[2.8,-.42,3.74,.95]]){
  site.block('水潭',u,.5,w,a,1.2,d);
 }
 const deck=position(5.05,0,2.67);
 world.surface.pad(deck.x,deck.z,2.75,2.53,y+.55,angle);
 const jettyStep=position(5.05,0,4.16);
 world.surface.pad(jettyStep.x,jettyStep.z,2.12,.54,y+.27,angle);
 site.block('修行石',seatPoint.x,.23,seatPoint.z,1.2,.58,.91);
 site.block('岸邊坐石',1.36,.16,4.89,.91,.69,.72);
 site.grove=[
  {u:-7.9,w:-3.2,k:0,scale:.63,yaw:1.4},
  {u:-3.52,w:-5.84,k:1,scale:.57,yaw:1},
  {u:.42,w:-6.42,k:0,scale:.59,yaw:1.9},
  {u:4.8,w:-6.48,k:1,scale:.64,yaw:3.9},
  {u:7.0,w:-2.38,k:0,scale:.52,yaw:2.1},
  {u:-10.85,w:.84,k:2,scale:.75,yaw:2.7}
 ].map(o=>({...o,template:world.trees.templates[o.k]}));
 for(const p of site.grove){
  const h=ground(p.u,p.w),space=position(p.u,h,p.w);
  world.physics.circle('瀧の杉木',space.x,space.y+1.7,space.z,.28*p.scale,3.6);
 }
 site.interaction=position(seatPoint.x,.02,5.72);
 return site;
}

export function addWaterfallGrounds({site,M,mesh,box,ball,column,tube,label,stone,rock,random}){
 const rail=M.darkWood,wood=M.wood,lamps=[];
 const {x,base,bottom,top,steps,width}=site.route;
 const depth=(bottom-top)/steps;
 for(let i=0;i<steps;i++){
  const z=bottom-(i+.5)*depth,y=THREE.MathUtils.lerp(base+.09,.018,(i+1)/steps);
  const foundation=Math.min(site.ground(x,z)-.19,y-.19);
  box(stone,x,(y+foundation)/2,z,width,y-foundation,depth+.015);
  for(const [part,dx]of [[.62,-.45],[.38,.78]]){
   const segment=box(stone,x+dx,y-.043,z,part*width-.025,.085,depth+.032);
   segment.rotation.y=(i%3-1)*.009;
  }
  for(const side of [-1,1]){
   const u=x+side*(width/2+.135);
   rock(u,y-.065,z,.20,.16,.226,(i%4)*.32);
  }
 }
 const gateX=x-2.53,gateZ=6.10;
 const gateY=Math.max(-.48,site.ground(gateX,gateZ)+.04);
 // A small worship landing under the timber canopy joins the open stair at its side.
 for(const [u,w,a,d,high] of [[gateX,gateZ+.05,2.58,1.62,gateY+.16],[gateX+.30,7.13,2.05,.55,gateY-.035],[gateX+.66,7.59,1.55,.49,gateY-.20],[gateX+.91,5.18,1.40,.39,gateY+.20]]){
  const low=Math.min(site.ground(u,w)-.13,high-.16);
  const slab=box(stone,u,(low+high)/2,w,a,high-low,d);slab.rotation.y=.018;
  site.pad(u,w,a,d,high);
 }
 const timberRoof=M.roof.clone();timberRoof.color.set('#716252');
 for(const side of [-1,1]){
  const gx=gateX+side*1.35;
  const low=Math.min(gateY-.10,site.ground(gx,gateZ)-.13);
  box(stone,gx,(low+gateY+.27)/2,gateZ,.47,gateY+.27-low,.55);
  box(rail,gx,gateY+1.43,gateZ,.19,2.56,.25);
  box(M.black,gx,gateY+.35,gateZ,.224,.43,.28);
  box(wood,gx,gateY+2.53,gateZ,.39,.16,.37);
  site.block('入口木柱',gx,gateY+1.35,gateZ,.27,2.7,.34);
 }
 box(wood,gateX,gateY+2.52,gateZ,3.15,.20,.28);
 box(rail,gateX,gateY+2.30,gateZ+.05,2.63,.07,.12);
 for(const side of [-1,1]){
  const roof=box(timberRoof,gateX,gateY+2.77,gateZ+side*.32,3.46,.14,.79);
  roof.rotation.x=side*.39;
  for(let j=0;j<12;j++){
   const rafter=box(wood,gateX+(j-5.5)*.274,gateY+2.69,gateZ+side*.28,.092,.11,.81);
   rafter.rotation.x=side*.39;
  }
 }
 box(rail,gateX,gateY+2.94,gateZ,3.53,.14,.19);
 const indigo=new THREE.MeshStandardMaterial({color:'#29425f',roughness:.95,side:THREE.DoubleSide});
 for(let i=0;i<3;i++){
  const panel=new THREE.PlaneGeometry(.74,.47,12,8);
  const p=panel.attributes.position;
  for(let k=0;k<p.count;k++)p.setZ(k,Math.sin(p.getX(k)*23.+i*.8)*.035);
  panel.computeVertexNormals();
  mesh(panel,indigo,gateX+(i-1)*.765,gateY+2.075,gateZ+.174);
 }
 const signX=gateX+1.44,signZ=gateZ+.18,signY=gateY+1.46;
 box(rail,signX,signY,signZ,.62,2.14,.13);
 const signGround=Math.min(gateY+.39,site.ground(signX,signZ)-.09),postCap=signY+.13;
 box(wood,signX,(signGround+postCap)/2,signZ-.125,.16,postCap-signGround,.16);
 for(const h of [-.95,.94])for(const dx of [-.20,.20])ball(M.bronze,signX+dx,signY+h,signZ+.077,.021,.018,.014);
 label('山林之瀧・坐石修行',signX,signY,signZ+.07,.49,1.94,true);
 site.block('案內木牌',signX,signY,signZ,.67,2.25,.22);

 function lantern(u,y,w,scale,stoneBase=false){
  if(stoneBase){
   box(stone,u,y+.115*scale,w,.58*scale,.23*scale,.56*scale);
   column(stone,u,y+.46*scale,w,.14*scale,.55*scale);
  }
  const h=y+(stoneBase?.90:.23)*scale;
  box(rail,u,h-.23*scale,w,.47*scale,.12*scale,.47*scale);
  box(M.glow,u,h,w,.32*scale,.39*scale,.32*scale);
  for(const side of [-1,1]){
   box(rail,u,h,w+side*.163*scale,.021*scale,.4*scale,.018);
   box(rail,u+side*.163*scale,h,w,.018,.4*scale,.021*scale);
   box(rail,u,h-.025*scale,w+side*.163*scale,.35*scale,.024*scale,.017);
  }
  for(const dx of [-1,1])for(const dz of [-1,1])box(rail,u+dx*.177*scale,h,w+dz*.177*scale,.029*scale,.45*scale,.029*scale);
  const roof=new THREE.CylinderGeometry(.11,.39,.17,4);roof.rotateY(Math.PI/4);
  mesh(roof,stoneBase?stone:rail,u,h+.29*scale,w,scale,scale,scale);
  ball(stoneBase?stone:rail,u,h+.41*scale,w,.062*scale);
  site.block('行燈',u,h-.04,w,.43*scale,.54*scale,.44*scale);
  if(w>7.0||u>5.5)lamps.push([u,h-.12,w+.12]);
 }
 lantern(-4.87,gateY-.06,6.76,.87,true);
 lantern(-1.37,base+.13,7.62,.82,true);
 lantern(-1.93,.04,4.08,.9,true);
 lantern(-2.44,.20,1.98,1.23,true);
 // Deck planks span beams and real posts that extend to the bank.
 for(const u of [3.81,6.28])for(const w of [1.54,3.83]){
  const floor=Math.min(-.3,site.ground(u,w)-.08);
  box(rail,u,(floor+.5)/2,w,.21,.5-floor,.21);
 }
 for(const u of [3.87,6.21])box(rail,u,.39,2.68,.22,.25,2.67);
 for(let i=0;i<17;i++)box(wood,5.05,.486,1.43+(i+.5)*.147,2.77,.126,.137);
 const stepFoot=Math.min(-.14,site.ground(5.05,4.16)-.04);
 box(stone,5.05,(stepFoot+.089)/2,4.16,1.95,.089-stepFoot,.47);
 box(wood,5.05,.16,4.16,2.14,.20,.53);
 for(const [u,w]of [[3.77,1.48],[3.77,2.73],[3.77,3.9],[5.05,1.48],[6.35,1.48],[6.35,2.73],[6.35,3.9]])box(rail,u,.93,w,.11,.83,.11);
 for(const h of [.78,1.18]){
  box(wood,5.06,h,1.48,2.60,.078,.095);
  for(const u of [3.77,6.35])box(wood,u,h,2.69,.098,.078,2.48);
 }
 for(const u of [3.77,6.35])site.block('木平台欄杆',u,.95,2.68,.12,.80,2.5);
 site.block('木平台後欄',5.05,.95,1.48,2.65,.8,.13);
 lantern(6.05,.55,3.45,1.0);
 const cushion=new THREE.MeshStandardMaterial({color:'#aa8a52',roughness:.96,map:M.wood.map});
 ball(cushion,5.03,.61,2.45,.38,.085,.33);

 // Shimenawa bows across the rock face, with two ends secured into the crags.
 const cord=[[-.18,5.04,-1.59],[.97,4.4,-.94],[2.42,4.19,-.60],[3.76,4.5,-.86],[4.98,5.04,-1.7]];
 for(let j=0;j<3;j++){
  const curve=new THREE.CatmullRomCurve3(cord.map(p=>new THREE.Vector3(...p)));
  const pts=Array.from({length:52},(_,i)=>{const t=i/51,p=curve.getPoint(t),a=t*78+j*2.094;return[p.x,p.y+.031*Math.cos(a),p.z+.031*Math.sin(a)];});
  tube(M.rope,pts,.024);
 }
 const paper=new THREE.Shape();paper.moveTo(0,0);paper.lineTo(.13,0);paper.lineTo(.05,-.15);paper.lineTo(.13,-.20);paper.lineTo(.07,-.33);paper.lineTo(.12,-.38);paper.lineTo(.03,-.52);paper.lineTo(-.04,-.41);paper.lineTo(.016,-.32);paper.lineTo(-.05,-.25);paper.lineTo(.014,-.124);paper.lineTo(-.03,-.08);paper.closePath();
 const folded=new THREE.ShapeGeometry(paper);
 for(const [i,dx]of [-.74,0,.74].entries()){
  const streamer=mesh(folded,M.white,gateX+dx,gateY+2.28,gateZ+.22,1.05,.87,1);
  streamer.rotation.y=(i-1)*.18;
 }
 for(const [u,v,w]of [[.48,4.55,-1.1],[1.30,4.26,-.78],[2.20,4.18,-.58],[3.12,4.29,-.7],[4.08,4.60,-1]]){
  const o=mesh(folded,M.white,u,v,w+.04,.77,.73,.77);o.rotation.y=.22+random()*.5;
 }
 for(const [u,w,r] of [[-7.13,6.14,1.00],[-7.15,4.69,1.17],[-5.7,2.45,1.07],[4.85,7.66,1.05],[6.45,7.58,1.06],[7.41,5.88,.96],[6.72,-.31,1.47],[-3.92,-1.9,1.45]]){
  const floor=site.localFloor(u,w),h=.64+r*.31;
  const center=floor-h*.42;
  rock(u,center,w,r,h,r*.75,random()*5);
  site.block('苔岩',u,floor+h*.27,w,r*1.52,h*.56,r*1.05);
  for(let i=0;i<3;i++){
   const a=i*2.44+.4,x=u+Math.cos(a)*r*.77,z=w+Math.sin(a)*r*.58;
   const base=site.localFloor(x,z),size=.16+r*.1+random()*.11;
   rock(x,base-size*.19,z,size,size*.57,size*.80,a);
  }
 }
 // The pool spills across a mortared stone notch, into a narrow gravel bed.
 // Each bank follows the actual grading, and a flat crossing keeps the path continuous.
 const flow=[[3.12,.216,3.26]],positions=[],uv=[],indices=[];
 for(const [i,[u,w]] of [[3.22,3.62],[3.32,3.97],[3.34,4.42],[3.30,4.87],[3.34,5.28],[3.37,5.74],[3.4,6.19],[3.45,6.62],[3.54,6.92]].entries()){
  const floor=site.localFloor(u,w),h=Math.min(flow.at(-1)[1]-.009,floor+.062);
  flow.push([u,h,w]);
  for(const side of [-1,1]){
   const x=u+side*(.205+random()*.052),size=.105+random()*.115,bedY=site.localFloor(x,w);
   if(w<4.93||w>5.59)rock(x,Math.max(bedY,h)-size*.13,w,size,size*.60,size*.82,random()*5);
  }
 }
 for(const [i,[u,y,w]] of flow.entries()){
  positions.push(u-.25,y-.022,w,u+.25,y-.022,w);uv.push(0,i*.4,1,i*.4);
  if(i>0){const a=i*2;indices.push(a-2,a,a-1,a-1,a,a+1);}
 }
 const bed=new THREE.BufferGeometry();
 bed.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 bed.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bed.setIndex(indices);bed.computeVertexNormals();
 mesh(bed,stone);
 const crossing=site.localFloor(3.34,5.28)+.06;
 box(stone,3.34,crossing-.068,5.28,.92,.136,.54).rotation.y=.065;
 site.pad(3.34,5.28,.92,.54,crossing);
 site.overflow=flow;
 // Bamboo in the damp right foreground, then low fern crowns on the stone banks.
 const green=new THREE.MeshStandardMaterial({color:'#60733c',roughness:.78});
 const node=new THREE.MeshStandardMaterial({color:'#809454',roughness:.8});
 const blade=new THREE.Shape();blade.moveTo(0,0);blade.quadraticCurveTo(.095,.14,.022,.36);blade.quadraticCurveTo(-.085,.18,0,0);
 const bladeGeo=new THREE.ShapeGeometry(blade,4),leafMat=new THREE.MeshStandardMaterial({color:'#526e35',side:THREE.DoubleSide,roughness:.78});
 for(let i=0;i<9;i++){
  const u=6.42+random()*1.9,w=3.33+random()*3.1,baseY=Math.max(site.ground(u,w),-.22),h=3.6+random()*2.4,lean=(i%4-1.5)*.28;
  const ab=[[u,baseY,w],[u+lean*.42,baseY+h*.54,w-.12],[u+lean,baseY+h,w-.25]];
  tube(green,ab,.052+random()*.033);
  for(let j=1;j<9;j++){
   const t=j/9;column(node,u+lean*t,baseY+h*t,w-.25*t,.084,.026);
   if(j<4)continue;
   const side=j%2?1:-1,tip=[u+lean*t+side*(.48+random()*.5),baseY+h*t+.27,w-.25*t+.24];
   tube(green,[[u+lean*t,baseY+h*t,w-.25*t],tip],.014);
   for(let k=0;k<6;k++){
    const a=k/6,o=mesh(bladeGeo,leafMat,THREE.MathUtils.lerp(u+lean*t,tip[0],a),baseY+h*t+.26*a,w-.25*t+.24*a,.78,.88,.8);
    o.rotation.set(.58+(k%3)*.21,(k%2)*2.3,indexTilt(side,k));
   }
  }
 }
 function indexTilt(side,k){return side*(.55+k*.12);}
 for(const [u,w,h]of [[-5.43,5.9,.37],[-4.75,4.4,.14],[-4.55,2.8,.45],[-2.7,2.48,.12],[3.3,5.7,.27],[5.8,5.83,.36],[6.6,4.9,.42],[-1.62,3.47,.1],[5.88,-.39,1.4],[.05,-1.62,1.35]]){
  for(let j=0;j<8;j++){
   const a=j*Math.PI/4+random()*.2;
   for(let k=0;k<5;k++){
    const t=k/5,r=.11+.39*t,o=mesh(bladeGeo,leafMat,u+Math.sin(a)*r,h+.24*Math.sin(t*2.2),w+Math.cos(a)*r,.65*(1-t)+.20,.88*(1-t)+.33,.72);
    o.rotation.set(.55+t*.85,a,(k%2?1:-1)*.5);
   }
  }
 }
 const petal=new THREE.IcosahedronGeometry(1,0);
 const bloomPaint=[
  new THREE.MeshStandardMaterial({color:'#e7dfbc',roughness:.86}),
  new THREE.MeshStandardMaterial({color:'#c9c8a7',roughness:.86})
 ];
 for(const [u,w,h] of [[-4.75,4.10,.26],[5.84,5.84,.33],[6.42,5.64,.57],[-1.95,-1.36,1.95],[5.18,-.77,2.6]]){
  for(let i=0;i<6;i++){
   const a=i*2.4,b=u+Math.sin(a)*.26,d=w+Math.cos(a)*.22,v=h+.21+random()*.19;
   tube(green,[[u,h-.17,w],[b-.05,v-.06,d],[b,v,d]],.009);
   for(let j=0;j<11;j++){
    const phi=j*2.4,rad=Math.sqrt(j/11)*.10;
    mesh(petal,bloomPaint[j%4===0?1:0],b+Math.cos(phi)*rad,v+.052*(1-rad/.11),d+Math.sin(phi)*rad,.041,.032,.040);
   }
  }
 }
 // A stone basin is fed from a short bamboo spout, with the drain opening downhill.
 for(let i=0;i<16;i++){
  const t=i/15,a=1.75+t*1.13,u=1.05+Math.cos(a)*3.85,w=1.4+Math.sin(a)*2.33;
  rock(u,-.012+random()*.038,w,.14+random()*.26,.11+random()*.11,.12+random()*.14,random()*6);
 }
 const basinX=6.15,basinZ=5.63,basinFloor=site.localFloor(basinX,basinZ);
 const basinY=basinFloor+.11;
 const bowl=new THREE.LatheGeometry([[.01,0],[.40,0],[.56,.14],[.60,.42],[.56,.57],[.48,.57],[.44,.31],[.06,.25],[.01,.25]].map(([r,y])=>new THREE.Vector2(r,y)),32);
 rock(basinX,basinFloor-.08,basinZ,.77,.26,.77,.77);
 mesh(bowl,stone,basinX,basinY,basinZ);
 column(green,basinX+.63,basinY+.62,basinZ,.065,1.25);
 const lip=[basinX+.10,basinY+1.02,basinZ];
 tube(green,[[basinX+.64,basinY+1.14,basinZ],[basinX+.35,basinY+1.11,basinZ],lip],.059);
 site.block('手水鉢',basinX,basinY+.22,basinZ,1.10,.58,1.08);
 site.basin={x:basinX,y:basinY+.40,z:basinZ,lip};
 return lamps;
}
