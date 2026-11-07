/* ISLAND_TRAVEL_ENGINE_START */
const islandSaveBase=saveGame_;
const islandCountries=['blue','green','red'];

saveGame_=function(d){
 try{
  const data=JSON.parse(d.data||'{}'),code=code_(d.code);
  if(!data.P)return islandSaveBase(d);
  const exists=findRow_(sheet_(SV_SHEET,SV_HEAD),code)>0;
  const previous=exists?campRaw_(code).P:null,ledger=previous?.islandAccount;
  if(!ledger&&!data.P.islandAccount&&!data.P.islandProgress)return islandSaveBase(d);
  if(!ledger){
   delete data.P.islandAccount;
   delete data.P.islandProgress;
  }else{
   data.P.islandAccount=ledger;
   const progress=data.P.islandProgress??=structuredClone(previous.islandProgress||{});
   progress.clears=ledger.clears;
   progress.coupons=0;
   if(!ledger.active)delete progress.visit;
   else if(progress.visit?.id!==ledger.active.id||progress.visit.country!==ledger.active.country)
    progress.visit=previous.islandProgress?.visit;
   else if(progress.visit.pending?.id==='boss'&&progress.visit.pending.kind==='boss')
    ledger.active.bossStarted=true;
  }
  return islandSaveBase({...d,data:JSON.stringify(data)});
 }catch(e){return json_({ok:false,error:e.message||String(e)});}
};

function islandTravel_(d){
 try{
  const code=code_(d.code),state=campRaw_(code),p=state.P;
  if(!islandCountries.includes(d.country))return {ok:false,error:'island_bad_country'};
  const ledger=p.islandAccount??={clears:{},active:null};
  const progress=p.islandProgress??={clears:{},ruins:{},coupons:0};
  const reply=(data,extra={})=>{
   delete data.P.cpin;delete data.P.walkId;
   return {ok:true,data:JSON.stringify(data),...extra};
  };
  let outcome;
  if(d.action==='island_depart'){
   if(!(p.hp>0))return {ok:false,error:'island_character_unavailable'};
   if(ledger.active?.country===d.country&&progress.visit?.id===ledger.active.id)
    return reply(state,{outcome:'resume'});
   if(d.resumeOnly===true)return {ok:false,error:'island_resume_missing'};
   if(!(p.gold>=10000))return {ok:false,error:'island_fare'};
   p.gold-=10000;
   const id=Utilities.getUuid();
   ledger.active={id,country:d.country};
   progress.visit={id,country:d.country,cleared:{},traps:{revealed:{}},pending:null,position:null};
   outcome='depart';
  }else{
   const ticket=ledger.active,visit=progress.visit;
   if(d.action==='island_exit'&&ledger.lastExit?.id===d.visitId&&ledger.lastExit.country===d.country)
    return reply(state,{outcome:'exit'});
   if(!ticket||ticket.id!==d.visitId||ticket.country!==d.country||visit?.id!==ticket.id)
    return {ok:false,error:'island_visit_missing'};
   if(d.action==='island_exit'){
    ledger.lastExit={id:ticket.id,country:ticket.country};
    ledger.active=null;
    delete progress.visit;
    outcome='exit';
   }else if(d.action==='island_boss_reward'){
    if(ticket.reward)return reply(state,{outcome:ticket.reward,already:true});
    if(!ticket.bossStarted||visit.cleared?.boss!==true||visit.last?.id!=='boss'||visit.last.result!=='win')return {ok:false,error:'island_boss_incomplete'};
    const prior=ledger.clears[d.country]||0;
    outcome=ticket.reward=prior?'repeat':'first';
    ledger.clears[d.country]=prior+1;
    if(prior){
     p.gold=Number(p.gold)+10000;
     p.items??={};
     p.items.eternalSeal=(p.items.eternalSeal||0)+1;
    }
   }else return {ok:false,error:'bad action'};
  }
  progress.clears=ledger.clears;
  progress.coupons=0;
  const saved=JSON.parse(islandSaveBase({...d,data:JSON.stringify(state)}).getContent());
  if(!saved.ok)return saved;
  if(outcome==='first'){
   // Coupon credits are consumed in one-coupon units by the existing wallet.
   for(let i=0;i<10;i++)communityCredit_(code,'island-'+code+'-'+d.country+'-'+i,'island-boss',1);
   communitySyncCredits_(code);
  }
  return reply(campRaw_(code),{outcome});
 }catch(e){return {ok:false,error:e.message||String(e)};}
}
/* ISLAND_TRAVEL_ENGINE_END */
