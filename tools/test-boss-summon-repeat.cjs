const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('runtime/combat.js','utf8');
const due=source.slice(source.indexOf('function bossSummonDue('),source.indexOf('// @soulbeast-end 0737-bossSummonDue'));
const summon=source.slice(source.indexOf('function bossSummonLegends('),source.indexOf('// @soulbeast-end 0738-bossSummonLegends'));
let battle,room=true;
const context={Math,B:()=>battle,SP:{phoenix:{legendary:true},garuda:{legendary:true}},SK:{boss_legend_call:{n:'Call'}},battleHasRoom:()=>room,wildUnit:()=>({skills:['attack'],hp:100}),battlePlaceUnit:(_,n)=>{battle.enemies.push(n);return true;},blog:()=>{}};
vm.createContext(context);vm.runInContext(due+'\n'+summon,context);
const boss=extra=>({id:'boss',sp:'demonlord',side:'enemy',name:'Demonlord',...extra});
function killHelpers(){battle.enemies.forEach(u=>{if(u.bossHelper)u.hp=0;});}
const solo=boss();battle={kind:'boss',meta:6,enemies:[solo]};
assert(context.bossSummonDue(solo),'first solo summon is available');
room=false;assert.equal(context.bossSummonLegends(solo,1),false);assert(!solo.legendSummoned,'full slots do not consume the summon');room=true;
assert(context.bossSummonLegends(solo,1));assert.equal(battle.enemies.filter(u=>u.bossHelper).length,1);
for(let wave=0;wave<3;wave++){
 assert.equal(context.bossSummonDue(solo),false,'solo waits while helper lives');killHelpers();
 assert.equal(context.bossSummonDue(solo),false,'solo cooldown begins after death');
 assert.equal(context.bossSummonDue(solo),false,'solo retains one intervening turn');
 assert(context.bossSummonDue(solo),'solo can summon again after cooldown');
 assert(context.bossSummonLegends(solo,1));assert.equal(battle.enemies.filter(u=>u.bossHelper&&u.hp>0).length,1);
}
const world=boss({immortalWorld:true});battle={kind:'world',meta:6,enemies:[world]};
for(let wave=0;wave<3;wave++){
 assert(context.bossSummonDue(world),'world boss can summon each wave');
 assert(context.bossSummonLegends(world,2));assert.equal(battle.enemies.filter(u=>u.bossHelper&&u.hp>0).length,2);
 assert.equal(context.bossSummonDue(world),false,'world boss waits while helpers live');killHelpers();
 assert.equal(context.bossSummonDue(world),false,'world cooldown begins after death');
 assert.equal(context.bossSummonDue(world),false,'world cooldown retains one intervening turn');
}
const nextFight=boss();battle={kind:'boss',meta:'6',enemies:[nextFight]};assert(context.bossSummonDue(nextFight));assert(context.bossSummonLegends(nextFight,1),'fresh solo encounter gets a new summon');
console.log('PASS solo repeated waves of one and world repeated waves of two retain original cooldown; failed placement can retry and fresh fights reset.');
