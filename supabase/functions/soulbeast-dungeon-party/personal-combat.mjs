// Shared, deterministic personal encounters. No network or account persistence.
import {createEngine,createWorkbook,createUtilities} from './engine.mjs';
import {simulateSolo} from './solo-combat.mjs';
import './source/tools/town-walk-demo/game-clock.js';
import './source/tools/labyrinth-demo/traps.js';

export const PERSONAL_VERSION=2,PERSONAL_EVENT_LIMIT=2048;
const keys=['name','cls','gender','country','lv','exp','gold','pts','free','eq','owned','items','parts','pets','carried','party','ailments','hp','mp','uid','caught','score','worldPower','cleared','gachaLegendPets'];
const vitalKeys=['hp','mp','maxHp','maxMp','ailments','exploring','level'];
const copy=x=>JSON.parse(JSON.stringify(x));
const pick=(x,fields)=>Object.fromEntries(fields.filter(k=>x[k]!==undefined).map(k=>[k,copy(x[k])]));
export function personalState(player,member,traps={}){return {player:{...pick(player,keys),pets:(player.pets||[]).map(p=>pick(p,['uid','sp','lv','form','pts','name','nick','sig','signature','exp','free','hp','mp','ailments']))},member:pick(member,vitalKeys),traps:copy(traps)};}
export function applyPersonalState(member,state){
 Object.assign(member,copy(state.member));
 const before=new Map((member.save.P.pets||[]).map(p=>[p.uid,p]));
 Object.assign(member.save.P,copy(state.player));
 member.save.P.pets=(state.player.pets||[]).map(p=>({...before.get(p.uid),...copy(p)}));
}
function seeded(id){let seed=2166136261;for(const c of id)seed=Math.imul(seed^c.charCodeAt(0),16777619);return ()=>{let t=seed=(seed+0x6d2b79f5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function engineFor(id){const unavailable=()=>{throw Error('unsupported_personal_operation');};return createEngine(createWorkbook(),createUtilities(unavailable,unavailable),seeded(id)).partyCombat;}
export function createPersonalStart(grant,state,enemyId,sequence,auto=false){
 const enemy=grant.enemies[enemyId];if(!enemy||state.member.hp<=0)throw Error('personal_enemy_unavailable');
 const id=grant.id+'-'+sequence,engine=engineFor(id),player=copy(state.player);
 Object.assign(player,{hp:state.member.hp,mp:state.member.mp,ailments:copy(state.member.ailments||{})});
 const built=engine.team(player,grant.code,0);
 const enemies=enemy.plan.units.map((spec,i)=>{
  if(spec.type==='human'){const u=engine.human(spec.cls,spec.lv,'e'+i);u.gender=spec.gender;return u;}
  const u=engine.beast(spec.sp,spec.lv,'e'+i);
  if(enemy.kind==='shadow'){for(const k of ['patk','matk'])u.st[k]=Math.round(u.st[k]*1.25);for(const k of ['hp','pdef','mdef'])u.st[k]=Math.round(u.st[k]*1.5);u.hp=u.st.hp;u.dungeonShadow=true;}
  if(spec.type==='pet'){u.kind='npcpet';u.name+='ของโจร';}
  return spec.nightAura?globalThis.SoulBeastClock.applyNightAura(u):u;
 });
 const time=grant.issuedAt+sequence;
 return {personalVersion:PERSONAL_VERSION,run:{id,kind:'solo',enemyId,participants:[grant.code],status:'active',wallets:{[grant.code]:built.gold},nextTurnAt:time+350,startedAt:time,loading:{pending:[grant.code],deadline:time+90000},battle:{kind:'dungeonParty',allies:built.team,enemies,round:0,turns:0,queue:[],cur:null,log:[],fx:[],effects:[]}},code:grant.code,kind:enemy.kind,auto:!!auto,member:{...copy(state.member),exploring:false},player};
}
export async function replayPersonal(grant,state,receipt){
 if(!Array.isArray(receipt.events)||!receipt.events.length||receipt.events.length>PERSONAL_EVENT_LIMIT)throw Error('invalid_personal_result');
 const start=createPersonalStart(grant,state,receipt.enemy,receipt.seq,receipt.auto);
 const sim=simulateSolo(start);for(const event of receipt.events)await sim.apply(event);
 if(sim.run.status!=='finished'||sim.run.presentation||sim.run.result!==receipt.result)throw Error('invalid_personal_result');
 await sim.reward();
 return {start,run:sim.run,state:personalState(sim.member.save.P,sim.member,state.traps),auto:sim.auto};
}
export function personalTrap(grant,state,receipt){
 const trap=grant.traps.find(t=>t.id===receipt.trap),distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*.64);
 if(!trap||state.traps[trap.id]||![receipt.arm?.x,receipt.arm?.y,receipt.position?.x,receipt.position?.y].every(Number.isFinite)||distance(receipt.arm,trap)>48||distance(receipt.arm,receipt.position)>520)throw Error('invalid_personal_trap');
 const next=copy(state),hit=distance(receipt.position,trap)<=globalThis.DungeonTraps.RADIUS;
 let damage=0;if(hit){damage=globalThis.DungeonTraps.apply(trap.type,next.player,next.member.maxHp);Object.assign(next.member,{hp:next.player.hp,mp:next.player.mp,ailments:copy(next.player.ailments||{}),exploring:next.player.hp>0});}
 next.traps[trap.id]=true;return {state:next,hit,damage,type:trap.type};
}
