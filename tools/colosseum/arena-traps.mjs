import '../labyrinth-demo/traps.js';
import {distance} from './arena.mjs';

const rules=globalThis.DungeonTraps;
// Arena-only restriction; the shared dungeon and island types stay intact.
export const trapTypes=Object.freeze({blast:rules.types.blast});
export const applyTrap=rules.apply;

const EXPLOSION_URL='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/colosseum/explosion-atlas-v1-65c887be6153efb6.webp';
const BURST_MS=800,FRAME_COUNT=16,ATLAS_COLUMNS=4;
let explosionImage;
function loadExplosion(){
 if(typeof Image==='undefined')return null;
 if(!explosionImage){explosionImage=new Image();explosionImage.crossOrigin='anonymous';explosionImage.decoding='async';explosionImage.src=EXPLOSION_URL;}
 return explosionImage;
}
export function explosionFrame(trap,now){
 if(!trap.burstUntil||now>=trap.burstUntil)return -1;
 return Math.min(FRAME_COUNT-1,Math.floor(Math.max(0,1-(trap.burstUntil-now)/BURST_MS)*FRAME_COUNT));
}

export function createArenaTraps(){
 const state={revealed:{}};
 const controller=rules.create({cells:[]},{distance},state);
 return {controller,state,explosion:loadExplosion()};
}

export function drawArenaTraps(renderer,ctx,traps,now,flatten){
 renderer.controller.list.splice(0,Infinity,...traps);
 renderer.state.revealed=Object.fromEntries(traps.map(trap=>[trap.id,{
  remaining:Math.max(0,(trap.endsAt-now)/1000),
  burst:Math.max(0,(trap.burstUntil-now)/1000)||0,
  done:Boolean(trap.burstUntil),
 }]));
 renderer.controller.draw(ctx,p=>({x:p.x,y:p.y*flatten}),1);
 const image=renderer.explosion;
 if(!image?.complete||!image.naturalWidth)return;
 const cellWidth=image.naturalWidth/ATLAS_COLUMNS,cellHeight=image.naturalHeight/ATLAS_COLUMNS;
 for(const trap of traps){
  const frame=explosionFrame(trap,now);if(trap.type!=='blast'||frame<0)continue;
  const width=rules.RADIUS*2.6,height=width*.82;
  ctx.save();ctx.globalAlpha*=Math.min(1,(trap.burstUntil-now)/180);
  ctx.drawImage(image,(frame%ATLAS_COLUMNS)*cellWidth,Math.floor(frame/ATLAS_COLUMNS)*cellHeight,cellWidth,cellHeight,trap.x-width/2,trap.y*flatten-height*.58,width,height);
  ctx.restore();
 }
}
