import * as THREE from 'three';

// A depth-only pass rejects hidden layers before running expensive PBR leaf
// shading. Geometry, alpha threshold and MSAA coverage stay identical.
export function createFoliageDepth(scene,world,flora){
 const geometrySet=new Set(world.trees.templates.flatMap(t=>[t.branches,t.leaves,t.lowBranches,t.lowLeaves])),sources=[],materials=new Map(),depthScene=new THREE.Scene();
 scene.traverse(o=>{if(o.isInstancedMesh&&!o.userData.shadowOnly&&geometrySet.has(o.geometry))sources.push(o);});
 for(const source of sources){const mat=source.material;if(!materials.has(mat)){
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.BasicDepthPacking,side:mat.side,map:mat.alphaTest>0?mat.map:null,alphaTest:mat.alphaTest,alphaToCoverage:mat.alphaToCoverage,depthWrite:true,colorWrite:false});
  // MeshDepthMaterial normally writes opacity rather than the alpha-to-coverage
  // result. Preserve diffuseColor.a so every MSAA sample matches the color pass.
  depth.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('vec4( vec3( 1.0 - fragCoordZ ), opacity )','vec4( vec3( 1.0 - fragCoordZ ), diffuseColor.a )');};
  materials.set(mat,{depth,originalFunc:mat.depthFunc,originalWrite:mat.depthWrite});
 }
 const mesh=new THREE.InstancedMesh(source.geometry,materials.get(mat).depth,source.instanceMatrix.count);mesh.instanceMatrix=source.instanceMatrix;mesh.boundingSphere=source.boundingSphere?.clone()||null;mesh.matrixAutoUpdate=false;mesh.userData.source=source;depthScene.add(mesh);
 }
 let active=false;
 function setActive(value){if(value===active)return;active=value;for(const [mat,record]of materials){mat.depthFunc=value?THREE.EqualDepth:record.originalFunc;mat.depthWrite=value?false:record.originalWrite;}}
 function sync(){for(const [mat,record]of materials){if(mat.alphaTest>0&&record.depth.map!==mat.map){record.depth.map=mat.map;record.depth.needsUpdate=true;}record.depth.alphaTest=mat.alphaTest;record.depth.alphaToCoverage=mat.alphaToCoverage;}for(const mesh of depthScene.children){const s=mesh.userData.source;mesh.visible=s.visible&&s.count>0;mesh.count=s.count;}}
 return{scene:depthScene,setActive,sync,sourceCount:sources.length};
}
