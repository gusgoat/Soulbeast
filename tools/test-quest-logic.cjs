const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),file=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
require('./town-walk-demo/world-quests-data.js');require('./town-walk-demo/quest-pilot-visuals.js');require('./town-walk-demo/quest-expansion-visuals.js');const D=global.WorldQuestData,E=require('./town-walk-demo/quest-engine.js');
let serial=0;const qid=id=>D.quests.find(q=>q.id===id),fresh=(country='blue')=>({lv:60,country,gold:100000});
function send(p,q,o,extra={}){return E.emit(p,[q],{...o,count:1,country:E.objectiveCountry(q,o)||q.country,questId:q.id,objectiveStep:E.state(p).accepted[q.id]?.step,depth:o.depth||(o.target==='moon-gem'?3:2),id:'event-'+(++serial),...extra})}
function complete(p,q,choice){if(q.requires)E.state(p).completed[q.requires]=1;if(q.promotion===40)E.state(p).completed[q.country+'-capital:promotion25']=1;assert(E.accept(p,q,choice));for(const o of E.steps(p,q))for(let i=0;i<(o.count||1);i++)assert(send(p,q,o));}
let routes=0;for(const q of D.quests)for(const c of q.choices||[{id:null}]){
 const p=fresh(q.country);if(q.requires)E.state(p).completed[q.requires]=1;if(q.promotion===40)E.state(p).completed[q.country+'-capital:promotion25']=1;
 assert(!E.claim(p,q,q.place,q.npc));assert(E.accept(p,q,c.id));assert(!E.accept(p,q,c.id));
 const gold=p.gold;for(const o of E.steps(p,q)){
  assert(!send(p,q,o,{type:'not-an-objective'}));
  const expected=E.objectiveCountry(q,o);if(expected)assert(!send(p,q,o,{country:expected==='blue'?'red':'blue'}));
  if(o.place)assert(!send(p,q,o,{place:'wrong-place'}));
  if(o.target)assert(!send(p,q,o,{target:'wrong-target'}));
  for(let i=0;i<(o.count||1);i++)assert(send(p,q,o),q.id);
 }
 const saved=JSON.stringify(p);assert(!E.claim(p,q,'wrong-place',q.npc));assert(!E.claim(p,q,q.place,'wrong-npc'));assert.equal(JSON.stringify(p),saved);
 const restored=JSON.parse(saved);assert(E.claim(restored,q,q.place,q.npc));assert.equal(restored.gold,gold+(c.gold??q.gold));
 const awarded=JSON.stringify(restored);assert(!E.claim(restored,q,q.place,q.npc));assert.equal(JSON.stringify(restored),awarded);
 assert(!send(restored,q,q.steps[0]));routes++;
}
assert.equal(routes,549);console.log('PASS 549 routes: exact objectives, wrong location/country/target, save/reload and once-only rewards');

for(const target of ['lost-person','moon-gem']){
 const qs=['blue','green','red'].map(c=>qid(c+'-capital:'+(target==='lost-person'?'lost':'gem'))),p=fresh();for(const q of qs)assert(E.accept(p,q));
 const q=qs[0],o=q.steps[0],country=target==='lost-person'?'blue':'green';
 assert(!E.emit(p,qs,{...o,country,id:'unscoped-'+target,depth:9}));
 assert(!E.emit(p,qs,{...o,country,id:'shallow-'+target,depth:1,questId:q.id,objectiveStep:0}));
 assert(!E.emit(p,qs,{...o,country,id:'wrong-step-'+target,depth:9,questId:q.id,objectiveStep:1}));
 const event={...o,country,id:'correct-'+target,depth:target==='moon-gem'?3:2,questId:q.id,objectiveStep:0};assert(E.emit(p,qs,event));
 assert.equal(E.state(p).accepted[qs[0].id].step,1);for(const other of qs.slice(1))assert.equal(E.state(p).accepted[other.id].step,0);
 const reload=JSON.parse(JSON.stringify(p));assert(!E.emit(reload,qs,event));assert.equal(E.state(reload).accepted[qs[1].id].step,0);
}
// A stale button must not complete the next occurrence of the same objective.
const repeated={id:'test:repeated',country:'blue',level:1,steps:[0,1].map(()=>({type:'forestSearch',zone:7,target:'lost-person'}))};
{const p=fresh();E.accept(p,repeated);const o=repeated.steps[0];assert(send(p,repeated,o));assert(!send(p,repeated,o,{objectiveStep:0}));assert.equal(E.state(p).accepted[repeated.id].step,1)}
// Generic combat may still satisfy several genuinely matching objectives.
{const p=fresh(),qs=[qid('blue-capital:promotion25'),qid('blue-city-1:local')];assert(qs.every(Boolean));for(const q of qs)E.accept(p,q);assert(E.emit(p,qs,{id:'fight',type:'defeat',country:'blue',place:'blue-city-1',kind:'shadow'}));assert(qs.every(q=>E.state(p).accepted[q.id].count===1))}
// Promotion 40 cannot be accepted alongside 25; old accepted progress is retained.
for(const country of ['blue','green','red']){
 const p=fresh(country),q25=qid(country+'-capital:promotion25'),q40=qid(country+'-capital:promotion40');
 assert(!E.available(p,q40));assert(!E.accept(p,q40));assert(!E.accept(fresh(country==='blue'?'red':'blue'),q25));
 complete(p,q25);assert(E.claim(p,q25,q25.place,'questboard'));assert(E.accept(p,q40));
 const old=fresh(country);old.worldQuests={accepted:{[q40.id]:{step:1,count:0}},completed:{}};const before=JSON.stringify(old.worldQuests.accepted);assert(!send(old,q40,q40.steps[1]));assert.equal(JSON.stringify(old.worldQuests.accepted),before);assert.deepEqual(E.state(old).events.filter(e=>e==='old'),[]);
}
{const p=fresh(),q=qid('blue-capital:choice-story');assert(!E.accept({...p,gold:0},q,'investigate'));assert(!E.accept(p,q,'invalid'));assert.equal(p.gold,100000);complete(p,q,'orders');p.worldQuests.accepted[q.id].choice='invalid';assert(!E.claim(p,q,q.place,q.npc));}
// Reject invalid counts and corrupt completion state instead of paying out.
{const p=fresh(),q=qid('blue-capital:promotion25');E.accept(p,q);for(const count of [NaN,Infinity,-1,0,1.5])assert(!send(p,q,q.steps[0],{count}));assert.equal(E.state(p).accepted[q.id].count,0);p.worldQuests.accepted[q.id].step=99;assert(!E.claim(p,q,q.place,q.npc));}
{const q=qid('blue-capital:lost'),p=fresh('red');E.accept(p,q);assert(E.isTarget(p,[q],{type:'place',zone:7,country:'blue',place:'blue-forest-7'}));assert(!E.isTarget(p,[q],{type:'place',zone:7,country:'red',place:'red-forest-7'}));}
console.log('PASS isolated searches, depth, stale steps, countries, promotion order, invalid choices/counts and old-save progress');

// Execute the actual menu bridge with small host stubs, including click closures.
function bridgeHost(country='blue',playerCountry='red',zone=7,depth=2,worldCall){
 const p=fresh(playerCountry),main={prepend(n){this.box=n}},nodes={};
 const ctx={console,URLSearchParams,wbCall:worldCall,crypto:{randomUUID:()=> 'bridge-'+(++serial)},location:{origin:'http://local'},parent:{postMessage(){}},S:{P:p,zone:{id:zone,depth},battle:null},params:new URLSearchParams('city='+country+'-capital'),screen:'hero',canPromote:()=>true,tierOf:()=>0,vHero:()=>'',handlers:{},save(){},render(){},endBattle(){},startBattle(){},B:()=>null,toast(){},document:{getElementById:id=>nodes[id],createElement:tag=>({tag,style:{},children:[],append(...n){this.children.push(...n)}}),querySelector:()=>main,addEventListener(){}}};ctx.window={WalkQuestEngine:E,WorldQuestData:D};vm.createContext(ctx);vm.runInContext(file('tools/town-walk-demo/quest-menu-bridge.js'),ctx);return {p,ctx,main};
}
for(const target of ['lost-person','moon-gem']){
 const zone=target==='lost-person'?7:1,country=zone===7?'blue':'green',h=bridgeHost(country,'red',zone,1),qs=['blue','green','red'].map(c=>qid(c+'-capital:'+(zone===7?'lost':'gem')));for(const q of qs)E.accept(h.p,q);
 vm.runInContext('questSearchUI()',h.ctx);assert(!h.main.box);h.ctx.S.zone.depth=zone===7?2:3;vm.runInContext('questSearchUI()',h.ctx);
 const buttons=h.main.box.children.filter(n=>n.tag==='button');assert.equal(buttons.length,zone===7?1:3);buttons[0].onclick();assert.equal(E.state(h.p).accepted[qs[0].id].step,1);assert(qs.slice(1).every(q=>E.state(h.p).accepted[q.id].step===0));buttons[0].onclick();assert.equal(E.state(h.p).accepted[qs[0].id].step,1);
}
{const h=bridgeHost('blue','blue');const q=qid('blue-capital:lost');E.accept(h.p,q);vm.runInContext('questSearchUI()',h.ctx);const button=h.main.box.children.find(n=>n.tag==='button');h.ctx.S.zone.id=1;button.onclick();assert.equal(E.state(h.p).accepted[q.id].step,0);h.ctx.S.zone.id=7;h.ctx.S.battle={over:false};button.onclick();assert.equal(E.state(h.p).accepted[q.id].step,0)}
// Embedded menu keeps the production bridge, deliberately omitting local practice fights.
let bridge=file('tools/town-walk-demo/quest-menu-bridge.js');const start=bridge.indexOf('// The local preview supplies'),end=bridge.indexOf("questEmit('visit'",start);bridge=bridge.slice(0,start)+bridge.slice(end);assert(file('tools/town-walk-demo/menu.html').includes(bridge));
console.log('PASS actual search buttons: map country vs nationality, depth, quest isolation, stale clicks and embedded menu parity');

class Node{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.textContent='';this.classList={remove(){},add(){}};this.style={}}get firstChild(){return this.children[0]}append(...n){this.children.push(...n)}prepend(...n){this.children.unshift(...n)}replaceChildren(...n){this.children=n}querySelector(){return null}setAttribute(){}addEventListener(){}showModal(){this.open=true}}
const flat=n=>[n,...n.children.flatMap(flat)];
function uiHost(p,place){
 let raw=JSON.stringify(p);const els=Object.fromEntries(['townDialog','dialogChoices','dialogTitle','dialogText'].map(id=>[id,new Node('div')]));
 const ctx={window:{WalkQuestEngine:E,WorldQuestData:D},URLSearchParams,location:{search:'?city='+place,origin:'http://local'},crypto:{randomUUID:()=> 'ui-'+(++serial)},sessionStorage:{getItem:()=>raw,setItem:(k,v)=>raw=v},localStorage:{setItem(){}},document:{getElementById:id=>els[id],querySelector:()=>null,createElement:tag=>new Node(tag)},addEventListener(){}};
 ctx.window.document=ctx.document;vm.createContext(ctx);vm.runInContext(file('tools/town-walk-demo/quest-event-art.js'),ctx);vm.runInContext(file('tools/town-walk-demo/quest-events.js'),ctx);vm.runInContext(file('tools/town-walk-demo/world-quests-ui.js'),ctx);return {ctx,els,api:ctx.window.townQuests,player:()=>JSON.parse(raw)};
}
for(const country of ['blue','green','red'])for(const level of [25,40])for(const npc of ['hall','questboard']){
 const p=fresh(country),q=qid(country+'-capital:promotion'+level);if(level===40)E.state(p).completed[country+'-capital:promotion25']=1;E.accept(p,q);for(let i=0;i<5;i++)send(p,q,q.steps[0]);
 const h=uiHost(p,q.place);h.api.talk('forge');h.api.append('forge');assert(flat(h.els.dialogChoices).some(n=>n.textContent==='ได้รับคำรับรองจากช่างหลอมแล้ว'));
 h.api.show(false,npc);flat(h.els.dialogChoices).find(n=>n.textContent==='รายงานผลและรับรางวัล').onclick();assert(h.player().worldQuests.completed[q.id]);assert(flat(h.els.dialogChoices).some(n=>n.textContent.includes('เปิดเมนูตัวละคร →')));
}
// Town conversations use the visited map's country, including foreign NPC visits.
{const p=fresh('red'),q=qid('blue-capital:choice-story');E.accept(p,q,'orders');const h=uiHost(p,'blue-capital');assert(h.api.talk('hospital'));assert.equal(h.player().worldQuests.accepted[q.id].step,1);}
{const h=uiHost(fresh(),'blue-capital');h.api.show(false,'questboard');assert(flat(h.els.dialogChoices).some(n=>n.textContent==='ต้องส่งบททดสอบเลื่อนอาชีพระดับ 25 ก่อน'));}
// Cast quests can only be turned in to their actual NPC, never the public board.
{const q=D.quests.find(q=>q.cast),p=fresh(q.country);complete(p,q);assert(!E.claim(p,q,q.place,'questboard'));assert(E.claim(p,q,q.place,q.npc));}
console.log('PASS actual town UI: all six promotions via board/NPC, certificate/character guidance, foreign visits and cast-only turn-in');

(async()=>{
 let result;const h=bridgeHost('blue','blue',7,2,async()=>result),q=qid('blue-capital:world');E.accept(h.p,q);
 const room={id:'online-world-1',status:'finished',sharedScore:10,me:0,players:[{forfeit:false}]};
 for(const r of [{ok:false,room},{ok:true,room:{...room,status:'lobby'}},{ok:true,room:{...room,sharedScore:0}},{ok:true,room:{...room,players:[{forfeit:true}]}}]){result=r;await h.ctx.wbCall('wb_poll');assert.equal(E.state(h.p).accepted[q.id].step,0);}
 result={ok:true,room};await h.ctx.wbCall('wb_poll');assert.equal(E.state(h.p).accepted[q.id].step,1);assert.equal(h.p.walkWorldQuestRooms.length,1);
 const eventCount=E.state(h.p).events.length;await h.ctx.wbCall('wb_poll');assert.equal(E.state(h.p).events.length,eventCount);
 // Persistent room dedupe survives event-log trimming and a reload.
 const saved=JSON.parse(JSON.stringify(h.p));saved.worldQuests.events=[];h.ctx.S.P=saved;await h.ctx.wbCall('wb_poll');assert.equal(saved.worldQuests.events.length,0);assert.equal(saved.walkWorldQuestRooms.length,1);
 console.log('PASS online world boss bridge: successful results, failure/withdrawal/zero-score rejection, repeated polls and reload dedupe');
})().catch(error=>{console.error(error);process.exitCode=1});
