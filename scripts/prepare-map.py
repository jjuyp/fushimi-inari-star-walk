"""Compile OSM footprints/trails and GSI DEM into a reproducible scene data module.
Input snapshots are reference/shared/osm.json and GSI dem-15-X-Y.png.
OSM: Open Database License, GSI: GSI Maps attribution; see dist/assets/CREDITS.md.
"""
import json, math, pathlib, heapq
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[1]
REF=ROOT/'reference/shared'
origin=[34.967108,135.7728]
mx=111320*math.cos(math.radians(origin[0]));mz=111320
def project(lat,lon): return [round((lon-origin[1])*mx,3),round(-(lat-origin[0])*mz,3)]
obj=json.loads((REF/'osm.json').read_text(encoding='utf8'))
nodes={e['id']:e for e in obj['elements'] if e['type']=='node'}
ways={e['id']:e for e in obj['elements'] if e['type']=='way'}
tiles={}
for p in REF.glob('dem-15-*.png'):
 _,zoom,x,y=p.stem.split('-');tiles[int(x),int(y)]=Image.open(p).convert('RGB')
def elevation(x,z):
 lat=origin[0]-z/mz;lon=origin[1]+x/mx
 tx=(lon+180)/360*32768;ty=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*32768
 im=tiles.get((int(tx),int(ty)))
 if im is None:return 30
 r,g,b=im.getpixel((min(255,int((tx%1)*256)),min(255,int((ty%1)*256))))
 v=r*65536+g*256+b
 if v==8388608:return 30
 if v>8388608:v-=16777216
 return v*.01
base=elevation(-15,-3)

buildings=[];paths=[];water=[];gates=[];monuments=[]
for e in obj['elements']:
 tags=e.get('tags',{})
 if e['type']=='node':
  p=project(e['lat'],e['lon'])
  if tags.get('ceremonial_gate')=='torii':gates.append({'id':e['id'],'p':p,'width':float(tags.get('width',3)) if str(tags.get('width',3)).replace('.','',1).isdigit() else 3})
  continue
 if e['type']!='way':continue
 ns=[nodes[n] for n in e['nodes'] if n in nodes]
 if len(ns)<2:continue
 ps=[project(n['lat'],n['lon'])for n in ns];cx=sum(p[0]for p in ps)/len(ps);cz=sum(p[1]for p in ps)/len(ps)
 if not(-140<cx<1250 and -420<cz<200):continue
 if tags.get('building') and ((-70<cx<310 and -120<cz<78) or (cx>310 and tags.get('building') in ['shrine','roof'])):
  buildings.append({'id':e['id'],'name':tags.get('name',''),'type':tags['building'],'p':ps})
 if tags.get('natural')=='water':water.append({'id':e['id'],'name':tags.get('name',''),'p':ps})
 if tags.get('highway') in ['footway','path','steps','pedestrian'] and tags.get('access')!='private':
  width=tags.get('width','2.2')
  try:width=float(width)
  except:width=2.2
  paths.append({'id':e['id'],'p':ps,'nodes':e['nodes'],'width':min(9,max(1.2,width)),'steps':tags.get('highway')=='steps','name':tags.get('name',''),'covered':tags.get('tunnel')=='building_passage'})
 if tags.get('ceremonial_gate')=='torii':gates.append({'id':e['id'],'p':[cx,cz],'width':math.dist(ps[0],ps[-1]) if len(ps)==2 else 3})

# Dijkstra on measured trail nodes; this preserves mountain path turns and junctions.
graph={};points={}
for p in paths:
 for nid,xy in zip(p['nodes'],p['p']):points[nid]=xy
 for i in range(len(p['nodes'])-1):
  a,b=p['nodes'][i:i+2];d=math.dist(points[a],points[b]);graph.setdefault(a,[]).append((b,d,p['id']));graph.setdefault(b,[]).append((a,d,p['id']))
def public_node(xy):
 # Some OSM trail endpoints share the shrine's door/outline node. Route visitors
 # to its approach instead, retaining the actual solid building at the door.
 x,z=xy
 for building in buildings:
  ps=building['p'];inside=False
  for a,b in zip(ps,ps[1:]+ps[:1]):
   dx,dz=b[0]-a[0],b[1]-a[1];ll=dx*dx+dz*dz
   t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/ll)) if ll else 0
   if math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<.9:return False
   if (a[1]>z)!=(b[1]>z) and x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]:inside=not inside
  if inside:return False
 return True
def nearest(p):return min((n for n in points if public_node(points[n])),key=lambda n:math.dist(p,points[n]))
def route(a,b):
 a=nearest(a);b=nearest(b);q=[(0,a)];dist={a:0};prev={}
 while q:
  d,n=heapq.heappop(q)
  if n==b:break
  if d!=dist[n]:continue
  for nn,dd,w in graph.get(n,[]):
   nd=d+dd
   if nd<dist.get(nn,1e99):dist[nn]=nd;prev[nn]=(n,w);heapq.heappush(q,(nd,nn))
 if b not in dist:raise ValueError(f'Disconnected trail {a}->{b}')
 seq=[b];ws=[]
 while seq[-1]!=a:
  n,w=prev[seq[-1]];seq.append(n);ws.append(w)
 return {'p':[points[n]for n in reversed(seq)],'ways':list(dict.fromkeys(reversed(ws))),'length':round(dist[b],2)}

poiSpecs=[
 ('entrance','表參道・大鳥居',34.967105,135.7717),
 ('gate','樓門',34.967132,135.77265),
 ('haiden','外拜殿',34.967151,135.77286),
 ('hall','內拜殿・本殿',34.967171,135.77325),
 ('okumiya','奧宮',34.9672832,135.7740236),
 ('torii','千本鳥居',34.966983,135.7747604),
 ('okusha','奧社奉拜所',34.966548,135.77551),
 ('kumataka','熊鷹社・新池',34.96835,135.77852),
 ('mitsu','三ツ辻',34.970147,135.7787682),
 ('yotsu','四ツ辻',34.9690927,135.7814186),
 ('sannomine','三ノ峰',34.96781,135.7823253),
 ('ninomine','二ノ峰',34.9671539,135.784002),
 ('summit','一ノ峰・稻荷山',34.9669808,135.7854899),
 ('mitsurugi','御劔社',34.9686625,135.7858476),
 ('gozentani','御膳谷奉拜所',34.9695168,135.783501),
]
pois=[{'id':key,'name':name,'p':project(lat,lon),'lat':lat,'lon':lon,'altitude':round(elevation(*project(lat,lon)),2)}for key,name,lat,lon in poiSpecs]
P={p['id']:p['p']for p in pois}
routePairs=[('okusha','kumataka'),('kumataka','mitsu'),('mitsu','yotsu'),('yotsu','sannomine'),('sannomine','ninomine'),('ninomine','summit'),('summit','mitsurugi'),('mitsurugi','gozentani'),('gozentani','yotsu')]
routes=[]
for a,b in routePairs:
 r=route(P[a],P[b]);r.update({'from':a,'to':b});routes.append(r)

# A local 4 m elevation grid with true metre scale.
grid={'x0':-150,'z0':-430,'step':4,'nx':356,'nz':166,'base':round(base,2)}
grid['h']=[round(elevation(grid['x0']+i*4,grid['z0']+j*4)-base,2)for j in range(grid['nz'])for i in range(grid['nx'])]
data={'version':2,'origin':origin,'sourceDate':'2026-10-25','buildings':buildings,'paths':paths,'water':water,'gates':gates,'pois':pois,'routes':routes,'dem':grid}
output=ROOT/'dist/map-data.js';output.write_text('export const MAP='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print(json.dumps({'buildings':len(buildings),'paths':len(paths),'routes':[(r['from'],r['to'],r['length'])for r in routes],'heightBase':base,'fileBytes':output.stat().st_size},ensure_ascii=True))
