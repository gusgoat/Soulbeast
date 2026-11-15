(function(){
 'use strict';
 const defaultRoot=document.currentScript&&new URL('../assets/audio/',document.currentScript.src);
 window.SoulbeastVoicePlayer=function({enabled,volume,duck=()=>{},audioRoot=defaultRoot}){
  const queue=[];
  const audio=new Audio();
  let current=null,version=0;
  function finish(){
   current=null;
   duck(false);
   pump();
  }
  function pump(){
   if(current||!queue.length||document.hidden||!enabled())return;
   const next=queue.shift();
   if(Date.now()-next.added>12_000||next.valid&&!next.valid()){pump();return;}
   current=next;
   const stamp=++version,level=Number(volume());
   audio.volume=Number.isFinite(level)?Math.max(0,Math.min(1,level)):.35;
   audio.src=new URL(next.clip+'.mp3',audioRoot).href;
   duck(true);
   Promise.resolve(audio.play()).catch(error=>{
    if(version!==stamp||!current)return;
    current=null;
    duck(false);
    if(error.name==='NotAllowedError'){queue.unshift(next);return;}
    pump();
   });
  }
  function play(clip,valid){
   if(!enabled()||document.hidden||!clip||queue.length>=8)return;
   queue.push({clip,valid,added:Date.now()});
   pump();
  }
  function clear(){
   queue.length=0;
   version++;
   audio.pause();
   audio.removeAttribute('src');
   current=null;
   duck(false);
  }
  function refresh(){
   if(current?.valid&&!current.valid()){
    version++;
    audio.pause();
    finish();
   }
  }
  audio.addEventListener('ended',finish);
  audio.addEventListener('error',finish);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  document.addEventListener('pointerup',pump,{capture:true,passive:true});
  document.addEventListener('keydown',pump,true);
  window.addEventListener('pagehide',clear);
  return {play,clear,refresh};
 };
})();
