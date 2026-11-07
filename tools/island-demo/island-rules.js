(function(g){'use strict';
const key='soulbeast-walk-preview-player-v1', onlineKey='soulbeast-online-walk-v1';
const fare=10000, F=.64, shadowCount=20, banditCount=8, trapCount=20;
const countries=['blue','green','red'];
const islands={
 blue:{name:'เกาะวิมานน้ำแข็ง',port:'ท่าเรือเหมันตคีรี',anchor:'blue-city-3',size:[7400,10200],angle:Math.PI,seed:1729,
  boss:'solar_cryostag',bossName:'คริโอสเทล กวางมงกุฎเหมันต์',helper:'legend2_aurorion',helperName:'ออโรริออน มังกรแสงเหนือ',
  gate:2,ruins:['เมืองร้างธารน้ำแข็ง','เมืองร้างหอคอยหิมะ','เมืองร้างมงกุฎขาว']},
 green:{name:'เกาะศิลามรกต',port:'ท่าเรือพนาสมุทร',anchor:'green-city-4',size:[7300,17600],angle:0,seed:2718,
  boss:'solar_raijaku',bossName:'ไรจาคุ ราชันนยุราวายุ',helper:'legend2_yggwarden',helperName:'อิดดราซิล ผู้พิทักษ์รากจักรวาล',
  gate:5,ruins:['เมืองร้างป่าชายเลน','เมืองร้างรากมรกต','เมืองร้างวิหารวายุ']},
 red:{name:'เกาะเถ้าทมิฬ',port:'ท่าเรืออัคนีบรรพต',anchor:'red-city-4',size:[9000,14500],angle:Math.PI*.75,seed:3141,
  boss:'solar_pentadrake',bossName:'แพนทาไพโรส มังกรห้าเศียรสุริยัน',helper:'solar_sovereign',helperName:'พญาราชสีห์สุริยะ',
  gate:3,ruins:['เมืองร้างหาดดำ','เมืองร้างเตาหลอม','เมืองร้างปราการเถ้า']}
};
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*F);
const chance=(rng=Math.random)=>Math.max(0,Math.min(1-Number.EPSILON,rng()));
const choose=(list,rng)=>list[Math.floor(chance(rng)*list.length)];
const level=(lo,rng)=>lo+Math.floor(chance(rng)*(61-lo));
function seeded(seed){
 return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
function pointSegment(p,a,b){
 const dx=b.x-a.x,dy=(b.y-a.y)*F;
 const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*F*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(p.x-a.x-dx*t,(p.y-a.y)*F-dy*t);
}
function port(country,nav){
 const cfg=islands[country],anchor=nav.byId.get(cfg.anchor);
 const candidates=['south','west','east'].map(gate=>nav.spawnAt(anchor,gate));
 const location=candidates.find(p=>distance(p,anchor)>190)||candidates[0];
 return {...location,id:'island-port',type:'islandPort',name:cfg.port,anchor:anchor.id};
}
function map(country){
 const cfg=islands[country],width=Math.round(cfg.size[0]/Math.SQRT2),height=Math.round(cfg.size[1]/Math.SQRT2);
 const center={x:width/2,y:height/2},rx=width*.447,ry=height*.447;
 const radius=Math.min(rx,ry*F);
 const polar=(r,a)=>({x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r/F});
 const shoreline=angle=>1+.045*Math.sin(angle*3+cfg.angle)+.028*Math.cos(angle*7-cfg.angle)+.012*Math.sin(angle*13);
 const coast=(angle,fraction=1)=>polar(fraction*shoreline(angle)/Math.hypot(Math.cos(angle)/rx,Math.sin(angle)/(ry*F)),angle);
 const harborExtra=distance(coast(cfg.angle,.97),center)-radius*.94;
 const nodes=Array.from({length:161},(_,i)=>{
  const t=i/160,angle=cfg.angle+Math.PI*4*t;
  const r=radius*(.94-.89*t)+harborExtra*Math.max(0,1-t/.11);
  return polar(Math.min(r,distance(coast(angle,.97),center)),angle);
 });
 const spawn=nodes[0],boss=nodes.at(-1),safeRadius=220,lane=145;
 const isLand=(x,y)=>{
  const dx=x-center.x,dy=(y-center.y)*F,angle=Math.atan2(dy,dx);
  return Math.hypot(dx/rx,dy/(ry*F))<=shoreline(angle);
 };
 const isSafe=p=>distance(p,spawn)<=safeRadius;
 function walkable(x,y){
  if(!isLand(x,y))return false;
  const p={x,y};
  if(isSafe(p)||distance(p,center)<=215)return true;
  return nodes.some((a,i)=>i>0&&pointSegment(p,nodes[i-1],a)<=lane);
 }
 const at=fraction=>nodes[Math.round(fraction*(nodes.length-1))];
 const sites=cfg.ruins.map((name,i)=>({...at([.27,.53,.77][i]),id:'ruin-'+i,name}));
 const chest={...at(.83),id:'chest',name:'หีบสมบัติเกาะ'};
 const rng=seeded(cfg.seed);
 const actors=Array.from({length:shadowCount+banditCount},(_,i)=>{
  const shadow=i%7<5;
  const progress=.12+i/(shadowCount+banditCount-1)*.77;
  const shift=chance(rng)*.018-.009;
  return {...at(progress+shift),id:'enemy-'+i,kind:shadow?'shadow':'bandit',lv:level(45,rng)};
 });
 const cells=[];
 for(let i=8;i<nodes.length-7;i++){
  const a=nodes[i-1],b=nodes[i],steps=Math.ceil(distance(a,b)/65);
  for(let j=0;j<steps;j++)cells.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps});
 }
 const roomAt=p=>isSafe(p)||distance(p,center)<300||[...sites,chest].some(s=>distance(s,p)<130);
 const barriers=[];
 const placeBarrier=(x,y,index)=>{
  if(isLand(x,y)&&!walkable(x,y)){
   barriers.push({x,y,art:index%3===0?'rock':'tree',size:105+chance(rng)*35});
  }
 };
 let carried=0;
 for(let i=1;i<nodes.length;i++){
  const a=nodes[i-1],b=nodes[i],span=distance(a,b),dx=(b.x-a.x)/span,dy=(b.y-a.y)*F/span;
  for(let step=125-carried;step<=span;step+=125){
   const x=a.x+dx*step,y=a.y+dy*step/F;
   for(const side of [-1,1])placeBarrier(x-dy*(lane+32)*side,y+dx*(lane+32)*side/F,i+(side>0?1:0));
  }
  carried=(carried+span)%125;
 }
 for(let i=0;i<16;i++){
  const angle=i*Math.PI/8,x=spawn.x+Math.cos(angle)*(safeRadius+12),y=spawn.y+Math.sin(angle)*(safeRadius+12)/F;
  placeBarrier(x,y,i);
 }
 return {width,height,center,rx,ry,nodes,spawn,boss,sites,chest,actors,cells,barriers,coast,roomAt,isLand,isSafe,walkable,at,lane,safeRadius};
}
function state(p,country){
 const s=p.islandProgress??={};
 s.clears??={};s.ruins??={};s.coupons??=0;
 return country?{ledger:s,ruins:s.ruins[country]??={},visit:s.visit?.country===country?s.visit:null}:s;
}
function sail(p,country){
 if(!islands[country]||!p||p.hp<=0)return 'unavailable';
 const s=state(p);
 if(s.visit?.country===country)return 'resume';
 if(!(p.gold>=fare))return 'fare';
 p.gold-=fare;
 s.visit={country,cleared:{},traps:{revealed:{}},pending:null,position:null};
 return 'depart';
}
function leave(p,country,defeated=false,maxHp=1){
 const s=state(p,country);
 if(!s.visit)return false;
 delete s.ledger.visit;
 if(defeated)p.hp=Math.max(1,Math.round(maxHp*.3));
 return true;
}
function explore(p,country,id,rng=Math.random){
 const s=state(p,country);
 if(!s.visit||s.visit.pending||!/^ruin-[0-2]$/.test(id)||s.ruins[id])return null;
 const type=choose(['well','portal','items','bandit'],rng);
 s.ruins[id]=type;
 if(type!=='items')s.visit.pending={id,kind:type,lv:level(type==='portal'?50:45,rng)};
 return type;
}
function heal(p,max){
 for(const k of ['hp','mp'])p[k]=Math.min(max[k],(Number(p[k])||0)+Math.round(max[k]*.30));
 delete p.ailments;
}
function items(p,rng=Math.random){
 const sets=[[['pot',3],['eth',2],['seal1',3]],[['pot',2],['antidote',2],['seal2',2]],[['pot',4],['eth',2],['seal2',2]]];
 const result=choose(sets,rng);p.items??={};
 for(const [id,n] of result)p.items[id]=(p.items[id]||0)+n;
 return result;
}
const encounterRates=[['form1',30],['form2',20],['form3',20],['rare',25],['legend',5]];
const chestRates=[['rare',40],['craft',30],['legend',20],['eclipse',10]];
function weighted(rates,rng=Math.random){
 let value=chance(rng)*100;
 for(const [id,weight] of rates){if(value<weight)return id;value-=weight;}
 return rates.at(-1)[0];
}
function pools(species,affinities={}){
 const groups={common:[],blue:[],green:[],red:[]};
 const tiers={ordinary:[],rare:[],legend:[]};
 for(const [id,s] of Object.entries(species)){
  if(s.noseal||s.solar||id==='demonlord')continue;
  tiers[s.legendary?'legend':s.rare?'rare':'ordinary'].push(id);
 }
 const keys=Object.keys(groups);
 let offset=0;
 for(const ids of Object.values(tiers)){
  const bucket=Object.fromEntries(keys.map(k=>[k,[]]));
  const limits=Object.fromEntries(keys.map((k,j)=>[k,Math.floor(ids.length/4)+Number((j-offset+4)%4<ids.length%4)]));
  offset=(offset+ids.length)%4;
  const desired=id=>keys.find(k=>affinities[k]?.includes(id))||'common';
  for(const id of ids.sort()){
   const own=desired(id);
   const available=keys.filter(k=>bucket[k].length<limits[k]);
   const group=available.includes(own)?own:available.sort((a,b)=>bucket[a].length-bucket[b].length)[0];
   bucket[group].push(id);
  }
  for(const k of keys)groups[k].push(...bucket[k]);
 }
 return groups;
}
function shadowGroups(groups,country,species){
 return Object.fromEntries(encounterRates.map(([tier])=>{
  const formCount=tier.startsWith('form')?Number(tier.at(-1)):null;
  const eligible=id=>{
   const s=species[id];
   if(formCount!==null)return !s.rare&&!s.legendary&&(s.ev?.length||0)+1===formCount;
   return tier==='rare'?!!s.rare&&!s.legendary:!!s.legendary;
  };
  return [tier,[groups.common,groups[country]].map(group=>group.filter(eligible)).filter(group=>group.length)];
 }));
}
function shadowCatalog(species,affinities){
 const groups=pools(species,affinities);
 const collator=new Intl.Collator('th');
 return Object.fromEntries(countries.map(country=>[country,Object.fromEntries(
  Object.entries(shadowGroups(groups,country,species)).map(([tier,regional])=>[
   tier,regional.flat().map(id=>species[id].n).sort(collator.compare),
  ])
 )]));
}
function plan(country,encounter,catalog,rng=Math.random){
 const cfg=islands[country],{species,classes,affinities}=catalog;
 const {kind,lv}=encounter;
 if(kind==='boss')return [{sp:cfg.boss,lv:60,aura:'island'},{sp:cfg.helper,lv:60,helper:true}];
 const groups=pools(species,affinities),available=[...groups.common,...groups[country]];
 const ordinary=id=>!species[id].rare&&!species[id].legendary;
 const legendary=id=>!!species[id].legendary;
 if(kind==='portal'){
  const sp=choose(available.filter(legendary),rng);
  if(!sp)throw Error('Missing island legendary pool');
  return [{sp,lv,aura:'forest'}];
 }
 if(kind==='bandit'){
  const cls=choose(classes.filter(c=>c.tier===2),rng);
  return [{cls:cls.id,lv},...Array.from({length:Math.min(2,cls.capacity)},()=>({sp:choose(available.filter(ordinary),rng),lv:Math.max(45,lv-2),pet:true}))];
 }
 const countryRules=typeof module==='undefined'?g.hemantEncounterRules:require('../hemant-walk-demo/encounter-rules.js');
 const byTier=shadowGroups(groups,country,species);
 return Array.from({length:countryRules.rollShadowCount(rng)},()=>{
  const tier=weighted(encounterRates,rng);
  const sp=choose(choose(byTier[tier],rng)||[],rng);
  if(!sp)throw Error('Missing island encounter pool '+tier);
  return {sp,lv,tier};
 });
}
function aura(unit){
 for(const [key,rate] of Object.entries({hp:2,mp:2,patk:1.5,matk:1.5,pdef:1.5,mdef:1.5,acc:1.5,spd:1.25})){
  unit.st[key]=Math.round(unit.st[key]*rate);
 }
 Object.assign(unit,{hp:unit.st.hp,mp:unit.st.mp,boss:true,bossAura:true,bossAuraVersion:'island-v1',noseal:true});
 return unit;
}
function begin(p,country,id,kind,lv){
 const s=state(p,country);
 if(!s.visit||s.visit.pending||s.visit.cleared[id]||p.hp<=0)return false;
 s.visit.pending={id,kind,lv};
 return true;
}
function finish(p,country,id,result){
 const s=state(p,country),pending=s.visit?.pending;
 if(!pending||pending.id!==id||!['win','lose','flee'].includes(result))return null;
 s.visit.pending=null;
 s.visit.last={id,result};
 if(result!=='win')return {};
 s.visit.cleared[id]=true;
 if(pending.kind!=='boss')return {};
 const first=!s.ledger.clears[country];
 s.ledger.clears[country]=(s.ledger.clears[country]||0)+1;
 if(first){s.ledger.coupons+=10;return {coupons:10};}
 p.gold+=10000;p.items??={};p.items.eternalSeal=(p.items.eternalSeal||0)+1;
 return {gold:10000,eternalSeal:1};
}
const api={key,onlineKey,fare,F,islands,countries,map,port,distance,seeded,state,sail,leave,explore,heal,items,weighted,
 encounterRates,chestRates,pools,shadowCatalog,plan,aura,begin,finish,trapCount,shadowCount,banditCount};
g.IslandRules=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
