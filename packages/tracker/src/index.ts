type EventType='page_view'|'click';
type Payload={projectId:string;sessionId:string;type:EventType;page:{url:string;path:string};timestamp:string;click?:{x:number;y:number;viewportWidth:number;viewportHeight:number}};
const script=document.currentScript as HTMLScriptElement|null;
const api=(script?.dataset.api||'http://localhost:4000').replace(/\/$/,'');
const projectId=script?.dataset.projectId||'demo-project';
const key=`causal_session_${projectId}`;
let sessionId=localStorage.getItem(key);
if(!sessionId){sessionId=`sess_${crypto.randomUUID().replace(/-/g,'')}`;localStorage.setItem(key,sessionId)}
let queue:Payload[]=[]; let timer:number|undefined;
const emit=(type:EventType,click?:Payload['click'])=>{queue.push({projectId,sessionId:sessionId!,type,page:{url:location.href,path:location.pathname+location.search},timestamp:new Date().toISOString(),...(click?{click}: {})}); schedule();};
const flush=()=>{if(!queue.length)return;const batch=queue.splice(0,50);const body=JSON.stringify(batch); if(navigator.sendBeacon){const ok=navigator.sendBeacon(`${api}/v1/events/batch`,new Blob([body],{type:'application/json'}));if(ok)return;} fetch(`${api}/v1/events/batch`,{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true}).catch(()=>{queue.unshift(...batch.slice(0,20))});};
const schedule=()=>{if(timer!==undefined)return;timer=window.setTimeout(()=>{timer=undefined;flush()},500)};
window.addEventListener('click',e=>emit('click',{x:e.clientX,y:e.clientY,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight}),{passive:true});
window.addEventListener('pagehide',flush); window.addEventListener('beforeunload',flush);
emit('page_view');
export {sessionId};
