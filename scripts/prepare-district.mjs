// Expand the already retained OSM snapshot; no invented station alignment.
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('reference/shared/osm.json','utf8')),nodes=new Map(data.elements.filter(e=>e.type==='node').map(e=>[e.id,e]));
const origin=[34.967108,135.7728],mx=111320*Math.cos(origin[0]*Math.PI/180),project=n=>[+((n.lon-origin[1])*mx).toFixed(3),+(-(n.lat-origin[0])*111320).toFixed(3)];
const ways=data.elements.filter(e=>e.type==='way').map(e=>({...e,p:e.nodes.filter(n=>nodes.has(n)).map(n=>project(nodes.get(n)))}));
const bounds=p=>p[0]>-440&&p[0]<-60&&p[1]>-255&&p[1]<75;
const streets=ways.filter(e=>e.tags?.highway&&!['service','steps','track'].includes(e.tags.highway)&&e.tags.access!=='private'&&e.p.some(bounds)).map(e=>({id:e.id,name:e.tags.name||'',p:e.p,width:Math.min(8,Math.max(3.2,parseFloat(e.tags.width)||(e.tags.highway==='footway'?3.5:5.5))),steps:false}));
const existing=new Set((await import('../dist/map-data.js')).MAP.paths.map(p=>p.id));
const roads=streets.filter(s=>!existing.has(s.id)&&s.p.every(p=>p[0]>-470&&p[0]<35&&p[1]>-290&&p[1]<120));
const distance=(p,road)=>{let best=1e9;for(let i=1;i<road.p.length;i++){const a=road.p[i-1],b=road.p[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz));}return best;};
const buildings=ways.filter(e=>e.tags?.building&&e.p.length>3&&e.p.every(bounds)).map(e=>({id:e.id,name:e.tags.name||'',type:e.tags.building,p:e.p})).filter(b=>{const c=b.p.reduce((p,q)=>[p[0]+q[0]/b.p.length,p[1]+q[1]/b.p.length],[0,0]);return streets.some(s=>distance(c,s)<15);});
const stations=data.elements.filter(e=>e.tags?.railway==='station'&&['稲荷','伏見稲荷'].includes(e.tags.name)).map(e=>({id:e.tags.name==='稲荷'?'jr':'keihan',name:e.tags.name==='稲荷'?'JR 稻荷站':'京阪伏見稻荷站',p:project(e),lat:e.lat,lon:e.lon}));
const railways=ways.filter(e=>e.tags?.railway==='rail'&&e.p.some(bounds)).map(e=>({p:e.p.filter(p=>p[0]>-470&&p[0]<-80&&p[1]>-290&&p[1]<120)})).filter(r=>r.p.length>1);
const waterways=ways.filter(e=>e.tags?.waterway&&e.tags.tunnel!=='yes'&&e.p.some(bounds)).map(e=>({id:e.id,name:e.tags.name||'',p:e.p.filter(p=>p[0]>-470&&p[0]<-60&&p[1]>-290&&p[1]<120),width:e.tags.waterway==='canal'?8:3})).filter(r=>r.p.length>1);
const graph=new Map(),points=new Map();
for(const way of ways.filter(w=>w.tags?.highway&&w.tags.access!=='private')){const ns=way.nodes.filter(n=>nodes.has(n));for(const n of ns)points.set(n,project(nodes.get(n)));for(let i=1;i<ns.length;i++){const a=ns[i-1],b=ns[i],d=Math.hypot(points.get(a)[0]-points.get(b)[0],points.get(a)[1]-points.get(b)[1]);for(const [n,m]of [[a,b],[b,a]]){if(!graph.has(n))graph.set(n,[]);graph.get(n).push([m,d]);}}}
function route(p,q){const nearest=p=>[...points].reduce((best,[id,xy])=>{const d=Math.hypot(p[0]-xy[0],p[1]-xy[1]);return d<best.d?{id,d}:best;},{d:Infinity}).id,a=nearest(p),b=nearest(q),todo=new Set([a]),dist=new Map([[a,0]]),prev=new Map();while(todo.size){let n=[...todo].reduce((a,b)=>dist.get(a)<dist.get(b)?a:b);todo.delete(n);if(n===b)break;for(const [m,d]of graph.get(n)||[]){const nd=dist.get(n)+d;if(nd<(dist.get(m)??Infinity)){dist.set(m,nd);prev.set(m,n);todo.add(m);}}}const seq=[b];while(seq[0]!==a){const n=prev.get(seq[0]);if(!n)return[];seq.unshift(n);}return seq.map(n=>points.get(n));}
const routes=stations.map(s=>({id:s.id+'-approach',from:s.id,to:'entrance',p:route([s.p[0]+8,s.p[1]],[-100,.3])}));
const district={source:'OpenStreetMap retained snapshot, ODbL; storefronts and festival stalls are artistic reconstructions',roads,buildings,stations,railways,waterways,routes};
fs.writeFileSync('dist/district-data.js','export const DISTRICT='+JSON.stringify(district)+';\n');console.log({roads:roads.length,buildings:buildings.length,stations,rails:railways.length});
