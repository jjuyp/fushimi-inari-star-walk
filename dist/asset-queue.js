// Two concurrent asset tasks avoid a burst of decode/transcode work on iGPUs.
const tasks=[];let active=0,started=0,finished=0;
export const assetQueueStats={active:0,queued:0,finished:0,total:0};
function report(){Object.assign(assetQueueStats,{active,queued:tasks.length,finished,total:started});window.inariBoot?.asset(finished,started);}
function pump(){while(active<2&&tasks.length){const task=tasks.shift();active++;report();Promise.resolve().then(task.run).then(task.resolve,task.reject).finally(()=>{active--;finished++;report();pump();});}}
export function queueAsset(label,run,priority=0){started++;return new Promise((resolve,reject)=>{tasks.push({label,run,priority,resolve,reject});tasks.sort((a,b)=>b.priority-a.priority);report();pump();});}
export function yieldToUI(){return new Promise(resolve=>setTimeout(resolve,0));}
