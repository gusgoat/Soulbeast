(function(){
 'use strict';
 const defaultRoot=document.currentScript&&new URL('../assets/audio/',document.currentScript.src);
 window.SoulbeastVoicePlayer=function({enabled,volume,duck=()=>{},audioRoot=defaultRoot}){
  const queue=[];
  const audio=new Audio();
  let current=null,version=0,stallTimer;
  function watchProgress(){
   clearTimeout(stallTimer);
   if(current?.done)stallTimer=setTimeout(clear,15000);
  }
  function finish(){
   clearTimeout(stallTimer);
   current?.done?.();
   current=null;
   duck(false);
   pump();
  }
  function pump(){
   if(current||!queue.length||document.hidden||!enabled())return;
   const next=queue.shift();
   if(Date.now()-next.added>12_000||next.valid&&!next.valid()){next.done?.();pump();return;}
   current=next;
   const stamp=++version,level=Number(volume());
   audio.volume=Number.isFinite(level)?Math.max(0,Math.min(1,level)):.35;
   audio.src=new URL(next.clip+'.mp3',audioRoot).href;
   duck(true);
   Promise.resolve(audio.play()).catch(error=>{
    if(version!==stamp||!current)return;
    if(next.done){finish();return;}
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
   clearTimeout(stallTimer);
   current?.done?.();
   queue.length=0;
   version++;
   audio.pause();
   audio.removeAttribute('src');
   current=null;
   duck(false);
  }
  // A terminal announcement takes priority and its caller waits for actual playback.
  function playUntilEnded(clip,valid,onTime){
   if(!enabled()||document.hidden||!clip||!valid())return Promise.resolve();
   clear();
   return new Promise(done=>{
    queue.push({clip,valid,added:Date.now(),done,onTime});
    pump();
    watchProgress();
   });
  }
  function refresh(){
   if(current?.valid&&!current.valid()){
    version++;
    audio.pause();
    finish();
   }
  }
  function updateTime(){if(current?.onTime&&!audio.paused)current.onTime(audio.currentTime);}
  audio.addEventListener('playing',updateTime);
  audio.addEventListener('timeupdate',()=>{watchProgress();updateTime();});
  audio.addEventListener('ended',()=>{if(audio.ended)finish();});
  audio.addEventListener('error',()=>{if(audio.error)finish();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  document.addEventListener('pointerup',pump,{capture:true,passive:true});
  document.addEventListener('keydown',pump,true);
  window.addEventListener('pagehide',clear);
  return {play,playUntilEnded,clear,refresh};
 };
})();
