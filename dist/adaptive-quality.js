export function createAdaptiveQuality(renderer,pipeline,state,profile){
 let enabled=false,scale=1,elapsed=0,count=0,lastChange=0,good=0;
 const cap=profile.integrated?1:Math.min(1.5,devicePixelRatio||1),minimum=profile.integrated?.55:.75;
 const stats={enabled:false,scale:1,profile:profile.integrated?'內顯':'標準',meanFrameMs:0};state.adaptive=stats;
 function apply(){renderer.setPixelRatio(scale);pipeline.setSamples(profile.integrated?0:2);pipeline.setAntialias('fxaa');pipeline.resize();stats.scale=scale;state.aaSamples=pipeline.samples;}
 return{stats,set(value){enabled=value;stats.enabled=value;elapsed=count=good=0;if(enabled){scale=profile.integrated?.8:cap;apply();}},observe(dt,interacting,blocked=false){if(!enabled||blocked||dt<=0||dt>.25)return;elapsed+=dt;count++;if(elapsed<1.5)return;const mean=elapsed*1000/count;stats.meanFrameMs=Math.round(mean*10)/10;elapsed=count=0;const now=performance.now();if(now-lastChange<2500)return;let next=scale;if(mean>25){next=Math.max(minimum,scale-.1);good=0;}else if(mean<18){if(++good>=3){next=Math.min(cap,scale+.05);good=0;}}else good=0;if(interacting&&mean>21)next=Math.max(minimum,next-.05);next=Math.round(next*100)/100;if(next!==scale){scale=next;lastChange=now;apply();}},get enabled(){return enabled;}};
}
