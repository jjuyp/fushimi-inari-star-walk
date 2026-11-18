import * as T from 'three';
import {curvedRoof} from './geometry.js';

const cube=new T.BoxGeometry(1,1,1),ball=new T.SphereGeometry(1,28,20);
const v=(x,y,z)=>new T.Vector3(x,y,z);
const mat=(color,roughness=.84)=>new T.MeshStandardMaterial({color,roughness});
const easing=t=>T.MathUtils.smoothstep(t,0,1);
function mesh(g,geometry,material,x,y,z,sx=1,sy=1,sz=1){
 const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.receiveShadow=true;g.add(o);return o;
}
function box(g,m,x,y,z,w,h,d){return mesh(g,cube,m,x,y,z,w,h,d);}
function image(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function granite(){return image(384,384,(c,w,h)=>{
 c.fillStyle='#ac9f8f';c.fillRect(0,0,w,h);let seed=4397;
 const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 for(let i=0;i<34000;i++){
  const k=rand(),x=rand()*w,y=rand()*h,r=.35+rand()*1.8;
  c.fillStyle=k<.27?'#514a423f':k<.56?'#f0dfc951':k<.77?'#665f5944':'#87756655';c.fillRect(x,y,r,r*(.5+rand()));
 }
 for(let i=0;i<57;i++){const x=rand()*w,y=rand()*h,r=9+rand()*38;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'#d7c2a042':'#433f3b29');g.addColorStop(1,'#b4a39100');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
});}
function plane(g,texture,w,h,x,y,z){return mesh(g,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,roughness:.93,transparent:true,alphaTest:.12,polygonOffset:true,polygonOffsetFactor:-2}),x,y,z);}
function letters(c,text,x,y,size,color='#6f3025'){c.font='bold '+size+'px serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);}
function blossom(c,x,y,r){c.save();c.translate(x,y);c.fillStyle='#f4d9b5';for(let i=0;i<5;i++){c.rotate(Math.PI*2/5);c.beginPath();c.ellipse(0,-r*.49,r*.30,r*.49,0,0,Math.PI*2);c.fill();}c.restore();}
function fox(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#f4d9b5';c.beginPath();c.moveTo(-24,-28);c.quadraticCurveTo(-33,-17,-25,4);c.quadraticCurveTo(-20,15,0,29);c.quadraticCurveTo(20,15,25,4);c.quadraticCurveTo(33,-17,24,-28);c.lineTo(11,-11);c.quadraticCurveTo(0,-15,-11,-11);c.closePath();c.fill();c.strokeStyle='#963831';c.lineWidth=2.2;for(const a of [-1,1]){c.beginPath();c.moveTo(a*17,-4);c.quadraticCurveTo(a*10,-2,a*8,5);c.stroke();}c.beginPath();c.ellipse(0,15,3,2,0,0,Math.PI*2);c.fillStyle='#963831';c.fill();c.restore();}
function stoneGeometry(){
 const g=ball.clone(),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),rough=1+.035*Math.sin(x*12+y*17+z*9)+.024*Math.cos(y*15-x*13);
  p.setXYZ(i,x*rough,Math.max(-.87,y*rough),z*rough);
 }
 g.computeVertexNormals();return g;
}
function capital(g,material,x){
 const vertices=[],uv=[],index=[],rings=[[1.07,1.08],[1.07,1.2],[.84,1.27],[.55,1.38]],corners=[[-1,-1],[-1,1],[1,1],[1,-1]];
 for(let face=0;face<4;face++)for(let j=0;j<rings.length-1;j++){
  const n=vertices.length/3;
  for(const [row,end] of [[j,0],[j,1],[j+1,0],[j+1,1]]){
   const [width,y]=rings[row],[px,pz]=corners[(face+end)%4];vertices.push(x+px*width/2,y,pz*width*.48);uv.push(.12+end*.76,.12+(y-1.08)*.83);
  }
  index.push(n,n+1,n+2,n+1,n+3,n+2);
 }
 const top=vertices.length/3;for(const [a,b] of corners){vertices.push(x+a*.275,1.38,b*.264);uv.push((a+1)*.5,(b+1)*.5);}index.push(top,top+1,top+2,top,top+2,top+3);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();mesh(g,geo,material,0,0,0);
}

export function createOmokaru(site,world){
 const g=site.group,M=world.M;g.name='奧社・重輕石';
 const map=granite(),light=new T.MeshStandardMaterial({map,color:'#cdbfab',roughness:.96,bumpMap:map,bumpScale:.018,side:T.DoubleSide}),dark=new T.MeshStandardMaterial({map,color:'#9d9284',roughness:.96,bumpMap:map,bumpScale:.026}),moss=new T.MeshStandardMaterial({map,color:'#a4a593',roughness:1,bumpMap:map,bumpScale:.035});
 const wood=mat('#683c26'),red=mat('#ae4428'),roofMat=mat('#464750'),roofEdge=mat('#33343b'),paper=mat('#fff0d2');
 box(g,light,0,.045,.07,4.85,.12,2.07);box(g,moss,0,.82,-1.04,4.46,1.58,.16);
 const rock=stoneGeometry(),wall=new T.InstancedMesh(rock,moss,33),dummy=new T.Object3D();
 for(let j=0;j<4;j++)for(let i=0;i<8;i++){
  const k=j*8+i;dummy.position.set((i-3.5)*.56+(j%2?.16:-.08),.28+j*.40,-.92-.07*Math.sin(k));dummy.scale.set(.35+.035*Math.cos(k*3),.26+.025*Math.sin(k*4),.30);dummy.rotation.y=k*.89;dummy.updateMatrix();wall.setMatrixAt(k,dummy.matrix);wall.setColorAt(k,new T.Color().setHSL(.105+(k%5)*.018,.19,.52+.16*Math.sin(k*2.33)**2));
 }wall.count=32;wall.receiveShadow=true;g.add(wall);
 for(const x of [-2.06,2.06]){
  box(g,light,x,.19,-.31,.42,.31,.44);box(g,red,x,1.08,-.31,.23,1.56,.25);box(g,wood,x,2.30,-.31,.24,.91,.26);
  box(g,wood,x,2.62,-.02,.37,.18,.75);
 }
 box(g,wood,0,2.72,-.20,4.7,.23,.39);box(g,M.wood,0,2.84,.14,4.95,.18,1.03);
 const roof=curvedRoof(5.04,2.36,.52,{ridge:.93,curl:.16});mesh(g,roof,roofMat,0,2.91,-.06);
 for(let i=-5;i<=5;i++){const x=i*.44;const geo=new T.TubeGeometry(new T.CatmullRomCurve3([v(x,2.95,1.13),v(x,3.03,.76),v(x,3.17,.33),v(x,3.43,-.06),v(x,3.16,-.47),v(x,2.97,-1.25)]),16,.024,5,false);mesh(g,geo,roofEdge,0,0,0);}
 const cloth=image(768,224,(c,w,h)=>{c.fillStyle='#a93229';c.fillRect(0,0,w,h);for(let x=0;x<w;x++){c.fillStyle='rgba(57,16,13,'+(.08+.055*Math.sin(x*.116))+')';c.fillRect(x,0,1,h);}fox(c,168,113,1.55);blossom(c,w/2,109,44);fox(c,600,113,1.55);c.fillStyle='#6f2522';c.fillRect(w/2-2,0,4,h);});
 const clothGeo=new T.PlaneGeometry(3.82,.82,45,7),cp=clothGeo.attributes.position;
 for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i);cp.setXYZ(i,x,y+.019*Math.cos(x*12),Math.sin(x*12)*.033);}clothGeo.computeVertexNormals();
 mesh(g,clothGeo,new T.MeshStandardMaterial({map:cloth,side:T.DoubleSide,roughness:1}),0,2.30,-.5);
 box(g,M.rope,0,2.74,-.35,4.22,.061,.063);
 for(const x of [-1.38,-.45,.46,1.39])for(let i=0;i<3;i++){const p=box(g,paper,x+(i%2?.047:0),2.65-i*.12,-.31,.105,.148,.015);p.rotation.z=i%2?-.54:.53;}
 const etch=image(128,256,(c,w,h)=>[...'おもかる石'].forEach((ch,i)=>letters(c,ch,w/2,30+i*48,47,'#8e3328')));
 const stones=[];
 for(const x of [-.94,.94]){
  box(g,light,x,.18,0,.82,.24,.79);box(g,light,x,.69,0,.54,1.0,.50);capital(g,light,x);
  plane(g,etch,.31,.86,x,.72,.254);
  const stone=mesh(g,rock,dark,x,1.685,0,.384,.35,.389);stone.rotation.y=x*.43;stone.castShadow=true;stones.push(stone);
  world.physics.box('重輕石石柱',site.x+x,site.y+.72,site.z,1.04,1.42,1.05);
 }
 for(const x of [-2.06,2.06])world.physics.box('重輕石木柱',site.x+x,site.y+1.37,site.z-.31,.27,2.7,.31);
 world.physics.box('重輕石後石牆',site.x,site.y+.90,site.z-.94,4.51,1.8,.42);
 const boardMap=image(360,460,(c,w,h)=>{
  c.fillStyle='#d2a56f';c.fillRect(0,0,w,h);
  for(let i=0;i<58;i++){c.strokeStyle=i%2?'#a66a414a':'#fbdb9c65';c.beginPath();c.moveTo(i*7,0);c.bezierCurveTo(i*7+17,140,i*7-12,230,i*7+3,h);c.stroke();}
  letters(c,'おもかる石',w/2,73,47,'#49311e');letters(c,'重輕石',w/2,125,26,'#693524');
  c.fillStyle='#ad7445';c.fillRect(30,152,300,3);
  ['先在心中許願','再用雙手慢慢舉起','感受比想像輕或重'].forEach((s,i)=>letters(c,s,w/2,203+i*51,24,'#593823'));
  blossom(c,w/2,380,27);
 });
 const bx=2.93,bz=.08;
 box(g,wood,bx,.75,bz,.12,1.47,.12);
 box(g,M.wood,bx,1.68,bz,1.02,1.31,.098);
 plane(g,boardMap,.978,1.25,bx,1.68,bz+.054);
 for(const s of [-1,1]){const end=box(g,M.wood,bx+s*.26,2.368,bz,.59,.065,.16);end.rotation.z=-s*.27;}
 world.physics.box('重輕石木牌',site.x+bx,site.y+.9,site.z+bz,.18,1.8,.19);
 const stats={side:null,lifting:false,rise:0};let selected=0;
 const cameraTarget=v(site.x-.16,site.y+1.46,site.z+.26);
 function begin(index,player){
  selected=index===1?1:0;const stone=stones[selected];
  for(const d of [1.02,1.14,1.28,1.50]){
   const x=site.x+stone.position.x,z=site.z+d,y=world.walkHeight(x,z);if(!Number.isFinite(y)||world.physics.collides(x,y,z))continue;
   player.position.set(x,y,z);player.rotation.y=Math.PI;stats.side=selected;cameraTarget.set(site.x+stone.position.x*.52,site.y+1.43,site.z+.35);return true;
  }
  return false;
 }
 const touch=v(0,0,0);
 function update(t){const rise=.36*easing((t-2.4)/1.12)*(1-easing((t-4.6)/1.18));stones[selected].position.y=1.685+rise;stones[selected].getWorldPosition(touch);stats.lifting=rise>.015;stats.rise=rise;return touch;}
 function reset(){for(const o of stones)o.position.y=1.685;stats.side=null;stats.lifting=false;stats.rise=0;cameraTarget.set(site.x-.16,site.y+1.46,site.z+.26);}
 return{stones,stats,cameraTarget,begin,update,reset};
}
