import * as T from 'three';
import {samplePrayer} from './prayer-timeline.js';

const clamp=T.MathUtils.clamp;
const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u)};
const point=(x,y,z)=>new T.Vector3(x,y,z);

// All poses share the player's materials and a small set of geometry. No video,
// animation textures, or per-frame geometry allocations are needed.
export function createStarActing({group,body,feet,gold,black,white,eyes,glints,smile}){
 const root=new T.Group();root.name='star-performance';body.add(root);
 const ballGeometry=new T.SphereGeometry(1,20,14),boneGeometry=new T.CylinderGeometry(1,1,1,12),up=point(0,1,0);
 const mouthMaterial=new T.MeshStandardMaterial({color:'#472c25',roughness:.65});
 function ball(parent,material,p,s){const o=new T.Mesh(ballGeometry,material);o.position.copy(p);o.scale.copy(s);parent.add(o);return o}
 const mouth=ball(body,mouthMaterial,point(0,.933,.282),point(.085,.075,.019));
 const tongue=ball(body,new T.MeshStandardMaterial({color:'#e8847b',roughness:.55}),point(0,.906,.302),point(.047,.018,.005));
 const closedEyes=[-1,1].map(s=>{const o=new T.Mesh(new T.TorusGeometry(.047,.009,8,24,Math.PI),black);o.position.set(s*.19,1.052,.281);body.add(o);return o});
 const brows=[-1,1].map(s=>{const o=new T.Mesh(new T.CapsuleGeometry(.008,.055,3,8),black);o.rotation.z=s*.6;o.position.set(s*.19,1.174,.27);body.add(o);return o});
 const stats={active:null,phase:'idle',expression:'neutral',mouthOpen:0,item:null,contact:0};
 function face(expression='neutral',amount=0){stats.expression=expression;stats.mouthOpen=amount;const closed=['happy','calm','chew','sleep'].includes(expression),surprised=expression==='surprised';
  eyes.forEach((o,i)=>{o.visible=!closed;o.scale.set(.046,surprised?.078:expression==='drink'?.044:.064,.022);glints[i].visible=!closed;closedEyes[i].visible=closed;closedEyes[i].rotation.z=expression==='sleep'?Math.PI:0;brows[i].visible=['think','surprised'].includes(expression);brows[i].rotation.z=(i?1:-1)*(expression==='think'?.9:.3)});
  smile.visible=amount<.08;smile.scale.set(1,1,1);mouth.visible=amount>=.08;mouth.scale.set(expression==='drink'?.035:surprised?.062:.088,Math.max(.012,amount*.086),.019);tongue.visible=mouth.visible&&expression!=='drink'&&expression!=='surprised';tongue.position.y=.933-mouth.scale.y*.57;tongue.scale.x=mouth.scale.x*.56;
 }
 const arms=[-1,1].map(s=>{const g=new T.Group();root.add(g);const shoulder=point(s*.405,.96,.07),elbow=ball(g,gold,shoulder,point(.052,.052,.052)),hand=ball(g,gold,point(s*.5,.7,.2),point(.075,.067,.06));const upper=new T.Mesh(boneGeometry,gold),lower=new T.Mesh(boneGeometry,gold);g.add(upper,lower);return{g,shoulder,elbow,hand,upper,lower}});
 const tokenShape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.055:.11,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)tokenShape.lineTo(x,y);else tokenShape.moveTo(x,y)}tokenShape.closePath();
 const token=new T.Mesh(new T.ExtrudeGeometry(tokenShape,{depth:.025,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2,steps:1}),new T.MeshStandardMaterial({color:'#ffc94f',emissive:'#b46f10',emissiveIntensity:.35,roughness:.3,metalness:.12}));root.add(token);token.visible=false;
 function bone(o,a,b){o.position.copy(a).add(b).multiplyScalar(.5);const direction=b.clone().sub(a);o.scale.set(.042,direction.length(),.042);o.quaternion.setFromUnitVectors(up,direction.normalize())}
 function arm(i,hand,elbow){const a=arms[i];a.elbow.position.copy(elbow);a.hand.position.copy(hand);bone(a.upper,a.shoulder,elbow);bone(a.lower,elbow,hand)}
 function pose(left,right,elbows){root.visible=true;arm(0,point(...left),point(...(elbows?.[0]||[-.54,.72,.28])));arm(1,point(...right),point(...(elbows?.[1]||[.54,.72,.28])))}
 let meal=null,gesture=null,lastTime=0;
 const duration={wave:3.2,jump:2.1,think:4.2,surprise:3,rest:7,reward:4};
 function reset(){if(meal){const {object,parent,position,rotation,scale,portion}=meal;if(portion){portion.parent.add(portion.object);portion.object.position.copy(portion.position);portion.object.rotation.copy(portion.rotation);portion.object.scale.copy(portion.scale)}parent.add(object);object.position.copy(position);object.rotation.copy(rotation);object.scale.copy(scale);meal=null}gesture=null;root.visible=token.visible=false;body.rotation.x=body.rotation.z=0;body.position.z=0;stats.bowDegrees=0;feet.forEach((o,i)=>{o.position.set((i?1:-1)*.24,.13,.03);o.rotation.set(0,0,0)});face();stats.active=null;stats.item=null;stats.phase='idle';stats.contact=0}
 function beginMeal(object,id){reset();meal={object,id,parent:object.parent,position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};body.add(object);object.rotation.set(0,0,0);object.scale.setScalar(id==='senbei'?.72:1);if(id==='sushi'){const o=object.children.find(o=>o.userData.foodPortion===1);if(o){meal.portion={object:o,parent:o.parent,position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()};root.add(o)}}stats.active='eat';stats.item=id;updateMeal(0)}
 function updateMeal(t){if(!meal)return;const {id,object,portion}=meal,raise=smooth(.85,2.6,t),lower=smooth(4.9,6.3,t),lift=raise*(1-lower),bite=smooth(2.65,3.05,t)*(1-smooth(3.6,3.95,t));stats.phase=t<.85?'ready':t<2.6?'raise':t<3.95?(id==='matcha'?'sip':'bite'):t<4.9?'chew':t<6.3?'lower':'happy';stats.contact=lift;const happy=t>6.1;
  face(happy?'happy':id==='matcha'&&t>2.6&&t<4.9?'drink':t>3.95&&t<4.9?'chew':'neutral',id==='matcha'&&t>2.55&&t<4.5?.28:bite*(.85+.15*Math.sin(t*8)));
  body.rotation.x=-.035*lift;body.rotation.z=happy?Math.sin(t*4)*.025:0;if(stats.phase==='chew'&&id!=='matcha')smile.scale.set(1+.1*Math.sin(t*13),.8+.2*Math.sin(t*13),1);
  if(id==='sushi'){
   object.position.set(-.34,.54,.48);object.rotation.z=.06;pose([-.34,.52,.48],[.17,.7+lift*.03,.52],[[ -.53,.68,.28],[.5,.71,.32]]);
   if(portion){const o=portion.object;o.position.set(T.MathUtils.lerp(-.16,.19,lift),T.MathUtils.lerp(.57,.69,lift),T.MathUtils.lerp(.48,.515,lift));o.rotation.set(0,0,-.08*lift);o.scale.setScalar(1-.24*smooth(3.25,3.8,t));arms[1].hand.position.set(o.position.x+.14,o.position.y+.055,o.position.z+.025);bone(arms[1].lower,arms[1].elbow.position,arms[1].hand.position)}
  }else if(id==='matcha'){
   object.position.set(0,.5+.06*lift,.58-.16*lift);object.rotation.x=.25*lift;const y=.56+.06*lift,z=.58-.16*lift;pose([-.22,y,z],[.22,y,z],[[-.5,.68,.25],[.5,.68,.25]]);
  }else{
   object.position.set(.17-.14*lift,.5+.13*lift,.55);object.rotation.set(-.68*lift,0,.3*lift);object.scale.setScalar(.72-.06*smooth(3.2,3.8,t));pose([-.25,.6,.35],[object.position.x+.105,object.position.y+.1,.59],[[-.49,.72,.22],[.48,.66,.35]]);
  }
 }
 function perform(id){if(!duration[id]||meal)return false;reset();gesture={id,start:lastTime,duration:duration[id]};stats.active=id;return true}
 function updateGesture(t){const {id}=gesture,f=t/duration[id];stats.phase=f<.18?'anticipation':f>.8?'settle':'perform';face('neutral');root.visible=true;const idle=[[-.48,.7,.25],[.48,.7,.25]];
  if(id==='wave'){const u=smooth(0,.6,t)*(1-smooth(2.5,3.2,t));pose(idle[0],[.48+Math.sin(t*12)*.095*u,.7+.7*u,.25],null);arms[1].elbow.position.set(.6,1.1,.17);bone(arms[1].upper,arms[1].shoulder,arms[1].elbow.position);bone(arms[1].lower,arms[1].elbow.position,arms[1].hand.position);face('happy')}
  if(id==='jump'){const u=smooth(.2,.65,t)*(1-smooth(1.15,1.65,t)),crouch=Math.sin(Math.PI*clamp(t/.4,0,1))*.12,jump=u*.48;body.position.y+=jump-crouch;feet.forEach(o=>o.position.y+=jump-crouch);pose([-.52,.7+u*.56,.22],[.52,.7+u*.56,.22],[[-.6,.85+u*.2,.13],[.6,.85+u*.2,.13]])}
  if(id==='reward'){const lift=smooth(.6,1.8,t),settle=smooth(3.3,4,t);token.visible=true;token.position.set(.36,.35+lift*.82-settle*.45,.43);token.rotation.y=Math.sin(t*2)*.25;pose([-.48,.7+lift*.55-settle*.55,.26],[.36,token.position.y-.04,.43],[[-.56,.82+lift*.25,.15],[.56,.64+lift*.3,.25]]);body.rotation.x=.13*(1-lift);body.rotation.z=Math.sin(t*5)*.025*lift;face(t<.6?'surprised':'happy',t<.6?.4:0);stats.phase=t<.6?'discover':t<1.8?'pick-up':t<3.3?'celebrate':'settle'}
  if(id==='think'){const u=smooth(0,.7,t)*(1-smooth(3.5,4.2,t));pose(idle[0],[.48-.4*u,.7+.16*u,.25+.09*u]);body.rotation.z=.07*u;face(t>2.7?'happy':'think')}
  if(id==='surprise'){const u=smooth(0,.35,t)*(1-smooth(1.9,3,t));pose([-.48-.09*u,.7+.38*u,.25],[.48+.09*u,.7+.38*u,.25]);body.rotation.x=-.1*u;face(u>.25?'surprised':'neutral',u*.85)}
  if(id==='rest'){const settle=smooth(.6,2,t)*(1-smooth(5.9,7,t));body.position.y-=settle*.14;feet.forEach(o=>{o.position.z=.03+settle*.18;o.rotation.x=-settle*.35});pose([-.32,.58,.4],[.32,.58,.4]);face(t<1.3?'neutral':t<6?'sleep':'happy',t<1.3?Math.sin(t/1.3*Math.PI)*.8:0);stats.phase=t<1.3?'yawn':t<2?'sit':t<5.9?'sleep':'wake'}
 }
 function tick(time,moving){lastTime=time;if(gesture){const t=time-gesture.start;if(t>=gesture.duration||(moving&&gesture.id!=='jump'))reset();else updateGesture(t)}else if(!meal&&stats.active===null&&stats.expression==='neutral'){const blink=Math.sin(time*1.37)> .995;eyes.forEach((o,i)=>{o.scale.y=blink?.008:.064;glints[i].visible=!blink})}}
 function ritual(type,t,propPoint){if(meal||gesture)return;if(!['pray','draw','stone','tie'].includes(type)){if(stats.active==='ritual')reset();return}stats.active='ritual';stats.phase=type;const u=(Math.sin(t*2)+1)*.5;face(type==='pray'?'calm':'think');
  if(type==='pray'){
   const {phase,bow,gap}=samplePrayer(t);stats.phase=phase;stats.bowDegrees=T.MathUtils.radToDeg(bow);stats.contact=gap*2;
   body.rotation.x=bow;body.position.y+=.43*(1-Math.cos(bow));body.position.z=-.43*Math.sin(bow);
   if(phase==='coin')pose([-.42,.64,.26],[.23,.72+.18*u,.40+.23*u]);
   else if(phase==='bell'){const swing=Math.sin(t*11)*.08;pose([-.22,1.21+swing,.56],[.21,1.20-swing,.56]);}
   else if(bow>.025)pose([-.28,.62,.30],[.28,.62,.30]);
   else if(phase==='clap')pose([-gap,1.035,.63],[gap,1.035,.63],[[-.41,.86,.35],[.41,.86,.35]]);
   else pose([-gap,.93,.47],[gap,.93,.47],[[-.37,.77,.25],[.37,.77,.25]]);
  }else if(type==='stone'&&propPoint){
   root.updateWorldMatrix(true,false);root.worldToLocal(focusPoint.copy(propPoint));
   const contact=smooth(1.1,2.4,t)*(1-smooth(5.72,6,t));
   const y=T.MathUtils.lerp(.73,focusPoint.y-.14,contact),z=T.MathUtils.lerp(.34,focusPoint.z-.24,contact),x=T.MathUtils.lerp(.24,.31,contact);
   pose([-x,y,z],[x,y,z],[[-.48,y*.46+.52,z*.59],[.48,y*.46+.52,z*.59]]);stats.contact=contact;face(contact>.9?'think':'calm');
  }else if(type==='tie')pose([-.12,.98,.43],[.12+Math.sin(t*4)*.035,.98,.43]);else pose([-.12,.77,.43],[.12,.8+Math.sin(t*7)*.04,.43]);}
 function hold(object,id){if(meal||gesture)return;if(!object||!object.userData.handHeld&&!['sushi','senbei','matcha'].includes(id)){root.visible=false;return}pose([-.47,.7,.2],[.65,id==='senbei'?.72:.66,.28],[[-.52,.75,.16],[.58,.76,.12]])}
 face();root.visible=false;
 const foxHand=new T.Vector3(),focusPoint=new T.Vector3();
 function foxPose(fox){if(!fox){if(stats.active==='fox')reset();return}if(meal||gesture)return;stats.active='fox';stats.phase=fox.pose;root.visible=true;face('happy');const u=smooth(0,.55,fox.elapsed)*smooth(0,.55,fox.remaining);body.rotation.x=.15*u;body.position.y-=.20*u;
  if(fox.pose==='pet'&&fox.touch){group.updateMatrixWorld(true);root.worldToLocal(foxHand.copy(fox.touch));foxHand.y+=.065+Math.sin(fox.elapsed*12)*.043;foxHand.z+=Math.sin(fox.elapsed*12)*.065;const r=[T.MathUtils.lerp(.48,foxHand.x,u),T.MathUtils.lerp(.7,foxHand.y,u),T.MathUtils.lerp(.25,Math.min(1.1,foxHand.z),u)];pose([-.43,.63,.3],r,[[-.53,.69,.20],[.39,.82,r[2]*.5]])}else{const h=.76+Math.sin(fox.elapsed*8)*.19*u;pose([-.51,h,.35],[.51,1.52-h,.35])}}
 return{stats,face,reset,beginMeal,updateMeal,perform,tick,ritual,hold,foxPose,get gesture(){return gesture},get busy(){return !!meal||!!gesture},get focus(){return meal||gesture?{x:group.position.x,y:group.position.y,z:group.position.z,angle:group.rotation.y}:null}};
}
