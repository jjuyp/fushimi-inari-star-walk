export const PRAYER_DURATION=9;
export const CLAP_TIMES=[4.80,5.40];
const bows=[[2.0,3.02],[3.19,4.21],[7.28,8.82]];
const smooth=t=>{const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u)};

export function samplePrayer(t){
 const index=bows.findIndex(([start,end])=>t>=start&&t<=end);
 let bow=0;
 if(index>=0){const [start,end]=bows[index],span=end-start;bow=.91*smooth((t-start)/(span*.39))*smooth((end-t)/(span*.4));}
 let gap=.079;
 if(t>4.28&&t<5.72){
  gap=.255;
  for(const at of CLAP_TIMES)gap=Math.min(gap,.058+.197*(1-smooth((t-at+.22)/.22)*smooth((at+.15-t)/.15)));
 }
 const phase=t<1.2?'coin':t<2?'bell':index===0?'bow-1':index===1?'bow-2':t<4.28?'ready':t<5.72?'clap':t<7.28?'prayer':t<8.85?'bow-3':'finish';
 return{phase,bow,gap};
}

export const PRAYER_LABELS={coin:'投下賽錢',bell:'輕搖鈴繩','bow-1':'第一禮・深深鞠躬','bow-2':'第二禮・深深鞠躬',ready:'抬起雙手',clap:'兩拍手・祈願',prayer:'合掌・靜心祈願','bow-3':'最後一禮・深深鞠躬',finish:'禮畢'};
