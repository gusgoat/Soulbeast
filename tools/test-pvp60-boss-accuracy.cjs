const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const file of ['runtime/combat.js','server/accounts/engine.ts']){
 const s=fs.readFileSync(file,'utf8');
 function fn(name){const start=s.indexOf('function '+name+'(');assert(start>=0);if(file.startsWith('runtime'))return s.slice(start,s.indexOf('// @soulbeast-end',start));return s.slice(start,s.indexOf('\n',s.indexOf('}',start))+1);}
 const start=s.indexOf('function eff('),end=s.indexOf('const hitChance=',start),context={Math,hasPas:()=>false,baseOf:c=>c==='ninja'?'thief':c,sideOf:()=>[],pvpOffense:(_,k,v)=>v,isWorldBattle:()=>false,FORMS:{}};
 vm.createContext(context);vm.runInContext(s.slice(start,end),context);vm.runInContext(fn('minimumHitChance'),context);
 const make=(acc,eva,boss=false)=>({st:{acc,eva},boss,buffs:[],status:{}}),attacker=make(100,0),rogue=make(0,500);rogue.cls='ninja';
 const hit=(a,t)=>Math.max(context.minimumHitChance(a,t),Math.min(100,context.eff(a,'acc')-context.eff(t,'eva')+15));
 assert.equal(hit(attacker,rogue),25);assert.equal(hit({...attacker,boss:true},rogue),40);
 assert.equal(context.eff(attacker,'acc'),100);assert.equal(context.eff({...attacker,boss:true},'acc'),115);
 assert.equal(hit(attacker,make(0,65)),50);assert.equal(hit({...attacker,boss:true},make(0,65)),65);
 assert.equal(context.minimumHitChance({cls:'gladiator'},rogue),80);
 console.log('PASS '+file+': dodge75%, bosses +15 accuracy points and hitfloor40%, original class counter80% preserved.');
}
const server=fs.readFileSync('server/accounts/engine.ts','utf8');assert(server.includes('PVP_MAX_TURNS=60'));assert(server.includes('maxTurns:60'));
const start=server.indexOf('function pvpCompleteTurn_('),end=server.indexOf('\nfunction ',start+1),ctx={PVP_MAX_TURNS:60,pvpCheckEnd_:()=>false,pvpFinish_:(r,w,reason)=>{r.status='finished';r.winner=w;r.reason=reason;}};vm.createContext(ctx);vm.runInContext(server.slice(start,end),ctx);
const room={status:'active',battle:{turns:29}};assert.equal(ctx.pvpCompleteTurn_(room),false);assert.equal(room.status,'active');room.battle.turns=59;assert.equal(ctx.pvpCompleteTurn_(room),true);assert.equal(room.battle.turns,60);assert.equal(room.winner,-1);
const raid={raid:true,status:'active',battle:{turns:59}};assert.equal(ctx.pvpCompleteTurn_(raid),false);raid.battle.turns=99;assert.equal(ctx.pvpCompleteTurn_(raid),true);
const ui=fs.readFileSync('runtime/pvp.js','utf8');assert(ui.includes('${r.turnLimit||60}'));assert(!ui.includes('30 เทิร์น'));assert(ui.includes('30 วินาที'));
console.log('PASS PVP remains active after30 turns, draw at60, raid100 preserved, UI uses room limit, 30-second action timer preserved.');
