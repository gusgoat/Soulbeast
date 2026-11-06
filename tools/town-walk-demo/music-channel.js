/* iOS: one gesture-unlocked Web Audio context across same-origin walk/menu frames. */
(function(scope){'use strict';
 let host=scope;try{while(host.parent!==host&&host.parent.document)host=host.parent}catch{}
 if(host.SoulbeastAudioBridge){scope.SoulbeastAudioBridge=host.SoulbeastAudioBridge;return}
 const enabled=/iPad|iPhone|iPod/.test(host.navigator.userAgent)||host.navigator.platform==='MacIntel'&&host.navigator.maxTouchPoints>1;
 const cache=new Map(),limit=32*1024*1024;let context=null,bytes=0;
 function getContext(){if(!enabled)return null;if(!context||context.state==='closed'){const C=host.AudioContext||host.webkitAudioContext;if(!C)return null;context=new C();}return context}
 function unlock(){const c=getContext();if(!c)return Promise.resolve(false);try{if(host.navigator.audioSession)host.navigator.audioSession.type='playback'}catch{}try{return Promise.resolve(c.state==='running'?undefined:c.resume()).then(()=>c.state==='running',()=>false)}catch{return Promise.resolve(false)}}
 function load(url,c){
  if(cache.has(url)){const row=cache.get(url);cache.delete(url);cache.set(url,row);return row.promise}
  const row={size:0,promise:null};row.promise=host.fetch(url).then(r=>{if(!r.ok)throw Error('audio_load_failed');return r.arrayBuffer()}).then(raw=>new Promise((resolve,reject)=>{
   // The callback form also supports older Safari decodeAudioData implementations.
   const p=c.decodeAudioData(raw,resolve,reject);if(p?.catch)p.catch(reject);
  })).then(buffer=>{row.size=buffer.length*buffer.numberOfChannels*4;bytes+=row.size;for(const [key,old]of cache){if(bytes<=limit)break;if(old.size){cache.delete(key);bytes-=old.size}}return buffer},error=>{if(cache.get(url)===row)cache.delete(url);throw error});cache.set(url,row);return row.promise;
 }
 function attach(audio,c,gain){
  if(!enabled||c!==context)return false;
  let node=null,version=0,paused=true,ended=false,offset=0,started=0,pending=null,duration=0;
  const now=()=>node?offset+(c.currentTime-started)*(audio.playbackRate||1):offset;
  const stop=()=>{const old=node;node=null;if(old){old.onended=null;try{old.stop();old.disconnect()}catch{}}};
  audio.pause=function(){offset=now();paused=true;version++;pending=null;stop();};
  audio.play=function(){
   if(!paused)return pending||Promise.resolve();
   if(c.state!=='running'){const e=Error('Tap to enable audio');e.name='NotAllowedError';return Promise.reject(e)}
   paused=false;ended=false;const stamp=++version,url=new URL(audio.src,audio.ownerDocument.baseURI).href;
   const promise=load(url,c).then(buffer=>{
    if(stamp!==version||paused)return;
    if(c.state!=='running'){paused=true;const e=Error('Audio context suspended');e.name='NotAllowedError';throw e}
    duration=buffer.duration;offset=audio.loop?offset%duration:Math.min(offset,duration);
    const source=c.createBufferSource();node=source;source.buffer=buffer;source.loop=audio.loop;source.playbackRate.value=audio.playbackRate||1;source.connect(gain);started=c.currentTime;
    source.onended=()=>{if(node!==source)return;node=null;source.disconnect();paused=true;ended=true;offset=duration;audio.dispatchEvent(new audio.ownerDocument.defaultView.Event('ended'));};source.start(0,offset);
   }).catch(error=>{if(stamp===version){paused=true;stop()}throw error}).finally(()=>{if(pending===promise)pending=null});pending=promise;return promise;
  };
  Object.defineProperties(audio,{
   paused:{configurable:true,get:()=>paused},ended:{configurable:true,get:()=>ended},
   currentTime:{configurable:true,get:()=>audio.loop&&duration?now()%duration:now(),set:value=>{const resume=!paused;audio.pause();offset=Math.max(0,Number(value)||0);ended=false;if(resume)audio.play().catch(()=>{})}}
  });
  audio.ownerDocument.defaultView.addEventListener('pagehide',()=>audio.pause());return true;
 }
 host.SoulbeastAudioBridge=scope.SoulbeastAudioBridge={enabled,getContext,unlock,attach,owns:c=>enabled&&c===context};
})(window);
/* Repeated in each frame so a real gesture in either scene can resume the shared context. */
(function(scope){'use strict';const bridge=scope.SoulbeastAudioBridge;if(!bridge?.enabled)return;
 function gesture(){try{if(JSON.parse(scope.localStorage.getItem('sealbeast_audio_v1')||'{}').enabled)void bridge.unlock()}catch{}}
 for(const type of ['pointerdown','touchend','click','keydown'])scope.document.addEventListener(type,gesture,{capture:true,passive:true});
})(window);

(function(scope){'use strict';
 // One music owner across the same-origin game and its menu frames.
 let host=scope;try{while(host.parent!==host&&host.parent.document)host=host.parent}catch{}
 if(host.SoulbeastMusicChannel){scope.SoulbeastMusicChannel=host.SoulbeastMusicChannel;return}
 const tracks=new Map();let owner=null;
 function visible(doc){try{if(doc.hidden||!doc.defaultView)return false;let w=doc.defaultView;while(w!==w.parent){const f=w.frameElement;if(!f)return false;for(let n=f;n;n=n.parentElement){const s=w.parent.getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility==='hidden')return false}w=w.parent}return true}catch{return false}}
 function ancestor(doc,child){try{let w=child.defaultView;while(w&&w!==w.parent){w=w.parent;if(w.document===doc)return true}}catch{}return false}
 function register(audio,doc){if(tracks.has(audio))return;const record={doc,version:0,play:audio.play.bind(audio),pause:audio.pause.bind(audio)};tracks.set(audio,record);
  audio.pause=function(){record.version++;record.pause();if(owner===audio)owner=null};
  audio.play=function(){if(!visible(doc)){audio.pause();return Promise.resolve()}const previous=tracks.get(owner);if(owner!==audio&&previous&&visible(previous.doc)&&!owner.paused&&ancestor(doc,previous.doc))return Promise.resolve();
   for(const [other]of tracks)if(other!==audio)other.pause();owner=audio;const version=++record.version;let pending;try{pending=record.play()}catch(error){if(owner===audio)owner=null;throw error}
   return Promise.resolve(pending).then(()=>{if(owner!==audio||!visible(doc))record.pause()},error=>{if(version===record.version&&owner===audio)owner=null;throw error});
  };
  doc.defaultView.addEventListener('pagehide',event=>{audio.pause();if(!event.persisted)tracks.delete(audio)});
 }
 const api={register};host.SoulbeastMusicChannel=scope.SoulbeastMusicChannel=api;
})(window);
