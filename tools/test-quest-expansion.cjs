const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={console};ctx.window=ctx;vm.createContext(ctx);const load=f=>vm.runInContext(fs.readFileSync(path.join(root,'tools/town-walk-demo',f),'utf8'),ctx);
const logic=q=>({id:q.id,place:q.place,npc:q.npc,country:q.country,level:q.level,gold:q.gold,rewards:q.rewards,requires:q.requires,promotion:q.promotion,story:q.story,ending:q.ending,steps:q.steps.map(({visual,...o})=>o),choices:q.choices?.map(({visuals,...c})=>({...c,steps:c.steps.map(({visual,...o})=>o)}))});
load('world-quests-data.js');load('quest-pilot-visuals.js');const D=ctx.WorldQuestData,baseline=JSON.stringify(D.quests.map(logic)),pilots=JSON.stringify(D.quests.filter(q=>q.pilotVisuals));load('quest-expansion-visuals.js');assert.equal(JSON.stringify(D.quests.map(logic)),baseline);assert.equal(JSON.stringify(D.quests.filter(q=>q.pilotVisuals)),pilots);
load('quest-engine.js');load('quest-event-art.js');load('quest-events.js');const E=ctx.WalkQuestEngine,V=ctx.WalkQuestEvents;
assert.equal(D.quests.filter(q=>q.eventVisuals).length,441);assert.equal(D.quests.filter(q=>q.eventVisuals||q.pilotVisuals).length,462);
const asset=src=>{assert(src?.startsWith('/Soulbeast/'));assert(fs.existsSync(path.join(root,src.slice(11))),src)};
const check=m=>{asset(m.scene.src);asset(m.portrait);asset(m.next.art);for(const r of m.rewards)asset(r.art);if(m.scene.crop){const c=m.scene.crop;assert(c.width>0&&c.height>0&&c.x>=0&&c.y>=0&&c.x+c.width<=c.sourceWidth&&c.y+c.height<=c.sourceHeight)}assert(!/\b(?:blue|green|red)-(?:capital|city|village)|road:(?:blue|green|red):/.test(m.next.place),m.next.place)};
let routes=0,objectives=0,actions=0,models=0;const report=[];
for(const q of D.quests){assert(q.visuals.offer&&q.visuals.accept&&q.visuals.complete);const entry={id:q.id,title:q.title,country:q.country,source:q.pilotVisuals?'pilot':'expanded',storyBeat:ctx.ExpandedQuestVisuals.coverage.find(c=>c.id===q.id)?.storyBeat,offer:q.visuals.offer,routes:[]};
 for(const c of q.choices||[{id:null}]){
  let p={lv:60,country:q.country,gold:10000};E.state(p);if(q.requires)p.worldQuests.completed[q.requires]=1;if(q.promotion===40)p.worldQuests.completed[q.country+'-capital:promotion25']=1;
  const untouched=JSON.stringify(p);check(V.model(p,q,'offered',{choiceId:c.id}));assert.equal(JSON.stringify(p),untouched);assert(E.accept(p,q,c.id));const accepted=V.model(p,q,'accepted');check(accepted);if(c.cost)assert(accepted.result.includes('จ่าย '+c.cost+' เหรียญแล้ว'));models+=2;
  const record={choice:c.id,label:c.label,steps:[]};for(const [i,o]of E.steps(p,q).entries()){
   assert(o.visual?.complete,'missing complete '+q.id);if(q.eventVisuals)assert(o.visual?.progress&&o.visual?.discover);
   if(o.type==='forestSearch'){const before=JSON.stringify(p),discovery=V.model(p,q,'discovered',{objectiveStep:i});check(discovery);assert(discovery.result.includes('ยังไม่ได้'));assert.equal(JSON.stringify(p),before);models++;}
   for(let n=0;n<(o.count||1);n++){
    const before=V.snapshot(p,[q]),event={...o,count:1,questId:q.id,objectiveStep:i,country:E.objectiveCountry(q,o)||q.country,depth:o.depth||(o.target==='moon-gem'?3:2),id:q.id+':'+c.id+':'+i+':'+n};assert(E.emit(p,[q],event));const m=V.changes(p,[q],before,event)[0];check(m);models++;actions++;
    if(n<(o.count||1)-1){assert.equal(m.phase,'progress');assert.equal(m.count.value,n+1);assert.notEqual(m.result,o.visual.complete.result)}else assert.equal(m.phase,'step');
    if(o.type==='talk'){assert.equal(m.speaker,D.npcs[o.place][o.target]);assert.equal(m.portrait,V.portrait(o.place,o.target))}
    p=JSON.parse(JSON.stringify(p));
   }record.steps.push({type:o.type,label:o.label,visual:o.visual});objectives++;
  }
  assert(E.claim(p,q,q.place,q.npc));const done=V.model(p,q,'completed');check(done);const saved=JSON.stringify(p);assert(!E.claim(p,q,q.place,q.npc));assert.equal(JSON.stringify(p),saved);assert.equal(p.gold,10000-(c.cost||0)+(c.gold??q.gold));models++;
  record.complete=done;entry.routes.push(record);routes++;
 }
 if(q.choices){const a=q.choices[0].visuals.complete,b=q.choices[1].visuals.complete;assert.notDeepEqual(a.crop||{art:a.art,frame:a.frame,row:a.row},b.crop||{art:b.art,frame:b.frame,row:b.row},q.id+' branches share ending image');assert.notEqual(a.quote,b.quote);}
 report.push(entry);
}
assert.equal(routes,549);assert.equal(objectives,1334);
// Real returned objects override conceptual forging/capture artwork at the successful step.
for(const [id,event,expected]of [['blue-capital:forge',{gearId:'cf_riddle7_gloves',gearName:'ถุงมือตราช่างฝึก'},ctx.QuestActionArt.cf_riddle7_gloves],['blue-capital:rare',{beastSp:'fenrir',beastName:'เฟนรีร์'},ctx.QuestBeastArt.fenrir]]){
 const q=D.quests.find(q=>q.id===id),p={lv:60,country:'blue',gold:10000};E.accept(p,q);const before=V.snapshot(p,[q]),o=q.steps[0],packet={...o,...event,id,type:o.type,place:q.place,country:'blue'};assert(E.emit(p,[q],packet));const model=V.changes(p,[q],before,packet)[0];assert.equal(model.scene.src,expected);assert(model.result.includes(event.gearName||event.beastName));check(model);
}
for(const [id,image]of Object.entries(ctx.QuestActionArt))asset(image);for(const image of Object.values(ctx.QuestBeastArt))asset(image);
for(const name of ['town-walk-demo/index.html','hemant-walk-demo/index.html','labyrinth-demo/index.html','town-walk-demo/menu.html']){const html=fs.readFileSync(path.join(root,'tools',name),'utf8');assert(html.indexOf('quest-expansion-visuals.js')>html.indexOf('quest-pilot-visuals.js'));}
const out=process.argv[2];if(out)fs.writeFileSync(out,JSON.stringify({quests:462,expanded:441,routes,objectives,actions,models,questsDetail:report},null,2));
console.log('PASS 441 expanded + 21 pilot quests / '+routes+' routes / '+objectives+' objectives / '+actions+' counted actions / '+models+' models');
console.log('PASS original mechanics/pilots unchanged, all images, every branch ending, dialogue actors, partial counts, save/reload and duplicate rewards');
console.log('PASS actual crafted gear / captured beast illustrations, readable destinations and four game entry points');
