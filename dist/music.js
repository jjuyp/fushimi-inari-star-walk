import {asset} from './materials.js';
export function createMusic(button,toast){
 const tracks=[{file:'hot-springs-town.mp3',name:'Hot Springs Town · Kistol'},{file:'kawarayu.mp3',name:'Kawarayu · Yubatake'},{file:'arukas-bloom.mp3',name:'Arukas Bloom · TAD'}];
 const audio=new Audio();audio.preload='none';audio.volume=.32;let index=0,enabled=false,loaded=false;
 function label(){button.querySelector('span').textContent=enabled?'音樂':'靜音';button.setAttribute('aria-pressed',String(enabled));button.title=enabled?tracks[index].name:'播放日式抒情音樂';}
 async function play(){if(!loaded){audio.src=asset('v3.1/'+tracks[index].file);loaded=true;}try{await audio.play();enabled=true;label()}catch{enabled=false;label();toast('請再點一下音樂開始播放');}}
 button.onclick=()=>{if(enabled){audio.pause();enabled=false;label()}else{play();toast(tracks[index].name)}};
 function next(){index=(index+1)%tracks.length;loaded=false;if(enabled)play();}
 audio.addEventListener('ended',next);let failures=0;audio.addEventListener('error',()=>{if(++failures<tracks.length)next();else{enabled=false;label()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();else if(enabled)play()});
 return{audio,tracks,next,get enabled(){return enabled},get index(){return index}};
}
