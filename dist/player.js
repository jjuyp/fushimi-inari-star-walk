import * as THREE from 'three';
export function createPlayer(scene,M){
  const group=new THREE.Group(),body=new THREE.Group();group.add(body);scene.add(group);
  const outline=[];for(let i=0;i<10;i++){const angle=Math.PI/2+i*Math.PI/5,r=i%2?.34:.68;outline.push(new THREE.Vector2(Math.cos(angle)*r,Math.sin(angle)*r));}
  const shape=new THREE.Shape();for(let i=0;i<10;i++){const previous=outline[(i+9)%10],p=outline[i],next=outline[(i+1)%10],a=p.clone().lerp(previous,.15),b=p.clone().lerp(next,.15);if(i===0)shape.moveTo(a.x,a.y);else shape.lineTo(a.x,a.y);shape.quadraticCurveTo(p.x,p.y,b.x,b.y);}shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.25,bevelEnabled:true,bevelSegments:8,bevelSize:.07,bevelThickness:.08,steps:1,curveSegments:28});geometry.center();
  const gold=new THREE.MeshPhysicalMaterial({color:'#f2c947',roughness:.32,metalness:.04,clearcoat:.28,envMapIntensity:.6});
  const star=new THREE.Mesh(geometry,gold);star.position.y=.98;body.add(star);
  const sphere=new THREE.SphereGeometry(1,40,24),feet=[];
  function part(material,x,y,z,sx,sy,sz,parent=body){const mesh=new THREE.Mesh(sphere,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;}
  for(const s of [-1,1]){part(M.black,s*.19,1.06,.255,.046,.064,.022);part(M.white,s*.18,1.08,.278,.013,.019,.008);part(new THREE.MeshStandardMaterial({color:'#df9267',roughness:.7}),s*.29,.9,.254,.08,.027,.014);feet.push(part(new THREE.MeshStandardMaterial({color:'#b6852d',roughness:.5}),s*.24,.13,.03,.15,.115,.22,group));}
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(.075,.014,12,48,Math.PI),M.black);mouth.position.set(0,.95,.267);mouth.rotation.z=Math.PI;body.add(mouth);
  const scarf=new THREE.Mesh(new THREE.TorusGeometry(.23,.045,8,24),M.red);scarf.position.y=.54;scarf.rotation.x=Math.PI/2;body.add(scarf);
  const tail=new THREE.Mesh(new THREE.BoxGeometry(.12,.35,.05),M.red);tail.position.set(.15,.39,-.18);tail.rotation.z=-.25;body.add(tail);
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),gr=ctx.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(20,24,18,.5)');gr.addColorStop(1,'rgba(20,24,18,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,128,128);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  group.traverse(o=>{if(o.isMesh)o.castShadow=false});
  function animate(time,phase,moving,height,reduced){body.position.y=moving?Math.sin(phase*2)*.035:reduced?0:Math.sin(time*2)*.012;body.rotation.z=moving?Math.sin(phase)*.045:0;feet.forEach((f,i)=>{f.position.z=.03+(moving?Math.sin(phase+i*Math.PI)*.17:0);f.position.y=.13+(moving?Math.max(0,Math.cos(phase+i*Math.PI))*.07:0);});shadow.position.set(group.position.x,height+.03,group.position.z);}
  return{group,body,feet,shadow,animate};
}
