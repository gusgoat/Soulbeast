import {ASSIST, BASES, BASE_BOLT_MS, BASE_FIRE_MS, BASE_FIRE_RANGE, BASE_AURA_RANGE, BASE_REPAIR_MS, BASE_REPAIR_POINTS, BASE_REPAIR_RANGE, BEAST_POINTS, BEAST_SPEED_SCALE, BOSS_INTERVAL, BOSS_POINTS, CELL, CHEST_COUNT, CLASSES, COLS, CONTACT, FLAT, HEAL_TARGET, MATCH_MS, RADIUS, RAID_TARGET, RESPAWN_MS, SPEED, TEAM_SPEED, TEAM_START_SCORE, TEAMS, REPAIR_TARGET, canRaidBase, siegeProfile,
 TEAM_ARENA, bushAt, cellCenter, distance, maze, spawns} from './arena.mjs?v=siege-scoring-1';
import {teamResults} from './ranking.mjs';
import {inSight} from './sight.mjs?v=colosseum-ranges';
import {advanceCombat, bossUnit, botLoadout, careerInfo, combatAction, combatView, demoProfile, makeCombat, rareSpecies, setCombatAuto, settleCombat} from './combat.mjs?v=siege-scoring-1';
import rareArt from './rare-art.mjs';
import {resetBotRoute, stepBot} from './practice.mjs?v=siege-scoring-1';
import {applyTrap,createArenaTraps,trapTypes} from './arena-traps.mjs';
import {SURVIVAL_ARENA, SURVIVAL_CHEST_COUNT, SURVIVAL_SITES, SURVIVAL_SPAWNS, fogZone, insideFogSafe, walkInArena} from './survival-arena.mjs';

const fresh=(p,now)=>p.connected&&p.phase==='walk'&&now>=p.safeUntil;
const huntPoints=(p,points)=>p.baseCls==='swordsman'?points*1.25:points;
const BASE_CAPTURE_LOSS={small:40,medium:60,large:100};
const nearest=(p,list)=>list.slice().sort((a,b)=>distance(a,p)-distance(b,p)||(a.id??'').localeCompare(b.id??''))[0];
const partyPets=(battle,p)=>[...battle.allies,...battle.enemies].filter(u=>u.kind==='pet'&&u.sealer===p.id&&p.petVitals?.has(u.uid));
const SHADOW_AGGRO=1000, SHADOW_LEASH=2000, SHADOW_CHASE_MS=5000;
const SURVIVAL_CUT_INTERVAL=120_000;
const SURVIVAL_CHEST_WAVE=5;
const SURVIVAL_POINTS={chest:5,player:20,beast:10};
const count=(r,side)=>r.players.filter(p=>p.side===side).length;
const safeName=name=>String(name??'').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,20)||'ผู้ผนึก';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const BOT_ROLES=['guard','raider','scout','hunter','escort'];
const SHADOW_SPAWNS=[
 [8,13,'qilin'],[11,21,'fenrir'],[7,29,'tempest_lynx'],[12,37,'pegasus'],[10,5,'unicorn'],
];
const OBJECT_SITES=maze.flatMap((row,y)=>row.flatMap((walk,x)=>{
 const p=cellCenter(x,y);
 return walk&&bushAt(p)===null&&BASES.every(b=>distance(p,b)>470)?[p]:[];
}));
export class Match {
 constructor(code,now,random=Math.random,mode='team'){
  this.code=code;this.id=crypto.randomUUID();this.created=now;this.players=[];this.score=[TEAM_START_SCORE,TEAM_START_SCORE];this.phase='lobby';this.events=[];
  this.battles=new Map();this.shadows=[];this.chests=[];this.bosses=[];this.battleSerial=0;this.eventSerial=0;this.botSerial=0;this.random=random;
  this.baseBolts=[];this.baseEffects=[];this.baseEffectSerial=0;
  this.solo=mode==='survival';
  this.arena=this.solo?SURVIVAL_ARENA:TEAM_ARENA;
  this.sites=this.solo?SURVIVAL_SITES:OBJECT_SITES;
  this.bases=this.solo?[]:BASES.map(base=>({...base,hp:base.maxHp}));
  this.traps=createArenaTraps();
 }
 spawnSurvivalChests(now){
  if(!this.zone.remaining)return;
  const occupied=new Set([...this.chests.filter(c=>!c.opened),...this.shadows,...this.traps.controller.list].map(p=>this.arena.indexAt(p)));
  const sites=this.sites.filter(p=>insideFogSafe(this.zone,p.x,p.y)&&!occupied.has(this.arena.indexAt(p)));
  const count=Math.min(SURVIVAL_CHEST_WAVE,sites.length);
  for(let i=0;i<count;i++){
   const [spot]=sites.splice(Math.floor(this.random()*sites.length),1);
   this.chests.push({id:`chest-${this.chests.length}`,...spot,points:SURVIVAL_POINTS.chest,opened:false});
  }
  if(count)this.note(`หีบสมบัติเกิดเพิ่ม ${count} หีบ`,now);
 }
 join(profile,character=null,assignedSide=null){
  assert(this.phase==='lobby'&&this.players.length<10,'ห้องเต็มหรือเริ่มแล้ว');
  assert(!character||!this.players.some(p=>p.character?.code===character.code),'ตัวละครนี้อยู่ในห้องแล้ว');
  const side=this.solo?0:assignedSide??(count(this,0)<=count(this,1)?0:1);
  assert(this.solo||((side===0||side===1)&&count(this,side)<5),'ทีมนี้เต็มแล้ว');
  const cls=character?.cls||(Object.hasOwn(CLASSES,profile.cls)||profile.botCareer&&careerInfo(profile.cls)?profile.cls:'swordsman');
  const career=careerInfo(cls);
  assert(career,'อาชีพของตัวละครไม่ถูกต้อง');
  const p={id:crypto.randomUUID(),token:crypto.randomUUID(),name:safeName(character?.name??profile.name),cls,baseCls:career.base,className:career.name,gender:character?.gender,
   lv:character?Number(character.lv):Math.max(1,Math.min(60,Math.trunc(Number(profile.lv))||20)),side,ready:false,connected:true,phase:'lobby',seq:-1,dx:0,dy:0,safeUntil:0};
  if(character){
   p.character={...structuredClone(character),name:p.name};
   try{demoProfile(p,0);}catch{throw Error('ตรวจชุดอุปกรณ์หรืออสูรของตัวละครไม่ได้');}
  }
  this.players.push(p);return p;
 }
 get host(){return this.ranked?null:this.players.find(p=>!p.bot)?.id;}
 addBot(side,level){
  assert(this.phase==='lobby'&&this.players.length<10,'ห้องเต็มหรือเริ่มแล้ว');
  assert(this.solo||((side===0||side===1)&&count(this,side)<5),'ทีมนี้เต็มแล้ว');
  const others=this.players.filter(p=>p.bot),teammates=others.filter(p=>p.side===side);
  const role=BOT_ROLES.find(role=>!teammates.some(p=>p.bot.role===role))||BOT_ROLES[others.length%BOT_ROLES.length];
  const loadout=botLoadout('บอท '+(this.botSerial+1),level,others,this.random);
  const bot=this.join({...loadout,botCareer:true},null,side);
  this.botSerial++;
  bot.gender=loadout.gender;
  bot.ready=true;
  bot.bot={loadout,role,patrol:0,lane:Math.floor(this.random()*2),routeSeed:Math.floor(this.random()*4096)};
  return bot;
 }
 canStart(){
  return !this.premade&&this.phase==='lobby'&&Boolean(this.host)&&(this.solo?this.players.length>=2:count(this,0)>0&&count(this,0)===count(this,1))&&this.players.every(p=>p.ready&&p.connected);
 }
 canSearchRankTeam(){
  return this.premade&&this.phase==='lobby'&&Boolean(this.host)&&this.players.length===5&&this.players.every(p=>p.side===0&&p.ready&&p.connected);
 }
 note(text,now,type='activity'){
  this.events.push({id:++this.eventSerial,text,at:now,type});if(this.events.length>6)this.events.shift();
  if(type==='boss')this.bossEvent=this.events.at(-1);
 }
 start(now){
  this.phase='match';this.started=now;
  if(this.solo){
   this.zone=fogZone(now,now);
   this.nextEliminationAt=now+SURVIVAL_CUT_INTERVAL;
  }
  else{this.ends=now+MATCH_MS;this.nextBossAt=now+BOSS_INTERVAL;}
  const lv=this.averageLevel=Math.round(this.players.reduce((sum,p)=>sum+p.lv,0)/this.players.length);
  const edgeSpawns=SURVIVAL_SPAWNS.slice(), assigned=[];
  for(const side of [0,1]){
   this.players.filter(p=>p.side===side).forEach((p,i)=>{
    const party=demoProfile(p,0);
    const hero=party.find(u=>u.kind==='player');
    p.petVitals=new Map(party.filter(u=>u.kind==='pet').map(u=>[u.uid,{hp:u.hp,mp:u.mp,maxHp:u.st.hp,maxMp:u.st.mp}]));
    let spawn=spawns(side)[i];
    if(this.solo){
     const separation=point=>Math.min(...assigned.map(other=>distance(point,other)));
     if(assigned.length)edgeSpawns.sort((a,b)=>separation(b)-separation(a));
     const index=assigned.length?0:Math.floor(this.random()*edgeSpawns.length);
     [spawn]=edgeSpawns.splice(index,1);assigned.push(spawn);
     Object.assign(p,{points:0,scoreAt:now});
    }
    Object.assign(p,{earned:0,kills:0,spawn,maxHp:hero.st.hp,maxMp:hero.st.mp});
    this.respawn(p,now);
   });
   SHADOW_SPAWNS.forEach(([x,y,sp],i)=>{
    const preferred=cellCenter(side?COLS-1-x:x,y);
    const home=this.solo?this.site(this.shadows,350):this.inBaseFireRange(preferred)?
     nearest(preferred,OBJECT_SITES.filter(point=>!this.shadows.some(s=>distance(s,point)<150))):preferred;
    this.shadows.push({sp,label:`${rareArt[sp].name}เงา`,rare:true,...home,home,id:`s${side}${i}`,lv,phase:'walk'});
   });
  }
  const chestCount=this.solo?SURVIVAL_CHEST_COUNT:CHEST_COUNT;
  for(let i=0;i<chestCount;i++){
   const spot=this.site([...this.chests,...this.shadows],220);
   this.chests.push({id:`chest-${i}`,...spot,points:this.solo?SURVIVAL_POINTS.chest:20+Math.floor(this.random()*61),opened:false});
  }
  this.placeTraps();
  this.note('ประตูสนามเปิดแล้ว!',now);
 }
 placeTraps(){
  const {controller}=this.traps;
  const types=Object.keys(trapTypes);
  for(const side of [0,1]){
   const candidates=this.sites.filter(p=>(p.x>this.arena.width/2?1:0)===side&&
    this.arena.fits(p.x,p.y)&&[...this.chests,...this.shadows].every(q=>distance(p,q)>=140));
   for(let i=0;i<10;i++){
    const pick=Math.floor(this.random()*candidates.length);
    const [point]=candidates.splice(pick,1);
    controller.test(types[i%types.length],point);
    controller.list.at(-1).side=side;
   }
  }
 }
 updateTraps(now,dt){
  const people=this.players.filter(p=>fresh(p,now)).map(p=>({id:p.id,position:p}));
  for(const event of this.traps.controller.update(dt,people)){
   if(event.kind!=='explode')continue;
   for(const id of event.hit){
    const player=this.players.find(p=>p.id===id);
    const damage=applyTrap(event.trap.type,player,player.maxHp);
    const label=trapTypes[event.trap.type].name;
    this.note(`${player.name} โดนกับดัก${label}${damage?` · −${damage} HP`:''}`,now);
    if(player.hp<=0)this.fall(player,now);
   }
   if(!this.solo){this.checkScore(now);if(this.phase!=='match')return;}
  }
  if(this.solo)this.checkScore(now);
 }
 site(existing,minimum){
  const spaced=this.sites.filter(p=>existing.every(q=>distance(p,q)>=minimum));
  const choices=spaced.length?spaced:this.sites.filter(p=>existing.every(q=>distance(p,q)>0));
  return choices[Math.floor(this.random()*choices.length)];
 }
 spawnBoss(now){
  const old=this.bosses[0];
  const candidates=rareSpecies.filter(sp=>sp!==old?.sp);
  const sp=candidates[Math.floor(this.random()*candidates.length)];
  if(old&&!old.claimed){
   const battle=this.battles.get(old.battle);
   if(battle&&!battle.finished){
    Object.assign(battle,{finished:true,cur:null,deadline:0,releasedAt:now+1500});
    battle.log.push('บอสตัวเดิมหายไปเมื่อครบเวลา');
   }
  }
  const home=this.site([...this.chests,...this.shadows,...this.bosses,...this.players.filter(p=>p.phase==='walk')],270);
  const boss={...home,home,id:`boss-${this.nextBossAt}`,boss:true,sp,label:rareArt[sp].name,lv:this.averageLevel,phase:'walk'};
  const u=bossUnit(boss);Object.assign(boss,{hp:u.hp,maxHp:u.st.hp,mp:u.mp});
  this.bosses=[boss];
  this.note(old&&!old.claimed?'บอสตัวเดิมหายไปแล้ว · บอสตัวใหม่ปรากฏในสนาม':'บอสโคลอสเซียมปรากฏตัวแล้ว · ออกค้นหาในสนาม',now,'boss');
 }
 rotateBosses(now){
  while(now>=this.nextBossAt&&this.nextBossAt<this.ends){
   this.spawnBoss(now);this.nextBossAt+=BOSS_INTERVAL;
  }
 }
 teleport(p,now){
  Object.assign(p,p.spawn,{phase:'walk',safeUntil:now+2500,dx:0,dy:0,warp:(p.warp||0)+1});
  delete p.battle;delete p.respawnAt;delete p.repair;delete p.siege;delete p.baseRecovery;
  resetBotRoute(p);
 }
 respawn(p,now){
  Object.assign(p,{hp:p.maxHp,mp:p.maxMp,ailments:{}});
  this.teleport(p,now);
 }
 finish(winner,reason,now){
  if(this.phase==='finished')return;
  this.phase='finished';this.winner=winner;this.reason=reason;this.finishedAt=now;
  if(this.solo){
   const survivor=this.players.find(p=>p.id===winner);
   if(survivor)survivor.placement=1;
  }else if(reason!=='error'){
   this.results=teamResults(this.players);
  }
  this.battles.clear();
 }
 checkScore(now){
  if(this.solo){
   const living=this.players.filter(p=>p.phase!=='dead');
   const rank=Math.max(2,living.length+1);
   for(const player of this.players)if(player.eliminatedAt===now)player.placement=rank;
   if(living.length<=1)this.finish(living[0]?.id??-1,'survival',now);
   return;
  }
  if(this.score.includes(0))this.finish(this.score[0]===this.score[1]?-1:this.score[0]>this.score[1]?0:1,'zero',now);
 }
 command(p,m,now){
  if(this.phase==='lobby'){
   if(m.type==='leave'){this.players=this.players.filter(x=>x!==p);return;}
   if(m.type==='ready'){p.ready=Boolean(m.ready);return;}
   if(m.type==='addBot'||m.type==='removeBot'){
    assert(p.id===this.host,'หัวหน้าห้องเท่านั้นที่จัดบอทได้');
    if(m.type==='addBot'){
     assert(this.solo||m.side===0||m.side===1,'เลือกทีมของบอทก่อน');
     this.addBot(this.solo?0:m.side,p.lv);
    }else{
     const bot=this.players.find(q=>q.bot&&q.id===m.id);
     assert(bot,'ไม่พบบอทในห้อง');
     this.players=this.players.filter(q=>q!==bot);
    }
    return;
   }
   if(m.type==='team'){
    assert(!this.solo,'โหมดเอาตัวรอดไม่มีทีม');
    assert(m.side===0||m.side===1,'เลือกทีมไม่ถูกต้อง');
    if(m.side===p.side)return;
    assert(count(this,m.side)<5,'ทีมนี้เต็มแล้ว');
    p.side=m.side;p.ready=false;return;
   }
   if(m.type==='start'){
    assert(p.id===this.host&&this.canStart(),this.solo?'ต้องมีผู้เล่น 2–10 คนและพร้อมทุกคน':'ทั้งสองทีมต้องมีจำนวนเท่ากันและพร้อมทุกคน');
    this.start(now);return;
   }
   return;
  }
  if(this.phase!=='match')return;
  if(m.type==='spectate'){
   if(this.solo&&p.phase==='dead'&&this.players.some(q=>q.id===m.target&&q.connected&&q.phase!=='dead'))p.spectating=m.target;
   return;
  }
  if(this.solo&&now>=this.nextEliminationAt){
   this.updateFog(now);
   this.eliminateByScore(now);
   if(this.phase!=='match'||p.phase==='dead')return;
  }
  if(!this.solo&&now>=this.ends){this.expire(now);return;}
  if(m.type==='move'){
   if(!Number.isSafeInteger(m.seq)||m.seq<=p.seq||!Number.isFinite(m.x)||!Number.isFinite(m.y))return;
   p.seq=m.seq;
   if(p.phase==='walk'&&!p.repair){
    p.dx=Math.max(-1,Math.min(1,m.x));p.dy=Math.max(-1,Math.min(1,m.y));p.inputAt=now;
   }
  }else if(m.type==='repairBase'){
   const base=this.bases.find(b=>b.id===m.id);
   assert(p.connected&&p.phase==='walk'&&base&&REPAIR_TARGET(p,base),'สายพ่อค้าต้องอยู่ใกล้ฐานฝ่ายตัวเองที่ HP ยังไม่เต็ม');
   if(p.repair?.baseId!==base.id)p.repair={baseId:base.id,nextAt:now+BASE_REPAIR_MS};
   p.dx=p.dy=0;
  }else if(m.type==='stopRepair'){
   delete p.repair;
  }else if(m.type==='chest'){
   const c=this.chests.find(x=>x.id===m.id);
   assert(fresh(p,now)&&c&&this.arena.chestInReach(p,c),'เข้าใกล้หีบก่อนเปิด');
   assert(!c.opened,'มีคนเปิดหีบนี้แล้ว');
   c.opened=true;
   if(this.solo){
    this.addSurvivalPoints(p,c.points,now);
    this.recover(p,p,.15,now,`หีบสมบัติ · +${c.points} คะแนน`);
    this.note(`${p.name} เปิดหีบ · +${c.points} คะแนน`,now);
   }else{
    this.earn(p,c.points);
    this.note(`${p.name} เปิดหีบ · ${TEAMS[p.side]} +${c.points}`,now);
   }
  }else if((m.type==='combat'||m.type==='combatAuto')&&p.phase==='battle'){
   const b=this.battles.get(p.battle);
   if(b?.boss)this.rotateBosses(now);
   if(!b)return;
   if(m.type==='combatAuto')setCombatAuto(b,p.id,m.enabled);
   else if(combatAction(b,p.id,m,now))this.recordFalls(b,now);
  }
 }
 expire(now){
  this.finish(this.score[0]===this.score[1]?-1:this.score[0]>this.score[1]?0:1,'time',now);
 }
 encounter(a,b,now,neutral=false){
  const helper=(p,exclude)=>nearest(p,this.players.filter(q=>q!==p&&q!==exclude&&q.side===p.side&&fresh(q,now)&&distance(p,q)<=ASSIST&&this.arena.clearPath(p,q)));
  const teams=this.solo?(neutral?[[a],[]]:[[a],[b]]):
   neutral?[[a,b.boss?helper(a):null].filter(Boolean),[]]:[a,b].sort((x,y)=>x.side-y.side).map(p=>[p,helper(p)].filter(Boolean));
  const contact={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const auraOwners=new Map();
  if(!this.solo)for(const p of teams.flat()){
   const aura=this.bases.reduce((max,base)=>base.side===p.side&&base.hp>0&&distance(contact,base)<=BASE_AURA_RANGE?
    Math.max(max,base.aura):max,0);
   if(aura)auraOwners.set(p.id,aura);
  }
  const id=String(++this.battleSerial), battle=makeCombat(id,teams,neutral?b:null,now,auraOwners,!this.solo);
  if(this.ranked)battle.onContribution=id=>{
   const player=this.players.find(p=>p.id===id);
   if(player?.connected&&!player.retired)player.helpedFight=true;
  };
  if(b.boss)battle.bossSide=a.side;
  if(neutral)battle.huntSide=a.side;
  this.battles.set(id,battle);
  for(const p of [...teams.flat(),...(neutral?[b]:[])]){
   p.phase='battle';p.battle=id;p.dx=p.dy=0;
   delete p.siege;
   if(p.repair)p.repair.nextAt=null;
  }
  this.baseBolts=this.baseBolts.filter(bolt=>bolt.target.phase!=='battle');
  this.baseEffects=this.baseEffects.filter(effect=>effect.kind==='collapse'||
   !teams.some(team=>team.some(p=>p.id===effect.playerId)));
 }
 earn(player,points){
  player.earned+=points;
  this.score[player.side]+=points;
 }
 combatCredit(battle,unit){
  if(!unit)return null;
  const owner=battle.colosseumFalls?.get(unit.id);
  return this.players.find(p=>p.id===battle.roster[owner])??null;
 }
 fall(p,now,cause='',killer=null){
  p.phase='dead';
  delete p.repair;
  if(this.solo){p.eliminationCause=cause;p.eliminatedAt=now;this.note(`${p.name} ตกรอบ${cause?' · '+cause:''}`,now);return;}
  p.respawnAt=now+RESPAWN_MS;
  const points=killer?(killer.baseCls==='thief'?40:30):10;
  if(killer)this.earn(killer,points);
  this.score[p.side]=Math.max(0,this.score[p.side]-points);
  const award=killer?`${killer.name} สังหาร ${p.name} · ${TEAMS[killer.side]} +${points}`:`${p.name} ล้มลง`;
  this.note(`${award} · ${TEAMS[p.side]} −${points}`,now);
 }
 recordFalls(b,now){
  let changed=false;
  for(const id of b.fallen){
   const p=this.players.find(x=>x.id===id);
   if(!p||p.battle!==b.id||p.phase==='dead')continue;
   this.savePetVitals(p,b);
   const hero=[...b.allies,...b.enemies].find(u=>u.kind==='player'&&u.sealer===id);
   const credit=this.combatCredit(b,hero);
   const killer=!b.beastId&&credit&&credit!==p&&(this.solo||credit.side!==p.side)?credit:null;
   if(killer)killer.kills++;
   this.fall(p,now,'',killer);changed=true;
   if(this.solo&&!b.beastId){
    const winner=[...b.allies,...b.enemies].find(u=>u.kind==='player'&&u.sealer!==id&&u.hp>0);
    const survivor=winner&&this.players.find(player=>player.id===winner.sealer);
    if(survivor){
     this.addSurvivalPoints(survivor,SURVIVAL_POINTS.player,now);
     this.recover(survivor,winner,.3,now,`ชนะคู่ต่อสู้ · +${SURVIVAL_POINTS.player} คะแนน`,true,b);
     this.note(`${survivor.name} ชนะ ${p.name} · +${SURVIVAL_POINTS.player} คะแนน`,now);
    }
   }
  }
  if(this.solo){
   const beast=b.beastId&&b.enemies[0];
   if(beast&&beast.hp<=0&&!b.beastScored){
    b.beastScored=true;
    const winner=b.allies.find(u=>u.kind==='player'&&u.hp>0);
    const survivor=winner&&this.players.find(p=>p.id===winner.sealer&&p.phase==='battle'&&p.battle===b.id);
    if(survivor){
     this.addSurvivalPoints(survivor,SURVIVAL_POINTS.beast,now);
     this.recover(survivor,winner,.2,now,`ชนะอสูร · +${SURVIVAL_POINTS.beast} คะแนน`,false,b);
     this.note(`${survivor.name} ชนะ${beast.name} · +${SURVIVAL_POINTS.beast} คะแนน`,now);
    }
   }
   if(changed)this.checkScore(now);
   return;
  }
  if(!b.boss&&b.beastId&&b.enemies[0]?.hp<=0&&!b.beastScored){
   b.beastScored=true;
   const credit=this.combatCredit(b,b.enemies[0])??this.players.find(p=>p.id===b.teams[0][0]);
   const points=huntPoints(credit,BEAST_POINTS);
   this.earn(credit,points);
   this.note(`${TEAMS[b.huntSide]} ล่า${b.enemies[0].name}สำเร็จ · +${points}`,now);
  }
  if(b.boss){
   const beast=this.bosses.find(x=>x.id===b.beastId),unit=b.enemies[0];
   if(beast){
    beast.hp=unit.hp;beast.mp=unit.mp;
    if(unit.hp<=0&&!beast.claimed){
     beast.claimed=true;beast.phase='defeated';const side=b.bossSide;
     const credit=this.combatCredit(b,unit)??this.players.find(p=>p.id===b.teams[0][0]);
     const points=huntPoints(credit,BOSS_POINTS);
     this.earn(credit,points);this.score[1-side]=Math.max(0,this.score[1-side]-BOSS_POINTS);
     const minutes=Math.round((this.nextBossAt-(this.ends-MATCH_MS))/60_000);
     const next=this.nextBossAt<this.ends?`เกิดอีกครั้งเมื่อนาทีที่ ${minutes}`:'ไม่มีบอสเกิดเพิ่มในรอบนี้';
     this.note(`${TEAMS[side]} สังหาร${beast.label} · ${TEAMS[side]} +${points} / ${TEAMS[1-side]} −${BOSS_POINTS} · คะแนน ${this.score[0]} : ${this.score[1]} · ${next}`,now,'boss');
     changed=true;
    }
   }
  }
  if(changed)this.checkScore(now);
 }
 addSurvivalPoints(p,points,now){
  p.points+=points;
  p.scoreAt=now;
 }
 eliminateByScore(now){
  while(this.phase==='match'&&now>=this.nextEliminationAt){
   this.nextEliminationAt+=SURVIVAL_CUT_INTERVAL;
   const living=this.players.filter(p=>p.phase!=='dead').sort((a,b)=>a.points-b.points||b.scoreAt-a.scoreAt);
   if(living.length<=1){this.checkScore(now);return;}
   const [lowest]=living;
   const tied=living.filter(p=>p.points===lowest.points&&p.scoreAt===lowest.scoreAt);
   const eliminated=tied[Math.floor(this.random()*tied.length)];
   const hero=this.battleHero(eliminated),battle=this.battles.get(eliminated.battle);
   if(hero)hero.hp=0;
   this.fall(eliminated,now,`คัดคะแนนต่ำสุด (${eliminated.points} คะแนน)`);
   if(battle)settleCombat(battle,now);
   this.checkScore(now);
   if(this.phase==='match')this.spawnSurvivalChests(now);
  }
 }
 savePetVitals(p,battle){
  for(const pet of partyPets(battle,p)){
   const vitals=p.petVitals.get(pet.uid);
   vitals.hp=Math.max(0,Math.min(vitals.maxHp,pet.hp));
   vitals.mp=Math.max(0,Math.min(vitals.maxMp,pet.mp));
  }
 }
 recoverPets(p,fraction,cleanse,battle,exact=false){
  if(battle)this.savePetVitals(p,battle);
  let petsRecovered=0,petsRevived=0;
  for(const vitals of p.petVitals?.values()??[]){
   const {hp,mp,maxHp,maxMp}=vitals;
   vitals.hp=Math.min(maxHp,hp+(exact?maxHp*fraction:Math.max(1,Math.round(maxHp*fraction))));
   vitals.mp=Math.min(maxMp,mp+(exact?maxMp*fraction:Math.round(maxMp*fraction)));
   if(vitals.hp!==hp||vitals.mp!==mp)petsRecovered++;
   if(hp===0&&vitals.hp>0)petsRevived++;
  }
  if(battle)for(const pet of partyPets(battle,p)){
   const {hp,mp}=p.petVitals.get(pet.uid);
   Object.assign(pet,{hp,mp});
   if(cleanse){pet.status={};pet.dots=[];}
  }
  return petsRecovered?{petsRecovered,petsRevived}:{};
 }
 recover(p,unit,fraction,now,source,cleanse=true,battle){
  const hp=unit.hp,mp=unit.mp;
  unit.hp=Math.min(p.maxHp,hp+Math.round(p.maxHp*fraction));
  unit.mp=Math.min(p.maxMp,mp+Math.round(p.maxMp*fraction));
  const cleansed=cleanse&&(Object.keys(unit.status??p.ailments).length>0||Boolean(unit.dots?.length));
  if(cleanse){
   p.ailments={};
   if(unit!==p){unit.status={};unit.dots=[];}
  }
  if(unit!==p){p.hp=unit.hp;p.mp=unit.mp;}
  const pets=this.recoverPets(p,fraction,cleanse,battle);
  p.baseHeal={hp:unit.hp-hp,mp:unit.mp-mp,cleansed,at:now,source,...pets};
 }
 updateFog(now){
  const zone=fogZone(this.started,now);
  if(zone.step!==this.zone.step)this.note(zone.remaining?`หมอกพิษรุกเข้า · พื้นที่ปลอดภัย ${Math.round(zone.remaining*100)}%`:'หมอกพิษปกคลุมทั้งสนาม',now,'fog');
  this.zone=zone;
  const fights=new Set();
  for(const p of this.players){
   if(p.phase==='dead')continue;
   if(insideFogSafe(zone,p.x,p.y)){delete p.fogAt;continue;}
   p.fogAt??=now+1000;
   if(now<p.fogAt)continue;
   const seconds=1+Math.floor((now-p.fogAt)/1000);
   p.fogAt+=seconds*1000;
   const previousTicks=p.fogTicks??0;
   p.fogTicks=previousTicks+seconds;
   const damage=Math.round(p.maxHp*p.fogTicks/50)-Math.round(p.maxHp*previousTicks/50);
   const battle=this.battles.get(p.battle),unit=this.battleHero(p)??p;
   unit.hp=Math.max(0,unit.hp-damage);
   if(battle){battle.fogVersion=(battle.fogVersion??0)+1;fights.add(battle);}
   if(unit.hp===0)this.fall(p,now,'หมอกพิษ');
  }
  for(const battle of fights)settleCombat(battle,now);
  this.checkScore(now);
 }
 battleHero(p){
  const fight=p.phase==='battle'&&this.battles.get(p.battle);
  return fight&&[...fight.allies,...fight.enemies].find(unit=>unit.kind==='player'&&unit.sealer===p.id)||null;
 }
 shadowTarget(beast,players,now){
  const pursued=beast.pursuedId&&players.find(p=>p.id===beast.pursuedId);
  if(beast.pursuedId&&(!pursued||distance(beast,pursued)>SHADOW_LEASH||now-beast.chaseStartedAt>=SHADOW_CHASE_MS)){
   beast.returning=true;beast.nav=null;
  }
  if(beast.returning||now<(beast.chaseAgainAt??0))return null;
  const target=pursued||nearest(beast,players.filter(p=>distance(beast,p)<=SHADOW_AGGRO));
  if(target&&!pursued)beast.chaseStartedAt=now;
  return target;
 }
 bossTarget(boss,players){
  const closest=nearest(boss,players);
  const current=players.find(p=>p.id===boss.pursuedId);
  return current&&distance(boss,current)===distance(boss,closest)?current:closest;
 }
 bossPatrol(boss){
  if(!boss.patrolTo||distance(boss,boss.patrolTo)<=10){
   const {indexAt,nextCell,clearPath}=this.arena,from=indexAt(boss);
   const canCross=(x,y,nx,ny)=>this.beastPathAllowed(cellCenter(x,y),cellCenter(nx,ny));
   const options=OBJECT_SITES.filter(point=>{
    const range=distance(boss,point);
    return range>=300&&range<=1000&&!this.inBaseFireRange(point);
   });
   const start=Math.floor(this.random()*options.length);
   boss.patrolTo=null;
   for(let i=0;i<options.length;i++){
    const point=options[(start+i)%options.length];
    if((clearPath(boss,point,RADIUS)&&this.beastPathAllowed(boss,point))||nextCell(from,indexAt(point),canCross)!==from){
     boss.patrolTo=point;break;
    }
   }
  }
  return boss.patrolTo??boss.home;
 }
 inBaseFireRange(point){
  return this.bases.some(base=>base.hp>0&&distance(base,point)<=BASE_FIRE_RANGE);
 }
 beastPathAllowed(a,b){
  if(this.solo)return true;
  // Distance to the closest point on the segment, in the same projected units as turret range.
  const dx=b.x-a.x,dy=(b.y-a.y)*FLAT,length=dx*dx+dy*dy;
  return this.bases.every(base=>{
   const x=base.x-a.x,y=(base.y-a.y)*FLAT;
   const t=length?Math.max(0,Math.min(1,(x*dx+y*dy)/length)):0;
   return base.hp<=0||Math.hypot(x-t*dx,y-t*dy)>BASE_FIRE_RANGE;
  });
 }
 moveBeast(beast,dest,dt,speed){
  const {clearPath,indexAt,cols,nextCell,move}=this.arena;
  if(distance(beast,dest)<=10)return;
  let aim=dest;
  if(!clearPath(beast,dest,RADIUS)||!this.beastPathAllowed(beast,dest)){
   const from=indexAt(beast),to=indexAt(dest);
   if(!beast.nav||beast.nav.to!==to||beast.nav.aim&&distance(beast,beast.nav.aim)<16){
    const center=cellCenter(from%cols,Math.floor(from/cols));
    const needsCenter=distance(beast,center)>16&&this.beastPathAllowed(beast,center);
    const next=needsCenter?from:nextCell(from,to,(x,y,nx,ny)=>
     this.beastPathAllowed(cellCenter(x,y),cellCenter(nx,ny)));
    beast.nav={to,aim:next!==from||needsCenter?cellCenter(next%cols,Math.floor(next/cols)):null};
   }
   aim=beast.nav.aim;
   if(!aim)return;
  }else beast.nav=null;
  const dx=aim.x-beast.x,dy=(aim.y-beast.y)*FLAT;
  const length=Math.hypot(dx,dy);
  if(!this.solo&&this.arena.bushAt(beast)!==null)speed/=2;
  if(length>0)move(beast,dx/length,dy/length,Math.min(dt,length/speed),speed,
   (x,y)=>this.beastPathAllowed(beast,{x,y}));
 }
 clearBaseRepairs(id){
  for(const p of this.players)if(p.repair?.baseId===id)delete p.repair;
 }
 baseEffect(kind,base,p,now,duration){
  const effect={id:++this.baseEffectSerial,kind,side:base.side,baseId:base.id,playerId:p.id,
   x:p.x,y:p.y,at:now,until:now+duration};
  this.baseEffects.push(effect);
 }
 siegeBases(now){
  this.baseEffects=this.baseEffects.filter(e=>e.until>now);
  const pending=[];
  for(const bolt of this.baseBolts){
   if(bolt.at>now){pending.push(bolt);continue;}
   const {target,warp,damage}=bolt;
   if(!target.connected||target.phase!=='walk'||target.warp!==warp)continue;
   target.hp=Math.max(0,target.hp-damage);
   if(!target.hp){this.fall(target,now);this.checkScore(now);}
   if(this.phase!=='match')return;
  }
  this.baseBolts=pending;
  for(const base of this.bases)base.underAttack=false;
  const attacks=new Map();
  for(const p of this.players){
   const walking=p.connected&&p.phase==='walk';
   if(p.repair){
    const base=this.bases.find(b=>b.id===p.repair.baseId);
    if(!base||!p.connected||!REPAIR_TARGET(p,base))delete p.repair;
    else if(walking){
     p.repair.nextAt??=now+BASE_REPAIR_MS;
     while(p.repair&&now>=p.repair.nextAt){
      base.hp++;
      p.earned+=BASE_REPAIR_POINTS;
      p.repair.nextAt+=BASE_REPAIR_MS;
      if(base.hp===base.maxHp)this.clearBaseRepairs(base.id);
     }
    }
   }
   if(!walking){delete p.siege;delete p.baseRecovery;continue;}
   const home=this.bases.filter(b=>HEAL_TARGET(p,b)).sort((a,b)=>b.points-a.points||distance(p,a)-distance(p,b))[0];
   if(!home)delete p.baseRecovery;
   else{
    if(p.baseRecovery?.id!==home.id)p.baseRecovery={id:home.id,nextAt:now+1000};
    const seconds=Math.floor((now-p.baseRecovery.nextAt)/1000)+1;
    if(seconds>0){
     p.baseRecovery.nextAt+=seconds*1000;
     const ratio=home.points*seconds/100;
     p.hp=Math.min(p.maxHp,p.hp+p.maxHp*ratio);
     p.mp=Math.min(p.maxMp,p.mp+p.maxMp*ratio);
     this.recoverPets(p,ratio,false,undefined,true);
    }
   }
   const base=!p.repair&&fresh(p,now)&&nearest(p,this.bases.filter(b=>RAID_TARGET(p,b)&&canRaidBase(p.side,b,this.bases)));
   if(!base){delete p.siege;continue;}
   const guards=this.players.filter(q=>q.connected&&q.repair?.baseId===base.id&&REPAIR_TARGET(q,base));
   if(guards.length){
    delete p.siege;
    const defender=nearest(p,guards.filter(q=>fresh(q,now)&&this.arena.canSeeOpponent(p,q)&&
     this.arena.canSeeOpponent(q,p)&&this.arena.clearPath(p,q)));
    if(defender)this.encounter(p,defender,now);
    continue;
   }
   if(!attacks.has(base))attacks.set(base,[]);
   attacks.get(base).push(p);
  }
  for(const [base,attackers] of attacks){
   if(this.phase!=='match')return;
   const active=attackers.filter(p=>fresh(p,now)&&p.side!==base.side);
   const count=active.length;
   if(!count||!canRaidBase(active[0].side,base,this.bases))continue;
   base.underAttack=true;
   // Split the combined rate among the attackers so each additional player adds
   // 50% to the group rate while their own career still affects their share.
   const rate=(1+(count-1)*.5)/count;
   for(const p of active){
    if(base.side===p.side)break;
    this.damageBase(base,p,rate,now);
    if(this.phase!=='match')return;
   }
  }
  for(const base of this.bases){
   if(now<(base.fireAt??0))continue;
   const target=nearest(base,this.players.filter(p=>p.side!==base.side&&fresh(p,now)&&distance(base,p)<=BASE_FIRE_RANGE));
   if(!target)continue;
   base.fireAt=now+BASE_FIRE_MS;
   const fraction=(base.points+1)*.02*(target.baseCls==='gladiator'?.5:1);
   this.baseBolts.push({target,warp:target.warp,damage:target.maxHp*fraction,at:now+BASE_BOLT_MS});
   this.baseEffect('tower',base,target,now,BASE_BOLT_MS);
  }
 }
 damageBase(base,p,rate,now){
  const {interval,effect}=siegeProfile(p);
  if(p.siege?.id!==base.id)p.siege={id:base.id,at:now,progress:0,rate};
  const siege=p.siege;
  siege.progress+=(now-siege.at)*siege.rate;
  siege.at=now;
  siege.rate=rate;
  while(siege.progress+1e-8>=interval){
   siege.progress=Math.max(0,siege.progress-interval);
   base.hp--;
   this.baseEffect(effect,base,p,now,interval);
   this.earn(p,base.points);
   this.score[base.side]=Math.max(0,this.score[base.side]-base.points);
   if(base.hp===0){
    this.baseEffect('collapse',base,{x:base.x,y:base.y},now,1050);
    const defender=base.side,loss=BASE_CAPTURE_LOSS[base.tier],bonus=loss/2;
    this.score[defender]=Math.max(0,this.score[defender]-loss);
    this.earn(p,bonus);
    base.side=p.side;
    base.hp=base.maxHp/4;
    base.fireAt=now+BASE_FIRE_MS;
    base.underAttack=false;
    this.clearBaseRepairs(base.id);
    this.note(`${p.name} ยึด${base.label} · ${TEAMS[p.side]} +${bonus} / ${TEAMS[defender]} −${loss}`,now);
    if(base.main)this.finish(p.side,'base-captured',now);
    else this.checkScore(now);
    return;
   }
   this.checkScore(now);
   if(this.phase!=='match')return;
  }
 }
 tick(now,dt){
  if(this.phase!=='match')return;
  if(this.solo){this.updateFog(now);this.eliminateByScore(now);}
  else{
   if(now>=this.ends){this.expire(now);return;}
   this.rotateBosses(now);
  }
  if(this.phase!=='match')return;
  for(const b of this.battles.values()){
   advanceCombat(b,now);this.recordFalls(b,now);
   if(this.phase!=='match')return;
   if(b.finished&&now>=b.releasedAt){
    for(const hero of [...b.allies,...b.enemies].filter(u=>u.kind==='player')){
     const p=this.players.find(player=>player.id===hero.sealer);
     if(p?.battle!==b.id||p.phase!=='battle')continue;
     this.savePetVitals(p,b);
     Object.assign(p,{phase:'walk',safeUntil:now+3500,hp:Math.max(1,hero.hp),mp:hero.mp,ailments:{...hero.status}});
     delete p.battle;
    }
    const beast=(b.boss?this.bosses:this.shadows).find(x=>x.id===b.beastId);
    if(beast){
     if(beast.boss){if(!beast.claimed){beast.phase='walk';beast.safeUntil=now+2200;}}
     else{beast.phase='rest';beast.reviveAt=now+25_000;}
     delete beast.battle;
    }
    this.battles.delete(b.id);
   }
  }
  for(const p of this.players){
   if(!this.solo&&!p.retired&&p.phase==='dead'&&now>=p.respawnAt)this.respawn(p,now);
   if(p.phase!=='walk'||!p.connected)continue;
   if(p.bot)stepBot(this,p,now,dt);
   else{
    if(!p.repair&&now-p.inputAt<900)walkInArena(this.arena,this.zone,p,p.dx,p.dy,dt);
    p.appliedSeq=p.seq;
   }
   if(this.phase!=='match')return;
  }
  this.updateTraps(now,dt);
  if(this.phase!=='match')return;
  const {canSeeOpponent,clearPath,bushAt}=this.arena;
  for(const a of this.players){
   if(!fresh(a,now))continue;
   const b=nearest(a,this.players.filter(p=>p!==a&&(this.solo||p.side!==a.side)&&fresh(p,now)&&distance(p,a)<=CONTACT&&canSeeOpponent(a,p)&&canSeeOpponent(p,a)&&clearPath(p,a)));
   if(b)this.encounter(a,b,now);
  }
  for(const b of [...this.shadows,...this.bosses]){
   if(b.phase==='rest'&&now>=b.reviveAt){
    Object.assign(b,b.home,{phase:'walk',pursuedId:undefined,nav:null});
   }
   if(b.phase!=='walk'||now<(b.safeUntil??0))continue;
   const players=this.players.filter(p=>fresh(p,now)&&bushAt(p)===null&&!this.inBaseFireRange(p));
   const target=b.boss?this.bossTarget(b,players):this.shadowTarget(b,players,now);
   if(b.pursuedId!==target?.id)b.nav=null;
   b.pursuedId=target?.id;
   if(target){
    this.moveBeast(b,target,dt,this.solo?SPEED*BEAST_SPEED_SCALE:TEAM_SPEED);
    if(distance(b,target)<=CONTACT&&clearPath(b,target))this.encounter(target,b,now,true);
   }else if(b.boss){
    this.moveBeast(b,this.bossPatrol(b),dt,this.solo?SPEED*BEAST_SPEED_SCALE:TEAM_SPEED);
   }else if(b.returning){
    this.moveBeast(b,b.home,dt,this.solo?SPEED*BEAST_SPEED_SCALE:TEAM_SPEED);
    if(distance(b,b.home)<=10)Object.assign(b,b.home,{returning:false,chaseAgainAt:now+1000});
   }else if(now>=(b.chaseAgainAt??0)){
    const patrol={x:b.home.x+(b.patrolLeft?-44:44),y:b.home.y};
    this.moveBeast(b,patrol,dt,this.solo?64*BEAST_SPEED_SCALE:TEAM_SPEED);
    if(distance(b,patrol)<=10)b.patrolLeft=!b.patrolLeft;
   }
  }
  if(!this.solo)this.siegeBases(now);
 }
 spectatorTarget(p){
  if(!this.solo||this.phase!=='match'||p.phase!=='dead')return null;
  const survivors=this.players.filter(q=>q.connected&&q.phase!=='dead');
  return survivors.find(q=>q.id===p.spectating)||survivors[0]||null;
 }
 viewedBattle(p){
  const viewer=this.spectatorTarget(p)||p;
  return viewer.phase==='battle'?this.battles.get(viewer.battle):null;
 }
 snapshot(p,now){
  const {bushAt,canSeeOpponent}=this.arena,hero=this.battleHero(p);
  const spectating=this.spectatorTarget(p),viewer=spectating||p;
  const repairing=q=>this.phase==='match'&&q.phase==='walk'&&q.connected&&q.repair?.nextAt!=null&&
   this.bases.some(b=>b.id===q.repair.baseId&&b.side===q.side&&b.hp<b.maxHp);
  const players=this.players.map(q=>{
   const {id,side,cls,baseCls,className,gender,name,lv,phase,ready,connected,x,y,warp,safeUntil}=q;
   const ally=this.solo?q===p:side===p.side;
   const visible=q===p||q===spectating||((this.solo||phase==='walk')&&inSight(viewer,q)&&(ally||canSeeOpponent(viewer,q)));
   const teamHp=ally?{hp:phase==='dead'?0:(q===p?hero:this.battleHero(q))?.hp??q.hp,maxHp:q.maxHp}:{};
   return {id,side,cls,baseCls,className,gender,name,lv,phase,ready,connected,bot:Boolean(q.bot),rating:q.rating,...teamHp,
    ...(this.solo?{points:q.points,scoreAt:q.scoreAt}:{}),...(visible?{x,y,warp,safeUntil,inBush:bushAt(q)!==null}:{}),
    ...(!this.solo&&ally&&visible?{repairingBase:repairing(q)?q.repair.baseId:null}:{}),
    ...(!this.solo&&ally&&!visible&&phase==='walk'&&Number.isFinite(x)&&Number.isFinite(y)?{mapX:x,mapY:y}:{})};
  });
  return {type:'state',me:p.id,code:this.code,phase:this.phase,ranked:Boolean(this.ranked),practice:Boolean(this.practice),isPublic:Boolean(this.isPublic),host:this.host,canStart:this.canStart(),
   ...(this.phase==='lobby'?{canManageBots:this.host===p.id&&this.rankSearch==null}:{}),
   ...(this.premade&&this.phase==='lobby'?{premade:true,rankSearching:this.rankSearch!=null,canSearchRankTeam:this.canSearchRankTeam()}:{}),
   score:this.score,now,ends:this.ends,winner:this.winner,reason:this.reason,
   ...(this.phase==='finished'?{results:this.results,rankDelta:p.rankDelta,rankSaved:p.rankSaved,rankingAvailable:this.rankingAvailable,rankPending:this.ranked&&!this.rankEvaluated}:{}),
   ...(this.solo?{mode:'survival',zone:this.zone,survivors:this.players.filter(player=>player.phase!=='dead').length,
    nextEliminationAt:this.phase==='match'?this.nextEliminationAt:null,placement:p.placement,eliminationCause:p.eliminationCause,spectating:spectating?.id,
    winnerName:this.players.find(player=>player.id===this.winner)?.name}:{}),
   bases:this.bases.map(({fireAt,underAttack,...base})=>({...base,underAttack:base.side===p.side&&Boolean(underAttack)})),
   baseEffects:this.baseEffects.filter(e=>e.until>now&&inSight(viewer,e)),

   traps:this.traps.controller.list.flatMap(({id,x,y,type})=>{
    const state=this.traps.state.revealed[id];
    if(!state||(state.done&&!state.burst)||!inSight(viewer,{x,y}))return [];
    return [{id,x,y,type,endsAt:now+state.remaining*1000,burstUntil:state.done?now+state.burst*1000:0}];
   }),
   players,vitals:{mp:hero?.mp??p.mp,maxMp:p.maxMp,ailments:Object.keys(hero?.status??p.ailments??{})},baseHeal:p.baseHeal,
   ...(repairing(p)?{baseRepair:{id:p.repair.baseId,nextAt:p.repair.nextAt}}:{}),
   respawnAt:p.respawnAt,finishedAt:this.finishedAt,ack:p.appliedSeq??-1,input:[p.dx,p.dy],battleId:p.phase==='battle'?p.battle:null,
   shadows:this.shadows.filter(b=>b.phase==='walk'&&inSight(viewer,b)).map(({id,x,y,sp,rare,lv,label})=>({id,x,y,sp,rare,lv,label})),
   bosses:this.bosses.filter(b=>!b.claimed&&inSight(viewer,b)).map(({id,x,y,sp,boss,lv,label,hp,maxHp,phase})=>({id,x,y,sp,boss,lv,label,hp,maxHp,phase})),
   chests:this.chests.filter(c=>!c.opened&&inSight(viewer,c)).map(({id,x,y})=>({id,x,y})),
   chestsLeft:this.chests.filter(c=>!c.opened).length,chestsTotal:this.chests.length,
   nextBossAt:this.nextBossAt<this.ends?this.nextBossAt:null,bossEvent:this.bossEvent,events:this.events};
 }
 battleSnapshot(p){
  const b=this.viewedBattle(p);
  return b?combatView(b,p.phase==='dead'?null:p.id):null;
 }
}
