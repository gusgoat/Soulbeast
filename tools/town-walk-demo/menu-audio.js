/* Reuse the original mixer, soundtrack and effects with shared walk preferences. */
const walkMusicTrack=Music.track;
Music.track=function(key){const track=walkMusicTrack.call(this,key);if(audioTrackKind(key)==='music')window.SoulbeastMusicChannel?.register(track.audio,document);if(!track.audio.isConnected){track.audio.hidden=true;track.audio.dataset.gameAudioTrack=key;document.body.append(track.audio)}return track};
const walkUnlockAudio=()=>{if(Sound.enabled)Sound.unlock()};
document.addEventListener('pointerdown',walkUnlockAudio,{passive:true});
document.addEventListener('keydown',walkUnlockAudio);
addEventListener('storage',event=>{if(event.key==='sealbeast_audio_v1'){Sound.load();if(Sound.enabled)Sound.unlock();else Sound.mute()}});
addEventListener('pagehide',()=>Sound.mute());
const walkMusicSync=Music.sync;
Music.sync=function(...args){const result=walkMusicSync.apply(this,args);document.documentElement.dataset.menuAudio=JSON.stringify({enabled:Sound.enabled,context:Sound.ctx?.state||'locked',scene:this.scene||'',track:this.playing||''});return result};
// Try immediately when the browser already permits audio; gestures retry if needed.
walkUnlockAudio();
