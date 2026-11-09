import assert from 'node:assert/strict';
import {createEngine,createWorkbook,createUtilities} from '../supabase/functions/soulbeast-dungeon-party/engine.mjs';
import {simulateSolo,soloChoice} from '../supabase/functions/soulbeast-dungeon-party/solo-combat.mjs';
import {partyCombatRuntime} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-combat-runtime.mjs';
import {dungeonPartyService} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-service.mjs';
import {partySnapshot} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-snapshot.mjs';
import {createFloor} from '../supabase/functions/soulbeast-dungeon-party/source/tools/labyrinth-demo/online-party-rules.mjs';
import {partyRunController} from './labyrinth-demo/online-party-controller.mjs';
import {resolveLocalTrap} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-local.mjs';
import {partyMapAdapter} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-map.mjs';
import {localPartyWorld} from './labyrinth-demo/online-party-local.mjs';

const engine=createEngine(createWorkbook(),createUtilities(()=>{},()=>{})).partyCombat;
const member=code=>({code,name:code,hp:300,mp:70,exploring:true,save:{P:{
 name:code,cls:'swordsman',lv:40,pts:{},eq:{weapon:'wp_sword0'},gold:500,hp:300,mp:70,
 pets:[{uid:1,sp:'mandrake',lv:4,hp:50,mp:20,pts:{},privateProperty:'keep'}],
 uid:2,party:[1],carried:[1],items:{godSeal:2},ailments:{},credentials:'NEVER_SERIALIZE',
}}});
const floor=createFloor(2);
floor.banditRoster8=true;
let now=100000, id=0, payouts=0;
const room={id:'room',floor:1,state:'active',startedSize:2,members:[member('A'),member('B')],dungeon:floor};
const enemies=()=>[engine.beast('mandrake',1,'foe')];
const combat={...partyCombatRuntime({engine,soloEnemies:enemies,now:()=>now,turnMs:350}),
 contact:()=>true,trapPlacements:async()=>[],enemyPlacements:async()=>({}),navigation:()=>({}),
 settle:async()=>{payouts++;},bossTeam:async()=>enemies(),evacuate:async()=>({city:'green-capital'})};
const command=dungeonPartyService({transaction:async(_id,f)=>f(room),combat,now:()=>now,uuid:()=>String(++id)});
const call=(actor,action,data)=>command(actor,'room',action,data);

const claim=await call('A','claim',{enemy:'shadow:0',localCombatVersion:1,requestId:'claimA'});
assert.equal(claim.snapshot.battle.id,claim.battle);
assert.equal(claim.snapshot.battle.localCombatVersion,1);
assert.equal(claim.snapshot.soloStart.code,'A');
assert(!JSON.stringify(claim.snapshot).includes('NEVER_SERIALIZE'));
assert(!JSON.stringify(claim.snapshot).includes('privateProperty'));
assert(!partySnapshot(room,'A',now).soloStart,'broadcast omits the solo seed state');
assert(!partySnapshot(room,'B',now,true).soloStart,'teammates cannot receive its seed state');
assert.equal((await call('A','status')).soloStart.run.id,claim.battle);
assert.equal((await call('A','status',{soloStart:false})).soloStart,undefined);
assert.equal((await call('A','claim',{enemy:'shadow:0',localCombatVersion:1,requestId:'claimA'})).snapshot.battle.id,claim.battle);
await assert.rejects(call('B','claim',{enemy:'shadow:0',localCombatVersion:1}),/enemy_unavailable/);
await assert.rejects(call('A','tick',{battle:claim.battle}),/battle_not_member/);

const requests=[];
const wire={run:async(_id,action,data)=>{
 requests.push(action);
 if(action==='status')return {...claim.snapshot,battle:null,soloStart:undefined};
 if(action==='claim')return claim;
 if(action==='soloFinish')return call('A',action,data);
 assert.fail('Local combat called '+action);
},code:'A'};
const controller=partyRunController({connection:wire,roomId:'room',scene:{receiveState(){},close(){}},openMotion:async()=>({close(){}}),localExploration:true,onError:assert.fail});
await controller.refresh();
assert.equal(await controller.command('claim',{enemy:'shadow:0'}),true);
assert.deepEqual(requests,['status','claim'],'no second request for encounter state');
assert.equal(controller.pollDelay,5000);
const sim=simulateSolo(JSON.parse(JSON.stringify(claim.snapshot.soloStart))),events=[];
const step=async event=>{await sim.apply(event);events.push(event);};
await step([0]);
for(let i=0;i<40&&(sim.run.status==='active'||sim.run.presentation);i++){
 if(sim.run.presentation)await step([0]);
 else if(sim.run.waiting?.actor==='p0'&&sim.run.waiting.seals.some(s=>s.id==='godSeal'))await step(soloChoice({seal:'godSeal',target:'foe'}));
 else if(sim.run.waiting){const t=sim.run.waiting;await step(soloChoice({skill:'attack',target:t.choices.find(x=>x.id==='attack').targets[0]}));}
 else await step([1]);
}
assert.equal(sim.run.result,'win');
assert(!sim.run.presentation);
assert.equal(sim.member.save.P.items.godSeal,1);
assert.equal(sim.member.save.P.pets.length,2);
assert.equal(room.members[0].save.P.items.godSeal,2,'local steps have not touched the authoritative save');
assert.deepEqual(requests,['status','claim']);
const result={battle:claim.battle,events,result:sim.run.result,hp:sim.member.hp,mp:sim.member.mp};
await assert.rejects(call('B','soloFinish',result),/battle_not_member/);
await assert.rejects(call('A','soloFinish',{...result,hp:result.hp+1}),/invalid_solo_result/);
assert.equal(payouts,0);
assert.equal(await controller.command('soloFinish',result),true);
assert.deepEqual(requests,['status','claim','soloFinish']);
assert.equal(payouts,1);
assert.equal(floor.kills.shadow,1);
assert.equal(room.members[0].save.P.items.godSeal,1);
assert.equal(room.members[0].save.P.pets[0].privateProperty,'keep');
assert.equal((await call('A','soloFinish',result)).snapshot.battle.status,'finished');
assert.equal(payouts,1,'retry cannot pay twice');
room.battles['zz-old-uuid']={...room.battles[claim.battle],id:'zz-old-uuid',finishedAt:now-1000};
assert.equal(partySnapshot(room,'A',now).battle.id,claim.battle,'a one-hit victory stays selected even if an older UUID sorts last');
delete room.members[0].lastBattleId;
assert.equal(partySnapshot(room,'A',now).battle.id,claim.battle,'a room created before this patch still gets its latest result');
delete room.battles['zz-old-uuid'];

const second=await call('A','claim',{enemy:'bandit:0',localCombatVersion:1});
floor.kills={shadow:floor.rules.shadows,bandit:floor.rules.bandits};floor.doorOpen=true;
const boss=await call('B','bossContact',{});
assert.equal(boss.snapshot.battle.id,boss.battle);
assert.deepEqual(boss.snapshot.battle.participants,['A','B']);
assert(!boss.snapshot.battle.localCombatVersion);
assert.deepEqual(boss.interrupted,[second.battle]);
assert.equal(floor.enemies['bandit:0'].state,'roaming');
await assert.rejects(call('A','soloFinish',{...result,battle:second.battle}),/battle_not_member/);
await call('B','battleReady',{battle:boss.battle});
assert.deepEqual(room.battles[boss.battle].loading.pending,['A']);
await call('A','battleReady',{battle:boss.battle});
const wait=room.battles[boss.battle].nextTurnAt-now;
assert.equal(wait,350);
now+=wait;
await call('B','tick',{battle:boss.battle});
assert(room.battles[boss.battle].waiting||room.battles[boss.battle].battle.turns>0);
const map=partyMapAdapter(),nav=map.navigation({floor:1}),flat=map.map(1).flatten;
const radius=globalThis.DungeonTraps.RADIUS;
const trap={id:'mine-trap',x:0,y:0,type:'blast',eligible:['A'],resolved:[],state:'armed',explodeAt:2000};
const visual=localPartyWorld();
visual.receive({traps:[trap]},'A',400,1300);
const outside={x:0,y:(radius+1)/flat};
visual.update(.01,outside,nav,{},outside,1099);
assert(!visual.request(),'the visual has not reached the explosion time');
visual.update(.01,outside,nav,{},outside,1100);
assert.deepEqual(visual.request(),{action:'trapResolve',trap:trap.id,position:outside});
for(const [position,hit] of [[outside,false],[{x:radius+1,y:0},false],[{x:0,y:(radius-1)/flat},true],[{x:radius-1,y:0},true]]){
 const m={code:'A',position,hp:100,maxHp:100,exploring:true};
 assert.equal(resolveLocalTrap({dungeon:{traps:[structuredClone(trap)]}},m,trap.id,2000,nav).hit,hit);
}
console.log('PASS party latency: one response to contact, deterministic local capture and single settlement, duplicate/forged result rejection, and shared boss turns at '+wait+' ms after readiness.');
