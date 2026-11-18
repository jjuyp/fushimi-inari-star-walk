import * as THREE from 'three';
import {CLAP_TIMES} from './prayer-timeline.js';
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
 const signCanvas=document.createElement('canvas');signCanvas.width=256;signCanvas.height=128;const sc=signCanvas.getContext('2d');sc.fillStyle='#513521';sc.fillRect(0,0,256,128);sc.strokeStyle='#bd995b';sc.lineWidth=5;sc.strokeRect(8,8,240,112);sc.fillStyle='#e2c17d';sc.font='bold 65px serif';sc.textAlign='center';sc.fillText('賽 銭',128,88);const tx=new THREE.CanvasTexture(signCanvas);tx.colorSpace=THREE.SRGBColorSpace;const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.5),new THREE.MeshStandardMaterial({map:tx,roughness:.85}));plaque.rotation.y=site.angle;plaque.position.set(site.position[0]+Math.sin(site.angle)*.71,site.floor+.66,site.position[2]+Math.cos(site.angle)*.71);scene.add(plaque);
 const coin=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.018,20),world.M.gold);coin.visible=false;scene.add(coin);let active=0,audio,clapBuffer,clapIndex=0;
 const stats={claps:[],playing:false};
 function near(player){return Math.hypot(player.x-site.position[0],player.z-site.position[2])<8;}
 function prepare(player){
  const dx=Math.sin(site.angle),dz=Math.cos(site.angle);
  for(const distance of [2.22,2.45,2.72,3])for(const side of [0,.26,-.26]){
   const x=site.position[0]+dx*distance+dz*side,z=site.position[2]+dz*distance-dx*side,y=world.walkHeight(x,z);
   if(!Number.isFinite(y)||world.physics.collides(x,y,z))continue;
   player.position.set(x,y,z);player.rotation.y=Math.atan2(site.position[0]-x,site.position[2]-z);return true;
  }return false;
 }
 const nodes=new Set();
 function mark(node){nodes.add(node);node.onended=()=>nodes.delete(node);}
 function pray(main=true){active=main?3.8:0;coin.visible=main;clapIndex=0;stats.claps=[];stats.playing=true;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();for(const [hz,vol]of [[831,.1],[1246,.06],[2027,.03]]){const osc=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+1.24;osc.frequency.value=hz;gain.gain.setValueAtTime(vol,start);gain.gain.exponentialRampToValueAtTime(.0001,start+2.3);osc.connect(gain).connect(audio.destination);osc.start(start);osc.stop(start+2.4);mark(osc);}}catch{}}
 function clap(elapsed){
  if(!stats.playing||clapIndex>=CLAP_TIMES.length||elapsed<CLAP_TIMES[clapIndex])return;
  const target=CLAP_TIMES[clapIndex++],event={target,elapsed,audio:false};stats.claps.push(event);
  if(!audio||audio.state!=='running')return;
  if(!clapBuffer){
   clapBuffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.17),audio.sampleRate);const samples=clapBuffer.getChannelData(0);
   let previous=0,seed=57329;
   for(let j=0;j<samples.length;j++){
    seed=(seed*16807)%2147483647;const noise=seed/1073741823.5-1,t=j/audio.sampleRate;previous=previous*.68+noise*.32;
    const attack=Math.min(1,t/.0017),early=Math.exp(-t*57),late=t>.018?.24*Math.exp(-(t-.018)*38):0;
    samples[j]=(.90*noise+.36*previous)*attack*(early+late)+.09*Math.sin(t*725*Math.PI*2)*Math.exp(-t*47);
   }
  }
  const source=audio.createBufferSource(),tone=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=clapBuffer;tone.type='bandpass';tone.frequency.value=1530;tone.Q.value=.63;gain.gain.value=.68;source.connect(tone).connect(gain).connect(audio.destination);source.start();mark(source);event.audio=true;
 }
 function stop(){active=0;stats.playing=false;coin.visible=false;pivot.rotation.x=0;for(const node of nodes){try{node.stop();}catch{}}nodes.clear();}
 return{root,site,stats,near,prepare,pray,clap,stop,update(dt){if(active<=0)return;active-=dt;const elapsed=3.8-active;const grip=Math.min(1,Math.max(0,(elapsed-1.22)/.18));pivot.rotation.x=Math.sin(elapsed*11)*.18*grip*Math.max(0,active/2.6);coin.visible=elapsed<.9;if(coin.visible){coin.position.set(site.position[0],site.floor+2.15-elapsed*1.1,site.position[2]);coin.rotation.z=elapsed*10;}}};
}
