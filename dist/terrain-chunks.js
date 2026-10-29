import * as THREE from 'three';
// Split an existing regular grid without changing its vertices, normals or diagonals.
export function chunkTerrain(geometry,columns,rows,material,span=64){
 const group=new THREE.Group();group.name='terrain chunks';const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
 for(let z=0;z<rows;z+=span)for(let x=0;x<columns;x+=span){const w=Math.min(span,columns-x),h=Math.min(span,rows-z),ps=[],ns=[],us=[],idx=[];
  for(let j=0;j<=h;j++)for(let i=0;i<=w;i++){const k=(z+j)*(columns+1)+x+i;ps.push(p.getX(k),p.getY(k),p.getZ(k));ns.push(n.getX(k),n.getY(k),n.getZ(k));us.push(uv.getX(k),uv.getY(k));}
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=j*(w+1)+i,b=a+w+1;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(ns,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(us,2));g.setIndex(idx);g.computeBoundingSphere();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;group.add(mesh);
 }geometry.dispose();return group;
}
