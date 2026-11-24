import './voice-player.js?v=fallen-end-1';

const root=new URL('../assets/audio/',import.meta.url);
const prefsKey='sealbeast_audio_v1';
function settings(){
 try{return JSON.parse(localStorage.getItem(prefsKey)||'{}')||{};}catch{return {};}
}
const voice=window.SoulbeastGameVoice??window.SoulbeastVoicePlayer({
 audioRoot:root,
 enabled:()=>window.SoulbeastGameVoiceMix?.enabled()??settings().enabled===true,
 volume:()=>{
  const prefs=settings();
  return window.SoulbeastGameVoiceMix?.volume()??(prefs.volume??.35)*(prefs.effectsVolume??1);
 },
 duck:on=>window.SoulbeastGameVoiceMix?.duck(on),
});
window.SoulbeastGameVoice=voice;
window.addEventListener('storage',event=>{if(event.key===prefsKey&&settings().enabled!==true)voice.clear();});
export function systemVoice(clip,valid){voice.play('game-voice/'+clip,valid);}
export function fallenVoice(valid,onTime){return voice.playUntilEnded('game-voice/fallen',valid,onTime);}
export function bossVoice(clip,valid){voice.play('boss-voice/'+clip,valid);}
