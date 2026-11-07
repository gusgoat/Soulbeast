/* Injected into the authoritative account engine by install-engine.py. */
const kbPool=Object.entries(SP).filter(([,s])=>s.rare&&!s.legendary&&!s.solar).map(([id])=>({id,rare:true}));
const kbPoints=__KINGDOM_BOSS_POINTS__;
function kbSummary(s){
 const beast=SP[s.species],winner=s.winnerName;
 return {id:String(s.start),start:s.start,end:s.end,country:s.country,species:s.species,name:beast?.n||s.species,
  level:s.level,status:s.status,position:s.position,hp:s.hp,maxHP:s.stats.hp,...(winner?{winner}:{}),rev:s.rev};
}
function kbState(now,testing){
 const w=kingdomBossWindow(now,testing),last=guildRead_('kb:current');
 const old=last&&guildRead_(last.id);
 if(old&&old.status==='active'&&now<old.end)return old; // keep in-flight rounds when the schedule changes
 if(old?.status==='active'){kingdomBossExpire(old,now);guildWrite_(old.id,old);guildWrite_('kb:public',kbSummary(old));}
 if(!w)return old||null;
 const existing=guildRead_(w.id);if(existing)return existing;
 const s=kingdomBossSpawn(now,{testing,species:kbPool,points:kbPoints,baseStats:(sp,lv)=>calcPet({sp,lv,form:formFor(sp,lv),pts:{}})});
 // Terminal results and reward letters have separate durable records. Keep only
 // the current round's large battle data in the workbook snapshot.
 const sheet=sheet_('GuildState',GUILD_HEAD),rows=sheet.getDataRange().getValues();
 for(let i=rows.length-1;i>0;i--)if(/^kb:\d+$/.test(rows[i][0]))sheet.deleteRow(i+1);
 guildWrite_(s.id,s);guildWrite_('kb:current',{id:s.id});guildWrite_('kb:public',kbSummary(s));return s;
}
function kbBoss(s){
 const boss=wildUnit(s.species,s.level,0,false);
 Object.assign(boss,{boss:true,bossAura:true,noseal:true,kingdomBoss:true,owner:-1,st:{...s.stats},hp:s.hp,mp:s.mp});
 boss.skills=boss.skills.filter(k=>!SK[k]?.summon&&!SK[k]?.seal);return boss;
}
function kbStart(s,f){
 const teams=f.members.map((code,seat)=>pvpTeam_(campRaw_(code).P,seat,'world').team);
 if(f.kind==='pvp')teams[1].forEach(u=>u.side='enemy');
 f.battle={kind:'kingdomBoss',allies:teams[0],enemies:f.kind==='boss'?[kbBoss(s)]:teams[1],round:1,turns:0,queue:[],cur:null,log:[],fx:[],effects:[]};
 f.nextAt=f.started;f.touched=f.started;
}
function kbFinish(s,now){
 if(s.status!=='defeated')return;
 s.winnerName=campRaw_(s.killer).P.name;
 for(const [code,letter] of Object.entries(s.letters)){
  const key='cw:mail:'+code+':kingdom-boss:'+s.start;
  if(!guildRead_(key))guildWrite_(key,{...letter,id:key,code,at:now,slot:s.start,kind:'kingdomBoss',from:'กิจกรรมบอสอาณาจักร',
    subject:'รางวัลปราบ '+(SP[s.species]?.n||s.species),read:false,delivered:false,country:s.participants[code]});
 }
}
function kbAdvance(s,f,now){
 if(!f.battle||f.status!=='active'||now<f.nextAt)return false;
 const b=f.battle;S={P:{gold:0},battle:b};
 const boss=f.kind==='boss'?b.enemies[0]:null;
 if(boss){boss.hp=s.hp;boss.mp=s.mp;boss.status={};boss.dots=[];boss.buffs=[];}
 const alive=xs=>xs.some(u=>u.hp>0);
 if(!b.queue.length){if(b.turns)b.round++;b.queue=[...b.allies,...b.enemies].filter(u=>u.hp>0).sort((a,z)=>eff(z,'spd')-eff(a,'spd')).map(u=>u.id);}
 let u;while(b.queue.length&&!u){const next=uById(b.queue.shift());if(next?.hp>0)u=next;}
 b.fx=[];b.effects=[];
 if(u){b.cur=u.id;if(!turnStart(u)){const move=pvpAutoChoice_(u);if(!act(u,move.id,move.target,move.friend))act(u,'rest',null,u);}b.turns++;}
 b.log=b.log.slice(-12);f.nextAt=now+450;f.touched=now;
 if(boss){
  kingdomBossResolve(s,f.id,f.turn,{damage:Math.max(0,s.hp-boss.hp),mp:boss.mp,defeated:!alive(b.allies),left:b.turns>=180},now,{dropPart:s.species+'|0'});
  boss.hp=s.hp;boss.mp=s.mp;
 }else if(!alive(b.allies)||!alive(b.enemies)||b.turns>=120){
  const loser=alive(b.allies)===alive(b.enemies)?null:f.members[alive(b.allies)?1:0];
  f.loser=loser;kingdomBossResolve(s,f.id,f.turn,{loser,draw:!loser},now);
 }else f.turn++;
 if(s.status==='defeated')kbFinish(s,now);
 return true;
}
function kbView(s,code){
 const summary=kbSummary(s),p=s.players[code],f=s.fights[p?.fight||p?.lastFight];
 if(!f)return {event:summary,fight:null};
 const seat=f.members.indexOf(code);if(seat<0)return {event:summary,fight:null};
 const battle=structuredClone(f.battle);
 if(f.kind==='boss'){battle.enemies[0].hp=s.hp;battle.enemies[0].mp=s.mp;}
 if(seat===1)[battle.allies,battle.enemies]=[battle.enemies,battle.allies];
 if(seat===1){battle.allies.forEach(u=>u.side='ally');battle.enemies.forEach(u=>u.side='enemy');}
 return {event:summary,respawn:p.respawn||null,hospital:!!p.hospital,
  fight:{id:f.id,kind:f.kind,status:f.status,turn:f.turn,battle,
   result:f.status==='won'||(f.loser&&f.loser!==code)?'win':p.respawn?'lose':f.status==='expired'?'expired':'ended',reward:!!s.letters[code]}};
}
function kbCleanup(s,now){
 for(const f of Object.values(s.fights))if(f.status==='active'&&now-f.touched>180000){
  f.status='ended';for(const code of f.members){const p=s.players[code];if(p?.fight===f.id){p.fight=null;p.lastFight=f.id;}}
 }
 for(const [id,f] of Object.entries(s.fights))if(f.status!=='active'&&now-f.touched>300000)delete s.fights[id];
 for(const [id,p] of Object.entries(s.players))if(!p.fight&&!p.respawn&&now-p.seen>300000)delete s.players[id];
}
function kbDispatch(d){
 try{
  const now=Date.now(),testing=d._kbTesting===true;
  if(d.action==='kingdom_boss_tick'){
   if(d._kbInternal!==true)return {ok:false,error:'account_action_not_supported'};
   const s=kbState(now,testing);return {ok:true,event:s?kbSummary(s):null};
  }
  // The gateway has already checked the character owner and the service has
  // verified the PIN from the same snapshot. Avoid the write-heavy load path.
  const code=code_(d.code),P=campRaw_(code).P,nation=cwMember(code)?.country||P.country;
  communityAllowed_(code);if(!KB_COUNTRIES.includes(nation))pvpFail_('country required');
  const s=kbState(now,testing);if(!s)return {ok:true,event:null,fight:null};
  if(d.round!==String(s.start))return {ok:true,event:kbSummary(s),fight:null};
  const p=s.players[code],current=s.fights[p?.fight];
  let changed=false;
  if(d.action==='kingdom_boss_move'&&s.status==='active'){
   const x=Number(d.x),y=Number(d.y),map=String(d.map||'');
   if(map!==s.country||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>50000||y>50000||Math.hypot(x-s.position.x,(y-s.position.y)*.64)>650)pvpFail_('bad position');
   if(p&&now-p.seen<=3000&&Math.hypot(x-p.x,(y-p.y)*.64)>110+430*(now-p.seen)/1000)pvpFail_('position too far');
   if(!current&&!p?.respawn){kbCleanup(s,now);const f=kingdomBossMove(s,{id:code,country:nation},{country:map,x,y,running:d.running===true},now);if(f)kbStart(s,f);changed=true;}
  }else if(d.action==='kingdom_boss_poll'&&s.status==='active'){
   if(current?.id===d.fight&&current.turn===d.turn)changed=kbAdvance(s,current,now);
  }else if(d.action==='kingdom_boss_leave'&&current?.id===d.fight&&current.status==='active'){
   current.touched=now;
   if(current.kind==='pvp'){current.loser=code;kingdomBossResolve(s,current.id,current.turn,{loser:code},now);}
   else kingdomBossResolve(s,current.id,current.turn,{left:true},now);
   changed=true;
  }
  if(changed){guildWrite_(s.id,s);if(d.action==='kingdom_boss_poll')guildWrite_('kb:public',kbSummary(s));}
  return {ok:true,...kbView(s,code)};
 }catch(e){return {ok:false,error:e.message||String(e)};}
}
function kbApplyRewards(P,code){
 const letters=guildRows_('cw:mail:'+code+':kingdom-boss:');if(!letters.length)return;
 const applied=P.kingdomBossClaimed||(P.kingdomBossClaimed={});
 for(const l of letters){
  if(!l.delivered){
   const wallet=campState_(code);wallet.delta+=l.gold;campWrite_(wallet);
   communityCredit_(code,l.id,'kingdom-boss',l.coupons);l.delivered=true;guildWrite_(l.id,l);
  }
  if(applied[l.slot])continue;
  P.parts||={};if(l.part)P.parts[l.part]=(P.parts[l.part]||0)+1;
  if(l.pet){const previous=S;try{S={P:{uid:5000000000000+l.slot}};const pet=mkPet(l.pet.species,10);if(!P.pets?.some(p=>p.uid===pet.uid))gachaGrant(P,[{type:'pet',pet}]);}finally{S=previous;}}
  applied[l.slot]=true;
 }
 campAdjust_(P,campState_(code));
}
const kbLoadBase=loadGame_,kbSaveBase=saveGame_;
loadGame_=function(d){const r=JSON.parse(kbLoadBase(d).getContent());if(r.ok){const data=JSON.parse(r.data),code=code_(d.code);kbApplyRewards(data.P,code);r.account=campAccount_(code);r.data=JSON.stringify(data);}return json_(r);};
saveGame_=function(d){try{const data=JSON.parse(d.data||'{}'),code=code_(d.code);if(data.P)kbApplyRewards(data.P,code);return kbSaveBase({...d,data:JSON.stringify(data)});}catch(e){return json_({ok:false,error:e.message||String(e)});}};
