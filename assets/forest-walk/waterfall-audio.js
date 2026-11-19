import {PUBLISHED_FOREST_MEDIA} from './published-scene-assets.js?v=heaven-waterfall-release-1';

const file='eisenkern1982-waterfall-176958.mp3';
export function waterfallGain(distance){
  if(!Number.isFinite(distance))return 0;
  const near=5,far=34,t=Math.max(0,Math.min(1,(far-distance)/(far-near)));
  return .8*t*t*(3-2*t);
}
export function waterfallAudioURL(){
  return ['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname)&&!new URLSearchParams(globalThis.location?.search).has('storage')
    ?new URL('./audio/'+file,import.meta.url).href:'https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/'+PUBLISHED_FOREST_MEDIA['audio/waterfall'];
}

// One loop for the nearest visible waterfall; borrow the game's effects bus.
export function startWaterfallAudio(getMix){
  const recording=new Audio();recording.loop=true;recording.preload='none';recording.crossOrigin='anonymous';
  let context,gain,source,destination,distance=Infinity,target=0,closed=false,pending=false,mayPlay=true;
  function update(){
    if(closed)return;
    const mix=getMix?.()||{};
    target=mix.enabled&&!document.hidden?waterfallGain(distance):0;
    if(!target&&!gain)return;
    if(!gain){
      if(!mix.context||mix.context.state==='closed'||!mix.destination)return;
      context=mix.context;gain=context.createGain();gain.gain.value=0;
      recording.src=waterfallAudioURL();source=context.createMediaElementSource(recording);source.connect(gain);
    }
    if(mix.destination&&destination!==mix.destination){gain.disconnect();destination=mix.destination;gain.connect(destination);}
    // Supplied recording is quiet (about -38 dB RMS); retain headroom at its original peak.
    gain.gain.setTargetAtTime(target*4,context.currentTime,.18);
    if(!mix.enabled||document.hidden){recording.pause();return;}
    if(target>0&&recording.paused&&!pending&&mayPlay){
      pending=true;
      Promise.resolve(recording.play()).catch(()=>{mayPlay=false;}).finally(()=>{pending=false;if(closed)recording.pause();});
    }
  }
  function gesture(){mayPlay=true;update();}
  document.addEventListener('visibilitychange',update);
  for(const type of ['pointerdown','click','keydown'])document.addEventListener(type,gesture,{passive:true});
  return {
    updateDistance(value){distance=value;update();},
    status:()=>({distance,target,playing:!recording.paused,source:recording.currentSrc||recording.src}),
    close(){
      if(closed)return;closed=true;
      document.removeEventListener('visibilitychange',update);
      for(const type of ['pointerdown','click','keydown'])document.removeEventListener(type,gesture);
      recording.pause();recording.removeAttribute('src');recording.load();source?.disconnect();gain?.disconnect();
      // The context and its master/effects gains belong to Sound, not this scene.
    }
  };
}
