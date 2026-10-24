const assert=require('assert/strict'),fs=require('fs');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r("render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};S.zone={id:7,depth:2};");
 assert.notEqual(r("BattleScenery.resolve({kind:'wild',meta:7}).art"),r("BattleScenery.resolve({kind:'wild',meta:1}).art"),'Training must not reuse moonlit forest art');
 assert.equal(r("BattleScenery.resolve({kind:'boss',meta:7}).key"),'training');
 const expected=['forest','mist','desert','volcano','ruins','fortress','training'];
 for(let zone=1;zone<=7;zone++){
  const before=r('JSON.stringify(S)');
  assert.equal(r(`BattleScenery.resolve({kind:'wild',meta:${zone}}).key`),expected[zone-1]);
  assert.equal(r('JSON.stringify(S)'),before,'Rendering must not mutate saves or combat');
  const art=r(`BattleScenery.resolve({kind:'wild',meta:${zone}}).art`);assert(fs.existsSync(art),art);
 }
 for(const [b,mode,key]of [[{kind:'boss',meta:3},'','boss'],[{kind:'boss',meta:6},'','throne'],[{kind:'boss',meta:4},'','volcano'],[{kind:'npc',meta:6},'','arena'],[{towerRun:true,towerFloor:20},'','arena'],[{},'world','world'],[{},'pvp','arena'],[{},'camp','fortress'],[{},'guildwar','fortress']]){
  assert.equal(r(`BattleScenery.resolve(${JSON.stringify(b)},'${mode}').key`),key);
 }
 assert.equal(r("BattleScenery.resolve({meta:999}).key"),'forest');
 r("S.battle={v:4,kind:'wild',meta:7,enemies:[wildUnit('kodama',3,0)],allies:[playerUnit()],round:1,queue:[],cur:'p',log:[],target:0,atarget:0,menu:'main',over:null,used:[],fx:[]};");
 const before=r('JSON.stringify(S.battle)'),html=r('vBattle()');assert(html.includes('data-battle-scene="training"'));assert(html.includes('data-v="target:0"'));assert(html.includes('data-v="ally:0"'));assert(html.includes('battle-scenery-title'));assert.equal(r('JSON.stringify(S.battle)'),before);
 // Both active and finished fights must render just one card set and one target per unit.
 r('S.battle.cur=S.battle.allies[0].id');
 for(const finished of [false,true]){
  r('S.battle.over='+(finished?JSON.stringify({res:'win',title:'ชัยชนะ',lines:['ได้ EXP 198 · 73 เหรียญ']}):'null'));
  const view=r('vBattle()');
  assert.equal((view.match(/class="battle-vitals battle-scenery"/g)||[]).length,1);
  assert(!view.includes('class="side"'),'Legacy card rows must not remain behind the arena');
  assert(!view.includes('data-detail-u='),'No duplicate hidden effect targets');
  assert(!view.includes('data-a="battleDetails"'),'No control to reveal the removed card layer');
  for(const target of ['target:0','ally:0'])assert.equal(view.split('data-v="'+target+'"').length-1,1,target);
  if(finished){assert(view.includes('data-v="done"'));assert(view.includes('ได้ EXP 198 · 73 เหรียญ'));}
  else assert(view.includes('data-v="sk:attack"'));
 }
 r('S.battle.over=null');
 for(const mode of ['pvp','world','camp','guildwar']){
  r("S.battle.allies[0].owner=0;S.battle.enemies[0].owner=1;");
  const html=r(`compactOnlineBattle('${mode}',{battle:S.battle,status:'finished',me:0,players:[],winner:0})`);
  assert(html.includes('online-combat-board battle-scenery'));assert(html.includes('data-battle-scene="'+(mode==='world'?'world':mode==='pvp'?'arena':'fortress')+'"'));
  assert.equal((html.match(/class="online-combat-scroll"/g)||[]).length,['pvp','world'].includes(mode)?1:0,'PVP and world boss use the separate scrollable card area');
  if(mode==='pvp'){assert(html.includes('data-a="pvpTarget"'));assert(html.includes('data-a="pvpFriend"'));assert(html.indexOf('online-combat-scroll')<html.indexOf('online-combat-footer'));}
 }
 for(const key of JSON.parse(r('JSON.stringify(Object.keys(BattleScenery.themes))')))assert(fs.existsSync('assets/ui/battle-frames/'+key+'.svg'));
 console.log('PASS '+file+': seven locations, bosses/throne/tower/PVP/world/camp/guildwar, actual battle cards/target actions and unchanged state');
}

const crypto=require('crypto');const art=JSON.parse(fs.readFileSync('content/battlefield-art-v2.json'));assert.equal(art.assets.length,12);assert.equal(new Set(art.assets.map(a=>a.sha256)).size,12);assert(art.assets.reduce((n,a)=>n+a.bytes,0)<6*1024*1024);for(const a of art.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(a.path)).digest('hex'),a.sha256);assert(a.path.startsWith('assets/ui/battle-scenes/'));assert(a.prompt.length>100);}console.log('PASS new-art provenance: 11 unique close-camera scenes + transparent foliage, exact asset hashes and compact distribution budget');
