import {dungeonPartyStore} from './dungeon-party-store.mjs';
import {dungeonPartyHttp} from './dungeon-party-http.mjs';
import {partySaveRepository} from './dungeon-party-saves.mjs';
import {partyMapAdapter} from './dungeon-party-map.mjs';
import {partyEnemyAdapter} from './dungeon-party-enemies.mjs';
import {partyCombatRuntime} from './dungeon-party-combat-runtime.mjs';
import {partyRespawnAdapter} from './dungeon-party-respawn.mjs';
import {partyRewardAdapter} from './dungeon-party-rewards.mjs';
import {broadcastPartyState} from './dungeon-party-broadcast.mjs';

// One engine instance per transaction: never share mutable lexical battle state
// across concurrent requests. Authentication and the database pool are injected
// by the host; no credentials or live/test defaults are embedded in this module.
export function createDungeonPartyApp({pool,createEngine,verifyToken,origins,environment,report,uuid,broadcast=false}){
 const map=partyMapAdapter();
 const command=dungeonPartyStore({pool,uuid,publish:broadcast?broadcastPartyState:undefined,
  initialize:(tx,context)=>partySaveRepository({engine:createEngine(),spawnPoint:map.spawnPoint}).initialize(tx,context),
  persist:(...args)=>partySaveRepository({}).persist(...args),
  buildCombat:async(tx,{serverNow})=>{
   let combatEngine;
   const engine=new Proxy({}, {get(_target,key){
    combatEngine??=createEngine();
    const method=combatEngine[key];
    return typeof method==='function'?method.bind(combatEngine):method;
   }});
   const enemies=partyEnemyAdapter({engine}),rewards=partyRewardAdapter({engine,map});
   return {...map,...enemies,...partyCombatRuntime({engine,soloEnemies:enemies.soloEnemies,now:()=>serverNow,turnMs:350}),...rewards,
    evacuate:partyRespawnAdapter({engine}),
    inventory(room,member,data){const result=engine.inventory(member.save.P,data.op||null,data);
     for(const key of ['hp','mp','maxHp','maxMp','ailments'])member[key]=result[key];return result;},
    heal(room,member){const nav=map.navigation(room),spring=map.map(room.floor).mini;
     if(nav.distance(member.position,spring)>180||!nav.clear(member.position,spring))throw Error('spring_out_of_reach');
     Object.assign(member,engine.heal(member.save.P));return {healed:true};
    }
   };
  }
 });
 return {command,handle:dungeonPartyHttp({verifyToken,command,origins,environment,report})};
}
