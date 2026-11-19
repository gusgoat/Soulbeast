import {forestAssetURL} from './storage-assets.js';
const buffers=new Map(),clips=new WeakMap();
// Original concrete recording: each impact starts after the initial quiet lead-in.
const trailOffsets=[.38,1.08,1.78,2.45,3.12,3.78,4.47,5.12];
export function footstepSlice(buffer,onTrail,index=0){
  const offset=onTrail?trailOffsets[index%trailOffsets.length]:0;
  const duration=Math.min(onTrail ? .27 : .21,buffer.duration-offset);
  let rows=clips.get(buffer);if(!rows){rows=new Map();clips.set(buffer,rows);}
  const key=onTrail?index%trailOffsets.length:'forest';if(rows.has(key))return rows.get(key);
  let peak=0;for(let channel=0;channel<buffer.numberOfChannels;channel++){
    const data=buffer.getChannelData(channel),end=Math.min(data.length,Math.ceil((offset+duration)*buffer.sampleRate));
    for(let i=Math.floor(offset*buffer.sampleRate);i<end;i++)peak=Math.max(peak,Math.abs(data[i]));
  }
  const clip={offset,duration,gain:.24*Math.min(6,.65/Math.max(.001,peak)),peak};rows.set(key,clip);return clip;
}
export function footstepURL(surface){
  return ['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname)&&!new URLSearchParams(globalThis.location?.search).has('storage')
    ?new URL('./audio/'+surface+'.mp3',import.meta.url).href:forestAssetURL('audio/'+surface+'.mp3');
}
export function createFootstepAudio(getMix){
  let closed=false,index=0;const active=new Set();
  function load(surface,context){
    if(!buffers.has(surface)){
      const pending=fetch(footstepURL(surface)).then(r=>{if(!r.ok)throw Error('Footsteps HTTP '+r.status);return r.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes));
      buffers.set(surface,pending);pending.catch(()=>{if(buffers.get(surface)===pending)buffers.delete(surface);});
    }
    return buffers.get(surface);
  }
  return {
    async step(running,onTrail,speed=1){
      const initial=getMix();if(closed||!initial.enabled||initial.context?.state!=='running')return;
      const requestedAt=initial.context.currentTime,surface=onTrail?'concrete-footsteps':'forest-footsteps';
      let buffer;try{buffer=await load(surface,initial.context);}catch{return;}
      const mix=getMix(),context=mix.context;
      if(closed||!mix.enabled||context!==initial.context||context.state!=='running'||context.currentTime-requestedAt>.25||!mix.destination)return;
      const clip=footstepSlice(buffer,onTrail,onTrail?index++:0);if(clip.duration<=0)return;
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.playbackRate.value=running?speed:1;
      const now=context.currentTime,end=now+clip.duration/source.playbackRate.value;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(clip.gain,now+.006);gain.gain.setValueAtTime(clip.gain,Math.max(now+.006,end-.02));gain.gain.linearRampToValueAtTime(0,end);
      source.connect(gain).connect(mix.destination);active.add(source);
      source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start(now,clip.offset,clip.duration);
    },
    close(){closed=true;for(const source of active)source.stop();active.clear();}
  };
}
