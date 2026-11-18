export function createNightAmbience(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 let context=null,gain=null,buffer=null,source=null,enabled=false,stopping=false,fadeToken=0,target=0;
 const stats={supported:!!Audio,enabled:false,playing:false};
 function makeLoop(){
  const rate=16000,duration=24,out=context.createBuffer(1,rate*duration,rate),samples=out.getChannelData(0);
  let seed=41732,wind=0,air=0;
  const bellTimes=[6.8,16.7,17.58];
  for(let i=0;i<samples.length;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const t=i/rate,noise=seed/2147483648-1;
   wind+=.008*(noise-wind);air+=.11*(noise-air);
   const moving=.155+Math.sin(t*1.19)*.06+Math.sin(t*.61+1)*.03;
   const pulse=Math.max(0,Math.sin(t*11+Math.sin(t*1.4))-.32)*Math.max(0,Math.sin(t*2.6-.4));
   let bell=0;
   for(const strike of bellTimes){const e=t-strike;if(e<0||e>4.1)continue;bell+=Math.min(1,e*32)*Math.exp(-e*1.8)*(.036*Math.sin(e*2*Math.PI*1318.51)+.020*Math.sin(e*2*Math.PI*2119.72)+.011*Math.sin(e*2*Math.PI*3212.1));}
   const insects=.009*pulse*Math.sin(2*Math.PI*(2890*t+13*Math.sin(t*21)))+.007*pulse*Math.sin(2*Math.PI*3100*t);
   samples[i]=(wind*moving+air*.017+insects+bell)*Math.min(1,t*3,(duration-t)*3);
  }
  return out;
 }
 async function toggle(){
  if(!Audio)return false;
  enabled=!enabled;stats.enabled=enabled;
  if(enabled){
   context??=new Audio();
   gain??=context.createGain();
   if(!buffer){gain.gain.value=0;gain.connect(context.destination);buffer=makeLoop();}
   if(context.state==='suspended')await context.resume().catch(()=>{});
  }
  return enabled;
 }
 function update(near,weather){
  if(!context||!gain)return;
  const shouldPlay=enabled&&near&&!document.hidden&&context.state==='running';
  if(shouldPlay){
   if(!source){
    source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(gain);source.start();
   }
   if(stopping){fadeToken++;stopping=false;}
   const next=weather==='rain'?.20:.42;
   if(next!==target){target=next;gain.gain.setTargetAtTime(target,context.currentTime,.26);}
  }else if(source&&!stopping){
   const token=++fadeToken;stopping=true;target=0;gain.gain.setTargetAtTime(0,context.currentTime,.12);
   setTimeout(()=>{if(token!==fadeToken)return;source.stop();source.disconnect();source=null;stopping=false;stats.playing=false;},650);
  }
  stats.playing=shouldPlay;
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)update(false);});
 return{toggle,update,stats};
}
