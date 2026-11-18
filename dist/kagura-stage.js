import * as T from 'three';

const boxGeometry=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,20,14),axis=new T.Vector3(0,1,0);
const vec=(x,y,z)=>new T.Vector3(x,y,z);
const ease=t=>T.MathUtils.smoothstep(t,0,1);
const material=(color,roughness=.72)=>new T.MeshStandardMaterial({color,roughness});
function mesh(parent,geometry,mat,position,scale=[1,1,1]){
 const object=new T.Mesh(geometry,mat);object.position.set(...position);object.scale.set(...scale);parent.add(object);return object;
}
function box(parent,mat,x,y,z,w,h,d){return mesh(parent,boxGeometry,mat,[x,y,z],[w,h,d]);}
function ellipse(parent,mat,x,y,z,w,h,d){return mesh(parent,sphere,mat,[x,y,z],[w,h,d]);}
function tube(parent,mat,points,radius){const curve=new T.CatmullRomCurve3(points.map(p=>vec(...p)));return mesh(parent,new T.TubeGeometry(curve,14,radius,6,false),mat,[0,0,0]);}
function lathe(parent,mat,profile,x,y,z){return mesh(parent,new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),36),mat,[x,y,z]);}
function texture(width,height,paint){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;paint(canvas.getContext('2d'),width,height);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;}
function blossom(c,x,y,r,color){
 c.save();c.translate(x,y);c.fillStyle=color;
 for(let i=0;i<5;i++){c.rotate(2*Math.PI/5);c.beginPath();c.ellipse(0,-r*.48,r*.31,r*.49,0,0,Math.PI*2);c.fill();}
 c.fillStyle='#f4d4a0';c.beginPath();c.arc(0,0,r*.125,0,Math.PI*2);c.fill();c.restore();
}

function createPavilion(g,M){
 const vermilion=material('#bc4e2d'),edge=material('#94361f'),brass=material('#d4a04f',.45),ridge=material('#35424b'),tile=material('#495463');
 const floorY=.49;
 box(g,M.wall,0,.045,0,6.1,.13,3.9);box(g,M.darkWood,0,.245,0,5.8,.43,3.55);box(g,M.wood,0,.45,0,5.95,.085,3.66);
 const boards=new T.InstancedMesh(boxGeometry,M.wood,23),matrix=new T.Matrix4();
 for(let i=0;i<23;i++){matrix.makeScale(.25,.025,3.57).setPosition((i-11)*.252,.488,0);boards.setMatrixAt(i,matrix);boards.setColorAt(i,new T.Color().setScalar(.88+.12*Math.sin(i*1.747)**2));}g.add(boards);boards.receiveShadow=true;
 box(g,M.darkWood,0,.144,2.11,2.03,.22,.62);box(g,M.wood,0,.285,1.92,1.9,.17,.56);
 for(const x of [-2.60,2.60])for(const z of [-1.44,1.35]){
  box(g,vermilion,x,1.89,z,.20,2.82,.20);box(g,edge,x,.61,z,.25,.20,.25);box(g,brass,x,3.13,z,.24,.11,.23);
 }
 for(const z of [-1.47,1.42]){box(g,vermilion,0,3.14,z,5.57,.22,.20);box(g,edge,0,3.29,z,5.92,.11,.24);}
 for(const x of [-2.6,2.6])box(g,vermilion,x,3.15,-.02,.18,.20,3.02);
 for(const s of [-1,1]){
  for(const x of [1.16*s,2.68*s]){box(g,vermilion,x,.79,1.72,.15,.58,.15);box(g,ridge,x,1.10,1.72,.19,.08,.19);}
  for(const y of [.68,.92]){box(g,vermilion,1.92*s,y,1.72,1.62,.082,.09);box(g,vermilion,2.68*s,y,.82,.09,.08,1.68);}
 }
 const rafters=new T.InstancedMesh(boxGeometry,brass,22);
 for(let i=0;i<22;i++){matrix.makeScale(.095,.15,.37).setPosition(((i%11)-5)*.51,3.335,i<11?-1.65:1.65);rafters.setMatrixAt(i,matrix);}g.add(rafters);
 const roofHeight=(x,z)=>3.45+.65*(1-Math.abs(z)/2.1)**1.5+.19*Math.abs(x/3.35)**5;
 const ps=[],indices=[],nx=28,nz=14;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=(i/nx-.5)*6.7,z=(j/nz-.5)*4.2;ps.push(x,roofHeight(x,z),z);
  if(i&&j){const n=j*(nx+1)+i,k=n-nx-1;indices.push(k-1,n-1,k,k,n-1,n)}
 }
 const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(ps,3));roof.setIndex(indices);roof.computeVertexNormals();mesh(g,roof,tile,[0,0,0]);
 for(const z of [-2.1,-1.78,-1.45,-1.1,-.75,-.39,0,.39,.75,1.1,1.45,1.78,2.1]){
  const points=Array.from({length:15},(_,i)=>{const x=(i/14-.5)*6.7;return[x,roofHeight(x,z)+.016,z]});tube(g,ridge,points,Math.abs(z)>2||z===0?.052:.013);
 }
 const curtainMap=texture(512,256,(c,w,h)=>{
  c.fillStyle='#ead5ac';c.fillRect(0,0,w,h);
  for(let i=0;i<w;i++){const f=.5+.5*Math.sin(i/512*8*Math.PI+1.7);c.fillStyle=`rgba(104,54,30,${f*.15})`;c.fillRect(i,0,1,h);}
  for(const x of [55,148,365,458])blossom(c,x,57,21,'#bd604d');
  c.strokeStyle='#b99562';c.lineWidth=4;c.beginPath();c.moveTo(0,h-11);c.lineTo(w,h-11);c.stroke();
 });
 const curtainGeo=new T.PlaneGeometry(4.83,2.48,64,4),ca=curtainGeo.attributes.position;
 for(let i=0;i<ca.count;i++){const x=ca.getX(i),y=ca.getY(i);ca.setXYZ(i,x,y+.028*Math.sin(x*13)*Math.max(0,.4-y),.056*Math.cos(x*11)*(1.2-y*.22));}curtainGeo.computeVertexNormals();
 mesh(g,curtainGeo,new T.MeshStandardMaterial({map:curtainMap,side:T.DoubleSide,roughness:1}),[0,1.79,-1.42]);
 const name=texture(512,128,(c,w,h)=>{c.fillStyle='#e7c38d';c.fillRect(0,0,w,h);c.strokeStyle='#986540';c.lineWidth=10;c.strokeRect(4,4,w-8,h-8);blossom(c,62,64,28,'#b45341');blossom(c,w-62,64,28,'#b45341');c.textAlign='center';c.textBaseline='middle';c.font='bold 68px serif';c.fillStyle='#3a261c';c.fillText('御神樂',w/2,h/2,310);});
 box(g,M.darkWood,0,3.07,1.66,2.7,.48,.12);
 mesh(g,new T.PlaneGeometry(2.64,.45),new T.MeshStandardMaterial({map:name,roughness:.85}),[0,3.07,1.731]);
 const paperMap=texture(256,128,(c,w,h)=>{c.fillStyle='#fff1c9';c.fillRect(0,0,w,h);for(let y=3;y<h;y+=5){c.fillStyle='#cca26855';c.fillRect(0,y,w,1);}blossom(c,64,67,26,'#b94e3c');blossom(c,192,67,26,'#b94e3c');});
 const paper=new T.MeshStandardMaterial({map:paperMap,color:'#fff4d8',emissive:'#fdb758',emissiveMap:paperMap,emissiveIntensity:.19,roughness:.91});
 for(const x of [-2.34,2.34]){
  const lantern=lathe(g,paper,[[0,0],[.18,.01],[.24,.11],[.255,.34],[.24,.57],[.18,.67],[0,.68]],x,2.06,1.67);lantern.rotation.y=-Math.PI/2;
  lathe(g,ridge,[[0,0],[.18,0],[.19,.06],[0,.07]],x,2.03,1.67);lathe(g,ridge,[[0,0],[.19,0],[.16,.066],[0,.066]],x,2.73,1.67);
  tube(g,M.darkWood,[[x,3.35,1.66],[x,2.79,1.67]],.017);lathe(g,brass,[[.04,0],[.04,.08],[.018,.15]],x,1.89,1.67);
  lathe(g,material('#fff1cc'),[[.045,0],[.028,.17],[.01,.18]],x,1.71,1.67);
 }
 return{paper,floorY};
}

function createDancer(parent,floorY){
 const root=new T.Group();root.name='御神樂・巫女';parent.add(root);
 const porcelain=material('#fff3e4',.88),shadowCloth=material('#ded1c0'),verm=material('#bc3c30',.88),red=material('#d75443'),tie=material('#9b3029'),skin=material('#efc29c'),cheek=material('#e9a18b'),hair=material('#3a2926',.65),hairEdge=material('#523730',.66),black=material('#35221f'),gold=material('#dba548',.38);
 gold.metalness=.59;
 const torso=new T.Group();root.add(torso);
 const pleats=new T.LatheGeometry([[.41,.075],[.425,.11],[.39,.25],[.287,.61],[.23,.83],[.215,.88],[0,.88]].map(p=>new T.Vector2(...p)),80),p=pleats.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),angle=Math.atan2(x,z),strength=1+(.056*Math.abs(Math.sin(angle*9))-.015)*(.4+.6*(1-p.getY(i)));
  p.setXYZ(i,x*strength,p.getY(i),z*strength);
 }pleats.computeVertexNormals();mesh(root,pleats,verm,[0,0,0],[1,1,.86]);
 for(const s of [-1,1])tube(root,tie,[[s*.065,.85,.19],[s*.13,.57,.247],[s*.17,.25,.314],[s*.19,.096,.34]],.009);
 lathe(torso,porcelain,[[.20,0],[.24,.08],[.27,.33],[.21,.48],[.13,.50]],0,.80,0);
 lathe(torso,red,[[.23,0],[.246,.02],[.243,.12],[.22,.14]],0,.795,0);
 const ribbon=ellipse(torso,red,0,.863,.225,.15,.041,.038);ribbon.rotation.z=.16;
 ellipse(torso,tie,0,.861,.263,.036,.038,.028);
 for(const s of [-1,1]){
  const lapel=box(torso,porcelain,s*.037,1.23,.196,.042,.22,.025);lapel.rotation.z=s*.55;
  const strip=box(torso,red,s*.048,1.26,.211,.022,.147,.011);strip.rotation.z=s*.55;
  tube(torso,red,[[s*.035,.865,.255],[s*.05,.79,.268],[s*.083,.712,.28]],.014);
 }
 ellipse(torso,skin,0,1.302,0,.112,.125,.092);
 const head=new T.Group();head.position.y=1.64;torso.add(head);
 ellipse(head,hair,0,.025,-.066,.335,.338,.30);
 ellipse(head,skin,0,-.033,.035,.290,.272,.249);
 ellipse(head,hair,.045,-.203,-.211,.234,.439,.139);
 for(const s of [-1,1]){
  ellipse(head,skin,s*.268,-.075,.065,.055,.07,.047);
  const lock=ellipse(head,hair,s*.226,-.009,.087,.095,.183,.123);lock.rotation.z=s*.26;
  ellipse(head,black,s*.111,.006,.274,.024,.047,.013);
  ellipse(head,porcelain,s*.111-.004,.023,.288,.006,.009,.004);
  ellipse(head,cheek,s*.157,-.091,.243,.043,.017,.012);
 }
 const fringe=ellipse(head,hairEdge,-.108,.139,.187,.226,.094,.088);fringe.rotation.z=.54;
 const sweep=ellipse(head,hair,.126,.113,.174,.169,.09,.103);sweep.rotation.z=-.55;
 ellipse(head,skin,0,-.063,.285,.023,.019,.015);
 tube(head,material('#a76b58'),[[-.029,-.116,.265],[0,-.13,.272],[.029,-.117,.266]],.007);
 for(const s of [-1,1]){const bow=ellipse(head,s<0?red:porcelain,.277+s*.036,.092,-.183,.064,.087,.028);bow.rotation.z=s*.6;const strip=box(head,s<0?red:porcelain,.285+s*.036,-.092,-.178,.038,.27,.013);strip.rotation.z=-.29+s*.17;}
 const arms=[];
 for(const s of [-1,1]){
  const shoulder=new T.Group();torso.add(shoulder);shoulder.position.set(s*.222,1.22,.015);
  const bellSleeve=lathe(shoulder,porcelain,[[.096,-.035],[.117,-.102],[.144,-.258],[.169,-.424],[.172,-.468],[.149,-.482],[.128,-.443],[.079,-.071]],0,0,0);bellSleeve.scale.z=.69;
  const wrist=new T.Group();wrist.position.set(0,-.492,.009);shoulder.add(wrist);ellipse(wrist,skin,0,-.017,.002,.058,.070,.048);
  ellipse(wrist,shadowCloth,0,.049,.01,.118,.022,.088);arms.push({shoulder,wrist});
 }
 const shoes=[-1,1].map(s=>ellipse(root,porcelain,s*.137,.065,.079,.098,.058,.154));
 const bells=new T.Group();arms[0].wrist.add(bells);bells.position.set(-.01,-.042,.04);
 tube(bells,tie,[[0,-.14,0],[0,.27,0]],.023);
 for(const [y,r,n] of [[.14,.104,6],[.235,.073,5],[.31,.04,3]]){
  for(let i=0;i<n;i++){const a=i/n*2*Math.PI,x=Math.cos(a)*r,z=Math.sin(a)*r;ellipse(bells,gold,x,y,z,.038,.036,.038);}
 }
 ellipse(bells,gold,0,.388,0,.031,.038,.031);
 const ribbons=['#ba4a38','#f1c963','#3c7857','#f4ecd8','#806287'].map((color,i)=>{
  const mesh=box(bells,material(color),-.065+i*.033,-.192,0,.036,.43,.009);return mesh;
 });
 const fan=new T.Group();arms[0].wrist.add(fan);fan.position.set(-.02,-.036,.045);
 const fanShape=new T.Shape();fanShape.moveTo(0,0);for(let i=0;i<=22;i++){const a=(.17+i/22*.66)*Math.PI;fanShape.lineTo(Math.cos(a)*.46,Math.sin(a)*.46);}fanShape.closePath();
 const fanMaterial=new T.MeshStandardMaterial({color:'#e6c581',roughness:.82,side:T.DoubleSide});mesh(fan,new T.ShapeGeometry(fanShape),fanMaterial,[0,0,0]);
 for(let i=0;i<10;i++){const a=(.17+i/9*.66)*Math.PI;tube(fan,tie,[[0,0,.011],[Math.cos(a)*.451,Math.sin(a)*.451,.011]],.006);}
 for(let i=0;i<5;i++){const a=i/5*2*Math.PI;ellipse(fan,red,.026*Math.cos(a),.33+.026*Math.sin(a),.012,.030,.022,.009);}
 return {root,torso,head,arms,shoes,bells,ribbons,fan,floorY};
}

// Pose columns: stage X/Z, torso yaw/bow, left & right arm side lift/front swing.
const day=[
 [0,0,0,.04,-.17,.25,.22,.20], [0,0,0,.35,-.27,.29,.27,.28],
 [-.46,.13,-.27,0,-2.18,.59,.82,.47], [-.5,.06,-.46,.02,-2.42,.39,1.11,.28],
 [.02,.33,.08,0,-1.59,.21,1.72,.47], [.54,.08,.55,0,-1.33,.51,1.99,.22],
 [.32,.02,.24,.1,-2.35,.28,.49,.48], [0,0,0,.35,-.27,.29,.27,.28], [0,0,0,.04,-.17,.25,.22,.20]
];
const night=[
 [0,0,0,.04,-.17,.25,.22,.20], [.02,-.12,.15,.38,-.28,.27,.39,.30],
 [.51,-.22,.53,.03,-.68,1.34,1.24,.42], [.48,.17,.28,.05,-1.18,1.39,1.43,.19],
 [.06,.36,0,.07,-2.25,.60,.76,.63], [-.6,-.04,-.55,.06,-1.88,.24,1.94,.38],
 [-.37,-.22,-.33,.17,-1.06,1.13,.58,.79], [0,-.13,0,.40,-.47,.44,.37,.32], [0,0,0,.04,-.17,.25,.22,.20]
];
export function createKaguraStage(site,M,physics){
 const g=site.group;g.name='外拜殿前・中央御神樂舞臺';
 const pavilion=createPavilion(g,M),dancer=createDancer(g,pavilion.floorY);
 physics.box('御神樂中央舞台',site.x,site.y+.26,site.z,5.90,.53,3.61);
 physics.box('御神樂舞台階梯',site.x,site.y+.145,site.z+2.05,2.08,.29,.68);
 for(const x of [-2.6,2.6])for(const z of [-1.44,1.35])physics.box('御神樂舞台柱',site.x+x,site.y+1.91,site.z+z,.20,2.83,.20);
 physics.box('御神樂舞台屋簷',site.x,site.y+3.52,site.z,6.7,.17,4.2);
 const key=new T.SpotLight('#ffd093',0,11,.52,.72,1.38),fill=new T.SpotLight('#9db6ff',0,10,.58,.77,1.55);
 key.position.set(-2.5,4.5,3.6);fill.position.set(2.75,3.65,2.2);key.target.position.set(0,1.41,0);fill.target.position.set(0,1.55,0);
 g.add(key,key.target,fill,fill.target);
 const stats={mode:'day',playing:false,phase:0,lights:0,localX:0};
 const jointRotation=new T.Quaternion(),propRotation=new T.Quaternion(),propEuler=new T.Euler();
 const update=(elapsed,nightSelected,near,playing)=>{
  const isNight=!!nightSelected,score=isNight?night:day,t=playing?T.MathUtils.clamp(elapsed/24,0,1)*(score.length-1):0;
  const i=Math.min(score.length-2,Math.floor(t)),u=ease(t-i),a=score[i],b=score[i+1],pose=a.map((v,j)=>T.MathUtils.lerp(v,b[j],u));
  const time=playing?elapsed:0,step=playing?Math.sin(time*Math.PI*.61):0;
  dancer.root.visible=near;dancer.root.position.set(pose[0],pavilion.floorY+.009+Math.abs(step)*.011,pose[1]);dancer.root.rotation.y=pose[2];
  dancer.torso.rotation.x=pose[3];dancer.torso.position.set(0,.83*(1-Math.cos(pose[3])),-.83*Math.sin(pose[3]));dancer.head.rotation.set(pose[3]*.27,Math.sin(time*.65)*.115,Math.sin(time*.83)*.035);
  dancer.arms.forEach(({shoulder},j)=>{shoulder.rotation.z=pose[4+j*2]+(j?1:-1)*Math.sin(time*2.15)*.095;shoulder.rotation.x=-pose[5+j*2];});
  dancer.shoes.forEach((shoe,j)=>{shoe.position.y=.060+Math.max(0,step*(j?1:-1))*.022;shoe.position.z=.079+step*(j?1:-1)*.049;});
  dancer.bells.visible=!isNight;dancer.fan.visible=isNight;
  dancer.arms[0].wrist.getWorldQuaternion(jointRotation).invert();
  if(isNight){propEuler.set(-.06+Math.sin(time*.9)*.28,Math.sin(time*.76)*.36,.09-dancer.arms[0].shoulder.rotation.z*.42);dancer.fan.quaternion.copy(jointRotation).multiply(propRotation.setFromEuler(propEuler));}
  else {propEuler.set(-.14+Math.sin(time*2.6)*.17,Math.sin(time*2.1)*.24,-dancer.arms[0].shoulder.rotation.z*.21);dancer.bells.quaternion.copy(jointRotation).multiply(propRotation.setFromEuler(propEuler));}
  dancer.ribbons.forEach((r,j)=>{r.rotation.set(Math.sin(time*3+j*.54)*.26,0,(j-2)*.12+Math.sin(time*2.8+j*.51)*.19);});
  const lit=isNight&&near;key.visible=fill.visible=lit;key.intensity=lit?112:0;fill.intensity=lit?48:0;pavilion.paper.emissiveIntensity=lit?1.36:.19;
  Object.assign(stats,{mode:isNight?'night':'day',playing,phase:i,lights:lit?2:0,localX:pose[0]});
 };
 update(0,false,false,false);
 const cameraTarget=vec(site.x,site.y+1.78,site.z+.24);
 return {dancer,stats,update,cameraTarget};
}
