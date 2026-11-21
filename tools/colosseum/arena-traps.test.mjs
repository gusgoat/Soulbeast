import {trapTypes,createArenaTraps,explosionFrame,applyTrap} from './arena-traps.mjs';
const eq=(a,b)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);};
Deno.test('arena exposes only blast while shared dungeon trap kinds stay intact',()=>{
 eq(Object.keys(trapTypes),['blast']);eq(Object.keys(globalThis.DungeonTraps.types),['blast','poison','fire','electric','ice']);
 const actor={hp:200,ailments:{}};eq(applyTrap('blast',actor,200),20);eq(actor.hp,180);eq(actor.ailments,{});
});
Deno.test('explosion animation follows the shared burst clock and ends after 800ms',()=>{
 eq(explosionFrame({burstUntil:0},1000),-1);const trap={burstUntil:1800};
 for(const [time,frame]of [[1000,0],[1200,4],[1400,8],[1799,15],[1800,-1],[2000,-1]])eq(explosionFrame(trap,time),frame);
});
Deno.test('authoritative arena traps need no browser image API',()=>{const arena=createArenaTraps();eq(arena.controller.list,[]);eq(arena.explosion,null);});
