// Autoplay support for learned class summons.
// @soulbeast-unit 1083-autoSummon
// Pure decision helper: never spend money, create units or consume RNG while choosing.
function chooseAutoSummon(u){
 const b=B();if(!b||b.over||b.kind==='world'||b.kind==='pvp'&&b.turns>=26||!u||u.hp<=0||u.temporary||!['player','human'].includes(u.kind))return null;
 const mates=sideOf(u),alive=mates.filter(x=>x.hp>0),foes=foesOf(u).filter(x=>x.hp>0);
 if(!foes.length||!battleHasRoom(u))return null;
 // Let the existing healer policy handle emergencies before investing a turn.
 if(u.skills.some(id=>{const s=SK[id];return s?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,s)<=u.mp&&(s.tg==='self'?[u]:alive).some(x=>x.hp/x.st.hp<.4);}))return null;
 const ids=['shadow_clone','summon_golem','hire_merc'].filter(id=>u.skills.includes(id)&&SK[id]&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp);
 if(!ids.length)return null;
 const bestHit=Math.max(0,...u.skills.filter(id=>SK[id]&&['p','m','h','auto'].includes(SK[id].t)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp).map(id=>combatSkillScore(u,id,foes[0],foes)));
 const remaining=foes.reduce((n,x)=>n+x.hp,0),maximum=foes.reduce((n,x)=>n+x.st.hp,0);
 if(remaining<=bestHit*1.25||remaining/Math.max(1,maximum)<.3)return null;
 for(const id of ids){
  const prefix=u.id+'_summon_';if(alive.some(x=>x.temporary&&String(x.id).startsWith(prefix)))continue;
  if(id==='hire_merc'){
   const wallet=u.kind==='player'||u.owner!=null?S.P:u;
   if(!Number.isFinite(wallet?.gold)||Math.floor(wallet.gold*.1)<1||b.autoMercHires?.[u.id])continue;
  }
  return id;
 }
 return null;
}
// Record successful hires, including manual hires, so autoplay cannot repeatedly spend 10%.
const autoSummonActPrevious=act;
act=function(u,id,...args){const ok=autoSummonActPrevious(u,id,...args);if(ok&&id==='hire_merc'){const b=B();if(b)(b.autoMercHires??={})[u.id]=true;}return ok;};

const autoSummonChoosePrevious=aiChoose;
aiChoose=function(u){const id=chooseAutoSummon(u);if(id)return [id,foesOf(u).find(x=>x.hp>0),u];const skills=u.skills;u.skills=skills.filter(id=>!['hire_merc','shadow_clone','summon_golem'].includes(id));try{return autoSummonChoosePrevious(u);}finally{u.skills=skills;}};
// @soulbeast-end 1083-autoSummon
