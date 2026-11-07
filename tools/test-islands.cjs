const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const I=require('./island-demo/island-rules.js');
const Patrols=require('./island-demo/patrols.js');
const T=require('./labyrinth-demo/traps.js');
const p={hp:40,mp:5,gold:40000,items:{},ailments:{poison:3}};
const species=Object.fromEntries(Array.from({length:40},(_,i)=>['beast'+i,i<4?{legendary:true}:i<8?{rare:true}:{ev:Array(i%3).fill({})}]));
const catalog={species,classes:[{id:'shogun',tier:2,capacity:3}]};
const groups=I.pools(species);
const props=require('./island-demo/island-props.json');
assert.deepEqual(Object.keys(props.beach).reduce((n,k)=>{
 const group=k.replace(/-\d$/,'');n[group]=(n[group]||0)+1;return n;
},{}),{shell:5,star:3,statue:1,palm:1,'shore-rock':5,'inland-rock':5});
assert.equal(Object.keys(props.bushes).length,5);
assert.deepEqual(Object.values(groups).map(g=>g.length),[10,10,10,10]);
assert.equal(new Set(Object.values(groups).flat()).size,40);
const ready=()=>true,dt=1/60;
for(const kind of ['shadow','bandit','boss']){
 const corridor={
  actors:[{kind,id:'enemy-0',x:300,y:0}],
  walkable:(x,y)=>x>=0&&x<1300&&(Math.abs(y)<45||y>100),
  isSafe:p=>p.x<=120,
 };
 const patrol=Patrols.create(corridor,7),actor=patrol.actors[0];
 for(const player of [{x:110,y:0},{x:300,y:110}]){
  assert.equal(patrol.update(dt,player,ready),null);
  assert.equal(actor.mode,'patrol');
 }
 if(kind==='boss'){
  for(let i=0;i<120;i++)assert.equal(patrol.update(dt,{x:1050,y:0},ready),null);
  assert.equal(actor.x,300);
 }
 const prey={x:520,y:0};
 assert.equal(patrol.update(dt,prey,ready),null);
 assert.equal(actor.mode,'chase');assert(actor.x>300&&actor.x<306);
 assert.equal(patrol.update(dt,{x:110,y:0},ready),null);
 assert.equal(actor.mode,'patrol');assert.equal(actor.x,300);
 let encounter=null;
 for(let i=0;i<60&&!encounter;i++)encounter=patrol.update(dt,prey,ready);
 assert.equal(encounter,actor);
 assert.equal(patrol.update(dt,prey,()=>false),null);
 assert.equal(actor.mode,'return');
}
for(const country of I.countries){
 const cfg=I.islands[country],d=I.map(country),nav={distance:I.distance,walkable:d.walkable};
 assert.equal(Object.keys(props.trees).filter(id=>id.startsWith(country+'-')).length,5);
 for(const name of ['port','wreck','rock','ruin'])assert(fs.existsSync(path.resolve(__dirname,'../assets/island-props',country+'-'+name+'.webp')));
 const traps=T.create(d,nav,{},{count:I.trapCount,spacing:370,seed:cfg.seed});
 assert.equal(traps.list.length,20);
 assert(traps.list.every(t=>d.walkable(t.x,t.y)&&!d.isSafe(t)));
 const trap=traps.list[0],person={id:'host',position:trap,alive:true};
 assert.equal(traps.update(.01,[person])[0].kind,'armed');
 assert.deepEqual(traps.update(2,[person])[0].hit,['host']);
 assert(d.nodes.every(n=>d.walkable(n.x,n.y)));
 assert(!d.walkable(0,0));assert(d.isSafe(d.spawn));
 assert(d.barriers.every(o=>d.isLand(o.x,o.y)&&!d.walkable(o.x,o.y)&&['tree','rock'].includes(o.art)));
 assert(d.barriers.length>60);
 assert.deepEqual(d.actors.reduce((n,a)=>({...n,[a.kind]:(n[a.kind]||0)+1}),{}),{shadow:20,bandit:8});
 assert(d.actors.every(a=>a.lv>=45&&a.lv<=60&&!d.isSafe(a)));
 const patrol=Patrols.create(d,cfg.seed);
 for(let i=0;i<120;i++){
  assert.equal(patrol.update(dt,d.spawn,ready),null);
  assert(patrol.actors.every(a=>d.walkable(a.x,a.y)&&!d.isSafe(a)));
 }
 assert(patrol.actors.every(a=>a.phase>=8||I.distance(a,a.home)>1));

 assert.equal(d.sites.length,3);
 for(const [roll,tier] of [[0,'form1'],[.3,'form2'],[.5,'form3'],[.7,'rare'],[.95,'legend']]){
  const sequence=[0,roll,.5,.5];
  const [unit]=I.plan(country,{kind:'shadow',lv:47},catalog,()=>sequence.shift());
  assert.equal(unit.tier,tier);assert.equal(unit.lv,47);
  assert([...groups.common,...groups[country]].includes(unit.sp));
  if(tier.startsWith('form'))assert.equal((species[unit.sp].ev?.length||0)+1,Number(tier.at(-1)));
 }
 for(const [roll,count] of [[0,1],[.45,2],[.78,3],[.92,4],[.999,4]]){
  const tiers=[0,.7,.95,.5];
  const rolls=[roll,...tiers.flatMap(t=>[t,.5,.5])];
  const units=I.plan(country,{kind:'shadow',lv:56},catalog,()=>rolls.shift());
  assert.deepEqual(units.map(u=>u.tier),['form1','rare','legend','form3'].slice(0,count));
  assert(units.every(u=>u.lv===56&&[...groups.common,...groups[country]].includes(u.sp)));
 }
 assert.deepEqual(I.plan(country,{kind:'boss'},catalog),[{sp:cfg.boss,lv:60,aura:'island'},{sp:cfg.helper,lv:60,helper:true}]);
 assert.equal(I.plan(country,{kind:'portal',lv:55},catalog,()=>0)[0].aura,'forest');
 assert.equal(I.sail(p,country),'depart');
 const gold=p.gold;
 assert.equal(I.sail(p,country),'resume');assert.equal(p.gold,gold);
 assert.equal(I.explore(p,country,'ruin-0',()=>0),'well');
 I.heal(p,{hp:100,mp:80});assert(!p.ailments);
 assert(I.finish(p,country,'ruin-0','win'));
 assert.equal(I.explore(p,country,'ruin-1',()=>.25),'portal');
 assert.equal(I.state(p,country).visit.pending.lv,52);
 assert(I.finish(p,country,'ruin-1','win'));
 assert.equal(I.explore(p,country,'ruin-2',()=>.5),'items');
 assert.equal(I.items(p,()=>.1).length,3);
 assert(I.begin(p,country,'boss','boss',60));
 assert.deepEqual(I.finish(p,country,'boss','win'),{coupons:10});
 assert.equal(I.finish(p,country,'boss','win'),null);
 assert(I.leave(p,country));assert.equal(p.gold,gold);
 p.gold+=10000;
 assert.equal(I.sail(p,country),'depart');
 assert.equal(I.explore(p,country,'ruin-0',()=>0),null);
 assert(I.begin(p,country,'boss','boss',60));
 assert.deepEqual(I.finish(p,country,'boss','win'),{gold:10000,eternalSeal:1});
 assert(I.leave(p,country,true,100));assert.equal(p.hp,30);
 const bandit={gold:10000,hp:100};
 I.sail(bandit,country);
 assert.equal(I.explore(bandit,country,'ruin-0',()=>.8),'bandit');
 assert.equal(I.state(bandit,country).visit.pending.lv,57);
}
assert.equal(I.state(p).coupons,30);
assert.equal(p.items.eternalSeal,3);
assert.equal(I.sail({gold:9999,hp:1},'blue'),'fare');
const interrupted={gold:20000,hp:100,islandProgress:{coupons:10,clears:{blue:1},ruins:{blue:{'ruin-0':'well'}}}};
assert.equal(I.sail(interrupted,'blue'),'depart');
const prior=I.state(interrupted).visit;
prior.cleared.chest=true;
interrupted.gold=9999;
assert.equal(I.sail(interrupted,'green'),'fare');
assert.equal(I.state(interrupted).visit,prior);
assert.equal(interrupted.gold,9999);
interrupted.gold=10000;
assert.equal(I.sail(interrupted,'green'),'depart');
assert.deepEqual(I.state(interrupted).visit,{country:'green',cleared:{},traps:{revealed:{}},pending:null,position:null});
assert.equal(interrupted.gold,0);
assert.equal(I.sail(interrupted,'green'),'resume');
assert.equal(interrupted.gold,0);
assert.deepEqual(I.state(interrupted).ruins,{blue:{'ruin-0':'well'}});
assert.deepEqual(I.state(interrupted).clears,{blue:1});
assert.equal(I.state(interrupted).coupons,10);

for(const [roll,quality] of [[0,'rare'],[.4,'craft'],[.7,'legend'],[.9,'eclipse']])assert.equal(I.weighted(I.chestRates,()=>roll),quality);
const u=I.aura({st:{hp:100,mp:100,patk:100,matk:100,pdef:100,mdef:100,acc:100,spd:100}});
assert.deepEqual(u.st,{hp:200,mp:200,patk:150,matk:150,pdef:150,mdef:150,acc:150,spd:125});
assert(u.noseal&&u.bossAura&&u.hp===200&&u.mp===200);
console.log('PASS island geometry, natural barriers, counts, trap behavior, fares, pools, all ruins, aura, one-time and repeat rewards, defeat');
