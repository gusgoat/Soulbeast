const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attributes={};this.className='';this.classList={add:n=>this.className+=' '+n};this.listeners={};this.textContent='';}
 get firstChild(){return this.children[0]}append(...n){this.children.push(...n)}prepend(...n){this.children.unshift(...n)}setAttribute(k,v){this.attributes[k]=v}addEventListener(k,fn){this.listeners[k]=fn}remove(){}showModal(){this.open=true}close(){this.open=false;this.listeners.close?.()}focus(){}
}
const body=new Node('body'),ctx={console,document:{body,createElement:tag=>new Node(tag),getElementById:id=>walk(body).find(n=>n.id===id)}};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['world-quests-data.js','quest-pilot-visuals.js','quest-expansion-visuals.js','quest-engine.js','quest-event-art.js','quest-events.js'])vm.runInContext(fs.readFileSync(path.join(root,'tools/town-walk-demo',file),'utf8'),ctx);
const D=ctx.WorldQuestData,E=ctx.WalkQuestEngine,V=ctx.WalkQuestEvents;function walk(n){return [n,...n.children.flatMap(walk)]}
function checkArt(src){assert(src?.startsWith('/Soulbeast/'),src);assert(fs.existsSync(path.join(root,src.slice('/Soulbeast/'.length))),src)}
function checkModel(m){checkArt(m.scene.src);checkArt(m.portrait);checkArt(m.next.art);for(const r of m.rewards)checkArt(r.art);assert(m.heading&&m.quote&&m.result&&m.next.label);const card=V.render(m);assert.equal(card.dataset.questEvent,m.phase);assert(walk(card).some(n=>n.tag==='img'&&n.alt));return card}
let routes=0,steps=0,models=0;
for(const q of D.quests)for(const choice of q.choices||[{id:null}]){
 const p={lv:60,country:q.country,gold:100000};if(q.requires)E.state(p).completed[q.requires]=1;if(q.promotion===40)E.state(p).completed[q.country+'-capital:promotion25']=1;
 E.accept(p,q,choice.id);let original=JSON.stringify(p);checkModel(V.model(p,q,'accepted'));assert.equal(JSON.stringify(p),original);models++;
 for(const [i,o]of E.steps(p,q).entries()){
  if(o.type==='forestSearch'){original=JSON.stringify(p);const found=V.model(p,q,'discovered',{objectiveStep:i});checkModel(found);assert(found.result.includes('ยังไม่ได้'));assert.equal(JSON.stringify(p),original);models++;}
  const before=V.snapshot(p,D.quests),event={...o,country:E.objectiveCountry(q,o)||q.country,questId:q.id,objectiveStep:i,depth:o.depth||(o.target==='moon-gem'?3:2),id:q.id+':'+choice.id+':'+i};assert(E.emit(p,D.quests,event));
  const changed=V.changes(p,D.quests,before,event);assert.equal(changed.length,1);const m=changed[0];assert.equal(m.questId,q.id);assert.equal(m.phase,'step');checkModel(m);models++;steps++;
  if(o.type==='talk')assert.equal(m.portrait,V.portrait(o.place,o.target));
 }
 assert(E.claim(p,q,q.place,q.npc));original=JSON.stringify(p);const completed=V.model(p,q,'completed');checkModel(completed);assert(completed.rewards.length>0);if(choice.label)assert.equal(completed.choice,choice.label);assert.equal(JSON.stringify(p),original);models++;routes++;
}
assert.equal(routes,549);assert.equal(steps,1334);
// A choice may provide different event art without changing the engine or renderer.
{const q={...D.quests.find(q=>q.choices),id:'override',choices:[{id:'x',label:'เลือกทดสอบ',cost:0,gold:1,steps:[{type:'talk',target:'hall',place:'blue-capital',label:'พูดคุย',visual:{art:V.art.rescue,quote:'คำตอบเฉพาะทางเลือก'}}],visuals:{accept:{art:V.art.gem}}}]},p={lv:60,country:'blue',gold:10};E.accept(p,q,'x');assert.equal(V.model(p,q,'accepted').scene.src,V.art.gem);const m=V.model(p,q,'step',{objectiveStep:0});assert.equal(m.quote,'คำตอบเฉพาะทางเลือก');assert.equal(m.scene.grid,false)}
// Presentation queue replaces obsolete progress for the same quest, and never opens itself.
const q=D.quests.find(q=>q.id==='blue-capital:promotion25'),p={lv:25,country:'blue',gold:0};E.accept(p,q);const before=V.snapshot(p,D.quests);E.emit(p,[q],{id:'count',type:'defeat',kind:'shadow',country:'blue'});const partial=V.changes(p,D.quests,before,{type:'defeat'});assert.equal(partial[0].count.value,1);V.push(partial);V.push(partial);assert.equal(V.pending().length,1);assert(!walk(body).some(n=>n.tag==='dialog'));const area=new Node('div');V.flush(area);assert.equal(V.pending().length,0);assert.equal(area.children[0].children.length,1);
// Chest receipts use the actual item ID and real reward illustrations.
const loot=V.loot({id:'pot',name:'ยาฟื้นพลัง',qty:2,gold:100});checkModel(loot);assert.equal(loot.rewards[1].art,ctx.QuestRewardArt.pot.art);
for(const name of ['town-walk-demo/index.html','hemant-walk-demo/index.html','labyrinth-demo/index.html','town-walk-demo/menu.html']){const html=fs.readFileSync(path.join(root,'tools',name),'utf8');assert(html.includes('quest-events.css'));assert(html.indexOf('quest-events.js')>html.indexOf('quest-engine.js'));assert(html.includes('quest-event-art.js'));}
console.log('PASS '+models+' presentation models / 549 routes / 1334 objectives: DOM structure, all image files, read-only rendering, branches and rewards');
console.log('PASS discovered-before-action state, target NPC portraits, per-choice art overrides, non-modal queue, progress and chest receipts');

// Run the real search bridge with the presenter loaded, as it is in menu.html.
{
 let sequence=0;const main=new Node('main'),page=new Node('body'),messages=[],host={console,URLSearchParams,location:{origin:'http://local'},params:new URLSearchParams('city=blue-capital'),screen:'hero',S:{P:{lv:60,country:'blue',gold:1000},zone:{id:7,depth:2}},crypto:{randomUUID:()=> 'actual-click-'+(++sequence)},parent:{postMessage:m=>messages.push(m)},save(){},render(){},canPromote:()=>false,tierOf:()=>0,vHero:()=>'',handlers:{},B:()=>null,endBattle(){},startBattle(){},document:{body:page,createElement:tag=>new Node(tag),getElementById:id=>walk(page).find(n=>n.id===id),querySelector:()=>main,addEventListener(){}}};host.window=host;vm.createContext(host);
 for(const f of ['world-quests-data.js','quest-pilot-visuals.js','quest-expansion-visuals.js','quest-engine.js','quest-event-art.js','quest-events.js','quest-menu-bridge.js'])vm.runInContext(fs.readFileSync(path.join(root,'tools/town-walk-demo',f),'utf8'),host);
 const q=host.WorldQuestData.quests.find(q=>q.id==='blue-capital:lost');host.WalkQuestEngine.accept(host.S.P,q);vm.runInContext('questSearchUI()',host);
 const card=walk(main).find(n=>n.dataset.questEvent==='discovered');assert(card);assert(walk(card).some(n=>n.src?.endsWith('rescue-v1.png.webp')));assert.equal(host.S.P.worldQuests.accepted[q.id].step,0);
 const button=walk(card).find(n=>n.tag==='button');button.onclick();assert.equal(host.S.P.worldQuests.accepted[q.id].step,1);assert.equal(host.WalkQuestEvents.pending()[0].phase,'step');assert(messages.some(m=>m.type==='walk-quest-events'&&m.models[0].questId===q.id));assert(!walk(page).some(n=>n.tag==='dialog'));button.onclick();assert.equal(host.WalkQuestEvents.pending().length,1);
}
console.log('PASS real menu search integration: illustrated discovery, successful-action receipt, parent notification and no forced modal');
