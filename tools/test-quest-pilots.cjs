const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const load=f=>vm.runInContext(fs.readFileSync(path.join(root,'tools',f),'utf8'),ctx);
load('town-walk-demo/world-quests-data.js');
const logic=q=>({id:q.id,level:q.level,country:q.country,place:q.place,npc:q.npc,gold:q.gold,rewards:q.rewards,requires:q.requires,promotion:q.promotion,steps:q.steps.map(({visual,...o})=>o),choices:q.choices?.map(({visuals,...c})=>({...c,steps:c.steps.map(({visual,...o})=>o)}))});
const baseline=JSON.stringify(ctx.WorldQuestData.quests.map(logic));load('town-walk-demo/quest-pilot-visuals.js');assert.equal(JSON.stringify(ctx.WorldQuestData.quests.map(logic)),baseline,'pilot authoring changed gameplay');
load('town-walk-demo/quest-engine.js');load('town-walk-demo/quest-event-art.js');load('town-walk-demo/quest-events.js');
const D=ctx.WorldQuestData,E=ctx.WalkQuestEngine,V=ctx.WalkQuestEvents,pilots=D.quests.filter(q=>q.pilotVisuals);assert.equal(pilots.length,21);
let routes=0,events=0;const trace=[];
for(const q of pilots)for(const c of q.choices||[{id:null}]){
 let p={lv:60,country:q.country,gold:1000};E.state(p);if(q.promotion===40)E.state(p).completed[q.country+'-capital:promotion25']=1;
 const beforeOffer=JSON.stringify(p),offer=V.model(p,q,'offered',{choiceId:c.id});assert.equal(JSON.stringify(p),beforeOffer);assert(offer.scene.src&&offer.quote);assert(!offer.result.includes('จ่าย 180 เหรียญแล้ว'));
 assert(E.accept(p,q,c.id));const accepted=V.model(p,q,'accepted');assert.equal(p.gold,1000-(c.cost||0));if(c.cost)assert(accepted.result.includes('จ่าย '+c.cost+' เหรียญแล้ว'));
 const row={questId:q.id,country:q.country,choice:c.id,events:[]};
 for(const [i,o]of E.steps(p,q).entries()){
  if(o.type==='forestSearch'){const discovery=V.model(p,q,'discovered',{objectiveStep:i});assert(discovery.result.includes('ยังไม่ได้'));if(o.target==='lost-person')assert.equal(discovery.speaker,'นักสำรวจหลงทาง');}
  for(let n=0;n<(o.count||1);n++){
   const before=V.snapshot(p,[q]),event={...o,count:1,id:q.id+':'+c.id+':'+i+':'+n,questId:q.id,objectiveStep:i,country:E.objectiveCountry(q,o)||q.country,depth:o.depth||(o.target==='moon-gem'?3:2)};
   assert(E.emit(p,[q],event));const m=V.changes(p,[q],before,event)[0];assert(m);assert(!/(blue|green|red)-(capital|city)/.test(m.next.place),'raw place ID');
   if(n<(o.count||1)-1){assert.equal(m.phase,'progress');assert(!m.result.includes('ครบ'),'premature completion copy');assert.equal(m.count.value,n+1)}else{assert.equal(m.phase,'step');assert(o.visual?.complete,'missing authored endpoint '+q.id);if(q.id.endsWith(':courier'))assert(m.result.includes((i+1)+'/4'));}
   row.events.push({type:o.type,phase:m.phase,result:m.result,next:m.next.label});events++;
   // Preserve exactly the same progress and route when reopening an existing save.
   p=JSON.parse(JSON.stringify(p));assert.equal(E.state(p).accepted[q.id].step,n<(o.count||1)-1?i:i+1);
  }
 }
 assert(E.claim(p,q,q.place,q.npc));const completed=V.model(p,q,'completed'),rewarded=JSON.stringify(p);assert(!E.claim(p,q,q.place,q.npc));assert.equal(JSON.stringify(p),rewarded);assert.equal(p.gold,1000-(c.cost||0)+(c.gold??q.gold));assert(completed.scene.crop);
 const crop=completed.scene.crop;assert(crop.x>=0&&crop.y>=0&&crop.x+crop.width<=crop.sourceWidth&&crop.y+crop.height<=crop.sourceHeight);
 if(q.promotion)assert(completed.next.label.includes('เปิดเมนูตัวละคร'));
 if(q.id.endsWith(':gem')){assert.equal(q.npc,'shop');assert(completed.result.includes('คืนพ่อค้า'));}
 if(c.id==='orders'){assert(completed.quote.includes('ยังกลับบ้านไม่ได้'));assert.equal(crop.x,717);assert.equal(crop.y,1086)}
 if(c.id==='investigate'){assert(completed.quote.includes('ครอบครัว'));assert.equal(crop.x,339);assert.equal(crop.y,1086)}
 row.completed={result:completed.result,quote:completed.quote,scene:crop,reward:p.gold};trace.push(row);routes++;
}
assert.equal(routes,24);
// Exercise actual chest claims, including the returned ID, inventory and once-only receipt.
load('hemant-walk-demo/treasures.js');load('hemant-walk-demo/treasure-catalog.js');
for(const country of ['blue','green','red']){
 let p={lv:60,country,gold:1000};const q=D.quests.find(q=>q.id===country+'-capital:treasure');E.accept(p,q);
 const owners=[0,1].map(i=>({home:{x:0,y:0},questId:'test-chest-'+country+'-'+i})),storage={getItem:()=>JSON.stringify(p),setItem:(key,value)=>{p=JSON.parse(value)}},nav={walkable:()=>true,clear:()=>true,distance:()=>0},t=ctx.hemantTreasures.create(nav,owners,storage,ctx.hemantTreasureCatalog,()=>0,country);
 for(const [i,owner]of owners.entries()){assert.equal(t.claim(t.chests[i],{x:0,y:0}).ok,false);t.unlock(owner);const r=t.claim(t.chests[i],{x:0,y:0});assert(r.ok);assert.equal(r.id,'pot');const amount=p.items.pot;assert(!t.claim(t.chests[i],{x:0,y:0}).ok);assert.equal(p.items.pot,amount);assert.equal(V.loot(r).rewards[1].art,ctx.QuestRewardArt.pot.art);E.emit(p,[q],{id:owner.questId,type:'chest',country,count:1});}
 assert(E.claim(p,q,q.place,q.npc));assert.equal(p.gold,1200+q.gold);assert.equal(p.items.pot,2+E.rewardList(q).filter(r=>r.id==='pot').reduce((n,r)=>n+r.qty,0));
}
for(const name of ['town-walk-demo/index.html','hemant-walk-demo/index.html','labyrinth-demo/index.html','town-walk-demo/menu.html']){const html=fs.readFileSync(path.join(root,'tools',name),'utf8');assert(html.indexOf('quest-pilot-visuals.js')>html.indexOf('world-quests-data.js'));}
const out=process.argv[2]||process.env.QUEST_PILOT_TRACE;if(out)fs.writeFileSync(out,JSON.stringify({quests:21,routes,events,trace},null,2));
console.log('PASS 21 authored pilot quests / 24 routes / '+events+' counted actions across three countries');
console.log('PASS unchanged gameplay, actors, merchant return, courier sequence, partial-progress copy, paid/free endings, reload and duplicate rewards');
console.log('PASS real guarded chest → unlock → claim → item illustration → quest turn-in, once-only rewards in all countries');
