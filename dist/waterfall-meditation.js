import * as THREE from 'three';

// Seat contact is derived from the actual avatar geometry; walking pose is restored on exit.
export function createWaterfallMeditation({player,avatar,site,scene,world}){
 const rig=new THREE.Group();rig.name='小星星・坐石合掌';player.add(rig);rig.visible=false;
 const gold=avatar.body.children[0].material,tube=new THREE.CylinderGeometry(1,1,1,10),sphere=new THREE.SphereGeometry(1,16,12),up=new THREE.Vector3(0,1,0),v=(x,y,z)=>new THREE.Vector3(x,y,z),arms=[];
 for(const side of [-1,1]){const meshes=[];for(let i=0;i<2;i++){const m=new THREE.Mesh(tube,gold);rig.add(m);meshes.push(m);}const palm=new THREE.Mesh(sphere,gold);palm.scale.set(.07,.11,.055);rig.add(palm);arms.push({side,meshes,palm});}
 const legs=[];for(const side of [-1,1]){const pair=[];for(let j=0;j<2;j++){const m=new THREE.Mesh(tube,gold);rig.add(m);pair.push(m);}legs.push({side,meshes:pair});}
 const eyes=avatar.body.children.filter(o=>o.material===world.M.black&&o.geometry?.type==='SphereGeometry'&&o.position.y>1.0).map(o=>({o,scale:o.scale.clone()})),glints=avatar.body.children.filter(o=>o.material===world.M.white&&o.position.y>1.05&&o.scale.x<.02).map(o=>({o,visible:o.visible}));
 const star=avatar.body.children[0];star.geometry.computeBoundingBox();const bodyBottom=star.geometry.boundingBox.min.y+star.position.y;
 const stats={active:false,seated:false,elapsed:0,seatTop:site.y+scene.meditation.position.y,contactGap:0,settle:0};let stand=null,hidden=[],active=false;
 const feetRest=avatar.feet.map(f=>({position:f.position.clone(),rotation:f.rotation.clone(),scale:f.scale.clone()})),seatBounds=new THREE.Box3();
 function link(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);const d=b.clone().sub(a);m.scale.set(.055,d.length(),.055);m.quaternion.setFromUnitVectors(up,d.normalize());}
 function begin(){if(active)return true;stand={position:player.position.clone(),rotation:player.rotation.clone()};hidden=player.children.filter(o=>o!==avatar.body&&o!==rig&&!avatar.feet.includes(o)&&o.visible);hidden.forEach(o=>o.visible=false);
  const p=scene.meditation.position;player.position.set(site.x+p.x,site.y+p.y-bodyBottom+.12,site.z+p.z);player.rotation.set(0,0,0);player.visible=true;avatar.body.scale.setScalar(1);active=true;rig.visible=true;eyes.forEach(e=>e.o.scale.y=.017);glints.forEach(e=>e.o.visible=false);stats.active=true;update(0);return true;
 }
 function update(time){if(!active)return;const q=THREE.MathUtils.clamp(time/1.1,0,1),settle=q*q*(3-2*q),breath=Math.sin(time*1.7)*.003*settle;player.position.y=stats.seatTop-bodyBottom+.12+.27*(1-settle);avatar.body.position.y=-.12*settle+breath;avatar.body.rotation.set(.008*settle,0,0);avatar.shadow.visible=false;
  avatar.feet.forEach((f,i)=>{const s=i?1:-1;f.position.set(s*(.24-.1*settle),.13+.12*settle,.03+.49*settle);f.rotation.set(-.12*settle,s*1.05*settle,s*.08*settle);f.scale.set(.15+.02*settle,.115-.04*settle,.22-.07*settle);f.visible=true;});
  for(const a of arms){const shoulder=v(a.side*.44,.73,.06),elbow=v(a.side*.33,.57,.23),palm=v(a.side*.06,.73+breath,.35);link(a.meshes[0],shoulder,elbow);link(a.meshes[1],elbow,palm);a.palm.position.copy(palm);a.palm.rotation.z=-a.side*.1;}
  for(const leg of legs){const hip=v(leg.side*.1,.25,.08),knee=v(leg.side*.42,.22,.36),ankle=v(-leg.side*.14,.25,.51);link(leg.meshes[0],hip,knee);link(leg.meshes[1],knee,ankle);}
  player.updateMatrixWorld(true);seatBounds.setFromObject(star);stats.elapsed=+time.toFixed(3);stats.contactGap=+(seatBounds.min.y-stats.seatTop).toFixed(4);stats.settle=+settle.toFixed(3);stats.seated=settle>.99;
 }
 function reset(){if(!active)return;active=false;rig.visible=false;eyes.forEach(e=>e.o.scale.copy(e.scale));glints.forEach(e=>e.o.visible=e.visible);avatar.body.position.y=0;avatar.body.rotation.set(0,0,0);avatar.feet.forEach((f,i)=>{f.position.copy(feetRest[i].position);f.rotation.copy(feetRest[i].rotation);f.scale.copy(feetRest[i].scale);f.visible=true;});hidden.forEach(o=>o.visible=true);hidden=[];avatar.shadow.visible=true;
  if(stand){const p=stand.position,y=world.walkHeight(p.x,p.z);if(Number.isFinite(y)&&!world.physics.collides(p.x,y,p.z))player.position.set(p.x,y,p.z);else{const safe=world.safePlace(site.place);player.position.set(safe.x,safe.y,safe.z);}player.rotation.copy(stand.rotation);}stand=null;Object.assign(stats,{active:false,seated:false,contactGap:0});
 }
 return{begin,update,reset,rig,stats};
}
