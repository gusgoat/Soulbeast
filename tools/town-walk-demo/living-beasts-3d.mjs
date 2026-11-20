import {createActor} from '../hemant-walk-demo/packlord-3d/world-actors.mjs?v=beasts-3d-six-20261121';
import '../../assets/living-beasts/models-3d.js?v=beasts-3d-six-20261121';
export function createLiving3D({data,ensure,fallback,maxActors:overrideBudget}={}){
 const entries=new Map(),queue=[],errors=new Map();let loading=0,disposed=false,generation=0,drawn=0,maxActors=3,renderInterval=.1;
 const position=a=>a.position||a;
 function remove(a,e){if(entries.get(a)!==e)return;entries.delete(a);e.model?.dispose();e.cancelled=true;}
 function trim(){const now=performance.now();for(const [a,e]of entries)if(now-e.seen>2000)remove(a,e);}
 function quality(){const q=globalThis.WalkGraphics?.active(),touch=matchMedia('(pointer: coarse)').matches;maxActors=Math.max(1,Math.min(navigator.deviceMemory&&navigator.deviceMemory<=2?2:4,overrideBudget??q?.beastBudget??(touch?3:4)));renderInterval=q?.beastInterval??(touch?.1:.067);for(const [a,e]of [...entries].slice(maxActors))remove(a,e);for(const e of entries.values())e.model?.setRenderInterval?.(renderInterval);}
 async function pump(){if(disposed||loading||!queue.length)return;const e=queue.shift();if(e.cancelled||performance.now()-e.seen>2000){remove(e.actor,e);pump();return;}loading++;const ticket=generation;
  try{const model=await createActor(e.spec.url,{beast:true,locomotionOnly:true,alwaysAnimate:['flight','hover'].includes(e.spec.kind),motionKind:e.spec.kind,phaseOffset:e.actor.livingPhase||0,renderInterval});if(disposed||ticket!==generation||e.cancelled){model.dispose();return;}model.setRenderInterval(renderInterval);e.model=model;errors.delete(e.id);}catch(error){if(!e.cancelled){errors.set(e.id,{message:String(error),at:Date.now()});remove(e.actor,e);}}finally{loading--;pump();}
 }
 function request(a){let e=entries.get(a);if(e){e.seen=performance.now();return e;}trim();const spec=globalThis.LivingBeastModels3D.models[a.beastModelId];if(!spec||disposed||entries.size>=maxActors||errors.has(a.beastModelId)&&Date.now()-errors.get(a.beastModelId).at<30000)return null;e={actor:a,id:a.beastModelId,spec,seen:performance.now(),model:null,cancelled:false};entries.set(a,e);queue.push(e);pump();return e;}
 function draw(ctx,a,x,y,size,time,options={}){if(!a.beastModelId)ensure(a,options);const p=position(a),pose=a.livingPose3d||(a.livingPose3d={...p,heading:a.livingPose?.heading||0}),dx=p.x-pose.x,dy=(p.y-pose.y)*(options.flatten||.64),changed=Math.hypot(dx,dy)>.1;if(changed)pose.heading=(Math.atan2(-dx,dy)/(Math.PI/4)+8)%8;pose.x=p.x;pose.y=p.y;const moving=options.moving??(typeof a.moving==='boolean'?((a.chasing||a.returning)?changed:a.moving):true),e=request(a);if(e?.model&&e.model.draw(ctx,x,y,size,options.heading??pose.heading,moving,false)){drawn++;return true;}return fallback.draw(ctx,a,x,y,size,time,options);}
 const timer=setInterval(trim,1000);
 function clear(){generation++;for(const [a,e]of entries)remove(a,e);queue.length=0;}
 function dispose(){if(disposed)return;disposed=true;clearInterval(timer);removeEventListener('walk-graphics-changed',quality);removeEventListener('storage',storage);clear();fallback.dispose();}
 function storage(e){if(e.key===globalThis.WalkGraphics?.KEY||e.key===null)quality();}
 quality();addEventListener('walk-graphics-changed',quality);addEventListener('storage',storage);addEventListener('pagehide',e=>e.persisted?clear():dispose());
 return {draw,preload:()=>Promise.resolve([]),ready:a=>!!entries.get(a)?.model?.available||fallback.ready(a),stats:()=>({mode:'3d',fallbackLoaded:fallback.stats().loaded,loaded:[...entries.values()].filter(e=>e.model).length,queued:queue.filter(e=>!e.cancelled).length,loading,maxActors,renderInterval,drawn,errors:[...errors.entries()],actors:[...entries.values()].map(e=>({id:e.id,ready:!!e.model?.available,motion:e.model?.motion||'loading',angle:e.model?.angle,animationTime:e.model?.animationTime,clipDuration:e.model?.clipDuration,rasterCount:e.model?.rasterCount}))}),clear,dispose};
}
