(function(g){'use strict';
const id='island-preview-v1',kitVersion=3;
const petPoints={hp:24,mp:12,patk:38,matk:38,pdef:20,mdef:20,spd:15,acc:10};
const extraBeasts=['legend2_yggwarden','baihu','phoenix','kraken'];
const slots=['weapon','armor','gloves','boots','belt','bracelet','ring','necklace','crown'];
const eq=Object.fromEntries(slots.map(slot=>[slot,slot==='weapon'?'lg6_weapon_whip':'lg6_'+slot]));
function addPet(p,sp){
 const uid=Math.max(Number(p.uid)||1,...p.pets.map(pet=>pet.uid+1));
 const pet={uid,sp,lv:60,form:0,exp:0,pts:{...petPoints},free:0,hp:1200,mp:480};
 p.uid=uid+1;p.pets.push(pet);
 p.seen={...p.seen,[sp]:1};p.caught={...p.caught,[sp]:1};p.seenForms={...p.seenForms,[sp]:[0]};
 return pet;
}
function applyStarterKit(p,maximum){
 p.cls='sealmaster';p.lv=60;
 p.owned=[...new Set([...(p.owned||[]),...Object.values(p.eq||{})])].filter(item=>!Object.values(eq).includes(item));
 p.eq={...eq};p.legend={...p.legend,...Object.fromEntries(Object.values(eq).map(item=>[item,1]))};
 p.pets??=[];
 const pet=p.pets.find(pet=>pet.sp==='legend2_aurorion')||addPet(p,'legend2_aurorion');
 if(p.islandPreviewKit===1&&Object.values(pet.pts||{}).reduce((sum,n)=>sum+n,0)>177)pet.pts={...petPoints};
 // The offline territory engine uses the endgame unlock to validate legendary partners.
 p.cleared=Math.max(1,p.cleared||0);
 pet.lv=60;pet.hp=1200;pet.mp=480;
 p.party=[pet.uid];p.carried=[...new Set([pet.uid,...(p.carried||[])])];
 p.seen={...p.seen,[pet.sp]:1};p.caught={...p.caught,[pet.sp]:1};p.seenForms={...p.seenForms,[pet.sp]:[0]};
 p.items??={};p.items.teleportScroll=Math.max(5,p.items.teleportScroll||0);
 p.items.beastRepellent=Math.max(3,p.items.beastRepellent||0);
 Object.assign(p,maximum(p));
}
function upgrade(p,maximum){
 if(p?.walkId!==id||p.islandPreviewKit>=kitVersion)return false;
 if(!(p.islandPreviewKit>=2))applyStarterKit(p,maximum);
 // Keep the current battle lineup. New pets go to camp if the pack is full.
 p.carried??=[...(p.party||[])];
 const capacity=p.cls==='sealmaster'?8:5;
 for(const sp of extraBeasts){
  const pet=addPet(p,sp);
  if(p.carried.length<capacity)p.carried.push(pet.uid);
 }
 p.islandPreviewKit=kitVersion;
 return true;
}
g.IslandPreviewProfile={id,eq,upgrade};
})(window);
