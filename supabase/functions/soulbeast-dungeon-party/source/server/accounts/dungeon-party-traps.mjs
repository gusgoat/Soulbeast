const statuses={poison:'poison',fire:'burn',electric:'static',ice:'freeze'};
export function createPartyTraps(placements){
 const ids=new Set();
 return placements.map(p=>{
  if(ids.has(p.id)||typeof p.id!=='string'||!Number.isFinite(p.x)||!Number.isFinite(p.y)||
   !['blast',...Object.keys(statuses)].includes(p.type))throw Error('invalid_trap');
  ids.add(p.id);return {id:p.id,x:p.x,y:p.y,type:p.type,state:'hidden'};
 });
}
// Called in the room transaction using trusted movement positions and server time.
export function advancePartyTraps(traps,members,now,metric=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)){
 const events=[];
 const eligible=p=>p.hp>0&&p.exploring===true&&Number.isFinite(p.position?.x)&&Number.isFinite(p.position?.y);
 const within=(p,t,r)=>metric(p.position,t)<=r;
 for(const t of traps){
  if(t.state==='hidden'&&members.some(p=>eligible(p)&&within(p,t,32))){
   Object.assign(t,{state:'armed',armedAt:now,explodeAt:now+2000});
   events.push({kind:'armed',id:t.id,explodeAt:t.explodeAt});
  }
  if(t.state!=='armed'||now<t.explodeAt)continue;
  t.state='spent';t.hit=[];
  for(const p of members){
   if(!eligible(p)||!within(p,t,290))continue;
   if(t.type==='blast'){
    if(!Number.isFinite(p.maxHp)||p.maxHp<=0)throw Error('invalid_member_vitals');
    p.hp=Math.max(0,p.hp-Math.max(1,Math.round(p.maxHp*.1)));
   }else{p.ailments??={};const key=statuses[t.type];p.ailments[key]=Math.max(2,Number(p.ailments[key])||0);}
   t.hit.push(p.code);
  }
  events.push({kind:'explode',id:t.id,hit:[...t.hit]});
 }
 return events;
}
// Hidden trap coordinates must never be included in a client snapshot.
export function visiblePartyTraps(traps){return structuredClone(traps.filter(t=>t.state!=='hidden'));}
