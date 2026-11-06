import '../../tools/labyrinth-demo/progression.js';
export function partyRewardAdapter({engine,map,random=Math.random}){
 const rules=globalThis.DungeonProgression;
 return {
  async settle(room,battle){
   if(battle.status!=='finished'||battle.result!=='win')return;
   battle.rewards??={};
   for(const member of room.members.filter(m=>m.hp>0&&battle.participants.includes(m.code))){
    if(battle.rewards[member.code])continue;
    const units=[...battle.battle.allies,...(battle.battle.retiredUnits||[])].filter(u=>u.ownerCode===member.code);
    const hero=units.find(u=>u.kind==='player');
    const before=[{id:'hero',name:member.save.P.name,level:member.save.P.lv},...(member.save.P.pets||[]).map(p=>({id:p.uid,name:p.name||p.nick||p.sp,level:p.lv}))];
    const reward=engine.victory(member.save.P,battle.battle.enemies,units.filter(u=>u.kind==='pet').map(u=>u.uid),hero?.pas?.filter(p=>p==='lucky').length||0);
    reward.levelUps=before.flatMap(old=>{const after=old.id==='hero'?member.save.P:(member.save.P.pets||[]).find(p=>p.uid===old.id);return after?.lv>old.level?[{name:old.name,from:old.level,to:after.lv}]:[]});
    Object.assign(member,{hp:reward.hp,mp:reward.mp,maxHp:reward.maxHp,maxMp:reward.maxMp,level:reward.level});
    battle.rewards[member.code]=reward;
   }
  },
  async chest(room,member,id){
   const chest=map.map(room.floor).chests.find(c=>c.id===id),nav=map.navigation(room),p=member.save.P;
   if(!chest||!member.exploring||member.hp<=0||nav.distance(member.position,chest)>145||!nav.clear(member.position,chest))throw Error('chest_out_of_reach');
   if(chest.big&&room.dungeon.boss!=='defeated')throw Error('chest_locked');
   const opened=room.chestClaims??={};opened[member.code]??={};
   p.labyrinthBossChests??={};
   for(const legacy of Object.values(p.labyrinth||{}))for(const [key,value] of Object.entries(legacy.opened||{}))if(key.endsWith("-grand"))p.labyrinthBossChests[key]??=value;
   const previous=Object.values(opened).find(claims=>claims[id])?.[id]||(chest.big&&p.labyrinthBossChests[id]);
   if(previous)return {...previous,alreadyClaimed:true};
   const roll=random(),category=chest.big?'equipment':roll<.25?'gold':roll<.65?'items':'equipment';
   const catalog=category==='gold'?null:engine.lootCatalog();
   const pool=category==='equipment'?rules.pool(catalog,room.floor,chest.big):category==='items'?catalog.items.filter(i=>(i.minFloor||1)<=room.floor):[];
   if(category!=='gold'&&!pool.length)throw Error('reward_catalog_empty');
   const entry=pool.length?pool[Math.floor(random()*pool.length)]:null;
   const progression=rules.get(room.floor),gold=chest.big?progression.grandGold:progression.gold[0]+Math.floor(random()*(progression.gold[1]-progression.gold[0]+1));
   const qty=category==='items'?1+Math.floor(random()*Math.min(5,room.floor+1)):entry?1:0;
   p.gold=(p.gold||0)+gold;
   if(category==='items'){p.items??={};p.items[entry.id]=(p.items[entry.id]||0)+qty;}
   if(category==='equipment'){p.owned??=[];p.owned.push(entry.id);}
   const reward={id:entry?.id||'gold',name:entry?.name||'เหรียญ',gold,qty,type:category};
   opened[member.code][id]=reward;if(chest.big)p.labyrinthBossChests[id]=reward;
   return reward;
  }
 };
}
