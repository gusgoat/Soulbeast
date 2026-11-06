/* Presentation barrier: combat clocks start after assets and the parent overlay clear. */
(()=>{'use strict';
 const pending=new WeakMap(),complete=new WeakSet();
 const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 function imageReady(im){im.loading='eager';if(im.complete)return im.decode?.().catch(()=>{})||Promise.resolve();return new Promise(resolve=>{const done=()=>{im.removeEventListener('load',done);im.removeEventListener('error',done);resolve()};im.addEventListener('load',done,{once:true});im.addEventListener('error',done,{once:true});if(im.complete)done()}).then(()=>im.decode?.().catch(()=>{}));}
 async function prepare(){
  const loading=window.WalkLoading?.begin('กำลังเตรียมฉากต่อสู้…',{delay:0});
  await paint();
  if(document.readyState!=='complete')await new Promise(resolve=>addEventListener('load',resolve,{once:true}));
  const root=document.querySelector('#app main')||document.querySelector('main')||document.body;
  const images=[...root.querySelectorAll('img')];
  const backgrounds=new Set();
  for(const el of [root,...root.querySelectorAll('[style],.battle-scene,.battlefield,.battle-stage')]){
   if(!el.getClientRects().length)continue;
   for(const match of getComputedStyle(el).backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g))backgrounds.add(match[1]);
  }
  for(const src of backgrounds){const im=new Image();im.src=src;images.push(im)}
  await Promise.allSettled(images.map(imageReady));
  if(document.fonts?.ready)await document.fonts.ready;
  while(document.hidden)await new Promise(resolve=>document.addEventListener('visibilitychange',resolve,{once:true}));
  loading?.finish();window.WalkLoading?.ready();
  if(parent!==window){
   const token=crypto.randomUUID();
   await new Promise(resolve=>{const done=e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='walk-battle-presented'&&e.data.token===token){clearTimeout(timer);removeEventListener('message',done);resolve()}};addEventListener('message',done);const timer=setTimeout(()=>{removeEventListener('message',done);resolve()},400);parent.postMessage({type:'walk-battle-present',href:location.href,token},location.origin)});
  }
  await paint();
 }
 window.BattleReady={ready:key=>complete.has(key),wait(key){if(!pending.has(key))pending.set(key,prepare().then(()=>complete.add(key)));return pending.get(key)}};
})();
