// One randomly selected story per forest expedition, shared by all discovery systems.
// @soulbeast-unit 1110-forestStoryLimit
const ForestStoryRun={
 routes:['secret','specialEvent','riddleReward','riddleHazard','villager','taleFollow','taleEvent'],
 followPool(){
  const z=S.zone,s=WorldTales.state(),run=WorldTales.run();
  return [...Object.values(s.quests).filter(r=>r.status==='active'&&!(r.deferredUntil>s.serial)&&(r.kind==='short'?r.run===run.serial:r.targets?.[r.progress]===z.id)),
   ...Object.values(s.aftermaths).filter(a=>!a.repaired&&a.zone===z.id&&a.heard>=1&&s.serial>=a.availableAfter).map(a=>({id:'after:'+a.source,source:a.source,kind:'aftermath'}))];
 },
 state(){
  const z=S.zone;if(!z)return null;if(z.storyRun)return z.storyRun;
  const q=z.taleSession,s=WorldTales.state(),serial=z.taleRun?.serial;
  // Old saves may already be inside, or have finished, a story in this expedition.
  const quest=q?.followId||q?.id||Object.values(s.quests).find(r=>serial!=null&&(r.acceptedAt===serial||r.completedAt===serial))?.id;
  const used=z.secretSession||(z.secretRun?.offered&&Secret.state().locations[z.secretRun.location]?.completed)?'secret':z.specialSession||z.specialRun?.used?'specialEvent':z.riddleSession?'riddle'+(ForestRiddle.data()?.group==='hazard'?'Hazard':'Reward'):z.riddleRun?.reward?.used?'riddleReward':z.riddleRun?.hazard?.used?'riddleHazard':z.warpGate||z.warpUsed?'warp':z.falseBoss||z.fakeBossUsed?'falseBoss':quest?'quest:'+quest:q?'villager':z.taleRun?.specialUsed?'taleEvent':z.log?.some(line=>line.includes(' · ผู้เดินทางข้างทาง'))?'villager':null;
  return z.storyRun={version:1,planned:!!used,selected:null,offered:!!used,used,followed:!!q?.followId};
 },
 shortFollow(id){const r=WorldTales.state().quests[id];return r?.kind==='short'&&r.status==='active'&&r.run===WorldTales.run().serial?r:null;},
 can(kind,id){
  const p=this.state();if(!p)return false;
  if(p.used)return kind==='taleFollow'&&p.used==='quest:'+id&&!p.followed&&!!this.shortFollow(id);
  return !p.selected||p.selected.kind===kind&&(!p.selected.id||p.selected.id===id);
 },
 claim(kind,id){const p=this.state();p.used=['villager','taleFollow'].includes(kind)&&id?'quest:'+id:kind;if(kind==='taleFollow')p.followed=true;},
 plan(){
  const z=S.zone,p=this.state();if(p.planned)return p;p.planned=true;
  const pool=[],secret=Secret.plan(z),special=ForestSpecial.plan(z),riddle=ForestRiddle.plan(z),tale=WorldTales.run();
  const add=(kind,depth,id)=>{if(depth!=null&&depth>z.depth&&depth<ZDEPTH)pool.push({kind,depth,id:id||null});};
  if(Secret.data(secret.location)&&Secret.eligible(Secret.data(secret.location)))add('secret',secret.depth);
  if(ForestSpecial.data()&&!special.used)add('specialEvent',special.depth);
  for(const group of ['reward','hazard'])if(riddle[group]?.id&&!riddle[group].used)add(group==='reward'?'riddleReward':'riddleHazard',riddle[group].depth);
  const event=TALES_DATA.special.find(d=>d.zone===z.id);
  if(event&&!tale.specialUsed&&!WorldTales.state().consequences['special:'+event.id])add('taleEvent',tale.specialDepth);
  const follows=this.followPool();if(follows.length){const f=pick(follows);add('taleFollow',Math.min(8,Math.max(z.depth+1,f.nextDepth||2)),f.id);}
  if(Math.random()<.15)add('villager',Math.min(8,z.depth+1+Math.floor(Math.random()*Math.max(1,8-z.depth))));
  p.selected=pool.length?pick(pool):null;return p;
 },
 continuation(){const p=this.state();if(!p?.used?.startsWith('quest:')||p.followed)return null;const id=p.used.slice(6),r=this.shortFollow(id);return r?{kind:'taleFollow',id,depth:r.nextDepth}:null;},
 fork(){
  const z=S.zone;if(!z?.fork)return;
  // Inner legacy generators may offer several independent stories. Only our saved selection survives.
  z.fork=z.fork.map(d=>this.routes.includes(d.k)?{k:'beast',h:false}:d);
  if(z.secretSession||z.specialSession||z.riddleSession||z.falseBoss||z.warpGate||z.taleSession)return;
  const p=this.state(),next=this.continuation()||(!p.used?p.selected:null);
  if(!next||p.offered||z.depth+1<next.depth||z.depth+1>=ZDEPTH)return;
  const slots=z.fork.map((d,i)=>!d.h?i:-1).filter(i=>i>=0);
  const index=slots.length?pick(slots):0;z.fork[index]={k:next.kind,h:next.kind==='riddleHazard'};p.offered=true;
  if(next.kind==='secret')Secret.plan(z).offered=true;
  if(next.kind==='specialEvent')ForestSpecial.plan(z).offered=true;
  if(next.kind==='riddleReward'||next.kind==='riddleHazard')ForestRiddle.plan(z)[next.kind==='riddleReward'?'reward':'hazard'].offered=true;
 },
 wrap(object,method,kind,session,idOf=()=>null){
  const previous=object[method];object[method]=function(...args){
   const k=typeof kind==='function'?kind(...args):kind,id=idOf(...args);
   if(!ForestStoryRun.can(k,id))return;
   const old=session(),out=previous.apply(this,args),q=session();
   if(q&&q!==old){ForestStoryRun.claim(k,q.followId||q.id||id);save();}return out;
  };
 }
};
const storyLimitNewFork=newFork;
newFork=function(...args){if(!S.zone)return storyLimitNewFork(...args);ForestStoryRun.plan();const out=storyLimitNewFork(...args);ForestStoryRun.fork();save();return out;};
const storyLimitFollow=WorldTales.follow;
WorldTales.follow=function(){
 const p=S.zone?.storyRun;if(!p)return storyLimitFollow.call(this);
 const next=ForestStoryRun.continuation()||(!p.used&&p.selected?.kind==='taleFollow'?p.selected:null);
 if(!next)return p.planned?null:storyLimitFollow.call(this);
 return ForestStoryRun.followPool().find(r=>r.id===next.id&&(!r.nextDepth||S.zone.depth+1>=r.nextDepth))||null;
};
ForestStoryRun.wrap(Secret,'enter','secret',()=>S.zone?.secretSession);
ForestStoryRun.wrap(ForestSpecial,'enter','specialEvent',()=>S.zone?.specialSession);
ForestStoryRun.wrap(ForestRiddle,'enter',g=>g==='reward'?'riddleReward':'riddleHazard',()=>S.zone?.riddleSession);
ForestStoryRun.wrap(SecretWarp,'trigger','warp',()=>S.zone?.warpGate);
ForestStoryRun.wrap(FalseBoss,'enter','falseBoss',()=>S.zone?.falseBoss);
ForestStoryRun.wrap(WorldTales,'startAfter','taleFollow',()=>WorldTales.session(),source=>'after:'+source);
ForestStoryRun.wrap(WorldTales,'encounter',kind=>kind==='follow'?'taleFollow':kind==='special'?'taleEvent':'villager',()=>WorldTales.session(),kind=>kind==='follow'?WorldTales.follow()?.id:null);
const storyLimitAccept=WorldTales.accept;
WorldTales.accept=function(token){const q=this.session(),id=q?.id,was=this.state().quests[id]?.status;const out=storyLimitAccept.call(this,token);if(id&&was!=='active'&&this.state().quests[id]?.status==='active'){const p=ForestStoryRun.state();p.used='quest:'+id;if(ForestStoryRun.shortFollow(id))p.offered=false;save();}return out;};
const storyLimitWarpEligible=SecretWarp.eligible;
SecretWarp.eligible=function(){return ForestStoryRun.can('warp')&&storyLimitWarpEligible.call(this);};
const storyLimitFalseEligible=FalseBoss.eligible;
FalseBoss.eligible=function(){return ForestStoryRun.can('falseBoss')&&storyLimitFalseEligible.call(this);};
// @soulbeast-end 1110-forestStoryLimit
