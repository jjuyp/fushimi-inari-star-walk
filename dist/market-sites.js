import * as T from'three';
import{SHOP_CATALOGS,STALL_CATALOGS}from'./market-catalog.js';
import{MARKET_NAVIGATION}from'./market-navigation.js';
export function findMarketConnection(world,start){const step=.65,queue=[],seen=new Map(),key=(i,j)=>i+','+j;let cursor=0;const initial={i:0,j:0,x:start.x,y:start.y,z:start.z,parent:null};queue.push(initial);seen.set('0,0',initial);
  while(cursor<queue.length&&cursor<6500){const node=queue[cursor++],near=world.surface.nearPath(node.x,node.z);if(near.distance<Math.max(.45,(near.s?.width||2)/2-.3)){const route=[];for(let p=node;p;p=p.parent)route.push([p.x,p.y,p.z]);return route}
   for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const i=node.i+di,j=node.j+dj,k=key(i,j);if(Math.abs(i)>43||Math.abs(j)>43||seen.has(k))continue;seen.set(k,null);const x=start.x+i*step,z=start.z+j*step,y=world.walkHeight(x,z);if(!Number.isFinite(y)||Math.abs(y-node.y)>.8||world.physics.collides(x,y,z))continue;const mx=(x+node.x)/2,mz=(z+node.z)/2,my=world.walkHeight(mx,mz);if(!Number.isFinite(my)||world.physics.collides(mx,my,mz))continue;const next={i,j,x,y,z,parent:node};seen.set(k,next);queue.push(next)}
  }return null;
 }

export function createMarketSites(world,scene){
 const sites=[],unreachable=[],navigationFailures=[];let navigationCached=0;
 const connection=start=>findMarketConnection(world,start);
 for(const[sourceType,list,catalogs]of[['shop',world.district.storefronts,SHOP_CATALOGS],['stall',world.district.stallSites,STALL_CATALOGS]])for(const source of list){
  const catalog=catalogs[source.kind%catalogs.length],nx=Math.sin(source.angle),nz=Math.cos(source.angle),candidates=[],cached=MARKET_NAVIGATION[source.id];
  if(cached&&Math.hypot(source.x-cached.source[0],source.z-cached.source[1])<.02&&cached.route?.length&&cached.route.every((p,i)=>{if(world.physics.collides(p[0],world.walkHeight(p[0],p[2]),p[2]))return false;if(!i)return true;const prev=cached.route[i-1],x=(p[0]+prev[0])/2,z=(p[2]+prev[2])/2;return !world.physics.collides(x,world.walkHeight(x,z),z)})){const near=world.surface.nearPath(cached.x,cached.z);candidates.push({x:cached.x,y:world.walkHeight(cached.x,cached.z),z:cached.z,pathDistance:near.distance,publicPath:{x:near.x,z:near.z},cachedRoute:cached.route,score:0});navigationCached++}
  if(!candidates.length)for(const forward of[sourceType==='shop'?1.4:2.3,1.65,2.1,2.9,3.5,4.1,5.2,6])for(const side of[0,-.7,.7,-1.2,1.2,-2,2,-3,3]){const x=source.x+nx*forward+Math.cos(source.angle)*side,z=source.z+nz*forward-Math.sin(source.angle)*side,y=world.walkHeight(x,z);if(!Number.isFinite(y)||world.physics.collides(x,y,z))continue;const near=world.surface.nearPath(x,z);if(near.distance>18)continue;candidates.push({x,y,z,pathDistance:near.distance,publicPath:{x:near.x,z:near.z},score:near.distance*.4+Math.abs(forward-2.5)+Math.abs(side)*.4})}
  candidates.sort((a,b)=>a.score-b.score);let approach=candidates[0],approachRoute=null;for(const candidate of candidates.slice(0,8)){const route=candidate.cachedRoute||connection(candidate);if(route){approach=candidate;approachRoute=route;break}}if(!approach){unreachable.push({id:source.id,type:sourceType,x:source.x,z:source.z,name:catalog.title});continue}if(!approachRoute)navigationFailures.push(source.id);
  const group=new T.Group();group.name=catalog.title;group.position.set(source.x,source.y||approach.y,source.z);scene.add(group);const site={id:'market-'+source.id,name:catalog.title+' · '+(sourceType==='shop'?'町屋 ':'屋台 ')+String(source.number).padStart(2,'0'),place:sourceType==='shop'?'keihan':'entrance',x:approach.x,y:approach.y,z:approach.z,range:3.15,group,market:true,source,catalog,approach,approachRoute,sales:0};sites.push(site);
 }
 const market={sites,unreachable,navigationFailures,navigationCached,total:world.district.storefronts.length+world.district.stallSites.length};world.market=market;return market;
}
