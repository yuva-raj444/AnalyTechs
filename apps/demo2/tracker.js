(function(){
  const API='http://localhost:4000';
  const PROJECT='demo-project';
  const key='causal_session_'+PROJECT;
  let sessionId=localStorage.getItem(key);
  if(!sessionId){sessionId='sess_'+crypto.randomUUID().replace(/-/g,'');localStorage.setItem(key,sessionId)}
  const queue=[];let timer;
  function pageSize(){const r=document.documentElement,b=document.body;return{w:Math.max(r.scrollWidth,b.scrollWidth,r.clientWidth,innerWidth),h:Math.max(r.scrollHeight,b.scrollHeight,r.clientHeight,innerHeight)}}
  function emit(type,click){queue.push({projectId:PROJECT,sessionId,type,page:{url:location.href,path:location.pathname+location.search},timestamp:new Date().toISOString(),...(click?{click}: {})});clearTimeout(timer);timer=setTimeout(flush,350)}
  async function flush(){if(!queue.length)return;const events=queue.splice(0,50);try{await fetch(API+'/v1/events/batch',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(events),keepalive:true})}catch(e){queue.unshift(...events)}}
  addEventListener('click',e=>{const s=pageSize();emit('click',{x:e.clientX,y:e.clientY,viewportWidth:innerWidth,viewportHeight:innerHeight,documentX:e.clientX+scrollX,documentY:e.clientY+scrollY,documentWidth:s.w,documentHeight:s.h,scrollX,scrollY})},{passive:true});
  addEventListener('pagehide',flush);emit('page_view');
})();
