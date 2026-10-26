// @soulbeast-unit 1103-forestJourney
// Visual travel only. Resolve the original route exactly once after three steps.
const ForestJourney={
 duration:3000,stepMs:1000,active:null,completing:false,audio:new Map(),
 counts:{1:4,2:3,3:3,4:4,5:4,6:6,7:3,8:3},
 art(z){const count=this.counts[z.id]||3;return 'assets/ui/forest-journey/zone-'+z.id+'-'+(z.depth%count)+'.webp';},
 sound(z,door){return ['spring','cleanse'].includes(door.k)?'water':z.id===6?'hall':[3,4,5].includes(z.id)?'stone':z.id===8?'leaves':'forest';},
 prepare(key){if(this.audio.has(key))return this.audio.get(key);const promise=fetch('assets/audio/forest-journey/'+key+'.mp3').then(r=>{if(!r.ok)throw Error('Footstep unavailable');return r.arrayBuffer();}).then(b=>Sound.ctx?Sound.ctx.decodeAudioData(b):null).catch(()=>null);this.audio.set(key,promise);return promise;},
 async begin(index){
  if(this.active||S.screen!=='zone'||S.battle||!S.zone?.fork?.[index])return;
  const zone=S.zone,fork=zone.fork,stage=document.querySelector('.forest-journey');
  if(!stage?.querySelector)return forestJourneyFork(String(index));
  const run={zone,fork,index,stage,sources:[],cancelled:false};this.active=run;
  document.getElementById('app')?.classList.add('forest-walking');stage.setAttribute('aria-busy','true');
  stage.querySelectorAll('button').forEach(b=>b.disabled=true);
  const image=stage.querySelector('.journey-scene'),key=this.sound(zone,fork[index]);
  // Unlock in the initiating gesture; wait only for local assets, never alter the route.
  const load=Sound.enabled?Sound.unlock().then(()=>this.prepare(key)):Promise.resolve(null);
  const ready=image?.decode?.().catch(()=>{})||Promise.resolve();
  const buffer=await Promise.race([Promise.all([load,ready]).then(x=>x[0]),new Promise(resolve=>setTimeout(()=>resolve(null),1500))]);
  if(run.cancelled||S.zone!==zone||S.screen!=='zone'){this.cancel();return;}
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const frames=[];for(let step=0;step<3;step++){const base=step/3,next=(step+1)/3;const scale=1+step*.12;const pan=(index? -1:1)*step*3;
   frames.push({offset:base,transform:'translate('+pan+'%,0) scale('+scale+')'});
   frames.push({offset:base+.12,transform:'translate('+(pan+(index?-1:1)*1.5)+'%,'+(step%2?-0.7:0.7)+'%) scale('+(scale+.065)+')'});
   frames.push({offset:next,transform:'translate('+((index?-1:1)*(step+1)*3)+'%,0) scale('+(scale+.12)+')'});
  }
  run.animation=image?.animate(reduced?[{opacity:1},{opacity:1}]:frames,{duration:this.duration,easing:'linear',fill:'forwards'});
  if(buffer&&Sound.enabled&&Sound.ctx){const start=Sound.ctx.currentTime;for(let i=0;i<3;i++){const source=Sound.ctx.createBufferSource();source.buffer=buffer;source.connect(audioBus('effects'));source.start(start+i);run.sources.push(source);stage.dataset.scheduledFootsteps=String(run.sources.length);Sound.voices.add(source);source.onended=()=>Sound.voices.delete(source);}}
  run.started=Date.now();stage.dataset.walkDirection=index?'right':'left';stage.dataset.walkStarted=String(run.started);
  run.timer=setTimeout(()=>this.finish(run),this.duration);
 },
 finish(run){if(this.active!==run||run.cancelled)return;const valid=S.zone===run.zone&&S.zone.fork===run.fork&&S.screen==='zone'&&!S.battle;this.cancel();if(!valid)return;this.completing=true;try{forestJourneyFork(String(run.index));}finally{this.completing=false;}},
 cancel(){const run=this.active;this.active=null;if(run){run.cancelled=true;clearTimeout(run.timer);run.animation?.cancel();for(const source of run.sources){try{source.stop();}catch(e){}Sound.voices.delete(source);}run.stage.removeAttribute('aria-busy');run.stage.querySelectorAll('button').forEach(b=>b.disabled=false);}document.getElementById('app')?.classList.remove('forest-walking');}
};
const forestJourneyView=vZone;
vZone=function(){let html=forestJourneyView();if(S.battle||!S.zone?.fork||S.zone.ev)return html;
 html=html.replace(/(<button class="door[^>]*>[\s\S]*?)<small>[\s\S]*?<\/small>(<\/button>)/g,'$1$2');
 html=html.replace('<section class="stack forest-travel-stage">','<section class="stack forest-travel-stage forest-journey"><img class="journey-scene" src="'+ForestJourney.art(S.zone)+'" alt="" fetchpriority="high"><div class="journey-ui">').replace('</section>','</div></section>');return html;
};
const forestJourneyFork=handlers.fork;
handlers.fork=v=>ForestJourney.begin(Number(v));
const forestJourneyOldWalk=playWalk;
playWalk=function(...args){if(!ForestJourney.completing)return forestJourneyOldWalk(...args);};
const forestJourneyRender=render;
render=function(...args){if(ForestJourney.active){if(S.screen==='zone'&&S.zone===ForestJourney.active.zone&&!S.battle)return;ForestJourney.cancel();}const result=forestJourneyRender(...args);document.getElementById('app')?.classList.toggle?.('forest-fork',S.screen==='zone'&&!S.battle&&!!S.zone?.fork&&!S.zone.ev);return result;};
if(typeof document.addEventListener==='function')document.addEventListener('click',e=>{if(ForestJourney.active&&e.target.closest?.('#app button,#app a')){e.preventDefault();e.stopImmediatePropagation();}},true);
// @soulbeast-end 1103-forestJourney
