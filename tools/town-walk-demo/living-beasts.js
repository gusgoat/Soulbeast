(function(g){'use strict';
 const data=typeof module!=='undefined'?require('../../assets/living-beasts/catalog.js'):g.LivingBeastCatalog;
 const byId=new Map(data.models.map(m=>[m.id,m])),byForm=new Map(data.models.map(m=>[m.sp+':'+m.form,m]));
 const point=a=>a.position||a,hash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
 function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
 const formFor=(sp,lv)=>data.species[sp]?.ev?.filter(e=>lv>=e[0]).length||0;
 function model(sp,form=0){return byForm.get(sp+':'+form)||byForm.get(sp+':0')||byId.get(sp);}
 function plan(options,rng){
  const habitats=typeof module!=='undefined'?require('./beast-habitats.js'):g.BeastHabitats,species=Object.fromEntries(Object.entries(data.species).filter(([sp,s])=>model(sp,0)&&habitats.allowed(sp,s,options))),catalog={species,zones:data.zones,classes:[],affinities:g.walkBeastGroups?.groups},now=options.at??Date.now();
  if(options.scene==='island'){const rule=typeof module!=='undefined'?require('../island-demo/island-rules.js'):g.IslandRules;return {kind:'wild',units:rule.plan(options.country,{kind:'shadow',lv:options.level||45,at:now},catalog,rng)};}
  if(options.scene==='dungeon'){const rule=typeof module!=='undefined'?require('../labyrinth-demo/encounter-rules.js'):g.DungeonEncounterRules;return rule.plan(options.player||{},'shadow',catalog,options.floor,rng,now);}
  const rule=typeof module!=='undefined'?require('../hemant-walk-demo/encounter-rules.js'):g.hemantEncounterRules;
  return rule.plan(options.player||{lv:1},'shadow',catalog,rng,options.country||null,now,options.habitat==='water'?'water':null);
 }
 // Curated from the existing model contact sheets: gentle faces and guardian/herbivore silhouettes.
 // Model IDs keep evolved warriors distinct from their gentle first form; no random temperament rolls.
 const passiveModels=new Set(["wisp","wisp_ghostfire","wisp_death_lantern","jackalope","tanuki","tanuki_shifter","tanuki_thousand","pixie","pixie_flower","pixie_titania","kodama","kodama_ancient","kodama_sacred","kitsune","kitsune_six","kitsune_nine","nilmangkorn","nilmangkorn_war","nilmangkorn_royal","baku","nekomata","nekomata_evolved","amabie","amabie_seer","kinnaree","kinnaree_queen","moon_tortoise","moss_treant","silver_fox","moon_cat","mermaid","night_horse","celestial_deer","unicorn","pegasus","erawan","lamassu","lunar_stag","jade_moon_hare","bloom_jade_mare","aurora_whale","dawn_valkyrie","cosmic_tortoise","legend2_aurorion","legend2_selestia","qilin","kappa","mandrake","scarab","griffin","scarab_gold","dragon_young","yeti"]);
 const isPassive=a=>passiveModels.has(a?.beastModelId);
 function ensure(a,options={}){
  if(a.beastModelId)return a;
  const seed=options.seed??hash((options.scene||'')+':'+(options.country||'')+':'+(options.floor?.floor||'')+':'+(a.id||a.questId||point(a).x+','+point(a).y)+':'+(options.at||Date.now())),rng=random(seed);
  const encounter=a.sp?{kind:'wild',units:[{sp:a.sp,lv:a.lv||1}]}:a.encounterPlan||plan({...options,level:a.lv||options.level},rng),unit=encounter.units.find(u=>u.sp),form=a.evo??a.form??formFor(unit.sp,unit.lv),visual=model(unit.sp,form);
  if(!visual)throw Error('Missing living beast atlas for '+unit.sp+':'+form);
  a.encounterPlan=encounter;a.beastModelId=visual.id;a.beastSpecies=unit.sp;a.beastForm=form;a.beastName=visual.name;a.beastHabitat=options.habitat||'land';a.livingPhase=rng()*3;a.livingPose={...point(a),heading:0};a.livingSeed=seed;return a;
 }
 function assign(actors,options={}){const at=options.at??Date.now(),seen=new Set();for(let i=0;i<actors.length;i++){const a=actors[i];for(let attempt=0;attempt<(options.diverse?24:1);attempt++){if(attempt){delete a.beastModelId;delete a.encounterPlan;}ensure(a,{...options,at,seed:options.seed===undefined?(options.diverse?hash(at+':'+i+':'+attempt):undefined):hash(options.seed+':'+i+(options.diverse?':'+attempt:''))});if(!seen.has(a.beastSpecies))break;}seen.add(a.beastSpecies);}return actors;}
 function remember(a,context={}){if(!a?.encounterPlan)return '';const token='living-'+(g.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));try{g.sessionStorage.setItem(token,JSON.stringify({at:Date.now(),context,plan:a.encounterPlan}));return token;}catch{return '';}}
 function restore(token,context={}){if(!/^living-[\w-]+$/.test(token||''))return null;try{const item=JSON.parse(g.sessionStorage.getItem(token)||'null');if(!item||Date.now()-item.at>24*3600000||Object.entries(context).some(([k,v])=>item.context[k]!==v)||!item.plan.units?.length||item.plan.units.length>4||item.plan.units.some(u=>!data.species[u.sp]||!Number.isFinite(u.lv)||u.lv<1||u.lv>60))return null;return item.plan;}catch{return null;}}
 function createSprites(options={}){
  const cache=new Map(),queue=[],errors=new Map(),cell=options.cell||(g.navigator?.deviceMemory&&g.navigator.deviceMemory<=2?96:128),limit=options.cacheSize||8;let loading=0,disposed=false,frameClock=0,generation=0;
  function trim(){for(const [key,e]of [...cache].sort((a,b)=>a[1].used-b[1].used)){if(cache.size<=limit)break;if(e.bitmap&&Date.now()-e.used>300){e.bitmap.close?.();cache.delete(key);}}}
  async function pump(){if(disposed||loading>=2||!queue.length)return;const e=queue.shift();loading++;
   try{const res=await fetch(e.spec.url);if(!res.ok)throw Error('Atlas HTTP '+res.status);const blob=await res.blob();if(disposed||e.generation!==generation){e.resolve(false);return;}
    if(g.createImageBitmap)e.bitmap=await g.createImageBitmap(blob,{resizeWidth:cell*e.spec.columns,resizeHeight:cell*e.spec.rows,resizeQuality:'high'});
    else{const url=URL.createObjectURL(blob);try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=cell*e.spec.columns;canvas.height=cell*e.spec.rows;canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);e.bitmap=canvas;}finally{URL.revokeObjectURL(url);}}
    if(disposed||e.generation!==generation){e.bitmap.close?.();e.resolve(false);return;}errors.delete(e.spec.id);e.used=Date.now();e.resolve(true);trim();
   }catch(error){if(!disposed&&e.generation===generation){errors.set(e.spec.id,{message:String(error),at:Date.now()});cache.delete(e.spec.id);}e.resolve(false);}finally{loading--;pump();pump();}
  }
  function request(id){if(disposed)return null;let e=cache.get(id);if(e){e.used=Date.now();return e;}const spec=byId.get(id);if(!spec)return null;if(errors.has(id)&&Date.now()-errors.get(id).at<30000)return null;e={spec,generation,used:Date.now(),bitmap:null};e.promise=new Promise(resolve=>e.resolve=resolve);cache.set(id,e);queue.push(e);pump();return e;}
  function draw(ctx,a,x,y,size,time,drawOptions={}){
   if(!a.beastModelId)ensure(a,drawOptions);const e=request(a.beastModelId);if(!e?.bitmap)return false;
   const p=point(a),pose=a.livingPose||(a.livingPose={...p,heading:0}),dx=p.x-pose.x,dy=(p.y-pose.y)*(drawOptions.flatten||.64);if(Math.hypot(dx,dy)>.1)pose.heading=(Math.round(Math.atan2(-dx,dy)/(Math.PI/4))+8)%8;pose.x=p.x;pose.y=p.y;
   const moving=drawOptions.moving??(typeof a.moving==='boolean'?((a.chasing||a.returning)?Math.hypot(dx,dy)>.1:a.moving):true);
   const heading=((Math.round(drawOptions.heading??pose.heading)%8)+8)%8,frame=(moving||e.spec.kind==='flight'||e.spec.kind==='hover')?Math.floor((((time+(a.livingPhase||0))%3+3)%3)/3*e.spec.frames)%e.spec.frames:0,[ax,ay]=e.spec.anchors[heading],w=e.bitmap.width/e.spec.columns,h=e.bitmap.height/e.spec.rows;
   size *= e.spec.walkSpriteScale ?? 1;
   ctx.drawImage(e.bitmap,frame*w,heading*h,w,h,x-size*ax,y-size*ay,size,size);if(++frameClock%120===0)trim();return true;
  }
  function clear(){generation++;for(const e of cache.values()){e.bitmap?.close?.();e.resolve?.(false);}cache.clear();queue.length=0;}
  function dispose(){disposed=true;clear();}
  g.addEventListener?.('pagehide',e=>{if(e.persisted)clear();else dispose();});
  return {draw,preload:actors=>Promise.all([...new Set(actors.map(a=>a.beastModelId))].map(id=>request(id)?.promise)),ready:a=>!!cache.get(a.beastModelId)?.bitmap,stats:()=>({loaded:[...cache.values()].filter(e=>e.bitmap).length,queued:queue.length,loading,cell,errors:[...errors.entries()]}),dispose};
 }
 function create(options={}){if(options.mode==='2d'||new URLSearchParams(g.location?.search||'').get('beast3d')==='0')return createSprites(options);const fallback=createSprites({...options,cell:96,cacheSize:4});let renderer=null,disposed=false,error=null;import('./living-beasts-3d.mjs?v=field-size-1').then(m=>{if(!disposed)renderer=m.createLiving3D({data,ensure,fallback,modelScale:id=>byId.get(id)?.walkModelScale??1,maxActors:options.maxActors});}).catch(e=>{error=String(e);});g.addEventListener?.('pagehide',e=>{if(!e.persisted)disposed=true;});return {draw:(...args)=>(renderer||fallback).draw(...args),preload:actors=>options.preloadFallback?fallback.preload(actors):Promise.resolve([]),ready:a=>renderer?renderer.ready(a):fallback.ready(a),stats:()=>renderer?.stats()||{mode:'3d',loaded:0,queued:0,loading:renderer?0:1,errors:error?[['module',error]]:[]},dispose(){disposed=true;renderer?.dispose();fallback.dispose();}};}
 const canPlan=options=>{try{return !!plan(options,random(1807)).units.length;}catch{return false;}};
 const api={data,model,formFor,hash,random,plan,canPlan,isPassive,passiveModels:Object.freeze([...passiveModels]),ensure,assign,remember,restore,create};g.LivingBeasts=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
