import assert from 'node:assert/strict';
import {createEngine,createWorkbook,createUtilities} from '../supabase/functions/soulbeast-dungeon-party/engine.mjs';
import {simulateSolo,soloChoice} from '../supabase/functions/soulbeast-dungeon-party/solo-combat.mjs';
import {createPersonalStart,replayPersonal,personalState,personalTrap} from '../supabase/functions/soulbeast-dungeon-party/personal-combat.mjs';
import {dungeonPartyService} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-service.mjs';
import {partySnapshot} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-snapshot.mjs';
import {partyEnemyAdapter} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-enemies.mjs';
import {partyMapAdapter} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-map.mjs';
import {createFloor} from '../supabase/functions/soulbeast-dungeon-party/source/tools/labyrinth-demo/online-party-rules.mjs';
import {personalParty} from './labyrinth-demo/online-party-personal.mjs';
import {localPartyWorld} from './labyrinth-demo/online-party-local.mjs';
import {partyRunController} from './labyrinth-demo/online-party-controller.mjs';
const clone=x=>JSON.parse(JSON.stringify(x)),engine=createEngine(createWorkbook(),createUtilities(()=>{},()=>{})).partyCombat;
let now=Date.UTC(2026,10,21),id=0;
const member=code=>({code,name:code,hp:99999,mp:9999,maxHp:99999,maxMp:9999,exploring:true,position:{x:0,y:0},save:{P:{name:code,cls:'swordsman',gender:'female',country:'green',lv:60,pts:{},eq:{weapon:'wp_sword0'},gold:500,hp:99999,mp:9999,pets:[{uid:1,sp:'mandrake',lv:4,exp:0,hp:9999,mp:999,pts:{},privateProperty:'SECRET'}],uid:2,party:[1],carried:[1],items:{godSeal:50},ailments:{},cpin:'SECRET',credentials:'SECRET'}}});
const room={id:'qa-personal',host:'A',floor:1,state:'active',startedSize:2,members:[member('A'),member('B')],dungeon:createFloor(2),battles:{}};
const map=partyMapAdapter(),enemies=partyEnemyAdapter({engine,now:()=>now});
const combat={...map,...enemies,inventory:async()=>({}),evacuate:async()=>({city:'green-capital'}),createBoss:async(r,units,id)=>({id,kind:'boss',status:'active',participants:r.members.map(m=>m.code),battle:{allies:[],enemies:units}})};
const service=dungeonPartyService({combat,now:()=>now,uuid:()=>`qa-grant-${++id}`,transaction:async(_,fn)=>fn(room)});
const call=(a,b,c={})=>service(a,room.id,b,c);
const a=await call('A','status',{localExploration:true,personalVersion:2}),b=await call('B','status',{localExploration:true,personalVersion:2});
assert(a.personal&&b.personal);assert.notEqual(a.personal.id,b.personal.id);assert.equal(Object.keys(a.personal.enemies).length,58);assert(!JSON.stringify(a).includes('SECRET'));
assert(!partySnapshot(room,'A',now).personal);assert(!JSON.stringify(partySnapshot(room,'B',now)).includes(a.personal.id));
async function fight(start,capture=false){const sim=simulateSolo(start),events=[];for(let i=0;i<2048&&(sim.run.status==='active'||sim.run.presentation);i++){
 let e;if(sim.run.loading||sim.run.presentation)e=[0];else if(capture&&sim.run.waiting?.actor==='p0'&&sim.run.waiting.seals?.some(s=>s.id==='godSeal'))e=soloChoice({seal:'godSeal',target:sim.run.battle.enemies.find(u=>u.hp>0).id});else e=[1];await sim.apply(e);events.push(e);
 }assert.equal(sim.run.status,'finished');await sim.reward();return {sim,events};}
const storageMap=new Map(),storage={getItem:k=>storageMap.get(k),setItem:(k,v)=>storageMap.set(k,v)};
let online=false,network=0,snapshots=[];
const manager=personalParty({roomId:room.id,code:'A',storage,send:async receipt=>{network++;if(!online)throw Error('offline');return call('A','personalFinish',receipt);},receive:s=>snapshots.push(s)});
manager.receive(a.personal);const start=manager.begin('shadow:0',true);assert(start,'Collision constructs battle synchronously');assert.equal(network,0,'No claim/status request for collision');
const fa=await fight(start);assert.equal(fa.sim.run.result,'win');manager.complete({start,...fa});assert.equal(manager.pending,1);assert.equal(room.dungeon.kills.shadow,0,'Offline win waits in durable queue');
const sameStart=createPersonalStart(b.personal,b.personal.state,'shadow:0',1,true),fb=await fight(sameStart);
const rb={grant:b.personal.id,floor:1,seq:1,kind:'battle',enemy:'shadow:0',events:fb.events,result:fb.sim.run.result,auto:true};
await assert.rejects(call('A','personalFinish',rb),/personal_wrong_floor/);
await call('B','personalFinish',rb);assert.equal(room.dungeon.kills.shadow,1);assert.equal(room.dungeon.enemies['shadow:0'].state,'roaming','Global same ID is never marked dead by private win');
const goldBefore=room.members[0].save.P.gold;online=true;await manager.flush();assert.equal(manager.pending,0);assert.equal(room.dungeon.kills.shadow,2,'Both players can fight the same local ID');assert(room.members[0].save.P.gold>goldBefore);assert.deepEqual(personalState(room.members[0].save.P,room.members[0]),manager.state);
const receipt=clone(JSON.parse(storageMap.values().next().value));const again={grant:a.personal.id,floor:1,seq:1,kind:'battle',enemy:'shadow:0',events:fa.events,result:fa.sim.run.result,auto:true};
const gold=room.members[0].save.P.gold;await call('A','personalFinish',again);assert.equal(room.members[0].save.P.gold,gold);assert.equal(room.dungeon.kills.shadow,2);await assert.rejects(call('A','personalFinish',{...again,result:'lose'}),/personal_receipt_mismatch/);
await assert.rejects(call('A','personalFinish',{...again,seq:3}),/personal_sequence/);
const malicious={...again,seq:2,enemy:'shadow:1',events:[[0]],result:'win'};await assert.rejects(call('A','personalFinish',malicious),/invalid_personal_result/);
// Capturing, chained battle state, deterministic rewards and private pet metadata.
const second=manager.begin('shadow:1',false),fc=await fight(second,true);manager.complete({start:second,...fc});await manager.flush();assert(room.members[0].save.P.pets.length>1);assert.equal(room.members[0].save.P.pets[0].privateProperty,'SECRET');assert.deepEqual(personalState(room.members[0].save.P,room.members[0]),manager.state);
const trap=manager.grant.traps[0],effect={...trap,armPosition:{x:trap.x,y:trap.y},hitPosition:{x:trap.x,y:trap.y}};manager.trap(effect);await manager.flush();assert.equal(manager.state.traps[trap.id],true);
// Reload while another receipt is pending; replay worker commits once.
online=false;const third=manager.begin('bandit:0',true),fd=await fight(third);manager.complete({start:third,...fd});manager.close();const reload=personalParty({roomId:room.id,code:'A',storage,send:r=>call('A','personalFinish',r)});assert.equal(reload.pending,1);await reload.flush();assert.equal(room.dungeon.kills.bandit,1);
// Retirement never touches active, visible or nearby actors, and ignores server ID deaths.
const local=localPartyWorld();local.setPersonal(reload);local.receive(room.dungeon,'A',0,now);const target=[...local.enemies.values()].find(e=>e.kind==='shadow');target.position={x:0,y:0};const far=[...local.enemies.values()].find(e=>e.kind==='shadow'&&e!==target);far.position={x:5000,y:5000};room.dungeon.kills.shadow=30;room.dungeon.contributions.A.shadow=29;const distance=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);local.reconcile(room.dungeon,'A',{x:0,y:0},{distance},{x:0,y:0,width:40000,height:40000,flatten:.64});assert(local.enemies.has(far.id),'Visible on large viewport must stay');local.reconcile(room.dungeon,'A',{x:0,y:0},{distance},{x:0,y:0,width:400,height:800,flatten:.64});assert(local.enemies.has(target.id),'Near/contact NPC stays');assert.equal(Object.keys(reload.retired).length,1);room.dungeon.enemies[target.id].state='dead';local.receive(room.dungeon,'A',0,now);assert(local.enemies.has(target.id),'Shared same ID death does not remove my actor');
// Read-only recovery uses no walking pulse and never takes the collision lane.
const calls=[];const controller=partyRunController({connection:{code:'A',run:async(_,action)=>{calls.push(action);return partySnapshot(room,'A',now);}},roomId:room.id,scene:{receiveState(){},close(){}},openMotion:async()=>({send(){},close(){}}),localExploration:true,personalExploration:true,onError:e=>{throw e;}});await controller.refresh();assert.equal(controller.pollDelay,60000);await controller.pulse();assert.deepEqual(calls,['status','status']);await controller.close();
// Boss readiness waits for both local queues; no early interruption.
room.dungeon.kills={shadow:100,bandit:100};room.dungeon.doorOpen=true;const boss=map.map(1).boss;for(const m of room.members)m.position={...boss};await call('A','bossContact',{enemyPosition:boss});assert.equal(room.dungeon.boss,'guarding');const gather=room.personalGather.id;await call('A','personalBossReady',{gather,grant:room.personal.A.id,afterSeq:room.personal.A.seq});assert.equal(room.dungeon.boss,'guarding');await call('B','personalBossReady',{gather,grant:room.personal.B.id,afterSeq:room.personal.B.seq});assert.equal(room.dungeon.boss,'fighting');
reload.close();console.log('PASS personal protocol, offline queues, rewards, collision independence and boss barrier');
