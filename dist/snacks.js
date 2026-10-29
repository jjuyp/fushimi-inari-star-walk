import * as THREE from 'three';
export function createSnacks(player,M){
 const group=new THREE.Group();group.position.set(.65,.77,.12);player.add(group);
 const ice=new THREE.Group(),dango=new THREE.Group();group.add(ice,dango);
 const cone=new THREE.Mesh(new THREE.ConeGeometry(.105,.35,16),M.rope);cone.rotation.z=Math.PI;cone.position.y=.16;ice.add(cone);
 const matcha=new THREE.MeshStandardMaterial({color:'#adc17c',roughness:.8});
 for(let i=0;i<5;i++){const radius=.14-i*.022,ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.04-i*.003,8,24),matcha);ring.rotation.x=Math.PI/2;ring.position.y=.34+i*.065;ice.add(ring);}const tip=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),matcha);tip.position.y=.66;ice.add(tip);
 const skewer=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.7,8),M.wood);skewer.position.y=.3;dango.add(skewer);const dangoColors=['#739b50','#fff4df','#e98c9c'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.78}));for(let i=0;i<3;i++){const ball=new THREE.Mesh(new THREE.SphereGeometry(.095,20,14),dangoColors[i]);ball.position.y=.22+i*.18;dango.add(ball);}group.visible=false;
 return{group,choose(kind){group.visible=kind!=='none';ice.visible=kind==='ice';dango.visible=kind==='dango';}};
}
