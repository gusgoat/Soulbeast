(function () {
 'use strict';
 const prefsKey='sealbeast_audio_v1';
 const audio=new Audio(new URL('../../assets/audio/menu-and-results.mp3',document.currentScript.src));
 audio.preload='none';
 audio.loop=true;
 window.SoulbeastMusicChannel?.register(audio,document);

 function volume(value,fallback){
  return Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
 }
 function sync(){
  let prefs={};
  try{prefs=JSON.parse(localStorage.getItem(prefsKey)||'{}')||{};}catch{}
  audio.volume=.38*volume(prefs.volume,.35)*volume(prefs.musicVolume,1);
  if(prefs.enabled!==true||document.hidden||audio.volume===0)audio.pause();
  else if(audio.paused)audio.play().catch(()=>{});
 }
 document.addEventListener('pointerup',sync,{capture:true,passive:true});
 document.addEventListener('keydown',sync,true);
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pageshow',sync);
 window.addEventListener('pagehide',()=>audio.pause());
 window.addEventListener('storage',event=>{if(event.key===prefsKey||event.key===null)sync();});
 sync();
})();
