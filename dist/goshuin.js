import {asset} from './materials.js';
import {SHRINES} from './side-shrines.js';

const kanji='〇一二三四五六七八九';
function number(value){
 return value<10?kanji[value]:(value>=20?kanji[Math.floor(value/10)]:'')+'十'+(value%10?kanji[value%10]:'');
}
function stampDate(value){
 const [year,month,day]=value.split('-').map(Number);
 return ['令和'+(year===2019?'元':number(year-2018))+'年',number(month)+'月'+number(day)+'日'];
}
export const hasGoshuin=(records,id)=>typeof records?.[id]==='string'&&/^20(?:1[9]|[2-9]\d)-\d{2}-\d{2}$/.test(records[id]);

export function currentStampDate(){
 const now=new Date();
 return [now.getFullYear(),now.getMonth()+1,now.getDate()].map((v,i)=>String(v).padStart(i?2:4,'0')).join('-');
}

export function goshuinCard(shrine,value){
 const recorded=hasGoshuin({[shrine.id]:value},shrine.id);
 const [era,day]=recorded?stampDate(value):['',''];
 return `<div class="goshuin-card${recorded?'':' goshuin-empty'}" role="img" aria-label="${shrine.name}御朱印${recorded?' '+value:' 尚未收集'}">
  ${recorded?`<img src="${asset('v3.7/goshuin-'+shrine.id+'.webp')}" alt="" decoding="async"><i class="goshuin-seal" aria-hidden="true">稲荷<br>奉拝</i>`:''}
  <span class="goshuin-name">${shrine.name}</span>
  ${recorded?`<span class="goshuin-worship">奉拝</span><span class="goshuin-era">${era}</span><span class="goshuin-date">${day}</span><span class="goshuin-round" aria-hidden="true">${shrine.mark}</span>`:'<span class="goshuin-missing">待參拜</span>'}
 </div>`;
}

export function goshuinGallery(records){
 const count=SHRINES.filter(s=>hasGoshuin(records,s.id)).length;
 return `<div class="goshuin-overview"><p>完成小社參拜，即可收藏該社的御朱印。</p><span aria-label="已收藏 ${count} 張，共 ${SHRINES.length} 張"><strong>${count}</strong> ／ ${SHRINES.length}</span></div>
 <div class="goshuin-grid">${SHRINES.map(s=>`<button type="button" class="goshuin-entry" data-goshuin="${s.id}" aria-label="${hasGoshuin(records,s.id)?'展開':'前往'}${s.name}">${goshuinCard(s,records?.[s.id])}</button>`).join('')}</div>
 <p class="goshuin-caption">遊戲原創御朱印・首次完成參拜的日期會留在帳內</p>`;
}
