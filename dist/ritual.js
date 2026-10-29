import * as THREE from 'three';
export function createRitual(scene,world){
 const site=world.ritualSites[0];if(!site)return{update(){},near(){return false},pray(){}};
 const root=new THREE.Group();root.position.fromArray(site.anchor);root.rotation.y=site.angle;scene.add(root);
 const pivot=new THREE.Group();root.add(pivot);const gold=world.M.goldDark,ropeMat=world.M.rope;
 const bell=new THREE.Mesh(new THREE.SphereGeometry(.43,32,20),gold);bell.scale.set(1,.84,1);pivot.add(bell);
 const seam=new THREE.Mesh(new THREE.TorusGeometry(.425,.025,8,40),world.M.bronze);seam.rotation.x=Math.PI/2;pivot.add(seam);
 for(const x of [-.16,.16]){const slit=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),world.M.black);slit.position.set(x,-.17,.35);slit.scale.set(1,1.8,.25);pivot.add(slit);}
 const twist=new THREE.Group();pivot.add(twist);for(let k=0;k<3;k++){const ps=[];for(let i=0;i<=80;i++){const y=-.2-i/80*2.65,a=i*.62+k*Math.PI*2/3;ps.push(new THREE.Vector3(Math.cos(a)*.046,y,Math.sin(a)*.046));}const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),120,.035,5,false),k===1?world.M.redEdge:ropeMat);twist.add(mesh);}
 const knot=new THREE.Mesh(new THREE.TorusGeometry(.15,.065,10,24),ropeMat);knot.position.y=-2.85;pivot.add(knot);
 const tassel=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,.32,16),ropeMat);tassel.position.y=-3.05;pivot.add(tassel);
 const coin=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.018,20),world.M.gold);coin.visible=false;scene.add(coin);let active=0,audio;
 function near(player){return Math.hypot(player.x-site.position[0],player.z-site.position[2])<8;}
 function pray(){active=3.8;coin.visible=true;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();for(const [hz,vol]of [[831,.1],[1246,.06],[2027,.03]]){const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=hz;gain.gain.setValueAtTime(vol,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+3.5);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+3.6);}}catch{}}
 return{root,site,near,pray,update(dt){if(active<=0)return;active-=dt;const elapsed=3.8-active;pivot.rotation.x=Math.sin(elapsed*11)*.18*Math.max(0,active/3.8);coin.visible=elapsed<.9;if(coin.visible){coin.position.set(site.position[0],site.floor+2.15-elapsed*1.1,site.position[2]);coin.rotation.z=elapsed*10;}}};
}
