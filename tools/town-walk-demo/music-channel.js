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
