// Warm the public renderer in the HTTP cache while the test player walks.
// Initializing the battle, playing audio and preparing poses still belong to the encounter.
(()=>{
 const start=async()=>{
  try{
   if(document.hidden||navigator.connection?.saveData||/2g/.test(navigator.connection?.effectiveType||''))return;
   const session=JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1')||'null');
   if(session?.environment!=='test'||sessionStorage.getItem('soulbeast-new-battle-test')==='off')return;
   const url=new URL('../../battle-ui-v1/test-effects.html?connected=ordinary&ui=dungeon-solo-context-20261123-1&entry=country',location.href);
   const response=await fetch(url,{priority:'low'});
   if(!response.ok)return;
   const template=document.createElement('template');
   template.innerHTML=await response.text();
   const script=template.content.querySelector('script[defer][src*="/battle-ui-v1/"]');
   if(!script)return;
   const hint=document.createElement('link');
   hint.rel='prefetch';hint.as='script';hint.href=new URL(script.getAttribute('src'),url).href;
   document.head.append(hint);
  }catch{/* A cold encounter can always fetch its own renderer. */}
 };
 const schedule=()=>window.requestIdleCallback?requestIdleCallback(start,{timeout:3500}):setTimeout(start,1000);
 if(document.readyState==='complete')schedule();else addEventListener('load',schedule,{once:true});
})();
