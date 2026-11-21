import assert from 'node:assert/strict';
import {createEngine,createWorkbook,createUtilities} from '../supabase/functions/soulbeast-dungeon-party/engine.mjs';
import {simulateSolo} from '../supabase/functions/soulbeast-dungeon-party/solo-combat.mjs';
import {personalState} from '../supabase/functions/soulbeast-dungeon-party/personal-combat.mjs';
import {partyMapAdapter} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-map.mjs';
import {partyEnemyAdapter} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-enemies.mjs';
import {partyRewardAdapter} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-rewards.mjs';
import {dungeonPartyService} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-service.mjs';
import {createFloor} from '../supabase/functions/soulbeast-dungeon-party/source/tools/labyrinth-demo/online-party-rules.mjs';
import {personalParty} from './labyrinth-demo/online-party-personal.mjs';
const clone=x=>JSON.parse(JSON.stringify(x)),engine=createEngine(createWorkbook(),createUtilities(()=>{},()=>{})).partyCombat,map=partyMapAdapter();let id=0;
const member=code=>({code,name:code,hp:100,mp:20,maxHp:500,maxMp:300,exploring:true,position:map.spawnPoint(1),save:{P:{name:code,cls:'swordsman',country:'blue',gender:'female',lv:60,hp:100,mp:20,gold:500,exp:0,pts:{},eq:{weapon:'wp_sword0'},owned:['wp_sword1'],items:{pot:5},party:[1],carried:[1],pets:[{uid:1,sp:'mandrake',lv:4,hp:0,mp:0,exp:0,pts:{}}],ailments:{poison:2}}}});
const room={id:'local-actions',state:'active',floor:1,startedSize:2,host:'A',members:[member('A'),member('B')],dungeon:createFloor(2),battles:{}};
const combat={...map,...partyEnemyAdapter({engine}),...partyRewardAdapter({engine,map}),inventory:async(_r,m,data)=>{const result=engine.inventory(m.save.P,data.op,data);Object.assign(m,{hp:result.hp,mp:result.mp,maxHp:result.maxHp,maxMp:result.maxMp});return result;},evacuate:async()=>({city:'blue-capital'}),arrive:async r=>{for(const m of r.members)m.position=map.spawnPoint(r.floor);}};
const call=dungeonPartyService({combat,transaction:async(_,fn)=>fn(room),uuid:()=>`instant-${++id}`}),run=(actor,action,data={})=>call(actor,room.id,action,data);
const grants={};for(const code of ['A','B'])grants[code]=(await run(code,'status',{localExploration:true,personalVersion:2,personalActions:3})).personal;
assert.equal(grants.A.actionsVersion,3);assert(grants.A.chests&&grants.A.spring);assert(!JSON.stringify(grants.B).includes(grants.A.id));
const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};let sent=0;const manager=personalParty({roomId:room.id,code:'A',storage,send:r=>{sent++;return run('A','personalFinish',r);}});manager.receive(grants.A);
const read=manager.inventory();assert.equal(sent,0);assert.equal(read.player.hp,100);manager.inventory({op:'use',id:'pot',target:'P'});assert.equal(manager.inventory().player.items.pot,4);assert(manager.state.member.hp>100);assert.equal(sent,0,'Local menu mutation does not wait for requests');
manager.inventory({op:'equip',id:'wp_sword1'});assert.equal(manager.inventory().player.eq.weapon,'wp_sword1');
const chest=Object.entries(grants.A.chests).find(([,c])=>!c.big),[chestId,c]=chest,before=manager.state.player.gold;
const reward=manager.action('chest',{chest:chestId,position:{x:c.x,y:c.y}});assert.equal(manager.state.player.gold,before+reward.gold);const again=manager.action('chest',{chest:chestId,position:{x:c.x,y:c.y}});assert.equal(again.alreadyClaimed,true);assert.equal(manager.state.player.gold,before+reward.gold);
manager.action('heal',{position:grants.A.spring});assert.equal(manager.state.member.hp,manager.state.member.maxHp);assert.equal(manager.state.player.pets[0].hp>0,true);assert.deepEqual(manager.state.player.ailments,{});assert.equal(sent,0);
const cached=manager.inventory();assert.equal(cached.player.gold,manager.state.player.gold);assert.equal(sent,0,'Opening all local views must leave pending results alone');
await manager.flush();assert.deepEqual(room.personal.A.state,manager.state);assert.equal(room.members[0].save.P.items.pot,manager.state.player.items.pot);
// The same map chest belongs to each player independently.
const other=personalParty({roomId:room.id,code:'B',storage:{getItem(){return null;},setItem(){}},send:r=>run('B','personalFinish',r)});other.receive(grants.B);const ownReward=other.action('chest',{chest:chestId,position:{x:c.x,y:c.y}});await other.flush();assert(room.personal.A.state.chests[chestId]);assert(room.personal.B.state.chests[chestId]);assert.equal(room.members[1].save.P.gold,500+ownReward.gold);
// An offline win opens the visual quota immediately; the trusted receipt opens
// the shared door as it commits, without an openDoor interaction.
room.dungeon.rules={...room.dungeon.rules,shadows:1,bandits:0};const start=manager.begin('shadow:0',true),sim=simulateSolo(start),events=[];
while((sim.run.status==='active'||sim.run.presentation)&&events.length<2048){const e=sim.run.loading||sim.run.presentation?[0]:[1];await sim.apply(e);events.push(e);}assert.equal(sim.run.result,'win');await sim.reward();manager.complete({start,sim,events});assert.equal(manager.counts(room.dungeon).shadow,1);assert.equal(room.dungeon.doorOpen,false);await manager.flush();assert.equal(room.dungeon.doorOpen,true);assert.deepEqual(room.personal.A.state,manager.state);
// Boss loot and healing become usable locally once the shared battle settles.
room.dungeon.boss='defeated';for(const p of Object.values(room.personal))p.suspended=true;
const afterBoss=(await run('A','status',{personalVersion:2,personalActions:3})).personal;manager.receive(afterBoss);assert.equal(afterBoss.bossDefeated,true);assert.equal(manager.begin('shadow:2'),null,'No new solo encounter can race the shared floor transition');const grand=Object.entries(afterBoss.chests).find(([,c])=>c.big);manager.action('chest',{chest:grand[0],position:grand[1]});await manager.flush();assert(room.members[0].save.P.labyrinthBossChests[grand[0]]);
// Everyone drains their journal before advancing the team floor.
for(const m of room.members)m.position=map.map(1).stairs;await run('A','nextFloor');const gather=room.personalGather.id;await run('A','personalBossReady',{gather,grant:room.personal.A.id,afterSeq:room.personal.A.seq});assert.equal(room.floor,1);await run('B','personalBossReady',{gather,grant:room.personal.B.id,afterSeq:room.personal.B.seq});assert.equal(room.floor,2);
manager.close();other.close();console.log('PASS instant cached inventory/use/equip, personal chest races, heal, chained combat, automatic door, boss loot and floor barrier');
