(function(scope){'use strict';
const KEY='soulbeast-walk-preview-player-v1';
const PREVIEW_KEY='soulbeast-walk-avatar-preview-v1';
const PREVIEW_AVATARS={"azure-valkyrie": {"cls": "swordsman", "gender": "female"}, "azure-starblade": {"cls": "swordsman", "gender": "male"}, "lionheart-valkyrie": {"cls": "gladiator", "gender": "female"}, "lionheart-sentinel": {"cls": "gladiator", "gender": "male"}, "azure-oracle-of-tides": {"cls": "summoner", "gender": "male"}, "celestial-archmage-character-sheet": {"cls": "mage", "gender": "male"}, "celestial-starweaver": {"cls": "mage", "gender": "female"}, "clockwork-trailblazer": {"cls": "merchant", "gender": "female"}, "crimson-gunslinger": {"cls": "gunner", "gender": "female"}, "emerald-grove-archmage": {"cls": "druid", "gender": "male"}, "feathered-wayfarer": {"cls": "merchant", "gender": "male"}, "gilded-gunslinger-character-sheet": {"cls": "gunner", "gender": "male"}, "gilded-shadowblade": {"cls": "thief", "gender": "male"}, "shadowblade-sentinel": {"cls": "thief", "gender": "female"}, "verdant-elven-archer": {"cls": "archer", "gender": "male"}, "verdant-elven-archer-sheet": {"cls": "archer", "gender": "female"}, "jade-seraphina": {"cls": "summoner", "gender": "female"}, "verdant-elven-oracle": {"cls": "druid", "gender": "female"}, "crimson-imperial-warmaiden": {"cls": "alchemist", "gender": "female"}, "crimson-artillerist": {"cls": "artillery", "gender": "female"}, "crimson-blade-dancer-alt": {"cls": "assassin", "gender": "female"}, "crimson-blade-dancer": {"cls": "rogue", "gender": "female"}, "verdant-oracle-of-the-glade": {"cls": "grove", "gender": "female"}, "celestial-archer-goddess": {"cls": "bard", "gender": "female"}, "crimson-ronin-empress": {"cls": "samurai", "gender": "female"}, "celestial-oracle-priestess": {"cls": "sage", "gender": "female"}, "crimson-dragon-empress": {"cls": "soullink", "gender": "female"}, "crimson-reaver": {"cls": "berserker", "gender": "female"}, "crimson-imperial-blade": {"cls": "spellblade", "gender": "female"}, "crimson-warhammer-sentinel": {"cls": "blacksmith", "gender": "female"}, "crimson-tiger-shaman": {"cls": "feral", "gender": "female"}, "crimson-empress-character-sheet": {"cls": "tamer", "gender": "female"}, "crimson-jade-gunslinger": {"cls": "marksman", "gender": "female"}, "crimson-arcane-empress": {"cls": "warlock", "gender": "female"}, "azure-sun-paladin": {"cls": "paladin", "gender": "female"}, "verdant-huntress-character-turnaround": {"cls": "ranger", "gender": "female"}, "crimson-blade-warlord": {"cls": "assassin", "gender": "male"}, "crimson-dragon-oracle": {"cls": "alchemist", "gender": "male"}, "bloodaxe-warlord": {"cls": "berserker", "gender": "male"}, "celestial-archer-concept-sheet": {"cls": "bard", "gender": "male"}, "crimson-cannon-corsair": {"cls": "artillery", "gender": "male"}, "crimson-hammer-warrior": {"cls": "blacksmith", "gender": "male"}, "golden-paladin-character-sheet": {"cls": "paladin", "gender": "male"}, "emerald-rifleman-character-study": {"cls": "marksman", "gender": "male"}, "verdant-archdruid": {"cls": "grove", "gender": "male"}, "tiger-warlord-character-sheet": {"cls": "feral", "gender": "male"}, "forest-ranger-character-turnaround": {"cls": "ranger", "gender": "male"}, "gilded-bladesworn-noble": {"cls": "spellblade", "gender": "male"}, "celestial-sovereign-priest": {"cls": "sage", "gender": "male"}, "crimson-blade-nomad": {"cls": "rogue", "gender": "male"}, "crimson-warlord-costume-concept": {"cls": "soullink", "gender": "male"}, "crimson-ronin-concept-sheet": {"cls": "samurai", "gender": "male"}, "crimson-imperial-warlord": {"cls": "tamer", "gender": "male"}, "crimson-arcane-sovereign": {"cls": "warlock", "gender": "male"}, "final-violet-empress-concept-sheet": {"cls": "soulsage", "gender": "female"}, "final-crimson-valkyrie-costume-design": {"cls": "beastking", "gender": "female"}, "final-arcane-empress-concept-sheet": {"cls": "archmage", "gender": "female"}, "final-emerald-oracle-priestess": {"cls": "biochem", "gender": "female"}, "final-crimson-wanderer-concept-sheet": {"cls": "bounty", "gender": "female"}, "final-crimson-warlord-concept-art": {"cls": "bloodwar", "gender": "female"}, "final-crimson-cannon-valkyrie": {"cls": "cannoneer", "gender": "female"}, "final-crimson-cannon-sentinel": {"cls": "demolisher", "gender": "female"}, "final-crimson-arcana-huntress": {"cls": "dirge", "gender": "female"}, "final-crimson-oracle-character-design": {"cls": "elementalist", "gender": "female"}, "final-azure-lion-paladin": {"cls": "eternal", "gender": "female"}, "final-amethyst-sovereign-costume-design": {"cls": "enchanter", "gender": "female"}, "final-golden-empress-concept-sheet": {"cls": "goldalch", "gender": "female"}, "final-crimson-blade-empress-alt": {"cls": "kensei", "gender": "female"}, "final-crimson-hammer-valkyrie": {"cls": "mastersmith", "gender": "female"}, "final-crimson-blade-warrior": {"cls": "masterthief", "gender": "female"}, "final-crimson-gearmaiden": {"cls": "mechanic", "gender": "female"}, "final-crimson-blade-dancer": {"cls": "ninja", "gender": "female"}, "final-crimson-halberd-empress": {"cls": "packlord", "gender": "female"}, "final-violet-oracle-of-the-bone-scepter": {"cls": "necro", "gender": "female"}, "final-crimson-ronin-concept-sheet": {"cls": "ronin", "gender": "female"}, "final-scarlet-blade-empress": {"cls": "sbsummon", "gender": "female"}, "final-crimson-valkyrie": {"cls": "sbwar", "gender": "female"}, "final-crimson-lotus-samurai": {"cls": "shogun", "gender": "female"}, "final-crimson-archer-concept-sheet": {"cls": "sniper", "gender": "female"}, "final-crimson-empress-costume-design": {"cls": "sealmaster", "gender": "female"}, "final-celestial-empress-costume-design": {"cls": "spiritlord", "gender": "female"}, "final-azure-oracle-of-the-golden-staff": {"cls": "stormcaller", "gender": "female"}, "final-radiant-valkyrie-concept-art": {"cls": "templar", "gender": "female"}, "final-crimson-warlord-concept-sheet": {"cls": "warlord", "gender": "female"}, "final-crimson-blade-empress": {"cls": "trickster", "gender": "female"}, "final-feathered-huntress-concept-sheet": {"cls": "wildlord", "gender": "female"}, "final-verdant-oracle": {"cls": "wildgod", "gender": "female"}, "final-celestial-archer-empress": {"cls": "maestro", "gender": "female"}, "final-crimson-imperial-gunner": {"cls": "gunsaint", "gender": "female"}, "final-moonlit-oracle-priestess": {"cls": "archdruid", "gender": "female"}, "final-male-arcane-sovereign-priest": {"cls": "archmage", "gender": "male"}, "final-male-azure-celestial-archmage": {"cls": "stormcaller", "gender": "male"}, "final-male-celestial-moonweaver": {"cls": "archdruid", "gender": "male"}, "final-male-celestial-dragon-regent": {"cls": "goldalch", "gender": "male"}, "final-male-celestial-warden": {"cls": "spiritlord", "gender": "male"}, "final-male-clockwork-crimson-vanguard": {"cls": "mechanic", "gender": "male"}, "final-male-crimson-blade-sovereign-1": {"cls": "sbsummon", "gender": "male"}, "final-male-crimson-blade-sovereign": {"cls": "trickster", "gender": "male"}, "final-male-crimson-blade-warlord": {"cls": "kensei", "gender": "male"}, "final-male-crimson-cannon-ronin": {"cls": "cannoneer", "gender": "male"}, "final-male-crimson-cannon-warlord": {"cls": "demolisher", "gender": "male"}, "final-male-crimson-dynasty-warlord-1": {"cls": "packlord", "gender": "male"}, "final-male-crimson-dynasty-warlord": {"cls": "sealmaster", "gender": "male"}, "final-male-crimson-hawk-archer": {"cls": "sniper", "gender": "male"}, "final-male-crimson-moon-archer": {"cls": "dirge", "gender": "male"}, "final-male-crimson-nomad-warrior": {"cls": "masterthief", "gender": "male"}, "final-male-crimson-reliquary-gunslinger": {"cls": "gunsaint", "gender": "male"}, "final-male-crimson-ronin-character-sheet": {"cls": "bounty", "gender": "male"}, "final-male-crimson-shadowblade": {"cls": "ninja", "gender": "male"}, "final-male-crimson-warlord-character-sheet-1": {"cls": "sbwar", "gender": "male"}, "final-male-crimson-straw-ronin": {"cls": "ronin", "gender": "male"}, "final-male-crimson-warlord-character-sheet-2": {"cls": "beastking", "gender": "male"}, "final-male-crimson-warlord-character-sheet": {"cls": "shogun", "gender": "male"}, "final-male-crimson-warlord-concept-sheet": {"cls": "warlord", "gender": "male"}, "final-male-crimson-warlord-of-the-abyss": {"cls": "bloodwar", "gender": "male"}, "final-male-feathered-bow-warrior": {"cls": "wildlord", "gender": "male"}, "final-male-flame-sovereign-archmage": {"cls": "elementalist", "gender": "male"}, "final-male-golden-aegis-champion": {"cls": "eternal", "gender": "male"}, "final-male-molten-warlord-character-sheet": {"cls": "mastersmith", "gender": "male"}, "final-male-moonlit-celestial-archer": {"cls": "maestro", "gender": "male"}, "final-male-obsidian-reliquary-mage": {"cls": "necro", "gender": "male"}, "final-male-regal-violet-warlock": {"cls": "soulsage", "gender": "male"}, "final-male-solaris-paladin": {"cls": "templar", "gender": "male"}, "final-male-verdant-staffbearer": {"cls": "wildgod", "gender": "male"}, "final-male-emerald-celestial-warden": {"cls": "biochem", "gender": "male"}, "final-male-violet-archmage-concept-sheet": {"cls": "enchanter", "gender": "male"}};
function previewAvatar(){try{const value=new URLSearchParams(scope.location?.search||'').get('avatar');if(value==='default')sessionStorage.removeItem(PREVIEW_KEY);else if(Object.hasOwn(PREVIEW_AVATARS,value))sessionStorage.setItem(PREVIEW_KEY,value);const saved=sessionStorage.getItem(PREVIEW_KEY);return Object.hasOwn(PREVIEW_AVATARS,saved)?saved:null}catch{return null}}
function identity(player){const cls=scope.sealerSpriteCatalog[player?.cls]?player.cls:'archdruid',gender=player?.gender==='male'?'male':'female';return {cls,gender,key:cls+'-'+gender}}
const sheetIds=new WeakMap(), coloredFrames=new Map();
let nextSheetId=0,cachedPixels=0;
const pixelBudget=4*1024*1024;

function drawColoredFrame(c,sheet,sx,sy,sw,sh,x,y,width,height){
 if(!scope.document){c.drawImage(sheet,sx,sy,sw,sh,x,y,width,height);return;}
 if(!sheetIds.has(sheet))sheetIds.set(sheet,++nextSheetId);
 const key=[sheetIds.get(sheet),sx,sy,sw,sh].join('/');
 let frame=coloredFrames.get(key);
 if(frame)coloredFrames.delete(key);
 else{
  frame=scope.document.createElement('canvas');
  const scale=Math.min(1,256/Math.max(sw,sh));
  frame.width=Math.max(1,Math.round(sw*scale));
  frame.height=Math.max(1,Math.round(sh*scale));
  const ctx=frame.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(sheet,sx,sy,sw,sh,0,0,frame.width,frame.height);
  const pixels=ctx.getImageData(0,0,frame.width,frame.height),data=pixels.data;
  // Lift contrast and color without changing the silhouette or transparency.
  for(let i=0;i<data.length;i+=4){
   if(!data[i+3])continue;
   const light=.213*data[i]+.715*data[i+1]+.072*data[i+2];
   const tone=(light-128)*1.1+135;
   data[i]=tone+(data[i]-light)*1.34;
   data[i+1]=tone+(data[i+1]-light)*1.34;
   data[i+2]=tone+(data[i+2]-light)*1.34;
  }
  ctx.putImageData(pixels,0,0);
  cachedPixels+=frame.width*frame.height;
  while(cachedPixels>pixelBudget){
   const [oldKey,oldFrame]=coloredFrames.entries().next().value;
   cachedPixels-=oldFrame.width*oldFrame.height;
   coloredFrames.delete(oldKey);
   oldFrame.width=oldFrame.height=1;
  }
 }
 coloredFrames.set(key,frame);
 c.drawImage(frame,x,y,width,height);
}

// Continuous headings use the same units as the original eight direction rows.
function heading(dx,dy){return (-Math.atan2(dx,dy)/(Math.PI/4)+8)%8;}
function nearestDirection(dir){return Math.round(dir)%8;}

let turnCanvas,turnContext;
function drawMovement(c,x,y,size,dir,frame,cols,sheet,anchor,scale,between,extra,mask=false){
 const position=between?dir*2:nearestDirection(dir)*2;
 const lower=Math.floor(position),mix=position-lower;
 const drawFrame=mask?(ctx,...args)=>ctx.drawImage(...args):drawColoredFrame;
 function pose(step){
  step%=16;
  const alternate=step%2===1;
  const image=alternate?between:sheet;
  const feet=alternate?extra.anchor:anchor;
  const width=size*(alternate?extra.renderScale:scale);
  return {image,row:Math.floor(step/2),left:-width*feet[0],top:-width*feet[1],width};
 }
 function drawPose(ctx,p,left,top,width){
  const sw=p.image.width/cols,sh=p.image.height/8;
  drawFrame(ctx,p.image,frame*sw,p.row*sh,sw,sh,left,top,width,width);
 }
 if(mix<.001||mix>.999||!scope.document){
  const p=pose(Math.round(position));
  drawPose(c,p,x+p.left,y+p.top,p.width);
  return;
 }
 const a=pose(lower),b=pose(lower+1);
 const left=Math.min(a.left,b.left),top=Math.min(a.top,b.top);
 const width=Math.max(a.left+a.width,b.left+b.width)-left;
 const height=Math.max(a.top+a.width,b.top+b.width)-top;
 if(!turnCanvas){
  turnCanvas=scope.document.createElement('canvas');
  turnCanvas.width=turnCanvas.height=256;
  turnContext=turnCanvas.getContext('2d');
 }
 const rasterScale=256/Math.max(width,height);
 const sw=width*rasterScale,sh=height*rasterScale;
 turnContext.clearRect(0,0,256,256);
 // Add premultiplied colors so a pixel covered by both poses keeps its opacity.
 turnContext.globalCompositeOperation='lighter';
 turnContext.globalAlpha=1-mix;
 drawPose(turnContext,a,(a.left-left)*rasterScale,(a.top-top)*rasterScale,a.width*rasterScale);
 turnContext.globalAlpha=mix;
 drawPose(turnContext,b,(b.left-left)*rasterScale,(b.top-top)*rasterScale,b.width*rasterScale);
 // Project a single blended silhouette, including when the caller draws a shadow.
 c.drawImage(turnCanvas,0,0,sw,sh,x+left,y+top,width,height);
}

function create({preloadDirections=false}={}){
 let current=null,requested='',version=0,pending=null,idleStartedAt=null;
 function close(sprite){
  for(const key of ['walk','idle','run','walkBetween','runBetween'])sprite?.[key]?.close?.();
 }
 function read(src,cols,rows,cell){
  return new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=async()=>{
    try{resolve(scope.CountryRenderBudget?await scope.CountryRenderBudget.atlas(image,cols,rows,cell):image)}
    catch(error){reject(error)}
   };
   image.onerror=()=>reject(Error('Cannot load '+src));
   image.src=src;
  });
 }
 function loadBetween(sprite,motion,ticket){
  const file=sprite.intercardinal?.[motion],key=motion+'Between';
  if(!file||sprite[key]!==undefined)return;
  sprite[key]=null; // A missing optional atlas keeps the nearest original direction.
  read(file,sprite[motion+'Frames'],8,preloadDirections?256:192).then(image=>{
   if(ticket===version&&current===sprite)sprite[key]=image;
   else image.close?.();
  }).catch(()=>{});
 }
 async function sync(player){
  const explicit=!!player;
  if(!player){try{player=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{}}
  const preview=!explicit&&!player&&previewAvatar();
  const id=identity(preview?PREVIEW_AVATARS[preview]:player);
  const entry=scope.sealerSpriteCatalog[id.cls][id.gender];
  const requestKey=id.key+'|'+entry.walk+'|'+entry.idle+'|'+(entry.run||'');
  if(requested===requestKey)return pending||current;
  if(!entry.ready)throw Error('Missing animated sealer '+id.key);
  requested=requestKey;
  const ticket=++version,walkFrames=entry.walkFrames||8,runFrames=entry.runFrames||walkFrames;
  pending=Promise.allSettled([
   read(entry.walk,walkFrames,8),read(entry.idle,4,2),entry.run?read(entry.run,runFrames,8):null
  ]).then(results=>{
   const [walk,idle,run]=results.map(result=>result.value);
   const failure=results.find(result=>result.status==='rejected');
   if(failure||ticket!==version){
    close({walk,idle,run});
    if(failure)throw failure.reason;
    return current;
   }
   close(current);
   idleStartedAt=null;
   current={...id,walk,idle,run,walkFrames,runFrames,intercardinal:entry.intercardinal,
    phaseScale:entry.phaseScale||1,runPhaseScale:entry.runPhaseScale||entry.phaseScale||1,
    anchor:entry.anchor||[.5,.962],renderScale:entry.renderScale||1,name:scope.sealerSpriteCatalog[id.cls].name};
   pending=null;
   if(preloadDirections){
    loadBetween(current,'walk',ticket);
    loadBetween(current,'run',ticket);
   }
   return current;
  }).catch(error=>{
   if(ticket===version){requested='';pending=null}
   throw error;
  });
  return pending;
 }
 function draw(c,x,y,size,dir,phase,moving,running=false,idleTime,mask=false){
  if(!current||!(size>0))return;
  if(moving){
   idleStartedAt=null;
   const sprint=running&&current.run,motion=sprint?'run':'walk',cols=current[motion+'Frames'];
   const rate=sprint?current.runPhaseScale:current.phaseScale;
   const frame=Math.floor(phase*rate*cols/8)%cols;
   if(!Number.isInteger(dir))loadBetween(current,motion,version);
   drawMovement(c,x,y,size,dir,frame,cols,current[motion],current.anchor,current.renderScale,
    current[motion+'Between'],current.intercardinal,mask);
   return;
  }
  // Use elapsed wall time because the movement phase stops advancing at rest.
  const now=idleTime??scope.performance?.now?.()??Date.now();
  if(idleStartedAt===null)idleStartedAt=now;
  const inhale=(1-Math.cos(Math.max(0,now-idleStartedAt)*Math.PI*2/3600))*.5;
  dir=nearestDirection(dir);
  size*=current.renderScale;
  const width=size*(1+.0025*inhale),height=size*(1+.009*inhale);
  const im=current.idle,sw=im.width/4,sh=im.height/2;
  const args=[im,(dir%4)*sw,Math.floor(dir/4)*sh,sw,sh,x-width*current.anchor[0],y-height*current.anchor[1],width,height];
  if(mask)c.drawImage(...args);
  else drawColoredFrame(c,...args);
 }
 function release(){version++;close(current);current=null;requested='';pending=null;idleStartedAt=null}
 return {sync,draw,release,get current(){return current}};
}
scope.sealerSprites={create,identity,drawColoredFrame,heading,nearestDirection,drawMovement};if(typeof module!=='undefined')module.exports=scope.sealerSprites;
})(typeof window==='undefined'?globalThis:window);
