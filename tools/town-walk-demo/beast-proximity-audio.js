(function(scope){'use strict';
 const F=.64,RADIUS=360,MIN_GAP=3.5,MAX_CLIP=6;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const distance=(p,a)=>Math.hypot(p.x-a.x,(p.y-a.y)*F);
 function create({catalog=scope.BeastVoiceCatalog,makeAudio=src=>new Audio(src),random=Math.random}={}){
  const due=new WeakMap();let clock=0,next=0,scanAt=0,nearest=null,current=null,pooled=null,disposed=false,plays=0;
  function stop(){if(current){const voice=current;current=null;voice.audio.onended=voice.audio.onerror=null;voice.audio.pause();voice.audio.removeAttribute?.('src');voice.audio.load?.();voice.audio.remove?.();}}
  function eligible(a){return a&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&!(a.cooldown>0)&&!a.dead&&a.hp!==0&&catalog?.species[a.beastSpecies||a.sp]?.urls?.length;}
  function tick(dt,{position,actors=[],enabled=false,volume=0}){
   if(disposed)return;clock+=dt;
   if(!enabled||volume<=0){stop();nearest=null;scanAt=0;return;}
   if(clock>=scanAt||!nearest||!eligible(nearest)||!actors.includes(nearest)){
    scanAt=clock+.2;nearest=null;let best=RADIUS;
    for(const actor of actors){if(!eligible(actor))continue;const d=distance(position,actor);if(d<best){best=d;nearest=actor;}}
   }
   if(nearest&&distance(position,nearest)>=RADIUS)nearest=null;
   if(current&&(!eligible(current.actor)||!actors.includes(current.actor)||current.actor!==nearest||distance(position,current.actor)>=RADIUS||clock-current.started>=MAX_CLIP||current.audio.ended))stop();
   if(current){current.audio.volume=clamp(volume*.75*Math.pow(1-distance(position,current.actor)/RADIUS,1.3));return;}
   if(!nearest||clock<next||clock<(due.get(nearest)||0))return;
   const actor=nearest,sp=actor.beastSpecies||actor.sp,entry=catalog.species[sp],src=entry.urls[Math.min(entry.urls.length-1,Math.floor(random()*entry.urls.length))];
   const audio=pooled??(pooled=makeAudio(src));audio.src=src;audio.currentTime=0;const voice={actor,sp,src,audio,started:clock};current=voice;plays++;next=clock+MIN_GAP;due.set(actor,clock+9+random()*5);
   audio.loop=false;audio.preload='none';audio.hidden=true;if(audio.dataset){audio.dataset.walkAudioTrack='beast';audio.dataset.beastSpecies=sp;}scope.document?.body?.append(audio);
   audio.volume=clamp(volume*.75*Math.pow(1-distance(position,actor)/RADIUS,1.3));
   const done=()=>{if(current===voice)stop();};audio.onended=done;audio.onerror=done;
   try{const playing=audio.play();playing?.then(()=>{if(disposed||!current)audio.pause();}).catch(done);}catch{done();}
  }
  function dispose(){if(disposed)return;disposed=true;stop();pooled?.beastDispose?.();pooled=null;nearest=null;}
  return {tick,stop,dispose,stats:()=>({playing:!!current,species:current?.sp||'',src:current?.src||'',volume:current?.audio.volume||0,plays,radius:RADIUS,disposed})};
 }
 const api={create,distance,RADIUS};scope.BeastProximityAudio=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
