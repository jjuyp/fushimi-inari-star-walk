import * as THREE from 'three';
import {Building,curvedRoof,curtain} from './geometry.js';
import {terrainHeight,footprintBox} from './geography.js';

export function createArchitecture(g,surface){
  const M=g.M,seasonal=[],registered=[],ritualSites=[];
  const P=(b,x,y,z)=>new THREE.Vector3(...b.p(x,y,z));
  function chrysanthemum(b,x,y,z,r=.16){
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2;g.put('petal',M.gold,...b.p(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,z),r*.19,r*.48,.025,0,b.angle,a-Math.PI/2);}
    b.sphere(M.gold,x,y,z+.03,r*.22,r*.22,.035);
  }
  function plaque(b,text,x,y,z,w,h,dark=true){
    const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=dark?'#17241c':'#c9baa0';ctx.fillRect(0,0,256,512);ctx.strokeStyle='#b99141';ctx.lineWidth=10;ctx.strokeRect(8,8,240,496);ctx.lineWidth=2;ctx.strokeRect(21,21,214,470);ctx.fillStyle=dark?'#d9bd67':'#171b13';ctx.font='bold 53px "Yu Mincho",serif';ctx.textAlign='center';[...text].forEach((ch,i)=>ctx.fillText(ch,128,78+i*370/[...text].length));const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshStandardMaterial({map:tx,roughness:.62,envMapIntensity:.3});b.mesh(new THREE.PlaneGeometry(w,h),mat,x,y,z);b.box(M.gold,x,y,z-.065,w+.08,h+.08,.06);
  }
  function bracket(b,x,y,z,scale=1){
    for(let tier=0;tier<3;tier++){
      const yy=y+tier*.21*scale,l=(1.18+tier*.32)*scale;
      b.box(M.red,x,yy,z,l,.17*scale,.32*scale);b.box(M.red,x,yy,z,.32*scale,.17*scale,l);
      for(const s of [-1,1]){b.box(M.cream,x+s*l*.36,yy+.12*scale,z,.17*scale,.13*scale,.3*scale);b.box(M.cream,x,yy+.12*scale,z+s*l*.36,.3*scale,.13*scale,.17*scale);}
    }
  }
  function carving(b,x,y,z,w=1.6){
    // Kaerumata split-bottom brackets and layered floral metal fittings.
    const curve=[[-w/2,0,0],[-w*.3,.04,0],[-w*.17,.37,0],[0,.44,0],[w*.17,.37,0],[w*.3,.04,0],[w/2,0,0]];
    b.tube(M.redDark,curve.map(p=>[x+p[0],y+p[1],z+p[2]]),.11,26);
    for(let j=-2;j<=2;j++){const a=j*.65;b.sphere(j%2?M.blue:M.green,x+j*.21,y+.2+Math.cos(a)*.13,z+.03,.18,.11,.055);}
    chrysanthemum(b,x,y+.33,z+.09,.13);
  }
  function detailedRoof(b,y,w,d,h,opts={}){
    const ridge=opts.gable?1:.68,front=opts.front||.5;
    const geo=curvedRoof(w,d,h,{ridge,front,curl:.42});b.mesh(geo,M.roof,0,y,0);
    // Deep, layered cypress-bark eaves with patinated bronze and gilt fascia.
    for(const side of [-1,1]){
      const zz=side*d*(side>0?front:1-front),points=[];
      for(let i=0;i<=24;i++){const u=i/24*2-1;points.push([u*w/2,y+.42*Math.pow(Math.abs(u),4),zz]);}
      b.tube(M.darkWood,points,.145,44);b.tube(M.bronze,points.map(p=>[p[0],p[1]+.12,p[2]+side*.03]),.07,44);b.tube(M.gold,points.map(p=>[p[0],p[1]-.08,p[2]+side*.04]),.025,44);
      if(b.x<70&&w>16)for(let layer=0;layer<4;layer++)b.tube(layer%2?M.roof:M.darkWood,points.map(p=>[p[0],p[1]-.035-layer*.045,p[2]-side*layer*.055]),.026,44);
      for(let i=0;i<=Math.floor(w/.3);i++){
        const xx=-w/2+.15+i*.3,yy=y-.18+.42*Math.pow(Math.abs(xx/(w/2)),4);
        b.box(M.redDark,xx,yy,zz-side*.8,.105,.19,1.9);b.box(M.gold,xx,yy,zz+side*.17,.12,.2,.07);
        if(i%2===0)b.box(M.red,xx,yy-.21,zz-side*1.05,.12,.17,1.55);
      }
    }
    for(const s of [-1,1]){
      const points=[];
      for(let k=0;k<=32;k++){const t=k/32;points.push([s*w/2*(1-(1-ridge)*t),y+h*Math.pow(t,1.6)+.42*Math.pow(1-t,6),d*front*(1-t)]);}
      for(let k=32;k>=0;k--){const t=k/32;points.push([s*w/2*(1-(1-ridge)*t),y+h*Math.pow(t,1.6)+.42*Math.pow(1-t,6),-d*(1-front)*(1-t)]);}
      b.tube(M.bronze,points,.145,Math.min(52,Math.max(12,Math.ceil(w*2))));b.tube(M.gold,points.map(p=>[p[0]+s*.025,p[1]+.08,p[2]]),.035,Math.min(52,Math.max(12,Math.ceil(w*2))));
    }
    const rw=w*ridge;b.box(M.darkWood,0,y+h+.12,0,rw+.2,.38,.5);b.box(M.goldDark,0,y+h+.34,0,rw+.3,.055,.56);
    for(const x of [-rw/2,0,rw/2]){b.sphere(M.goldDark,x,y+h+.42,0,.19,.2,.22);chrysanthemum(b,x,y+h+.43,.24,.14);}
    if(opts.gable){
      for(const s of [-1,1]){
        const shape=new THREE.Shape();shape.moveTo(-d*(1-front),0);shape.lineTo(d*front,0);shape.lineTo(0,h);shape.closePath();const panel=new THREE.ShapeGeometry(shape);panel.rotateY(Math.PI/2);b.mesh(panel,M.cream,s*(w/2-.4),y,0);
        b.box(M.red,s*(w/2-.3),y+h*.34,0,.16,h*.7,.17);
        for(const side of [-1,1])for(let i=1;i<7;i++){const t=i/7;b.box(M.red,s*(w/2-.3),y+h*t*.88,side*d*.28*(1-t),.18,.15,d*.5*(1-t));}
      }
    }
    const cap=new THREE.Mesh(geo.clone(),M.snow);cap.position.set(...b.p(0,y+.09,0));cap.rotation.y=b.angle;cap.visible=false;cap.receiveShadow=true;g.scene.add(cap);seasonal.push(cap);
    geo.dispose();
    const roofPos=b.p(0,y+h/2,0),roofBody=g.physics.box(b.id+' roof',...roofPos,w,h+.7,d,b.angle);
    Object.assign(roofBody,{kind:'roof',baseY:b.y+y,rise:h,ridge,front});
  }
  function rail(b,x,y,z,w,axis='x',solid=true){
    if(axis==='x'){
      b.box(M.red,x,y+.85,z,w,.15,.14,0,solid);b.box(M.red,x,y+.31,z,w,.13,.12);
      for(let i=0;i<=Math.floor(w/.36);i++)b.box(M.red,x-w/2+i*.36,y+.57,z,.065,.7,.07);
      for(const s of [-1,1]){b.column(M.red,x+s*w/2,y+.61,z,.1,1.22,solid);b.sphere(M.bronze,x+s*w/2,y+1.25,z,.13,.12,.13);}
    }else{
      b.box(M.red,x,y+.85,z,.14,.15,w,0,solid);b.box(M.red,x,y+.31,z,.12,.13,w);
      for(let i=0;i<=Math.floor(w/.36);i++)b.box(M.red,x,y+.57,z-w/2+i*.36,.07,.7,.065);
    }
  }
  function hangingLantern(b,x,y,z,size=.65){
    b.column(M.black,x,y+.42*size,z,.027*size,.9*size,false);
    b.g.put('cylinder',M.glow,...b.p(x,y-.2*size,z),.32*size,.52*size,.32*size,0,b.angle);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;b.column(M.bronze,x+Math.cos(a)*.31*size,y-.2*size,z+Math.sin(a)*.31*size,.018*size,.57*size,false);}
    b.box(M.bronze,x,y+.12*size,z,.66*size,.08*size,.66*size);b.box(M.gold,x,y+.18*size,z,.35*size,.04*size,.35*size);b.box(M.bronze,x,y-.51*size,z,.59*size,.08*size,.59*size);b.sphere(M.gold,x,y-.62*size,z,.08*size,.1*size,.08*size);
  }
  function shimenawa(b,x,y,z,w){
    for(let strand=0;strand<3;strand++){const points=[];for(let i=0;i<=90;i++){const t=i/90,a=t*26*Math.PI+strand*Math.PI*2/3;points.push([x+(t-.5)*w,y-.23*Math.sin(t*Math.PI)+Math.sin(a)*.047,z+Math.cos(a)*.047]);}b.tube(M.rope,points,.04,90);}
    for(let i=-2;i<=2;i++){
      const shape=new THREE.Shape();shape.moveTo(-.08,0);shape.lineTo(.1,0);shape.lineTo(.04,-.2);shape.lineTo(.2,-.2);shape.lineTo(.12,-.43);shape.lineTo(-.03,-.43);shape.lineTo(.02,-.27);shape.lineTo(-.13,-.27);shape.closePath();b.mesh(new THREE.ShapeGeometry(shape),M.white,x+i*w*.15,y-.22,z+.05);
    }
  }
  function stairs(b,z,w,depth,top,steps=12){
    const front=b.p(0,0,z+depth/2),low=terrainHeight(front[0],front[2])+.08;
    const high=b.y+top;
    for(let j=0;j<steps;j++){const dz=depth/steps,h=(high-low)*(j+1)/steps,yy=low+h/2-b.y;b.box(M.stone,0,yy,z+depth/2-(j+.5)*dz,w,h,dz+.02);}
    const center=b.p(0,0,z);surface.staircase(center[0],center[2],w,depth,low,high,b.angle,steps);
  }
  function guardian(b,x,z,mirror=1){
    b.sphere(M.skin,x,2.5,z,.28,.36,.25);b.g.put('cone',M.black,...b.p(x,3,z),.26,.65,.22,0,b.angle);
    b.sphere(M.white,x,2.7,z+.22,.3,.06,.045);b.sphere(M.black,x-.1,2.52,z+.25,.038,.022,.018);b.sphere(M.black,x+.1,2.52,z+.25,.038,.022,.018);
    const robe=mirror<0?M.blue:M.redDark;b.g.put('cone',robe,...b.p(x,1.65,z),.66,1.5,.48,0,b.angle);b.box(M.gold,x,1.7,z+.4,1,.12,.08);
    b.box(M.darkWood,x,.95,z,.95,.15,.75);for(const s of [-1,1]){b.sphere(robe,x+s*.5,1.85,z,.24,.6,.3);b.sphere(M.skin,x+s*.53,1.5,z+.22,.13,.17,.13);b.sphere(robe,x+s*.37,1.12,z+.17,.43,.22,.36);}
    for(let k=0;k<5;k++){b.column(M.darkWood,x-.3+k*.12,2.2,z-.3,.013,1.8,false);b.g.put('cone',M.white,...b.p(x-.3+k*.12,3.05,z-.3),.045,.2,.04,0,b.angle);}
    b.tube(M.darkWood,[[x+mirror*.55,1,z+.3],[x+mirror*.8,2,z+.3],[x+mirror*.55,3.1,z+.3]],.035,24);b.column(M.wood,x-mirror*.7,2,z+.3,.025,2.1,false);
  }
  function romon(building){
    const b=new Building(g,String(building.id),-13.6,.1,-2.6,-Math.PI/2+.055),w=18.5,d=7.4;
    const floor=1.15;b.box(M.wall,0,.38,0,w+1,.8,d+1,0,true);surface.pad(b.x,b.z,w+1,d+1,b.y+floor,b.angle);
    b.box(M.stone,0,.95,0,w+.4,.36,d+.5);stairs(b,8.5,13.1,9,floor,17);const back=new Building(g,b.id,b.x,b.y,b.z,b.angle+Math.PI);stairs(back,6.2,5.5,4.5,floor,9);
    for(const x of [-8.1,-4.1,4.1,8.1])for(const z of [-3,3]){
      b.column(M.red,x,3.08,z,.29,4.15);b.box(M.goldDark,x,1.5,z,.62,.16,.62);bracket(b,x,4.8,z,.92);
    }
    for(const s of [-1,1]){
      b.box(M.cream,s*6.1,3.1,0,3.7,3.5,5.8,0,true);
      // Recessed guardian bays are open behind fine teal lattices.
      b.box(M.black,s*6.1,2.9,3.03,3.5,2.5,.04);guardian(b,s*6.1,3.3,s);
      for(let i=0;i<19;i++)b.box(M.green,s*6.1-1.7+i*.19,2.1,3.8,.065,1.5,.08);
      for(const z of [-3.8,3.8]){b.box(M.red,s*6.1,1.35,z,4,.28,.28);b.box(M.red,s*6.1,4.32,z,4,.32,.3);}
    }
    for(const z of [-3.8,3.8])for(let j=0;j<3;j++)b.box(M.red,0,4.1+j*.33,z,w,.2,.35);
    detailedRoof(b,5.25,23,11.5,1.05);
    b.box(M.red,0,6.36,0,19.5,.3,8.3);
    b.box(M.cream,0,7.65,0,16.4,2.45,5.8,0,true);
    for(const z of [-3,3])for(let x=-8.1;x<=8.2;x+=2.7){b.box(M.red,x,7.58,z,.22,2.65,.34);bracket(b,x,8.85,z,.8);}
    for(const z of [-3.16,3.16]){
      for(const y of [6.7,7.33,8.6])b.box(M.red,0,y,z,16.5,.16,.19);
      for(let x=-6.7;x<7;x+=2.7){b.box(M.darkWood,x,7.83,z,1.9,.98,.07);for(let k=0;k<10;k++)b.box(M.red,x-.85+k*.19,7.83,z+.045,.055,.98,.04);}
      rail(b,0,6.32,z>0?4.15:-4.15,19.3,'x',false);
    }
    for(const s of [-1,1])rail(b,s*9.65,6.32,0,8.3,'z',false);
    detailedRoof(b,9.6,25,14.7,5.5);
    plaque(b,'伏見稲荷大社',0,7.83,3.39,.94,1.95);
    for(const s of [-1,1]){const q=b.p(s*7.5,0,6.8);fox(q[0],q[2],1.05,b.angle+(s>0?-.08:.08),b.y+.12,s<0?'key':'jewel');const pp=b.p(s*9,0,7.4);standingLantern(pp[0],pp[2],1.2,b.angle);}
    for(const x of [-2.4,2.4])hangingLantern(b,x,4.0,3.8,.9);
    shimenawa(b,0,4,3.95,4.8);
    registered.push({id:building.id,name:'樓門',x:b.x,z:b.z,w,d,angle:b.angle,open:true});
  }
  function shrine(building,{open=false,main=false,gabled=false}={}){
    const box=footprintBox(building);let w,d,angle;
    // Shrine front faces west; the long north/south facade follows the actual footprint.
    if(box.w>box.d){w=box.w;d=box.d;angle=box.angle;}else{w=box.d;d=box.w;angle=box.angle+Math.PI/2;}
    if(Math.sin(angle)>0)angle+=Math.PI;
    if([105449674,105449716,899425893].includes(building.id)){w=building.id===105449716?21:building.id===105449674?17.2:16.5;d=building.id===105449674?12.6:building.id===899425893?12.8:14.4;angle=-Math.PI/2+.055;}
    const y=terrainHeight(box.x,box.z),b=new Building(g,String(building.id),box.x,y,box.z,angle),floor=main?1.3:open?.95:.65,height=main?4.7:open?4.1:Math.max(2.5,Math.min(4,d*.5));
    b.box(M.wall,0,floor/2-.15,0,w+.4,floor+.3,d+.4,0,true);b.box(M.stone,0,floor-.07,0,w+.5,.2,d+.6);b.box(M.darkWood,0,floor+.13,0,w,.23,d);
    surface.pad(box.x,box.z,w,d,y+floor+.25,angle);
    const bays=main?5:Math.max(2,Math.round(w/3)),spacing=(w-1)/bays;
    for(let i=0;i<=bays;i++)for(const side of [-1,1]){const xx=-(w-1)/2+i*spacing;const zz=side*(d/2-.45);b.column(M.red,xx,floor+height/2,zz,main?.24:.17,height);bracket(b,xx,floor+height-.45,zz,main?.9:.7);b.box(M.goldDark,xx,floor+.4,zz,.42,.09,.42);}
    for(const side of [-1,1]){const zz=side*(d/2-.4);b.box(M.red,0,floor+height-.35,zz,w,.28,.32);b.box(M.red,0,floor+.25,zz,w,.3,.28);}
    if(open){
      for(const s of [-1,1]){rail(b,0,floor,s*d/2,w,'x');rail(b,s*w/2,floor,0,d,'z');}
      for(let i=0;i<=bays;i++)for(const side of [-1,1])hangingLantern(b,-(w-1)/2+i*spacing,floor+height-.35,side*(d/2+.2),.8);
      b.box(M.darkWood,0,floor+.65,0,w*.58,1.1,d*.38);
    }else{
      b.box(M.redDark,0,floor+height/2,0,w-.4,height-.15,d-.8,0,true);
      for(const side of [-1,1]){b.box(M.cream,side*(w/2-.12),floor+height*.66,0,.12,height*.54,d-.4);for(let k=0;k<5;k++)b.box(M.red,side*w/2,floor+height*(.3+k*.13),0,.17,.12,d);}
      for(let i=0;i<bays;i++){
        const xx=-(w-1)/2+(i+.5)*spacing,zz=d/2+.02;
        b.box(M.darkWood,xx,floor+height*.48,zz,spacing-.15,height*.68,.12);
        for(let k=0;k<10;k++)b.box(M.red,xx-spacing*.44+k*spacing*.098,floor+height*.48,zz+.08,.045,height*.66,.05);
        for(let k=0;k<5;k++)b.box(M.red,xx,floor+height*.2+k*height*.13,zz+.09,spacing-.15,.04,.05);
        const curtainY=floor+height-.4;
        b.mesh(curtain(spacing-.24,height*.39),M.cloth,xx,curtainY,zz+.27);
        b.box(M.black,xx-spacing*.42,curtainY-height*.2,zz+.3,.075,height*.4,.04);
        chrysanthemum(b,xx,curtainY-height*.2,zz+.34,spacing*.13);
        carving(b,xx,floor+height-.12,zz+.2,spacing*.75);
        if(main||w>9)hangingLantern(b,xx,floor+height*.59,zz+.6,.85);
        b.box(M.black,xx,floor+.45,zz+.22,spacing-.22,.82,.13,0,true);
        for(let k=0;k<13;k++)b.box(M.white,xx-spacing*.42+k*spacing*.07,floor+.45,zz+.3,.07,.64,.025);
        for(const s of [-1,1])b.sphere(M.gold,xx+s*spacing*.38,floor+1.05,zz+.32,.055,.055,.025);
      }
      stairs(b,d/2+2.1,w*.46,4.6,floor+.25,9);
      for(const side of [-1,1])rail(b,side*(w/2+.2),floor,0,d+.4,'z');
      shimenawa(b,0,floor+height*.82,d/2+.55,w*.78);
    }
    if(building.id===105449716){
      const zz=d/2+1.25,top=floor+1.25;
      b.box(M.darkWood,0,floor+.6,zz,5.2,1.2,1.2,0,true);
      b.box(M.wood,0,floor+.65,zz+.62,4.9,.8,.06);
      for(const x of [-2.6,2.6])b.box(M.bronze,x,floor+.65,zz,.09,1.25,1.3);
      for(let i=-8;i<=8;i++)b.box(M.wood,i*.29,top,zz,.11,.12,1.35);
      plaque(b,'奉納',0,floor+.65,zz+.67,.45,.65,false);
      ritualSites.push({position:b.p(0,0,zz),floor:y+floor,angle,anchor:b.p(0,floor+4.15,zz+.18)});
    }
    const nagare=building.id===899425893;
    detailedRoof(b,floor+height+.05,w+4.2,d+5.5,nagare?5.1:main?3.4:open?3.3:Math.min(3.5,w*.24),{gable:gabled||nagare,front:nagare?.62:.5});
    if(main&&!nagare){
      const front=new Building(g,b.id+' worship',box.x,y,box.z,angle);
      // Karahafu belongs to the inner worship hall: an undulating central crest,
      // with swept ends, separate from Honden's long nagare roof behind it.
      const zFront=d/2+2.05,yy=floor+height*.68,ww=w*.67,points=[];
      for(let i=0;i<=48;i++){const t=i/48*2-1,h=1.45*Math.exp(-t*t*5)+.42*Math.pow(Math.abs(t),6);points.push([t*ww/2,yy+h,zFront]);}
      const positions=[],uv=[],indices=[];for(let j=0;j<2;j++)for(let i=0;i<points.length;i++){const p=points[i];positions.push(p[0],p[1]+j*.65,p[2]-j*5.3);uv.push(i/48,j*2);}for(let i=0;i<48;i++){const a=i,b=i+49;indices.push(a,a+1,b,b,a+1,b+1);}const canopy=new THREE.BufferGeometry();canopy.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));canopy.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));canopy.setIndex(indices);canopy.computeVertexNormals();front.mesh(canopy,M.roof);canopy.dispose();front.tube(M.bronze,points,.13,48);front.tube(M.gold,points.map(p=>[p[0],p[1]+.06,p[2]+.06]),.035,48);
      for(const s of [-1,1]){front.column(M.red,s*w*.28,floor+height*.35,zFront-.5,.2,height*.7);bracket(front,s*w*.28,yy-.45,zFront-.5,.82);}carving(front,0,yy+.25,zFront+.05,ww*.42);
    }
    registered.push({id:building.id,name:building.name,x:b.x,z:b.z,w,d,angle,open});
    return b;
  }
  function simpleBuilding(building){
    const bb=footprintBox(building);if(!bb)return;const y=terrainHeight(bb.x,bb.z),b=new Building(g,String(building.id),bb.x,y,bb.z,bb.angle),w=bb.w,d=bb.d,h=building.type==='shrine'?3.6:4.2;
    if(building.type==='roof'){
      for(const sx of [-1,1])for(const sz of [-1,1])b.column(M.wood,sx*(w/2-.25),h/2,sz*(d/2-.25),.13,h);
      detailedRoof(b,h,w+1.5,d+1.5,Math.min(2.4,Math.min(w,d)*.35));
      registered.push({id:building.id,name:building.name,x:bb.x,z:bb.z,w,d,angle:bb.angle,open:true});return;
    }
    // Exact polygon bases keep irregular offices and side halls in their measured positions.
    const shape=new THREE.Shape();building.p.forEach((p,i)=>{const xx=p[0]-bb.x,zz=p[1]-bb.z;i?shape.lineTo(xx,-zz):shape.moveTo(xx,-zz)});shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);g.mesh(geo,M.cream,bb.x,y,bb.z);geo.dispose();
    for(let i=1;i<building.p.length;i++){
      const a=building.p[i-1],c=building.p[i],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz),angle=Math.atan2(-dz,dx),x=(a[0]+c[0])/2,z=(a[1]+c[1])/2;
      g.box(M.darkWood,x,y+.4,z,length,.3,.15,angle);g.box(M.wood,x,y+h*.72,z,length,.15,.18,angle);g.physics.box(String(building.id),x,y+h/2,z,length+.1,h,.22,angle);
      if(length<1.6)continue;
      let nx=-dz/length,nz=dx/length;if(pointIn(x+nx*.2,z+nz*.2,building.p)){nx=-nx;nz=-nz;}
      const bays=Math.max(1,Math.round(length/2.6));
      for(let k=0;k<=bays;k++){const xx=a[0]+dx*k/bays,zz=a[1]+dz*k/bays;g.box(M.darkWood,xx+nx*.08,y+h/2,zz+nz*.08,.1,h,.1,angle);}
      for(let k=0;k<bays;k++){
        const xx=a[0]+dx*(k+.5)/bays+nx*.12,zz=a[1]+dz*(k+.5)/bays+nz*.12,ww=Math.min(1.8,length/bays-.35);if(ww<.35)continue;
        g.box(M.darkWood,xx,y+2.2,zz,ww,1.35,.06,angle);
        for(let q=0;q<9;q++)g.box(M.wood,xx+dx/length*(q/8-.5)*ww+nx*.045,y+2.2,zz+dz/length*(q/8-.5)*ww+nz*.045,.04,1.35,.045,angle);
        for(const sy of [-1,1])g.box(M.wood,xx+nx*.05,y+2.2+sy*.67,zz+nz*.05,ww+.1,.08,.07,angle);
      }
    }
    // Avoid giant bounding roofs on L-shaped footprints; smaller measured sections form the wings.
    if(building.p.length>12&&bb.area>300){
      for(let x=bb.x-w/2+4;x<bb.x+w/2;x+=8)for(let z=bb.z-d/2+4;z<bb.z+d/2;z+=8){if(pointIn(x,z,building.p)){const local=new Building(g,b.id,x,y,z,0);detailedRoof(local,h,9,9,1.4);}}
    }else detailedRoof(b,h,w+1.6,d+1.6,Math.min(2.6,Math.min(w,d)*.3));
    registered.push({id:building.id,name:building.name,x:bb.x,z:bb.z,w,d,angle:bb.angle,open:false});
  }
  function pointIn(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
  function fox(x,z,size=1,angle=0,baseY=terrainHeight(x,z),token='key'){
    const b=new Building(g,'fox pedestal',x,baseY,z,angle),s=size;
    b.sphere=(mat,x,y,z,sx,sy=sx,sz=sx)=>g.put(statueSphere,mat,...b.p(x,y,z),sx,sy,sz,0,b.angle);
    b.box(M.wall,0,.7*s,0,1.8*s,1.4*s,1.7*s,0,true);b.box(M.stone,0,1.48*s,0,2*s,.16*s,1.9*s);b.box(M.stone,0,.13*s,0,2.1*s,.26*s,2*s);
    b.sphere(M.wall,0,2.08*s,-.04*s,.4*s,.64*s,.42*s);b.sphere(M.wall,0,2.64*s,.1*s,.25*s,.58*s,.28*s);
    for(const side of [-1,1]){b.column(M.wall,side*.2*s,1.92*s,.37*s,.11*s,.68*s,false);b.sphere(M.wall,side*.2*s,1.61*s,.48*s,.16*s,.11*s,.27*s);b.sphere(M.wall,side*.31*s,1.77*s,-.2*s,.23*s,.26*s,.3*s);}
    b.sphere(M.wall,0,3.08*s,.2*s,.31*s,.39*s,.35*s);b.sphere(M.wall,0,2.98*s,.5*s,.2*s,.16*s,.3*s);b.sphere(M.black,0,3*s,.77*s,.075*s,.045*s,.06*s);
    for(const side of [-1,1]){
      const ear=new THREE.Shape();ear.moveTo(-.15,0);ear.lineTo(.15,0);ear.lineTo(side*.02,.54);ear.closePath();const eg=new THREE.ExtrudeGeometry(ear,{depth:.1,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:2,steps:1});eg.scale(s,s,s);b.mesh(eg,M.wall,side*.22*s,3.3*s,.13*s);eg.dispose();
      b.sphere(M.black,side*.19*s,3.13*s,.47*s,.07*s,.022*s,.025*s);b.box(M.wall,side*.2*s,3.2*s,.45*s,.17*s,.055*s,.06*s,side*.17);
    }
    b.tube(M.wall,[[0,1.7*s,-.25*s],[.32*s,1.78*s,-.7*s],[.38*s,2.4*s,-.72*s],[.28*s,2.79*s,-.6*s]],.18*s,24);
    const bib=new THREE.Shape();bib.moveTo(-.33*s,0);bib.lineTo(.33*s,0);bib.lineTo(.25*s,-.46*s);bib.lineTo(0,-.62*s);bib.lineTo(-.25*s,-.46*s);bib.closePath();b.mesh(new THREE.ShapeGeometry(bib),M.redEdge,0,2.78*s,.43*s);
    b.tube(M.red,[[-.3*s,2.75*s,.1*s],[0,2.82*s,-.2*s],[.3*s,2.75*s,.1*s]],.04*s,15);
    if(token==='key'){b.g.put('torus',M.goldDark,...b.p(.02*s,2.9*s,.78*s),.14*s,.14*s,.14*s,0,b.angle);b.box(M.goldDark,.02*s,2.65*s,.78*s,.055*s,.36*s,.055*s);for(const yy of [2.51,2.59])b.box(M.goldDark,.09*s,yy*s,.78*s,.18*s,.055*s,.065*s);}
    else{b.sphere(M.wall,0,2.8*s,.84*s,.2*s,.22*s,.2*s);b.g.put('cone',M.wall,...b.p(0,3.03*s,.84*s),.1*s,.22*s,.1*s,0,b.angle);}
  }
  function standingLantern(x,z,size=1,angle=0){
    const y=terrainHeight(x,z),b=new Building(g,'stone lantern',x,y,z,angle),s=size;
    b.box(M.stone,0,.16*s,0,1.1*s,.32*s,1.1*s,0,true);b.box(M.wall,0,.43*s,0,.78*s,.24*s,.78*s,0,true);b.column(M.wall,0,1.16*s,0,.18*s,1.3*s);b.box(M.wall,0,1.9*s,0,.9*s,.2*s,.9*s);
    b.box(M.glow,0,2.3*s,0,.5*s,.62*s,.5*s);
    for(const a of [-1,1])for(const c of [-1,1])b.box(M.wall,a*.32*s,2.3*s,c*.32*s,.12*s,.72*s,.12*s);
    const rg=curvedRoof(1.35*s,1.35*s,.5*s,{ridge:.2,curl:.08});b.mesh(rg,M.wall,0,2.7*s,0);rg.dispose();b.sphere(M.wall,0,3.32*s,0,.14*s,.2*s,.14*s);
  }
  function fence(points,yOffset=.2,height=1.5,wood=false){
    const mat=wood?M.darkWood:M.red;
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.round(len/.45)),angle=Math.atan2(-dz,dx),y=(terrainHeight(...a)+terrainHeight(...b))/2+yOffset;
      for(let k=0;k<=n;k++){const x=a[0]+dx*k/n,z=a[1]+dz*k/n,yy=terrainHeight(x,z)+yOffset;g.box(mat,x,yy+height/2,z,.1,height,.1,angle);}
      for(const yy of [height*.2,height*.76])g.box(mat,(a[0]+b[0])/2,y+yy,(a[1]+b[1])/2,len,.13,.12,angle);
      g.physics.box('fence',(a[0]+b[0])/2,y+height/2,(a[1]+b[1])/2,len,height,.15,angle);
    }
  }
  const statueSphere=new THREE.SphereGeometry(1,24,16);
  return{romon,shrine,simpleBuilding,fox,standingLantern,fence,detailedRoof,plaque,seasonal,registered,ritualSites,bracket,rail,hangingLantern,chrysanthemum};
}

export function createToriiBuilder(g,surface){
  const M=g.M,shape=new THREE.Shape(),w=3.24;
  shape.moveTo(-w/2,0);for(let i=0;i<=8;i++){const x=-w/2+i/8*w;shape.lineTo(x,.11+.17*Math.pow(Math.abs(x/(w/2)),5));}for(let i=8;i>=0;i--){const x=-w/2+i/8*w;shape.lineTo(x,-.09+.16*Math.pow(Math.abs(x/(w/2)),5));}shape.closePath();
  const redBeam=new THREE.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:false,steps:1});redBeam.translate(0,0,-.14);
  const blackBeam=redBeam.clone();blackBeam.scale(1.035,.38,1.14);
  const plaqueCanvas=document.createElement('canvas');plaqueCanvas.width=256;plaqueCanvas.height=1024;const pc=plaqueCanvas.getContext('2d');pc.fillStyle='#b78a34';pc.fillRect(0,0,256,1024);pc.strokeStyle='#30281b';pc.lineWidth=15;pc.strokeRect(9,9,238,1006);pc.fillStyle='#171c17';pc.textAlign='center';pc.textBaseline='middle';pc.font='bold 128px "Yu Mincho","Noto Serif CJK JP",serif';[...'伏見稲荷大社'].forEach((ch,i)=>pc.fillText(ch,128,110+i*157,215));
  const plaqueTexture=new THREE.CanvasTexture(plaqueCanvas);plaqueTexture.colorSpace=THREE.SRGBColorSpace;plaqueTexture.anisotropy=8;
  const plaqueMaterial=new THREE.MeshStandardMaterial({map:plaqueTexture,roughness:.7,polygonOffset:true,polygonOffsetFactor:-1});plaqueMaterial.name='伏見稲荷大社・共用扁額';plaqueMaterial.userData.noShadow=true;
  let count=0;const pending=[];
  function torii(x,z,size=1,angle=0,{collide=true,base=null,plaque=false}={}){
    if(surface&&size<1.9){
      for(const side of [-1,1]){
        const px=x+Math.cos(angle)*side*1.12*size,pz=z-Math.sin(angle)*side*1.12*size,near=surface.nearPath(px,pz);
        if(near.distance<.38+.135*size+.11)return null;
      }
    }
    pending.push({x,z,size,angle,collide,base,plaque,id:count++});return true;
  }
  function build({x,z,size,angle,collide,base,plaque,id},groundHeight){
    const ground=groundHeight(x,z),y=Math.max(base===null?terrainHeight(x,z)+.12:base,Number.isFinite(ground)?ground-.02:-Infinity),b=new Building(g,'torii-'+id,x,y,z,angle);
    const s=size;
    for(const side of [-1,1]){
      const px=side*1.12*s;
      b.column(M.red,px,1.56*s,0,.135*s,3.12*s,collide);b.column(M.black,px,.3*s,0,.145*s,.6*s,false);
      b.column(M.redDark,px,3.08*s,0,.19*s,.11*s,false);b.column(M.black,px,3.15*s,0,.165*s,.035*s,false);
      g.put('plane',M.ink,...b.p(px,1.64*s,.138*s),.14*s,1.3*s,1,0,angle);
      g.put('plane',M.date,...b.p(px,1.57*s,-.138*s),.14*s,1.4*s,1,0,angle+Math.PI);
    }
    b.box(M.red,0,2.57*s,0,2.72*s,.15*s,.2*s);b.box(M.red,0,2.86*s,0,.15*s,.49*s,.18*s);
    if(collide){g.physics.box(b.id+' crossbeam',...b.p(0,2.57*s,0),2.72*s,.15*s,.2*s,angle);g.physics.box(b.id+' lintel',...b.p(0,3.26*s,0),3.3*s,.4*s,.35*s,angle);}
    g.put(redBeam,M.red,...b.p(0,3.22*s,0),s,s,s,0,angle);g.put(blackBeam,M.black,...b.p(0,3.37*s,0),s,s,s,0,angle);
    if(plaque){b.box(M.darkWood,0,2.91*s,.17*s,.39*s,.61*s,.055);b.box(M.goldDark,0,2.91*s,.21*s,.31*s,.53*s,.025);g.put('plane',plaqueMaterial,...b.p(0,2.91*s,.241*s),.31*s,.53*s,1,0,angle);g.put('plane',plaqueMaterial,...b.p(0,2.91*s,-.185*s),.31*s,.53*s,1,0,angle+Math.PI);}
    return b;
  }
  return{torii,finish(groundHeight){for(const request of pending)build(request,groundHeight);pending.length=0;},get count(){return count}};
}
