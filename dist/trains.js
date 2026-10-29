import * as THREE from 'three';
import {pathSamples,terrainHeight} from './geography.js';
export function createTrains(scene,world){
 const rails=world.district.railways,route=rails.filter(r=>r.p[0][0]<-280).sort((a,b)=>b.p.length-a.p.length)[0],samples=pathSamples(route.p,.5),length=samples.at(-1).distance;
 const group=new THREE.Group();group.name='京阪電車・沿線運行';scene.add(group);
 const silver=new THREE.MeshStandardMaterial({color:'#bac1be',metalness:.58,roughness:.38}),green=new THREE.MeshStandardMaterial({color:'#23644f',roughness:.55}),window=new THREE.MeshStandardMaterial({color:'#223d48',metalness:.32,roughness:.19}),trim=new THREE.MeshStandardMaterial({color:'#303935',roughness:.7}),light=new THREE.MeshStandardMaterial({color:'#ffedb0',emissive:'#ffcc62',emissiveIntensity:.6});
 const cube=new THREE.BoxGeometry(1,1,1),wheels=new THREE.CylinderGeometry(.34,.34,.17,16);wheels.rotateZ(Math.PI/2);
 function part(parent,mat,x,y,z,w,h,d){const m=new THREE.Mesh(cube,mat);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
 const section=new THREE.Shape();section.moveTo(-1.25,0);section.lineTo(1.25,0);section.lineTo(1.31,2.5);section.quadraticCurveTo(1.31,2.88,.95,3.02);section.lineTo(-.95,3.02);section.quadraticCurveTo(-1.31,2.88,-1.31,2.5);section.closePath();const shell=new THREE.ExtrudeGeometry(section,{depth:14.3,bevelEnabled:true,bevelSize:.08,bevelThickness:.1,bevelSegments:3,steps:1,curveSegments:8});shell.translate(0,.75,-7.15);
 const cars=[];for(let k=0;k<3;k++){const car=new THREE.Group();cars.push(car);group.add(car);car.add(new THREE.Mesh(shell,silver));
  for(const side of [-1,1]){part(car,green,side*1.322,1.53,0,.035,.52,14.1);for(let j=0;j<9;j++){const z=(j-4)*1.46;part(car,trim,side*1.335,2.45,z,.04,1.02,1.24);part(car,window,side*1.36,2.46,z,.025,.88,1.1);if(j===2||j===6){part(car,silver,side*1.38,1.86,z,.025,2.1,1.36);part(car,window,side*1.4,2.43,z,.02,.85,1.13);part(car,trim,side*1.42,1.77,z,.02,1.85,.025);}}}
  for(const z of [-7.26,7.26]){part(car,green,0,1.55,z,2.5,.6,.03);part(car,window,0,2.55,z,2.22,1.01,.04);part(car,trim,0,2.03,z,2.4,.05,.04);for(const x of [-.85,.85])part(car,light,x,1.86,z,.3,.18,.06);part(car,trim,0,.82,z,1.1,.32,.22);}
  for(const z of [-4.7,4.7]){part(car,trim,0,.64,z,2.25,.42,1.8);for(const dz of [-.6,.6])for(const x of [-1.08,1.08]){const m=new THREE.Mesh(wheels,trim);m.position.set(x,.48,z+dz);car.add(m);}}
  part(car,trim,0,3.91,-.8,1.8,.19,3.2);part(car,silver,0,3.96,3.4,1.5,.32,1.9);
 }
 const colliders=cars.map((_,i)=>({kind:'box',name:'keihan-train-'+i,w:2.7,d:14.4,c:1,s:0,x:0,z:0,y0:0,y1:0,bounds:[0,0,0,0]}));world.physics.dynamicBodies.push(...colliders);
 let travel=length*.57,dir=1,wait=0;const temp=new THREE.Vector3();
 function locate(d){d=THREE.MathUtils.clamp(d,0,length);let lo=0,hi=samples.length-1;while(lo<hi){const m=(lo+hi)>>1;if(samples[m].distance<d)lo=m+1;else hi=m;}return samples[lo];}
 function draw(){for(let i=0;i<cars.length;i++){const p=locate(travel+(i-1)*15),a=locate(travel+(i-1)*15+2);cars[i].position.set(p.x,terrainHeight(p.x,p.z)+.22,p.z);cars[i].rotation.y=Math.atan2(a.x-p.x,a.z-p.z);const b=colliders[i];b.x=p.x;b.z=p.z;b.angle=cars[i].rotation.y;b.c=Math.cos(b.angle);b.s=Math.sin(b.angle);b.y0=cars[i].position.y+.45;b.y1=cars[i].position.y+3.9;const ex=Math.abs(b.c)*1.35+Math.abs(b.s)*7.2,ez=Math.abs(b.s)*1.35+Math.abs(b.c)*7.2;b.bounds=[b.x-ex,b.z-ez,b.x+ex,b.z+ez];}world.physics.revision++;}
 draw();return{group,cars,route:route.p,update(dt,player,reduced,enabled=true){const near=enabled&&player.x<-80;group.visible=near;if(!near||reduced)return;const occupied=colliders.some(b=>{const dx=player.x-b.x,dz=player.z-b.z;return Math.abs(b.c*dx-b.s*dz)<1.85&&Math.abs(b.s*dx+b.c*dz)<9.5;});if(wait>0)wait-=dt;else if(!occupied)travel+=dir*dt*7.5;if(travel>length-20){travel=length-20;dir=-1;wait=5;}if(travel<20){travel=20;dir=1;wait=5;}draw();},stats:{cars:3,continuousRails:true}};
}
