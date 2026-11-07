import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash,randomUUID} from 'node:crypto';
import {createEngine,createWorkbook,createUtilities} from '../supabase/functions/soulbeast-dungeon-party/engine.mjs';
import {partyCombatRuntime} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-combat-runtime.mjs';
import {partyBattleSnapshot} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-snapshot.mjs';
import {evacuateDeadMembers} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-death.mjs';

const engine=createEngine(createWorkbook({}),createUtilities(s=>createHash('sha256').update(s).digest(),randomUUID)).partyCombat;
const member=code=>({code,name:code,cls:'swordsman',hp:100,mp:50,save:{P:{
 name:code,cls:'swordsman',lv:25,pts:{},eq:{weapon:'wp_sword0'},gold:100,
 pets:[{uid:1,sp:'mandrake',lv:10,hp:50,mp:20,pts:{}},{uid:2,sp:'mandrake',lv:10,hp:50,mp:20,pts:{}}],
 party:[1],carried:[1,2],items:{antidote:2,seal1:2},ailments:{},
}}});
let now=1000;
const enemies=()=>[engine.beast('mandrake',25,'foe1'),engine.beast('mandrake',25,'foe2')];
const combat=partyCombatRuntime({engine,soloEnemies:enemies,now:()=>now});
const room={members:[member('A'),member('B')],dungeon:{enemies:{shadow:{kind:'shadow'}}}};
const run=await combat.createBoss(room,enemies(),'boss');
for(const code of ['A','B'])await combat.ready(room,run,code,{presentationVersion:2});
run.battle.queue=['p0','p1'];
const ally=run.battle.allies.find(u=>u.ownerCode==='B'&&u.kind==='player');
ally.status={poison:3};
now+=600;
await combat.advance(room,run);
assert.equal(run.waiting.ownerCode,'A');
assert.equal(run.waiting.canEscape,false);
assert.deepEqual(run.waiting.captureTargets,[]);
assert.deepEqual(run.waiting.choices.find(c=>c.id==='attack').targets,['foe1','foe2']);
const initial=partyBattleSnapshot(run);
const command=(code,data)=>combat.choose(room,run,code,{actor:run.waiting.actor,turn:run.waiting.turn,presentationVersion:2,...data});
await assert.rejects(command('B',{item:'antidote',friend:ally.id}),/not_your_turn/);
await assert.rejects(command('A',{turn:999,item:'antidote',friend:ally.id}),/stale_turn/);
await assert.rejects(command('A',{escape:true}),/invalid_escape/);
await assert.rejects(command('A',{seal:'seal1',target:'foe1'}),/invalid_capture/);
assert.equal(room.members[0].save.P.items.antidote,2);

const menu=readFileSync(new URL('./town-walk-demo/menu.html',import.meta.url),'utf8');
const section=(start,end)=>menu.slice(menu.indexOf(start),menu.indexOf(end,menu.indexOf(start)));
const ui=section('function battleMainCommands(', 'function vBattle(')+
 section('const MotionTimeline={','const timelineSkill=')+
 section("if(params.has('partyBattle')", "if(params.has('partyInventory')");

function client(code,kingdom=false){
 let html='',effects=[],clock=now;
 const messages=[],listeners={},timers=[];
 const panel={get innerHTML(){return html},set innerHTML(value){html=value},insertAdjacentHTML(_,value){html+=value;},
  replaceChildren(){html='';},append(...nodes){html+=nodes.map(n=>n.textContent).join(' ');}};
 const cards=['target:0','target:1','ally:0','ally:1','ally:2','ally:3'].map(v=>({dataset:{a:'bt',v}}));
 const main={querySelector:s=>s==='#battleCommandBody .panel'?panel:null,querySelectorAll:()=>cards,append(){}};
 const app={querySelector:()=>main,contains:()=>true};
 const context={
  params:new URLSearchParams(kingdom?'partyBattle=1&kingdomBoss=1':'partyBattle=1'),parent:{postMessage:m=>messages.push(m)},window:{},
  location:{origin:'http://localhost'},dungeonFloor:null,BattleScenery:{resolve:()=>({})},
  S:{P:{},ui:{}},SP:{mandrake:{t:['grass']}},SK:{attack:{n:'โจมตี',t:'p'},rest:{n:'พัก',t:'rest'}},
  CON:{antidote:{d:'รักษาพิษ'},seal1:{d:'ผนึก'}},VQ:[],structuredClone,
  document:{getElementById:()=>app,addEventListener:(k,f)=>listeners[k]=f,createElement:()=>({dataset:{},append(){}})},
  addEventListener:(k,f)=>listeners[k]=f,
  setTimeout:(f,ms)=>timers.push({f,time:clock+ms}),requestAnimationFrame:()=>{},
  BattleReady:{ready:()=>true,wait:()=>Promise.resolve()},
  BattleCommandFocus:{scroll(){}},BattleSkillTarget:{side:sk=>sk?.t==='p'?'enemy':''},
  Date:{now:()=>clock},handlers:{},skillElementIcon:()=>'',itemIcon:()=>'',portrait:()=>'',esc:String,fmt:String,
  battleMedicineUseful:(it,u)=>it?.cure?.some(k=>u?.status[k]),skTag:()=>'',attackMultiplier:()=>1,multTxt:()=>'',save(){},
  BattleEffects:{
   battle:()=>context.S.battle,actor:id=>[...context.S.battle.allies,...context.S.battle.enemies].find(u=>u.id===id),
   anchor:()=>null,enrich:(fx,actor,skill)=>fx.map(e=>({...e,source:e.source||actor,skill:e.skill||skill})),
  },
 };
 context.B=()=>context.S.battle;
 context.curTarget=()=>context.B().enemies[context.B().target];
 context.curAlly=()=>context.B().allies[context.B().atarget];
 context.render=()=>{effects.push(...context.VQ.splice(0));};
 vm.createContext(context);
 vm.runInContext(ui+'\nthis.timeline=MotionTimeline;',context);
 function message(data){listeners.message({source:context.parent,origin:context.location.origin,data});}
 return {
  get html(){return html},get effects(){return effects},get battle(){return context.S.battle},
  messages,cards,timeline:context.timeline,
  snapshot(snapshot){clock=now;message({type:'party-battle-state',run:snapshot,code,clockOffset:0});},
  click(v,a='bt'){const button=cards.find(c=>c.dataset.v===v)||{dataset:{a,v}};listeners.click({target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){}});},
  tick(ms){const end=clock+ms;while(timers.some(t=>t.time<=end)){timers.sort((a,b)=>a.time-b.time);const t=timers.shift();clock=t.time;t.f();}clock=end;},
 };
}
const a=client('A'),b=client('B');
const kingdom=client('A',true);
kingdom.snapshot({...initial,waiting:null});
assert(kingdom.html.includes('บอสอาณาจักร · ต่อสู้อัตโนมัติ'));
assert(!kingdom.html.includes('data-v="menu:skill"'));
kingdom.click('', 'kingdomWithdraw');
assert(kingdom.messages.some(m=>m.type==='kingdom-boss-withdraw'));
a.snapshot(initial);b.snapshot(initial);
for(const v of ['menu:skill','menu:item','menu:seal','menu:swap','flee'])assert(a.html.includes('data-v="'+v+'"'));
assert(!b.html.includes('data-v="menu:item"'));
a.click('sk:attack');
assert(a.html.includes('แตะการ์ดศัตรูเพื่อใช้สกิล'));
assert.equal(a.cards.find(c=>c.dataset.v==='ally:0').disabled,true);
assert(!a.messages.some(m=>m.type==='party-battle-command'));
a.click('', 'battleTargetCancel');
a.click('menu:item');a.click('item:antidote');
assert.equal(a.cards.find(c=>c.dataset.v==='ally:2').dataset.skillTarget,'valid');
a.click('ally:2');a.click('ally:2');
const sent=a.messages.filter(m=>m.type==='party-battle-command');
assert.equal(sent.length,1);
assert.equal(sent[0].friend,ally.id);
await combat.choose(room,run,'A',sent[0]);
assert.equal(room.members[0].save.P.items.antidote,1);
assert.deepEqual(ally.status,{});
assert.equal(run.effectSkill,'item:antidote');
const item=partyBattleSnapshot(run);
for(const c of [a,b]){
 c.snapshot(item);c.snapshot(item);
 assert.equal(c.effects.length,1);
 assert.equal(c.timeline.held.get(ally.id).conditions.status.poison,3);
 c.timeline.arrive(ally.id);
 assert.deepEqual(c.battle.allies.find(u=>u.id===ally.id).status,{});
 c.tick(100);
}
assert.deepEqual(a.effects,b.effects);
const firstAck=a.messages.find(m=>m.type==='party-battle-presented');
assert.equal(firstAck.sequence,run.effectSequence);
await combat.ready(room,run,'A',firstAck);
now+=600;
await combat.advance(room,run);
assert(!run.waiting,'wait for second viewer');
await combat.ready(room,run,'B',b.messages.find(m=>m.type==='party-battle-presented'));
await combat.advance(room,run);
assert.equal(run.waiting.ownerCode,'B');

// Summon twice within the same owner turn; each effect has its own sequence.
const turn=run.waiting.turn;
const firstSequence=run.effectSequence;
await command('B',{swap:2});
assert.equal(run.waiting.turn,turn);
assert.equal(run.effectSkill,'summon:party');
assert(run.effectSequence>firstSequence);
const summon=partyBattleSnapshot(run);
for(const c of [a,b]){c.snapshot(summon);c.snapshot(summon);assert.equal(c.effects.length,2);}
assert.deepEqual(a.effects,b.effects);
await assert.rejects(command('B',{swap:1}),/battle_presenting/);
await combat.ready(room,run,'A',{turn,sequence:firstSequence});
assert(run.presentation.pending.includes('A'));
for(const code of ['A','B'])await combat.ready(room,run,code,{turn,sequence:run.effectSequence});
await combat.advance(room,run);
await command('B',{swap:1});
assert.equal(run.waiting.turn,turn);
assert(run.effectSequence>summon.effectSequence);
for(const code of ['A','B'])await combat.ready(room,run,code,{turn,sequence:run.effectSequence});
const ready=partyBattleSnapshot(run);
b.snapshot(ready);
b.click('sk:attack');
b.click('target:1');
const shot=b.messages.find(m=>m.type==='party-battle-command');
assert.equal(shot.target,'foe2');
const priorHp=run.battle.enemies[1].hp;
const rng=Math.random;
try{
 Math.random=()=>0;
 await combat.choose(room,run,'B',shot);
}finally{Math.random=rng;}
assert(run.battle.enemies[1].hp<priorHp);
assert.equal(run.effectActor,'p1');
assert.equal(run.effectSkill,'attack');
const shotResult=partyBattleSnapshot(run);
for(const c of [a,b]){
 c.snapshot(shotResult);c.snapshot(shotResult);
 assert.equal(c.timeline.held.get('foe2').hp,priorHp);
 const effect=c.effects.at(-1);
 assert.equal(effect.id,'foe2');
 assert.equal(effect.source,'p1');
 c.timeline.arrive('foe2');
 assert.equal(c.battle.enemies[1].hp,run.battle.enemies[1].hp);
}

// Even a defeated viewer receives the final effect before evacuation.
const lethal=await combat.createBoss(room,enemies(),'lethal');
for(const code of ['A','B'])await combat.ready(room,lethal,code);
lethal.battle.queue=['foe1'];
for(const u of lethal.battle.allies){u.hp=1;u.st.eva=0;}
lethal.battle.enemies[0].st.patk=10000;
lethal.battle.enemies[0].skills=['attack'];
now+=600;
try{
 Math.random=()=>0;
 await combat.advance(room,lethal);
}finally{Math.random=rng;}
const down=room.members.find(m=>m.hp<=0);
assert(down);
assert(lethal.presentation.pending.includes(down.code));
const deathRoom={...room,battles:{lethal}};
assert.deepEqual(await evacuateDeadMembers(deathRoom,()=>{assert.fail('evacuated before presentation');}),[]);
now=lethal.presentation.deadline;
lethal.nextTurnAt=now+600;
await combat.advance(room,lethal);
assert(!lethal.presentation,'disconnected viewers do not block forever');
// Restore isolated fixture members for the shadow encounter below.
for(const m of room.members){m.hp=100;m.save.P.hp=100;}

// Eligible encounters expose the other two solo actions; the server executes them.
const solo=await combat.createSolo(room,room.members[0],room.dungeon.enemies.shadow,'solo');
await combat.ready(room,solo,'A');
solo.battle.queue=['p0'];
now+=600;await combat.advance(room,solo);
assert.equal(solo.waiting.canEscape,true);
assert(solo.waiting.captureTargets.includes('foe1'));
await combat.choose(room,solo,'A',{actor:solo.waiting.actor,turn:solo.waiting.turn,swap:2});
assert(!solo.presentation,'an older tab can still summon and continue its turn');
const random=Math.random;
try{
 Math.random=()=>0;
 await combat.choose(room,solo,'A',{actor:solo.waiting.actor,turn:solo.waiting.turn,seal:'seal1',target:'foe1'});
 assert.equal(solo.battle.enemies[0].captured,true);
 assert.equal(room.members[0].save.P.items.seal1,1);
 for(const code of solo.participants)await combat.ready(room,solo,code,{turn:solo.battle.turns,sequence:solo.effectSequence});
 solo.battle.queue=['p0'];
 now+=600;await combat.advance(room,solo);
 await combat.choose(room,solo,'A',{actor:solo.waiting.actor,turn:solo.waiting.turn,escape:true});
 assert.equal(solo.result,'abandoned');
}finally{Math.random=random;}
console.log('PASS party parity: shared menu, target/cancel, cross-player item, impact state, two viewers, repeat-safe summon, capture/escape and owner/turn guards');
