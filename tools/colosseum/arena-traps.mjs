import '../labyrinth-demo/traps.js';
import {distance} from './arena.mjs';

const rules=globalThis.DungeonTraps;
export const trapTypes=rules.types;
export const applyTrap=rules.apply;

export function createArenaTraps(){
 const state={revealed:{}};
 const controller=rules.create({cells:[]},{distance},state);
 return {controller,state};
}

export function drawArenaTraps(renderer,ctx,traps,now,flatten){
 renderer.controller.list.splice(0,Infinity,...traps);
 renderer.state.revealed=Object.fromEntries(traps.map(trap=>[trap.id,{
  remaining:Math.max(0,(trap.endsAt-now)/1000),
  burst:Math.max(0,(trap.burstUntil-now)/1000)||0,
  done:Boolean(trap.burstUntil),
 }]));
 renderer.controller.draw(ctx,p=>({x:p.x,y:p.y*flatten}),1);
}
