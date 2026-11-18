import * as T from 'three';
import {curvedRoof} from './geometry.js';

export const SHRINES=[
 {id:'wealth',place:'entrance',name:'惠比壽小社',deity:'蛭子大神（惠比壽）',wish:'財運・商賣繁昌',color:'#9e6032',mark:'鯛',fortune:'財運籤',source:'https://nishinomiya-ebisu.com/about/'},
 {id:'bonds',place:'gate',name:'結緣小社',deity:'大國主命',wish:'良緣・人與人的緣分',color:'#a34e64',mark:'結',fortune:'良緣籤',source:'https://www.kandamyoujin.or.jp/profile/'},
 {id:'health',place:'hall',name:'少彥名小社',deity:'少彥名命',wish:'健康・身心安穩',color:'#526b58',mark:'葉',fortune:'健康籤',source:'https://www.kandamyoujin.or.jp/profile/'},
 {id:'sun',place:'okusha',name:'日之御小社',deity:'天照大御神',wish:'日光・感謝新的一日',color:'#ad502d',mark:'日',source:'https://www.isejingu.or.jp/about/naiku/'},
 {id:'study',place:'torii',name:'天神小社',deity:'菅原道真公',wish:'學業・持續精進',color:'#57537c',mark:'梅',source:'https://kitanotenmangu.or.jp/about/'},
 {id:'path',place:'yotsu',name:'道開小社',deity:'猿田彥大神',wish:'旅途平安・新的方向',color:'#426275',mark:'道',source:'https://www.sarutahikojinja.or.jp/'}
];

const verseSets={wealth:[
 ['吉','鯛影浮清水/輕帆渡曉河/先明收與支/再把寸帆挪','先弄清手上有多少時間與資源，再考慮擴大規模。','把花費逐項記下','小筆先試，再談長期合作','先守已有成果'],
 ['大吉','晨市金光起/新舟入港門/守信通百貨/長業有餘溫','一份可靠的約定比一時熱鬧更值得維持。','整理訂單和收入','適合完成談定的合作','為淡季預留餘裕'],
 ['小吉','細網收微浪/空籃候晚潮/不貪多一尾/所得可持牢','今天宜把好處理的小事完成，慢慢累積。','避免情緒花費','熟悉品項優先','把小額收入留下'],
 ['末吉','月細潮聲淺/漁火隔堤微/前程猶待信/莫急載重歸','等待資訊確認，手上已有的計畫先維持。','先看預算再決定','先確認交付時間','延後大額決定'],
 ['中吉','長線牽深水/微風送好舟/往來宜有準/平實得長收','把流程變簡單，記錄清楚，就比較能持續。','定期清點手邊資源','重視彼此的分工','累積比追趕重要'],
 ['凶','急浪敲船底/重網壓舟低/此刻宜先泊/風平再問溪','局面不安時不必勉強增加投入，重新評估比跟風合宜。','暫緩新增支出','別急承諾陌生合作','先收拾已做一半的事']
],bonds:[
 ['吉','花間留半席/橋上話春風/相見先聽語/行來心自通','讓關係自然發展，給彼此都可以選擇的空間。','從共同話題開始','先聽完對方說的話','適合邀約散步'],
 ['大吉','雙泉同石渡/細線結成環/人意相扶處/春聲過遠山','適合真誠回應一份善意，約定也要彼此舒服。','分享能一起做的事','說出實際可承諾的時間','慢慢維繫比急促表白更好'],
 ['小吉','一枝花未満/風至自相知/不向門前候/從容共赴期','把自己的生活過好，緣分也需要合宜的節奏。','先照顧自己的節奏','有想法便溫和說明','不必追問立刻回覆'],
 ['末吉','長橋分兩岸/落日照歸帆/未諳同行意/留言只半函','有些事仍不明朗，先確認彼此的期待。','將疑問說清楚','不要憑猜測做結論','給對方回頭的空間'],
 ['中吉','小徑逢知己/雙行聽晚鐘/不須同一想/仍可入春風','看法不同也能好好相處，彼此尊重是關鍵。','先找共同接受的事','小事先試著配合','珍惜溫和的相處'],
 ['凶','秋聲催急語/白露濕長衫/若有相爭處/且休夜深談','情緒高時不必立刻得到答案，等心情平穩再說。','先暫停尖銳對話','為彼此保留界線','必要時向信任的人聊聊']
],health:[
 ['吉','松風停午刻/淡日落窗明/留些閒步走/心息自徐平','給日常留一點休息與活動的時間。','安排短暫休息','散步時留意路況','維持平常作息'],
 ['大吉','晴暖分花影/清泉潤石苔/日日添微暖/長養一庭開','小習慣持續下去，會比一時做很多更可靠。','選一項可維持的習慣','照平時節奏走路','與親友共享安靜時光'],
 ['小吉','雨息沿窗過/輕衣晾晚風/有暇先歇腳/再起亦從容','覺得疲倦就允許自己停一下。','留一段不受打擾的時間','把行程排鬆一些','溫和看待自己的進度'],
 ['末吉','夜長燈影細/晨起路初清/先理床邊物/再聞一鳥鳴','先把平常環境整理到舒服，再慢慢建立節奏。','簡化晚間安排','接納今天需要休息','重啟前先照顧自己'],
 ['中吉','薄霧藏山谷/明波近短堤/日日量微步/安然過竹西','循序可做的事情，適合分成幾段完成。','過程中排入休息','留心身體發出的疲憊訊號','不用與別人比較'],
 ['凶','山雨沖斜石/行囊重過肩/且停於簷下/勿勉涉前川','此籤只提醒你慢下來。有身體疑慮時，請向合適的專業人員求助。','先保留休息時間','不以遊戲籤文判斷身體情況','需要時請可信的人同行']
]};
export function thematicFortunes(id){return verseSets[id]||[];}

const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,14,9);
const material=color=>new T.MeshStandardMaterial({color,roughness:.87});
const vector=(x,y,z)=>new T.Vector3(x,y,z);
function mesh(g,geo,mat,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.receiveShadow=true;g.add(o);return o;}
function box(g,m,x,y,z,w,h,d){return mesh(g,cube,m,x,y,z,w,h,d);}
function canvasMap(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function sign(g,lines,matColor,x,y,z,w,h){
 const map=canvasMap(512,256,(c,W,H)=>{
  c.fillStyle='#edcf9e';c.fillRect(0,0,W,H);c.strokeStyle=matColor;c.lineWidth=7;c.strokeRect(10,10,W-20,H-20);
  c.fillStyle='#412c24';c.textAlign='center';c.textBaseline='middle';c.font='bold 56px serif';c.fillText(lines[0],W/2,100,W-42);
  if(lines[1]){c.font='36px serif';c.fillStyle=matColor;c.fillText(lines[1],W/2,177,W-42);}
 });
 return mesh(g,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.86}),x,y,z);
}
function bell(g,M,x,y,z){const group=new T.Group();group.position.set(x,y,z);g.add(group);mesh(group,sphere,M.gold,0,0,0,.14,.12,.135);box(group,M.rope,0,-.37,0,.042,.68,.045);mesh(group,sphere,M.rope,0,-.7,0,.067,.09,.063);return group;}

// A short side path joins each clearing. Test the building footprint, roof
// height and actual approach before committing any collider to the world.
export function chooseClearing(world,anchor,{width=3.5,depth=2.1,min=4,max=29,viewDistance=4.8,treeClearance=1.15}={}){
 const choices=[];
 const closeTrees=world.physics.bodies.filter(b=>b.name==='tree trunk'&&Math.hypot(b.x-anchor.x,b.z-anchor.z)<max+viewDistance+treeClearance+2);
 for(let r=min;r<=max;r+=1.25)for(let step=0;step<32;step++){
  const a=(step+(r%3)*.14)*Math.PI/16,x=anchor.x+Math.cos(a)*r,z=anchor.z+Math.sin(a)*r;
  const y=world.walkHeight(x,z);if(!Number.isFinite(y))continue;
  const near=world.surface.nearPath(x,z);if(near.distance<2.45||near.distance>9.8)continue;
  const yaw=Math.atan2(near.x-x,near.z-z),sn=Math.sin(yaw),cs=Math.cos(yaw),point=(u,v)=>[x+cs*u+sn*v,z-sn*u+cs*v];
  let clear=true,high=y,low=y;
  for(const u of [-width/2,0,width/2])for(const v of [-depth/2,0,depth/2]){
   const [xx,zz]=point(u,v),h=world.walkHeight(xx,zz);if(!Number.isFinite(h)||Math.abs(y-h)>.52){clear=false;break}high=Math.max(high,h);low=Math.min(low,h);
   if(world.physics.near(xx,zz).some(body=>[0,1.0,2.1].some(d=>world.physics.penetration(body,xx,h+d,zz,.31,.58)))){clear=false;break}
  }
  if(!clear)continue;
  const approach=[];
  for(let q=1.55;q<=near.distance+.25;q+=.25){const [xx,zz]=point(0,q),yy=world.walkHeight(xx,zz);if(!Number.isFinite(yy)||world.physics.collides(xx,yy,zz)||Math.abs(yy-high)>.89){clear=false;break}approach.push({x:xx,y:yy,z:zz});}
  if(!clear||!approach.length)continue;
  const stepper={...approach.at(-1)};
  for(let i=approach.length-2;i>=0;i--){
   const step=approach[i];world.physics.move(stepper,step.x-stepper.x,step.z-stepper.z,world.walkHeight);
   if(Math.hypot(step.x-stepper.x,step.z-stepper.z)>.08){clear=false;break;}
  }
  if(!clear)continue;
  const [frontX,frontZ]=point(0,Math.max(depth/2+.1,1.2));
  const start=vector(frontX,high+1.65,frontZ),forward=vector(sn,0,cs);
  const sight=[-.85,0,.85].map(u=>{
   const lane=start.clone().add(vector(cs*u,0,-sn*u));
   let clearance=world.physics.cameraDistance(lane,forward,viewDistance);
   // Branches spread beyond the small trunk collider.
   for(let d=.75;d<clearance;d+=.75){
    const xx=lane.x+sn*d,zz=lane.z+cs*d;
    if(closeTrees.some(b=>Math.hypot(b.x-xx,b.z-zz)<treeClearance)||world.walkHeight(xx,zz)>lane.y-.40){clearance=d;break;}
   }
   return clearance;
  });
  const score=r*.30+Math.abs(near.distance-3.0)*.47+(high-low)*2+(viewDistance-Math.min(...sight))*3.2;
  choices.push({x,y:high+.02,z,yaw,approach,score,point,low});
 }
 choices.sort((a,b)=>a.score-b.score);return choices[0]||null;
}

export function sideArrival(world,placement,depth,offset){
 const pathPoint=placement.approach[Math.min(Math.round((depth-1.55)/.25),placement.approach.length-1)];
 const [x,z]=placement.point(offset,depth),y=world.walkHeight(x,z);
 return Number.isFinite(y)&&Math.abs(y-pathPoint.y)<.42&&!world.physics.collides(x,y,z)?{x,y,z}:pathPoint;
}

function createPavilion(world,scene,s,placement){
 const g=new T.Group(),M=world.M;g.name=s.name;g.position.set(placement.x,placement.y,placement.z);g.rotation.y=placement.yaw;scene.add(g);
 const red=material(s.color),dark=material('#3c3730'),roof=material('#42494b'),white=material('#eee0bc'),metal=material('#ba8847');
 const width=s.id==='sun'?2.7:2.5;
 const plinthBottom=Math.min(placement.low-placement.y-.06,-.055);
 box(g,M.wall,0,(.175+plinthBottom)/2,0,width+.37,.175-plinthBottom,1.92);box(g,M.darkWood,0,.24,-.08,width,.23,1.55);
 box(g,red,0,.83,-.48,width-.23,1.13,.22);
 box(g,dark,0,.91,-.345,width-.56,.84,.085);
 for(const x of [-.77,.77]){
  box(g,red,x,1.12,.47,.145,1.82,.16);box(g,red,x,1.12,-.67,.145,1.82,.16);
  box(g,metal,x,1.91,.47,.185,.112,.20);
 }
 box(g,red,0,1.94,.51,width+.09,.14,.24);box(g,red,0,1.94,-.63,width+.09,.14,.24);
 for(let i=0;i<9;i++)box(g,M.wood,(i-4)*.18,1.03,-.245,.077,.92,.065);
 for(const y of [.64,.91,1.18])box(g,red,0,y,-.21,1.78,.065,.068);
 box(g,M.darkWood,0,2.035,-.045,width+.37,.13,1.74);
 mesh(g,curvedRoof(width+.6,2.01,.53,{ridge:s.id==='path'?.78:.93,curl:.14}),roof,0,2.085,-.04);
 box(g,M.darkWood,0,2.64,-.04,width*.83,.099,.17);
 for(const x of [-.7,.7]){box(g,M.darkWood,x,2.085,.72,.105,.064,.25);box(g,metal,x,2.04,.79,.094,.075,.065);}
 box(g,white,0,1.677,-.14,1.78,.28,.05);sign(g,[s.mark,s.wish.split('・')[0]],s.color,0,1.658,-.106,1.75,.29);
 box(g,M.darkWood,0,.625,.77,1.21,.55,.47);box(g,M.wood,0,.91,.77,1.28,.071,.51);
 for(let i=0;i<8;i++)box(g,M.wood,(i-3.5)*.153,.957,.77,.074,.037,.40);
 box(g,M.darkWood,0,1.78,.665,1.93,.363,.072);
 sign(g,[s.name,s.deity],s.color,0,1.78,.706,1.84,.326);
 const pivot=bell(g,M,0,1.60,.62);
 for(const x of [-1.16,1.16]){box(g,M.wall,x,.215,.80,.28,.29,.27);box(g,M.wall,x,.47,.80,.235,.18,.24);const glow=material('#f4c78a');glow.emissive.set('#cc8e47');glow.emissiveIntensity=.65;box(g,glow,x,.588,.80,.142,.13,.12);box(g,M.darkWood,x,.69,.80,.29,.06,.29);}
 for(const [u,v,w,d,h] of [[0,-.20,width+.17,1.48,1.84],[0,.77,1.26,.51,1.01]]){
  const [x,z]=placement.point(u,v);world.physics.box(s.name,x,placement.y+h/2,z,w,h,d,placement.yaw);
 }
 let tubeSite=null;
 if(s.fortune){
  const tubeX=1.44,tubeZ=1.02,[tx,tz]=placement.point(tubeX,tubeZ);
  box(g,M.wood,tubeX,.47,tubeZ,.43,.84,.42);box(g,red,tubeX,.91,tubeZ,.53,.10,.47);
  const tube=new T.CylinderGeometry(.153,.185,.49,8);mesh(g,tube,red,tubeX,1.185,tubeZ);
  mesh(g,new T.CylinderGeometry(.16,.16,.066,8),metal,tubeX,1.43,tubeZ);
  for(let i=0;i<5;i++)box(g,white,tubeX+(i-2)*.028,1.519+(i%3)*.021,tubeZ,.018,.23,.019);
  sign(g,[s.fortune,'御神籤'],s.color,tubeX,.69,tubeZ+.215,.40,.31);
  world.physics.box(s.fortune,tx,placement.y+.48,tz,.43,.96,.43,placement.yaw);
  const [ax,az]=placement.point(tubeX,1.95),ay=world.walkHeight(ax,az);
  if(Number.isFinite(ay)&&!world.physics.collides(ax,ay,az))tubeSite={id:'theme-'+s.id,x:ax,y:ay,z:az,range:1.42,name:s.fortune,place:s.place,group:new T.Group(),shrine:s,arrival:{x:ax,y:ay,z:az}};
 }
 const stand=placement.approach[Math.min(2,placement.approach.length-1)];
 const arrival=sideArrival(world,placement,2.70,-1.02);
 const [fx,fz]=placement.point(.12,1.45);
 return{...s,id:'shrine-'+s.id,key:s.id,x:placement.x,y:placement.y,z:placement.z,angle:placement.yaw,group:g,range:3.4,arrival,stand,pivot,tubeSite,approach:placement.approach,shrine:s,cameraTarget:vector(fx,placement.y+1.34,fz)};
}
export function createSideShrines(world,scene){
 const shrines=[],fortuneSites=[],missing=[];
 for(const s of SHRINES){const study=s.id==='study',p=chooseClearing(world,world.places[s.place],{width:3.4,depth:2.7,min:study?12:4,max:45,treeClearance:study?4.0:1.15});
  if(!p){missing.push(s.id);continue;}const site=createPavilion(world,scene,s,p);shrines.push(site);if(site.tubeSite)fortuneSites.push(site.tubeSite);}
 return{shrines,fortuneSites,missing};
}
