// Injected inside the authoritative engine closure by build-accounts.cjs.
// GuildState rows use a dedicated cw: namespace and participate in the existing CAS commit/receipt.
const CW_RULES=__COUNTRY_WAR_MAP__;
const cwNodes=new Map(CW_RULES.nodes.map(n=>[n.id,n]));
const cwCountries=new Map(CW_RULES.countries.map(c=>[c.id,c]));
const cwTopology=countryWarTopology(CW_RULES);
function cwClone(x){return JSON.parse(JSON.stringify(x));}
function cwLastCutoff(now=Date.now()){
 const local=new Date(now+25200000),d=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()-local.getUTCDay(),23,59)-25200000;
 return now>=d?d:d-604800000;
}
function cwMembers(){return guildRows_('cw:m:').filter(m=>!m.retired);}
function cwState(){return {members:Object.fromEntries(cwMembers().map(m=>[m.code,m])),locations:Object.fromEntries(guildRows_('cw:l:').map(l=>[l.id,l]))};}
function cwMember(code){return guildRead_('cw:m:'+code);}
function cwPut(m){return guildWrite_('cw:m:'+m.code,m);}
function cwRecord(m,at=Date.now()){m.lastParticipation=at;}
function cwSpentAction(m){m.lastSpentActionAt=Date.now();cwRecord(m);}
function cwOpenSlot(m,at=Date.now()){m.slotSince=at;cwRecord(m,at);}
function cwCloseSlot(m,at=Date.now()){if(m.slotSince!=null||m.capitalGuard||cwNodes.get(m.location)?.type!=='capital')m.lastOccupiedAt=at;m.slotSince=null;}
function cwEligible(m,start,end){return m.joinedAt<end&&Number.isFinite(m.lastSpentActionAt)&&m.lastSpentActionAt>=start&&m.lastSpentActionAt<end;}
function cwDie(m,at=Date.now()){
 cwCloseSlot(m,at);cwRecord(m,at);m.capitalGuard=false;m.capitalWounded=false;m.location=cwCountries.get(m.country).capitalId;
 const d=new Date(at+25200000);m.deadUntil=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)-25200000;m.diedAt=at;m.lastActionDay=new Date(at+25200000).toISOString().slice(0,10);
 const hero=m.team.find(u=>u.kind==='player');if(hero)hero.hp=0;
}
function cwSyncLives(){
 const now=Date.now();for(const m of cwMembers()){const before=JSON.stringify(m);
  if(m.rulesVersion!==2){m.rulesVersion=2;m.capitalGuard=false;if(!m.deadUntil&&cwNodes.get(m.location)?.type!=='capital')m.slotSince=now;}
  if(m.deadUntil&&m.deadUntil<=now){m.deadUntil=null;m.capitalGuard=false;m.capitalWounded=false;m.location=cwCountries.get(m.country).capitalId;cwFullHeal(m);}
  else if(!m.deadUntil&&m.team.find(u=>u.kind==='player')?.hp<=0)cwDie(m);
  else if(!m.deadUntil&&cwNodes.get(m.location)?.type==='capital'&&!m.capitalGuard&&!m.capitalWounded)cwFullHeal(m);
  if(before!==JSON.stringify(m))cwPut(m);
 }
}
function cwRational(old,numerator,denominator){
 let a=BigInt(old?.n||0),b=BigInt(old?.d||1);a=a*BigInt(denominator)+BigInt(numerator)*b;b*=BigInt(denominator);
 const whole=a/b;a%=b;let x=a,y=b;while(y){const r=x%y;x=y;y=r;}const g=x||1n;
 if(whole>BigInt(Number.MAX_SAFE_INTEGER))pvpFail_('country reward overflow');
 return {whole:Number(whole),balance:{n:String(a/g),d:String(b/g)}};
}
function cwDailyCutoff(now=Date.now()){
 const d=new Date(now+25200000),cutoff=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),22)-25200000;return cutoff<=now?cutoff:cutoff-86400000;
}
function cwPayPool(kind,cutoff,state,pools){
 const period=new Date(cutoff+25200000).toISOString().slice(0,10);
 for(const c of CW_RULES.countries){const members=Object.values(state.members).filter(m=>m.country===c.id&&cwEligible(m,cutoff-(kind==='daily'?86400000:604800000),cutoff)),pool=pools[c.id],count=members.length;if(!count)continue;
  for(const m of members){const id='cw:mail:'+m.code+':'+(kind==='weekly'?'':kind+':')+period;if(guildRead_(id))continue;
   const gold=cwRational(m.goldFraction,pool.gold,count),coupons=cwRational(m.couponFraction,pool.couponEighths,8*count);
   m.goldFraction=gold.balance;m.couponFraction=coupons.balance;cwPut(m);
   if(gold.whole){const account=campState_(m.code);account.delta+=gold.whole;campWrite_(account);}
   if(coupons.whole)communityCredit_(m.code,id,'country-war-'+kind,coupons.whole);
   guildWrite_(id,{id,code:m.code,kind,from:'ระบบสงครามประเทศ',subject:(kind==='daily'?'รางวัลรายวัน ':'รางวัลรายสัปดาห์ ')+c.name+' · '+period,at:cutoff,read:false,delivered:true,week:period,country:c.id,gold:gold.whole,coupons:coupons.whole,pool:{...pool},members:count,goldFraction:gold.balance,couponFraction:coupons.balance});
  }
 }
}
function cwMonthCutoff(now=Date.now()){const d=new Date(now+25200000);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)-25200000;}
function cwNextMonth(cutoff){const d=new Date(cutoff+25200000);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)-25200000;}
function cwMonthly(cutoff,state){
 const ranks=cwTopology.monthlyRanks(state),period=new Date(cutoff-1+25200000).toISOString().slice(0,7),snapshot='cw:season:'+period;
 if(guildRead_(snapshot))return;
 for(const m of Object.values(state.members).filter(m=>cwEligible(m,cwMonthCutoff(cutoff-1),cutoff))){
  const standing=ranks.find(r=>r.country===m.country),rank=standing.rank,gold=rank===3?1000:0,coupons=rank===1?10:rank===2?5:0,id='cw:mail:'+m.code+':monthly:'+period;
  if(guildRead_(id))continue;
  if(gold){const account=campState_(m.code);account.delta+=gold;campWrite_(account);}
  if(coupons)communityCredit_(m.code,id,'country-war-monthly',coupons);
  guildWrite_(id,{id,code:m.code,kind:'monthly',from:'ระบบสงครามประเทศ',subject:'รางวัลรายเดือน '+cwCountries.get(m.country).name+' · '+period,at:cutoff,week:period,read:false,delivered:true,country:m.country,rank,score:standing.score,ranks,gold,coupons,goldFraction:m.goldFraction,couponFraction:m.couponFraction});
 }
 // Reward receipts, ownership reset and roster reset commit together through the existing CAS transaction.
 guildWrite_(snapshot,{period,at:cutoff,ranks,locations:state.locations});
 for(const n of CW_RULES.nodes)guildWrite_('cw:l:'+n.id,{id:n.id,owner:n.country});
 for(const m of cwMembers()){cwCloseSlot(m,cutoff-1);m.location=cwCountries.get(m.country).capitalId;m.capitalGuard=false;m.capitalWounded=false;m.deadUntil=null;m.lastActionDay='';m.lastAction='';m.lastResult='';cwFullHeal(m);cwPut(m);}
}
function cwTick(){
 const now=Date.now(),last=cwLastCutoff(now),daily=cwDailyCutoff(now);let meta=guildRead_('cw:meta');
 if(!meta){guildWrite_('cw:meta',{settledThrough:last,dailyThrough:daily,monthThrough:cwMonthCutoff(now)});cwSyncLives();return;}
 // Existing weekly installations start daily rewards from upgrade, without retroactive credits.
 if(meta.dailyThrough==null){meta.dailyThrough=daily;guildWrite_('cw:meta',meta);}
 if(meta.monthThrough==null){meta.monthThrough=cwMonthCutoff(now);guildWrite_('cw:meta',meta);}
 for(;;){const week=meta.settledThrough+604800000,day=meta.dailyThrough+86400000,month=cwNextMonth(meta.monthThrough),cutoff=Math.min(week,day,month);if(cutoff>now)break;
  const state=cwState();if(month===cutoff){cwMonthly(cutoff,state);meta.monthThrough=cutoff;}
  else if(day<=week){cwPayPool('daily',cutoff,state,cwTopology.dailyPools(state));meta.dailyThrough=cutoff;}
  else{cwPayPool('weekly',cutoff,state,cwTopology.weeklyPools(state));meta.settledThrough=cutoff;}
  guildWrite_('cw:meta',meta);
 }
 cwSyncLives();
}
function cwCreateMember(code,P,country){
 if(!cwCountries.has(country))pvpFail_('country required');const old=cwMember(code);if(old){if(old.country!==country)pvpFail_('country immutable');return old;}
 const snapshot=pvpTeam_(cwClone(P),0);snapshot.team[0].gender=P.gender;const m={code,name:P.name,country,location:cwCountries.get(country).capitalId,joinedAt:Date.now(),lastActionDay:'',rulesVersion:2,capitalGuard:false,deadUntil:null,team:snapshot.team,goldFraction:{n:'0',d:'1'},couponFraction:{n:'0',d:'1'}};return cwPut(m);
}
function cwFullHeal(m){for(const u of m.team){u.hp=u.st.hp;u.mp=u.st.mp;}return m;}
function cwOwner(state,id){return state.locations[id]?.owner||cwNodes.get(id)?.country;}
function cwResidents(state,id){return Object.values(state.members).filter(m=>m.location===id&&!m.deadUntil&&(cwNodes.get(id)?.type!=='capital'||m.capitalGuard));}
function cwAlive(m){return !m.deadUntil&&m.team.find(u=>u.kind==='player')?.hp>0;}
function cwShuffle(rows){const a=rows.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function cwMailView(code){return guildRows_('cw:mail:'+code+':').sort((a,b)=>b.at-a.at).slice(0,200).map(({code,...m})=>m);}
function cwParticipation(m){const now=Date.now();return {daily:cwEligible(m,cwDailyCutoff(now),cwDailyCutoff(now)+86400000),weekly:cwEligible(m,cwLastCutoff(now),cwLastCutoff(now)+604800000),monthly:cwEligible(m,cwMonthCutoff(now),cwNextMonth(cwMonthCutoff(now)))};}
function cwView(code){
 const m=cwMember(code),state=cwState();
 const coupons=communitySyncCredits_(code).coupons;
 return {ok:true,countryWarVersion:2,season:new Date(cwMonthCutoff()+25200000).toISOString().slice(0,7),ranks:cwTopology.monthlyRanks(state),countries:CW_RULES.countries,day:campDate_(),nextReset:new Date(Date.parse(campDate_()+'T00:00:00+07:00')+86400000).toISOString(),me:m?{country:m.country,location:m.location,used:!!m.deadUntil||m.lastActionDay===campDate_(),deadUntil:m.deadUntil||null,capitalGuard:!!m.capitalGuard,capitalHealingLocked:!!m.capitalWounded,eligibility:cwParticipation(m),team:m.team.map(u=>({id:u.id,name:u.name,kind:u.kind,uid:u.uid,sp:u.sp,evo:u.evo,cls:u.cls,gender:u.gender,lv:u.lv,hp:u.hp,mp:u.mp,st:{hp:u.st.hp,mp:u.st.mp}})),goldFraction:m.goldFraction,couponFraction:m.couponFraction}:null,map:m?cwTopology.view(state,m):null,dailyPool:m?cwTopology.dailyPools(state)[m.country]:null,pool:m?cwTopology.weeklyPools(state)[m.country]:null,members:m?Object.values(state.members).filter(x=>x.country===m.country).length:0,eligibleMembers:m?Object.fromEntries(['daily','weekly','monthly'].map(kind=>[kind,Object.values(state.members).filter(x=>x.country===m.country&&cwParticipation(x)[kind]).length])):null,last:m?.lastResult?guildRead_('cw:result:'+m.lastResult+':'+code):null,unread:cwMailView(code).filter(x=>!x.read).length,coupons,account:campAccount_(code)};
}
function cwCombat(attackers,defenders,target){
 const sides=[attackers,defenders],allies=[],enemies=[],players=[];
 for(const m of [...attackers,...defenders])cwRecord(m);
 sides.forEach((members,side)=>members.forEach(m=>{const owner=players.length;players.push({code:m.code,name:m.name,country:m.country});for(const original of m.team){const u=cwClone(original);u._countrySlot=original.id;u.id='cw'+owner+'_'+original.id;u.owner=owner;u.side=side?'enemy':'ally';u.buffs=[];u.status={};u.cooldowns={};u.taunt=0;(side?enemies:allies).push(u);}}));
 const b={kind:'pvp',countryWar:true,terrain:cwNodes.get(target)?.terrain||'forest',allies,enemies,round:0,turns:0,queue:[],cur:null,log:['สงครามประเทศ · '+attackers.length+' VS '+defenders.length+' · อัตโนมัติ พร้อมอสูรตาม PVP'],fx:[],effects:[]};
 const room={id:'CW'+pvpId_().slice(0,14),status:'active',target,terrain:b.terrain,attackers:attackers.length,defenders:defenders.length,players,battle:b,me:0,winner:-1,reason:'เสมอ: ครบ 120 การกระทำ',rev:1};S={P:{gold:0},battle:b};replayInit_(room);
 for(let guard=0;guard<400&&b.turns<120;guard++){
  if(!b.allies.some(u=>u.hp>0)||!b.enemies.some(u=>u.hp>0))break;
  if(!b.queue.length){b.round++;b.queue=allU().filter(u=>u.hp>0).map(u=>[u,eff(u,'spd')*(.97+Math.random()*.06)]).sort((a,c)=>class10OpeningOrder(a[0],c[0],b)||c[1]-a[1]).map(([u])=>u.id);}
  const u=uById(b.queue.shift());if(!u||u.hp<=0)continue;b.cur=u.id;b.fx=[];b.effects=[];S.P={gold:0};
  if(turnStart(u)){b.turns++;replayFrame_(room);continue;}
  if(u.charging){const q=u.charging;u.charging=null;u.pendingStealthChargeCrit=!!q.stealthCrit;act(u,q.id,uById(q.tid),null,true);}
  else{const move=pvpAutoChoice_(u);if(!act(u,move.id,move.target,move.friend))act(u,'rest',null,u);}
  if(!takeFreeForm(u))b.turns++;replayFrame_(room);
 }
 const aliveA=b.allies.some(u=>u.hp>0),aliveD=b.enemies.some(u=>u.hp>0);room.winner=aliveA&&!aliveD?0:aliveD&&!aliveA?1:-1;room.reason=room.winner===0?'ฝ่ายโจมตีชนะคู่ป้องกัน':room.winner===1?'ฝ่ายป้องกันรักษาฐานไว้ได้':'เสมอ: ไม่มีการยึดฐาน';room.status='finished';
 // Persist only HP/MP of original roster units. Summons, buffs and enemy identities stay out of the public map.
 for(const m of [...attackers,...defenders]){const seat=players.findIndex(p=>p.code===m.code),units=[...b.allies,...b.enemies,...(b.retiredUnits||[])].filter(u=>u.owner===seat&&!u.temporary);for(const base of m.team){const u=units.find(x=>x._countrySlot===base.id);if(u){base.hp=Math.max(0,Math.min(base.st.hp,u.hp));base.mp=Math.max(0,Math.min(base.st.mp,u.mp));}}
  if(m.team.find(u=>u.kind==='player')?.hp<=0)cwDie(m);cwPut(m);
 }
 delete room._replayUnits;delete room._balanceKnown;return room;
}
function cwDispatch(d){
 try{
  const auth=pvpSaveAuth_(d),code=auth.code;if(d.action==='country_retire'&&d._countryRetire===true){cwTick();const retired=cwMember(code);if(retired){retired.retired=true;retired.retiredAt=Date.now();cwPut(retired);}return {ok:true};}communityAllowed_(code);cwTick();let m=cwMember(code);
  if(d.action==='mail_list')return {ok:true,messages:cwMailView(code),account:campAccount_(code),coupons:communitySyncCredits_(code).coupons};
  if(d.action==='mail_read'){const id=String(d.mail||''),mail=guildRead_(id);if(!mail||mail.code!==code||!id.startsWith('cw:mail:'+code+':'))pvpFail_('mail not found');mail.read=true;guildWrite_(id,mail);return {ok:true,messages:cwMailView(code)};}
  if(d.action==='country_choose'){if(m){if(m.country!==d.country)pvpFail_('country immutable');}else m=cwCreateMember(code,auth.P,String(d.country));if(!m.deadUntil){cwRecord(m);cwPut(m);}return cwView(code);}
  if(d.action==='country_status'){if(m&&!m.deadUntil){cwRecord(m);cwPut(m);}return cwView(code);}
  if(!m)pvpFail_('country required');
  if(m.deadUntil)pvpFail_('country dead until tomorrow');
  if(d.item!=null||d.useItem!=null||d.skill!=null||d.hp!=null||d.mp!=null||d.team!=null)pvpFail_('country automatic only');
  if(d.action==='country_team'){if(cwNodes.get(m.location)?.type!=='capital')pvpFail_('country capital only');if(m.capitalGuard||m.capitalWounded)pvpFail_('country guard healing locked');const source=cwClone(auth.P);if(d.petIds!==undefined){if(!Array.isArray(d.petIds)||!d.petIds.every(Number.isSafeInteger)||new Set(d.petIds).size!==d.petIds.length)pvpFail_('country bad pets');carryNormalize_(source);if(d.petIds.length>Math.min(3,clsSum(source.cls)))pvpFail_('too many pets');if(d.petIds.some(id=>!source.carried.includes(id)||!source.pets.some(p=>p.uid===id)))pvpFail_('pet at camp');source.party=d.petIds.slice();}const team=pvpTeam_(source,0);team.team[0].gender=auth.P.gender;m.team=team.team;m.name=auth.P.name;cwRecord(m);cwPut(m);return cwView(code);}
  if(d.action!=='country_action')pvpFail_('bad country action');
  if(m.lastActionDay===campDate_())pvpFail_('country daily limit');
  const state=cwState(),origin=m.location,target=String(d.target||''),kind=String(d.kind||'');
  if(kind==='defend'){if(cwOwner(state,origin)!==m.country)pvpFail_('country enemy base');if(cwNodes.get(origin)?.type==='capital'&&!m.capitalGuard){if(!cwTopology.hasRoom(state,origin))pvpFail_('country guard full');m.capitalGuard=true;m.capitalWounded=true;cwOpenSlot(m);}else if(m.slotSince==null)cwOpenSlot(m);cwRecord(m);m.lastActionDay=campDate_();m.lastAction='defend';cwSpentAction(m);cwPut(m);return cwView(code);}
  if(!['move','attack'].includes(kind)||!cwTopology.adjacent(origin,target))pvpFail_('country adjacent required');
  const friendly=cwOwner(state,target)===m.country;
  if(kind==='move'){if(!friendly)pvpFail_('country enemy base');if(cwNodes.get(target)?.type!=='capital'&&!cwTopology.hasRoom(state,target))pvpFail_('country base full');cwCloseSlot(m);m.capitalGuard=false;m.location=target;m.lastActionDay=campDate_();m.lastAction='move';cwSpentAction(m);if(cwNodes.get(target)?.type==='capital'){if(!m.capitalWounded)cwFullHeal(m);}else cwOpenSlot(m);cwPut(m);return cwView(code);}
  if(friendly||!cwTopology.canCapture(target))pvpFail_('country target protected');
  const helper=cwShuffle(cwResidents(state,origin).filter(x=>x.code!==code&&x.country===m.country&&cwAlive(x)))[0],attackers=[m,...(helper?[helper]:[])],defenders=cwShuffle(cwResidents(state,target).filter(x=>x.country!==m.country&&cwAlive(x))).slice(0,2);
  cwRecord(m);m.lastActionDay=campDate_();m.lastAction='attack';cwSpentAction(m);cwPut(m);
  let room=defenders.length?cwCombat(attackers,defenders,target):null;
  const after=cwState(),remaining=cwResidents(after,target).filter(x=>x.country!==m.country&&cwAlive(x));let captured=false;
  if(!remaining.length&&(!room||room.winner===0)){guildWrite_('cw:l:'+target,{id:target,owner:m.country});captured=true;for(const actor of attackers){const current=cwMember(actor.code);if(cwAlive(current)&&current.location===origin&&cwTopology.hasRoom(cwState(),target)){cwCloseSlot(current);current.location=target;current.capitalGuard=cwNodes.get(target)?.type==='capital';if(current.capitalGuard)current.capitalWounded=true;cwOpenSlot(current);cwPut(current);}}}
  if(!room)room={id:'CW'+pvpId_().slice(0,14),status:'finished',players:attackers.map(x=>({name:x.name,country:x.country})),winner:0,reason:'ยึดฐานว่างสำเร็จ',battle:null};
  room.captured=captured;room.target=target;room.remaining=remaining.length;
  // Only participants can fetch their own combat receipt; enemy map rosters remain anonymous.
  const involved=[...attackers,...defenders];for(const participant of involved){const current=cwMember(participant.code);current.lastResult=room.id;cwPut(current);const view=cwClone(room);view.me=attackers.some(x=>x.code===participant.code)?0:1;view.players=view.players.map(({code,...p})=>p);guildWrite_('cw:result:'+room.id+':'+participant.code,view);}
  return cwView(code);
 }catch(e){return {ok:false,error:e.message||String(e)};}
}
// Country identity is authoritative even when an older client saves without the new field.
const cwSaveBase=saveGame_;saveGame_=function(d){
 try{const code=code_(d.code),m=cwMember(code),data=JSON.parse(d.data||'{}'),nation=data.P?.country;
  if(m&&nation&&nation!==m.country)pvpFail_('country immutable');
  if(!m&&nation&&!cwCountries.has(nation))pvpFail_('country required');
  if(m)data.P.country=m.country;
  const result=JSON.parse(cwSaveBase({...d,data:JSON.stringify(data)}).getContent());
  if(result.ok){if(!m&&nation){cwTick();cwCreateMember(code,campRaw_(code).P,nation);}else if(m){m.name=campRaw_(code).P.name;cwPut(m);}}
  return json_(result);
 }catch(e){return json_({ok:false,error:e.message||String(e)});}
};
const cwLoadBase=loadGame_;loadGame_=function(d){const result=JSON.parse(cwLoadBase(d).getContent());if(result.ok){const m=cwMember(code_(d.code));if(m){const data=JSON.parse(result.data);data.P.country=m.country;result.data=JSON.stringify(data);}}return json_(result);};
