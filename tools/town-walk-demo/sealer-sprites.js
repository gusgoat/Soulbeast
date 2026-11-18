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

function createModel({beast=false,primary=false}={}){
 let current=null,next='',pending=null,ticket=0,supported=null;
 function release(){ticket++;next='';pending=null;current?.dispose();current=null;supported=null;}
 function sync(key){
  if(!key)return Promise.resolve(false);
  if(key===next)return pending;
  release();
  next=key;
  const revision=ticket;
  supported=beast?null:true;
  pending=import('/Soulbeast/tools/hemant-walk-demo/packlord-3d/actor-catalog.mjs?v=storage-local-1')
   .then(catalog=>{
    if(revision!==ticket)return null;
    supported=catalog.hasActor(key,{beast});
    return supported?catalog.loadActor(key,{beast,primary}):null;
   })
   .then(actor=>{
    if(revision!==ticket){actor?.dispose();return false;}
    current=actor;
    return !!actor;
   })
   .catch(()=>false);
  return pending;
 }
 return {sync,release,whenReady:()=>pending||Promise.resolve(false),get ready(){return !!current;},get supported(){return supported;},draw(...args){return current?.draw(...args)||false}};
}
let loadingMarker;
function getLoadingMarker(){
 if(!loadingMarker){
  loadingMarker=document.createElement('canvas');
  loadingMarker.width=loadingMarker.height=48;
  const c=loadingMarker.getContext('2d');
  c.fillStyle='#d9bd79';
  c.beginPath();c.ellipse(24,24,23,23,0,0,Math.PI*2);c.fill();
 }
 return loadingMarker;
}
function create({preloadDirections=false,allow3d=true}={}){
 const model=createModel({primary:preloadDirections});
 let current=null;
 function sync(player){
  const explicit=!!player;
  if(!player){try{player=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{}}
  const preview=!explicit&&!player&&previewAvatar();
  const id=identity(preview?PREVIEW_AVATARS[preview]:player);
  if(current?.key!==id.key){
   const cls=scope.sealerSpriteCatalog[id.cls],entry=cls[id.gender];
   const portrait=new Image();
   if(entry.portrait)portrait.src=entry.portrait;
   current={...id,name:cls.name,portrait};
   if(allow3d)model.sync(id.key);
  }
  return Promise.resolve(current);
 }
 function draw(c,x,y,size,dir,phase,moving,running=false){
  if(!current||!(size>0))return;
  if(model.draw(c,x,y,size,dir,moving,running))return;
  const portrait=current.portrait,width=size*.54;
  if(portrait.complete&&portrait.naturalWidth)c.drawImage(portrait,x-width*.5,y-width,width,width);
  else c.drawImage(getLoadingMarker(),x-size*.082,y-20-size*.12,size*.164,size*.24);
 }
 function release(){model.release();current=null;}
 return {sync,draw,release,whenReady:()=>model.whenReady(),get current(){return current},get renderer(){return model.ready?'3d':'portrait'}};
}
scope.sealerSprites={create,createModel,use3d:true,identity,drawColoredFrame,heading,nearestDirection};if(typeof module!=='undefined')module.exports=scope.sealerSprites;
})(typeof window==='undefined'?globalThis:window);
