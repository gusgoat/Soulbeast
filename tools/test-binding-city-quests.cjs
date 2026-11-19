const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),file=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
require('./town-walk-demo/world-quests-data.js');require('./town-walk-demo/quest-pilot-visuals.js');require('./town-walk-demo/quest-expansion-visuals.js');
const D=global.WorldQuestData,E=require('./town-walk-demo/quest-engine.js'),baseline=JSON.stringify(D.quests),sites=require('./town-walk-demo/forest-quest-sites.js');
assert.equal(JSON.stringify(D.quests),baseline,'presentation changed native quest data');
// Zone-8 native boss quests, including their existing objectives in other zones.
const forest=o=>o.zone===8;
const selected=D.quests.filter(q=>[...(q.steps||[]),...(q.choices||[]).flatMap(c=>c.steps||[])].some(forest));
let serial=0;
class Node{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.textContent='';this.classList={remove(){},add(){}};this.style={}}get firstChild(){return this.children[0]}append(...n){this.children.push(...n)}prepend(...n){this.children.unshift(...n)}replaceChildren(...n){this.children=n}querySelector(){return null}setAttribute(){}addEventListener(){}showModal(){this.open=true}}
const flat=n=>[n,...n.children.flatMap(flat)];
function town(p,place){
 let raw=JSON.stringify(p);const els=Object.fromEntries(['townDialog','dialogChoices','dialogTitle','dialogText'].map(id=>[id,new Node('div')]));
 const ctx={window:{WalkQuestEngine:E,WorldQuestData:D},URLSearchParams,location:{search:'?city='+place,origin:'http://local'},crypto:{randomUUID:()=> 'town-'+(++serial)},sessionStorage:{getItem:()=>raw,setItem:(k,v)=>raw=v},localStorage:{setItem(){}},document:{getElementById:id=>els[id],querySelector:()=>null,createElement:tag=>new Node(tag)},addEventListener(){}};
 ctx.window.document=ctx.document;vm.createContext(ctx);for(const f of ['quest-event-art.js','quest-events.js','world-quests-ui.js'])vm.runInContext(file('tools/town-walk-demo/'+f),ctx);
 const api=ctx.window.townQuests;return {api,els,player:()=>JSON.parse(raw),card:q=>flat(els.dialogChoices).find(n=>n.tag==='article'&&n.children.some(c=>c.tag==='h3'&&c.textContent===q.title+' · Lv '+q.level))};
}
function searchHost(p,country,zone,depth){
 const main={prepend(n){this.box=n}},ctx={console,URLSearchParams,crypto:{randomUUID:()=> 'search-'+(++serial)},location:{origin:'http://local'},parent:{postMessage(){}},S:{P:p,zone:{id:zone,depth},battle:null},params:new URLSearchParams('city='+country+'-capital'),screen:'hero',canPromote:()=>true,tierOf:()=>0,vHero:()=>'',handlers:{},save(){},render(){},endBattle(){},startBattle(){},B:()=>null,toast(){},document:{getElementById:()=>null,createElement:tag=>new Node(tag),querySelector:()=>main,addEventListener(){}}};
 ctx.window={WalkQuestEngine:E,WorldQuestData:D};vm.createContext(ctx);vm.runInContext(file('tools/town-walk-demo/quest-menu-bridge.js'),ctx);return {ctx,main};
}
let routes=0,searches=0,actions=0;const report=[],used=new Set();
for(const q of selected)for(const choice of q.choices||[{id:null}]){
 let p={lv:60,country:q.country,gold:100000,worldQuests:{accepted:{},completed:{}}};if(q.requires)p.worldQuests.completed[q.requires]=1;if(q.promotion===40)p.worldQuests.completed[q.country+'-capital:promotion25']=1;
 const h=town(p,q.place),giver=!q.cast&&routes%2?'questboard':q.npc;
 h.api.show(false,giver,q.place);let card=h.card(q);assert(card,q.id+' offer');const button=flat(card).find(n=>n.tag==='button'&&(choice.id?n.textContent.startsWith(choice.label+' · จ่าย '):n.textContent==='ข้าจะรับภารกิจนี้'));assert(button&&!button.disabled,q.id+' accept button');button.onclick();p=h.player();assert(E.state(p).accepted[q.id],q.id+' not accepted');assert(!E.claim(p,q,q.place,q.npc),'premature reward');
 const record={id:q.id,choice:choice.id,steps:[]};
 for(const [step,o]of E.steps(p,q).entries()){
  const country=E.objectiveCountry(q,o)||q.country,depth=o.depth||(o.target==='moon-gem'?3:2),event={...o,place:o.place||country+'-capital',country,depth,questId:q.id,objectiveStep:step,count:1};
  if(o.type==='forestSearch'&&[1,3,4,7].includes(o.zone)){
   const site=sites.describe(q);assert(site,q.id);used.add(site.id);
   const before=JSON.stringify(p);assert.equal(sites.available(p,D.quests,{country,place:event.place,zone:o.zone,depth:depth-1}).length,0,'too shallow');assert.equal(sites.available(p,D.quests,{country:country==='blue'?'red':'blue',place:event.place,zone:o.zone,depth}).length,0,'wrong country');
   const offered=sites.available(p,D.quests,{country,place:event.place,zone:o.zone,depth});assert(offered.some(s=>s.id===site.id&&s.entries.some(e=>e.questId===q.id&&e.objectiveStep===step)));assert.equal(JSON.stringify(p),before,'discovery grants progress');
   const host=searchHost(p,country,o.zone,depth);const searchButton=host.main.box.children.find(n=>n.tag==='button'&&n.dataset.questId===q.id);assert(searchButton,q.id+' actual search button');searchButton.onclick();const done=JSON.stringify(p);searchButton.onclick();assert.equal(JSON.stringify(p),done,'stale search click');assert.equal(E.state(p).accepted[q.id].step,step+1);searches++;
  }else for(let count=0;count<(o.count||1);count++){const id='native-'+(++serial);assert(E.emit(p,D.quests,{...event,id}),q.id+' native step');assert(!E.emit(p,D.quests,{...event,id}),'duplicate event');actions++;}
  p=JSON.parse(JSON.stringify(p));record.steps.push({step,type:o.type,zone:o.zone,target:o.target});
 }
 h.api.write(p);assert(!E.claim(JSON.parse(JSON.stringify(p)),q,'wrong-city',q.npc));if(q.cast)assert(!E.claim(JSON.parse(JSON.stringify(p)),q,q.place,'questboard'));
 h.api.show(false,giver,q.place);card=h.card(q);const claim=flat(card).find(n=>n.textContent==='รายงานผลและรับรางวัล');assert(claim,q.id+' claim button');const gold=p.gold;claim.onclick();p=h.player();assert(E.state(p).completed[q.id]);assert.equal(p.gold,gold+(choice.gold??q.gold));
 for(const reward of E.rewardList(q)){if(reward.kind==='item')assert.equal(p.items[reward.id],reward.qty);else if(reward.kind==='gear')assert.equal(p.owned.filter(id=>id===reward.id).length,reward.qty);else assert.equal(p.pets.filter(v=>v.sp===reward.id).length,reward.qty);}
 const paid=JSON.stringify(p);assert(!E.claim(p,q,q.place,q.npc));assert.equal(JSON.stringify(p),paid,'duplicate reward');record.completed=true;report.push(record);routes++;
}
assert.equal(used.size,0);assert.equal(selected.length,3);assert.equal(routes,3);assert.equal(searches,0);
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({quests:selected.length,routes,searches,nativeEventActions:actions,visualStories:used.size,details:report},null,2));
console.log(`PASS ${selected.length} quests / ${routes} routes: real town accept/claim buttons, ${searches} original search buttons, ${actions} native event packets, rewards and save/reload`);
console.log('PASS zone-8 city boss quests and original earlier story locations, wrong depth/country, quest isolation, duplicate events/rewards and original data unchanged');
