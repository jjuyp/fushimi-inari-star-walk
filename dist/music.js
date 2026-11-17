import {asset} from './materials.js';
export function createMusic(button,toast){
 const tracks=[
  {file:'v3.4.2/sunset-plains.mp3',name:'暖陽小徑｜Sunset Plains · Yoiyami',gain:0.977},
  {file:'v3.1/hot-springs-town.mp3',name:'溫泉小鎮｜Hot Springs Town · Kistol',gain:0.519},
  {file:'v3.4.2/peaceful-town.mp3',name:'街角慢步｜peaceful town · haruta',gain:0.912},
  {file:'v3.1/arukas-bloom.mp3',name:'花開時分｜Arukas Bloom · TAD',gain:0.794},
  {file:'v3.4.2/deep-blue-piano.mp3',name:'暮色微光｜Deep Blue Ambient Piano · Yoiyami',gain:0.923},
  {file:'v3.4.2/yuki.mp3',name:'冬日茶香｜Yuki · AstralTempest',gain:1},
  {file:'v3.1/kawarayu.mp3',name:'山中小歇｜Kawarayu · Yubatake',gain:0.452}
 ];
 const audio=new Audio();audio.preload='none';let index=0,enabled=false,wanted=false,loaded=-1,volume=.32,timer=null,token=0,failures=0;
 const select=document.querySelector('#musicTrack'),status=document.querySelector('#musicNowPlaying');
 if(select){for(const [i,t]of tracks.entries()){const o=document.createElement('option');o.value=i;o.textContent=t.name;select.append(o);}select.onchange=()=>choose(Number(select.value));}
 const level=()=>Math.min(1,volume*tracks[index].gain);
 function clearFade(){if(timer!==null)clearInterval(timer);timer=null;}
 function fade(target,duration,done){clearFade();const start=audio.volume,at=performance.now();timer=setInterval(()=>{const f=Math.min(1,(performance.now()-at)/duration);audio.volume=Math.min(1,Math.max(0,start+(target-start)*f));if(f===1){clearFade();done?.();}},40);}
 function label(){button.querySelector('span').textContent=enabled?'音樂':'靜音';button.setAttribute('aria-pressed',String(enabled));button.title=(enabled?'播放中：':'點擊播放：')+tracks[index].name;if(select)select.value=index;if(status)status.textContent=(enabled?'正在播放　':'已選曲　')+tracks[index].name;}
 async function play(){wanted=true;const request=++token;clearFade();if(loaded!==index){audio.src=asset(tracks[index].file);loaded=index;}audio.volume=0;try{await audio.play();if(request!==token)return;if(!wanted||document.hidden){audio.pause();return;}enabled=true;failures=0;label();fade(level(),1250);}catch{if(request!==token)return;wanted=enabled=false;label();toast('請點音符按鈕開始播放');}}
 function pause(){wanted=enabled=false;token++;clearFade();audio.pause();label();}
 function choose(value){if(!Number.isInteger(value)||value<0||value>=tracks.length)return;index=value;const request=++token;clearFade();label();if(wanted){if(audio.paused||audio.ended)play();else fade(0,280,()=>{if(request===token){audio.pause();play();}});}toast(tracks[index].name);}
 function next(){choose((index+1)%tracks.length);}
 function previous(){choose((index+tracks.length-1)%tracks.length);}
 function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));clearFade();audio.volume=level();}
 button.onclick=()=>wanted?pause():play();audio.addEventListener('ended',()=>{if(wanted)next();});
 audio.addEventListener('error',()=>{if(!wanted)return;if(++failures<tracks.length)next();else{pause();toast('音樂暫時無法載入，請稍後再試。');}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){token++;clearFade();audio.pause();}else if(wanted)play();});
 label();return{audio,tracks,next,previous,select:choose,setVolume,get enabled(){return enabled},get index(){return index}};
}
