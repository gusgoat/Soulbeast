/* Pure event rules. Call mutations inside one authoritative transaction per window. */
export const KB_COUNTRIES=Object.freeze(['blue','green','red']);
const HOUR=3600000,DAY=24*HOUR,THAI=7*HOUR;
export const KINGDOM_BOSS_HOURS={testing:[10,12,14,16,18,20,22],normal:[10,22]};
export function kingdomBossWindow(now,testing=false){
 const local=now+THAI,day=Math.floor(local/DAY),hour=(local-day*DAY)/HOUR;
 const slot=KINGDOM_BOSS_HOURS[testing?'testing':'normal'].find(h=>hour>=h&&hour<h+1);
 if(slot===undefined)return null;
 const start=day*DAY+slot*HOUR-THAI;
 return {id:'kb:'+start,start,end:start+HOUR};
}
export function kingdomBossNextStart(now,testing=false){
 const day=Math.floor((now+THAI)/DAY)*DAY-THAI,hours=KINGDOM_BOSS_HOURS[testing?'testing':'normal'];
 return hours.map(h=>day+h*HOUR).find(start=>start>now)??day+DAY+hours[0]*HOUR;
}
export function kingdomBossStats(st){
 return {...st,hp:st.hp*20,mp:st.mp*20,pdef:st.pdef*2,mdef:st.mdef*2,patk:st.patk*1.5,matk:st.matk*1.5,spd:st.spd*1.25};
}
export function kingdomBossSpawn(now,{species,points,baseStats,random=Math.random,testing=false}){
 const slot=kingdomBossWindow(now,testing);if(!slot)return null;
 const pool=species.filter(s=>s.rare&&!s.legendary&&!s.solar);
 const pick=a=>a[Math.min(a.length-1,Math.floor(random()*a.length))];
 if(!pool.length||KB_COUNTRIES.some(c=>!points[c]?.length))throw Error('Incomplete boss catalog or spawn points');
 const country=pick(KB_COUNTRIES),beast=pick(pool),home=pick(points[country]),level=50+Math.min(10,Math.floor(random()*11)),stats=kingdomBossStats(baseStats(beast.id,level));
 return {...slot,country,species:beast.id,level,home:{...home},position:{...home,dir:0},stats,hp:stats.hp,mp:stats.mp,status:'active',rev:0,players:{},fights:{},participants:{},letters:{},chase:null,lastTick:now};
}
const live=(s,now)=>s?.status==='active'&&now>=s.start&&now<s.end;
const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*.64);
function bump(s){s.rev++;}
export function kingdomBossExpire(s,now){
 if(s.status==='active'&&now>=s.end){s.status='expired';s.chase=null;for(const f of Object.values(s.fights))if(f.status==='active')f.status='expired';bump(s);}
 return s;
}
export function kingdomBossPosition(s,actor,pos,now){
 if(!live(s,now)||!actor?.id||!KB_COUNTRIES.includes(actor.country))return false;
 const prior=s.players[actor.id];
 if(prior?.fight||prior?.respawn||!Number.isFinite(pos.x)||!Number.isFinite(pos.y)||!KB_COUNTRIES.includes(pos.country))return false;
 s.players[actor.id]={country:actor.country,map:pos.country,x:pos.x,y:pos.y,seen:now,running:!!pos.running,fight:null,lastFight:prior?.lastFight};
 return true;
}
// First hit along the movement segment. At equal distance boss contact takes priority.
export function kingdomBossContact(from,to,targets){
 let hit=null;const dx=to.x-from.x,dy=(to.y-from.y)*.64,a=dx*dx+dy*dy;
 for(const t of targets){
  const x=from.x-t.x,y=(from.y-t.y)*.64,r=t.radius,c=x*x+y*y-r*r,b=x*dx+y*dy,q=b*b-a*c;
  const at=c<=0?0:a&&q>=0?(-b-Math.sqrt(q))/a:Infinity;
  if(at<0||at>1||!Number.isFinite(at))continue;
  if(!hit||at<hit.at||(at===hit.at&&t.kind==='boss'))hit={...t,at};
 }return hit;
}
export function kingdomBossMove(s,actor,pos,now){
 const prior=s.players[actor.id];if(!kingdomBossPosition(s,actor,pos,now))return null;
 const self=s.players[actor.id];if(self.map!==s.country)return null;
 const targets=[{...s.position,id:s.species,kind:'boss',radius:48}];
 if(self.running)for(const [id,p] of Object.entries(s.players))
  if(id!==actor.id&&p.map===s.country&&p.country!==self.country&&!p.fight&&!p.respawn&&now-p.seen<=3000)targets.push({...p,id,kind:'pvp',radius:34});
 const hit=kingdomBossContact(prior?.map===self.map&&now-prior.seen<=3000?prior:self,self,targets);
 if(!hit)return null;
 const id=s.id+':fight:'+s.rev, members=hit.kind==='boss'?[actor.id]:[actor.id,hit.id];
 const fight={id,kind:hit.kind,members,status:'active',started:now,turn:0};
 s.fights[id]=fight;for(const member of members)s.players[member].fight=id;
 bump(s);return fight;
}
export function kingdomBossPatrol(s,now,{walkable=()=>true,route=(a,b)=>b,speed=72,chaseSpeed=155}={}){
 if(!live(s,now))return kingdomBossExpire(s,now);
 const elapsed=Math.max(0,Math.min(.25,(now-s.lastTick)/1000));s.lastTick=now;
 const p=s.position,home=s.home,near=Object.entries(s.players).filter(([,v])=>v.map===s.country&&!v.fight&&!v.respawn&&now-v.seen<=3000&&dist(p,v)<=190).sort((a,b)=>dist(p,a[1])-dist(p,b[1]));
 if(!s.chase&&near.length&&now>=(s.restUntil||0))s.chase={id:near[0][0],until:now+5000};
 const tracked=s.chase?.id&&s.players[s.chase.id];
 if(s.chase?.id&&(now>=s.chase.until||!tracked||tracked.fight||tracked.respawn||now-tracked.seen>3000||tracked.map!==s.country))s.chase={returning:true};
 const goal=s.chase?.returning?home:s.chase?.id?tracked:{x:home.x+Math.cos((now-s.start)/4500)*90,y:home.y+Math.sin((now-s.start)/4500)*90};
 const next=route(p,goal)||goal,d=dist(p,next),step=Math.min(d,elapsed*(s.chase?chaseSpeed:speed));
 if(d>0){const x=p.x+(next.x-p.x)*step/d,y=p.y+(next.y-p.y)*step/d;if(walkable(x,y)){p.dir=(Math.round(-Math.atan2(x-p.x,(y-p.y)*.64)/(Math.PI/4))+8)%8;p.x=x;p.y=y;}}
 if(s.chase?.returning&&dist(p,home)<3){s.chase=null;s.restUntil=now+1500;}
 return s;
}
// Resolution is supplied by the server combat engine, never by the browser.
export function kingdomBossResolve(s,id,turn,outcome,now,{dropPart}={}){
 kingdomBossExpire(s,now);
 const f=s.fights[id];if(!live(s,now)||!f||f.status!=='active'||f.turn!==turn)return false;
 if(f.kind==='boss'){
  const actor=f.members[0],p=s.players[actor],damage=Math.max(0,Math.min(s.hp,Number(outcome.damage)||0));
  if(damage>0)s.participants[actor]=p.country;s.hp-=damage;
  if(Number.isFinite(outcome.mp))s.mp=Math.max(0,Math.min(s.stats.mp,outcome.mp));
  if(!s.hp){
   s.status='defeated';s.killer=actor;f.status='won';
   for(const [player,country] of Object.entries(s.participants))if(country===p.country)s.letters[player]={id:s.id+':'+player,gold:1000,coupons:1,part:dropPart,pet:player===actor?{species:s.species,level:10}:null,claimed:false};
   for(const fight of Object.values(s.fights))if(fight.status==='active')fight.status='ended';
  }else if(outcome.defeated){f.status='lost';p.respawn=p.country+'-capital';p.hospital=true;}
  else if(outcome.left)f.status='ended';
 }else{
  if(!f.members.includes(outcome.loser)&&outcome.draw!==true)return false;
  for(const actor of f.members)s.participants[actor]=s.players[actor].country;
  f.status='ended';if(outcome.loser)s.players[outcome.loser].respawn=s.players[outcome.loser].country+'-capital';
 }
 f.turn++;for(const p of Object.values(s.players))if(p.fight&&s.fights[p.fight]?.status!=='active'){p.lastFight=p.fight;p.fight=null;}
 bump(s);return true;
}
export function kingdomBossClaim(s,actor,grant){
 const letter=s.letters[actor];if(!letter||letter.claimed)return false;
 // Grant and claim must commit together. A throw leaves the letter unclaimed.
 grant(structuredClone(letter));letter.claimed=true;bump(s);return true;
}
export function kingdomBossView(s,actor,now){
 kingdomBossExpire(s,now);
 return {id:s.id,start:s.start,end:s.end,country:s.country,species:s.species,level:s.level,status:s.status,position:{...s.position},hp:s.hp,maxHP:s.stats.hp,rev:s.rev,players:Object.entries(s.players).filter(([id,p])=>id!==actor&&!p.fight&&!p.respawn&&now-p.seen<=3000).map(([id,p])=>({id,country:p.country,map:p.map,x:p.x,y:p.y})),fight:s.fights[s.players[actor]?.fight||s.players[actor]?.lastFight]||null,respawn:s.players[actor]?.respawn||null,hospital:!!s.players[actor]?.hospital,letter:s.letters[actor]||null};
}
