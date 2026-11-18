import * as T from 'three';
import {chooseClearing,sideArrival} from './side-shrines.js';
import {curvedRoof} from './geometry.js';

export const EMA_STYLES=[['study','合格祈願','#a74d34'],['bond','良緣','#b55868'],['health','健康','#55735b'],['road','旅の安全','#4b6977'],['wealth','金運上昇','#a96c35']];
const cube=new T.BoxGeometry(1,1,1),shape=new T.Shape();
shape.moveTo(-.37,-.238);shape.lineTo(.37,-.238);shape.lineTo(.37,.12);shape.lineTo(0,.24);shape.lineTo(-.37,.12);shape.closePath();
const blank=new T.ExtrudeGeometry(shape,{depth:.034,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2});
const face=new T.ShapeGeometry(shape),uv=face.attributes.uv,pos=face.attributes.position;
for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/.74+.5,pos.getY(i)/.478+.5);
const material=color=>new T.MeshStandardMaterial({color,roughness:.86});
function mesh(g,geo,mat,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);o.receiveShadow=true;return o;}
function box(g,m,x,y,z,w,h,d){return mesh(g,cube,m,x,y,z,w,h,d);}
function surface(w,h,draw){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);return canvas;}
function texture(canvas){const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function flower(c,x,y,r,color){c.save();c.translate(x,y);c.fillStyle=color;for(let i=0;i<5;i++){c.rotate(Math.PI*2/5);c.beginPath();c.ellipse(0,-r*.48,r*.31,r*.47,0,0,Math.PI*2);c.fill();}c.restore();}
function japan(c,x,y,s,color,kind){
 c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=color;c.strokeStyle=color;c.lineCap='round';c.lineWidth=6;
 if(kind==='road'||kind==='study'){
  c.beginPath();c.moveTo(-40,-18);c.quadraticCurveTo(0,-6,40,-18);c.lineTo(40,-31);c.quadraticCurveTo(0,-19,-40,-31);c.closePath();c.fill();c.fillRect(-32,-6,64,7);
  for(const i of [-1,1]){c.beginPath();c.moveTo(i*22,-17);c.lineTo(i*25,34);c.stroke();}
 }else{
  c.beginPath();c.moveTo(-29,-36);c.quadraticCurveTo(-43,-20,-33,-3);c.quadraticCurveTo(-25,20,0,34);c.quadraticCurveTo(25,20,33,-3);c.quadraticCurveTo(43,-20,29,-36);c.lineTo(12,-13);c.quadraticCurveTo(0,-20,-12,-13);c.closePath();c.stroke();
  for(const i of [-1,1]){c.beginPath();c.moveTo(i*20,1);c.quadraticCurveTo(i*12,4,i*9,10);c.stroke();}c.beginPath();c.ellipse(0,22,5,3,0,0,Math.PI*2);c.fill();
 }
 c.restore();
}
function wood(c,w,h){
 c.fillStyle='#e8b793';c.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){
  const y=i*h/70;c.strokeStyle=i%3?'#a7755b33':'#fff1c459';c.lineWidth=i%4===0?1.1:.65;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*.39,y+3*Math.sin(i),w*.65,y-3*Math.cos(i),w,y+.8);c.stroke();
 }
}
function emaArt(style,text=''){
 const [id,name,color]=EMA_STYLES.find(s=>s[0]===style)||EMA_STYLES[0];
 return surface(320,205,(c,w,h)=>{
  wood(c,w,h);japan(c,78,126,.76,color,id);
  flower(c,27,106,13,'#bc655452');flower(c,119,160,15,'#c5746955');flower(c,271,58,14,'#c66d4766');flower(c,288,152,18,'#c7765c55');
  c.font='bold 33px serif';c.fillStyle='#553026';c.textAlign='center';c.fillText(name,202,text?107:128,183);
  if(text){const words=[...text].slice(0,36);c.font='bold 16px serif';for(let i=0;i<Math.ceil(words.length/12);i++)c.fillText(words.slice(i*12,(i+1)*12).join(''),201,131+i*16,184);}
  c.fillStyle='#9e533c';c.beginPath();c.arc(w/2,20,5,0,Math.PI*2);c.fill();
 });
}
export function createEmaRack(world,scene){
 const placement=chooseClearing(world,world.places.gate,{width:4.9,depth:1.8,max:38,viewDistance:6.3});
 if(!placement)return null;
 const M=world.M,g=new T.Group();g.name='繪馬掛所';g.position.set(placement.x,placement.y,placement.z);g.rotation.y=placement.yaw;scene.add(g);
 const paint=material('#bb4a30'),rim=material('#814732'),woodMat=material('#ba7d54'),rope=material('#a52421'),roofMat=material('#393f46'),black=material('#352e29'),warm=material('#ffe1a3');warm.emissive.set('#e49546');warm.emissiveIntensity=1.05;
 const panelGeo=new T.CylinderGeometry(.013,.013,1,8),ring=new T.TorusGeometry(.041,.013,5,12);
 const bottom=Math.min(placement.low-placement.y-.04,-.03);
 box(g,M.wall,0,(.113+bottom)/2,.02,4.93,.113-bottom,1.61);
 for(const x of [-2.23,2.23]){box(g,M.wall,x,.22,.01,.34,.33,.33);box(g,paint,x,1.43,0,.225,2.63,.26);box(g,rim,x,2.70,0,.29,.13,.33);}
 for(const y of [.56,1.3,2.065,2.47]){box(g,paint,0,y,0,4.49,.15,.21);box(g,rim,0,y-.079,0,4.49,.028,.23);}
 box(g,rim,0,2.76,-.04,4.98,.12,1.34);mesh(g,curvedRoof(5.25,1.60,.51,{ridge:.93,curl:.14}),roofMat,0,2.81,-.055);
 const tileRidge=new T.CylinderGeometry(.018,.019,1,6);
 const darkTile=material('#292f35'),lightTile=material('#475057');
 for(let i=-15;i<=15;i++){
  const x=i*.162,eave=.14*Math.pow(Math.abs(x)/2.625,4);
  for(const s of [-1,1]){
   const roll=mesh(g,tileRidge,i%4===0?lightTile:darkTile,x*.992,2.816+eave*.65,-.055+s*.718,1,.20,1);
   roll.rotation.x=s*1.52;
   box(g,rim,x,2.725,-.055+s*.62,.071,.108,.32);
  }
 }
 for(const s of [-1,1])mesh(g,tileRidge,roofMat,s*1.187,3.336,-.055,1.95,2.4,1.95).rotation.z=Math.PI/2;
 for(const x of [-2.23,2.23]){
  box(g,rim,x,1.35,.043,.28,.115,.33);
  box(g,black,x,.43,.012,.26,.28,.28);
 }
 const header=surface(512,160,(c,w,h)=>{wood(c,w,h);flower(c,68,81,33,'#b7523b');flower(c,443,81,33,'#b7523b');c.fillStyle='#48271e';c.textAlign='center';c.font='bold 92px serif';c.fillText('絵 馬',w/2,116);});
 box(g,M.wood,0,2.45,.16,1.66,.45,.09);mesh(g,new T.PlaneGeometry(1.59,.42),new T.MeshStandardMaterial({map:texture(header),roughness:.85}),0,2.45,.207);
 for(const x of [-2.03,2.03]){
  box(g,black,x,2.28,.29,.02,.32,.02);box(g,black,x,2.115,.30,.26,.044,.235);box(g,warm,x,1.95,.30,.194,.29,.178);box(g,black,x,1.79,.30,.26,.042,.234);
  for(const a of [-1,1])for(const b of [-1,1])box(g,black,x+a*.101,1.95,.30+b*.093,.018,.31,.018);
 }
 const side=surface(144,512,(c,w,h)=>{wood(c,w,h);c.fillStyle='#7c3929';c.textAlign='center';c.font='bold 52px serif';[...'願いごと'].forEach((ch,i)=>c.fillText(ch,w/2,81+i*64));japan(c,w/2,411,.79,'#9d4737','bond');});
 box(g,woodMat,-2.13,1.30,.28,.35,1.20,.056);mesh(g,new T.PlaneGeometry(.32,1.16),new T.MeshStandardMaterial({map:texture(side)}),-2.13,1.30,.313);
 const example=EMA_STYLES.map(([id])=>new T.MeshStandardMaterial({map:texture(emaArt(id)),roughness:.84}));
 const userBoards=new T.Group();g.add(userBoards);
 function plaque(parent,col,row,mat,layer=0){
  const x=(col-2)*.755,y=row===0?1.68:.903,z=.21+layer*.074;
  const card=new T.Group();card.position.set(x,y,z);card.rotation.y=layer*.036+Math.sin(col*2+row)*.022;card.rotation.z=Math.sin(col*3.17+layer)*.019;parent.add(card);
  mesh(card,blank,woodMat,0,0,0);mesh(card,face,mat,0,0,.045);
  if(layer<0)return;
  for(const s of [-1,1]){const thread=mesh(card,panelGeo,rope,s*.045,.29,.045,1,.31,1);thread.rotation.z=s*.13;}
  mesh(card,ring,rope,0,.408,.062);mesh(card,ring,rope,0,.211,.058, .56,.46,.70);
 }
 for(let row=0;row<2;row++)for(let col=0;col<5;col++){
  const mat=example[(col+row*3)%example.length];plaque(g,col,row,mat,-1);plaque(g,col,row,mat,0);
 }
 const stats={count:0};
 function refresh(saved){
  userBoards.traverse(o=>{if(o.material?.userData.userEma){o.material.map.dispose();o.material.dispose();}});userBoards.clear();
  const entries=Array.isArray(saved)?saved:[];stats.count=entries.length;
  entries.slice(-10).reverse().forEach((e,i)=>{const mat=new T.MeshStandardMaterial({map:texture(emaArt(e.style,e.wish)),roughness:.85});mat.userData.userEma=true;plaque(userBoards,[2,3,1,4,0][i%5],i>=5?1:0,mat,1);});
 }
 const pictures=Object.fromEntries(EMA_STYLES.map(([name])=>[name,emaArt(name).toDataURL('image/webp',.9)]));
 world.physics.box('繪馬架',placement.x,placement.y+1.15,placement.z,4.65,2.3,.58,placement.yaw);
 const arrival=sideArrival(world,placement,3.55,-1.58);
 const [fx,fz]=placement.point(0,.68);
 return{id:'ema',place:'gate',name:'繪馬掛所・寫下心願',x:placement.x,y:placement.y,z:placement.z,angle:placement.yaw,range:4.1,group:g,arrival,pictures,refresh,stats,userBoards,cameraTarget:new T.Vector3(fx,placement.y+1.73,fz)};
}
