const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const exploration=fs.readFileSync('runtime/exploration.js','utf8'),stage=fs.readFileSync('runtime/demonlordBalance.js','utf8');
const aura=exploration.slice(exploration.indexOf('function applyBossAura('),exploration.indexOf('wildUnit=function(sp,lv,i,boss){const u=progressionWildUnit'));
const rules=stage.slice(stage.indexOf('const STAGE_BOSS_STRENGTH='),stage.indexOf('const stageBossStrengthStart='));
const ctx={Math};vm.createContext(ctx);vm.runInContext(aura+'\n'+rules,ctx);
const run=s=>vm.runInContext(s,ctx);
for(const [id,sp]of [[1,'tanuki'],[2,'kitsune'],[3,'sphinx'],[4,'dragon'],[5,'nidhogg']]){
run(`var u={boss:true,side:'enemy',sp:'${sp}',st:{hp:2000,mp:100,patk:115,matk:115,pdef:115,mdef:115,spd:100},hp:2000,mp:100};applyBossAura(u);`);
assert.equal(run('u.st.patk'),120);assert.equal(run('u.st.mdef'),120);assert.equal(run('u.st.hp'),2300);assert.equal(run('u.st.mp'),115);assert.equal(run('u.st.spd'),110);
run(`prepareStageBossStrength([u],'boss',${id})`);
assert.equal(run('u.st.hp'),id===4?2875:3450);const atk=({1:273,2:228,3:251,4:138,5:248})[id],def=({1:259,2:281,3:337,4:144,5:257})[id];assert.equal(run('u.st.patk'),atk);assert.equal(run('u.st.matk'),atk);assert.equal(run('u.st.mdef'),def);assert.equal(run('u.st.pdef'),def);
const before=run('JSON.stringify(u)');run(`applyBossAura(u);prepareStageBossStrength([u],'boss',${id})`);assert.equal(run('JSON.stringify(u)'),before,'bonuses must not stack twice');
}
run("var online={boss:true,side:'enemy',immortalWorld:true,st:{hp:100,patk:100}};");assert.equal(run("prepareStageBossStrength([online],'boss',5)"),false);
run("var wrong={boss:true,side:'enemy',sp:'other',st:{hp:100,patk:100}};");assert.equal(run("prepareStageBossStrength([wrong],'boss',1)"),false);
assert(exploration.includes('โจมตี +20% · ป้องกัน +20%'));
run("var training={boss:true,side:'enemy',sp:'jackalope',st:{hp:230,patk:27,pdef:16}};");const training=run('JSON.stringify(training)');assert.equal(run("prepareStageBossStrength([training],'boss',7)"),false);assert.equal(run('JSON.stringify(training)'),training);
const demon=stage.slice(stage.indexOf('const DEMONLORD_BALANCE='),stage.indexOf('const demonBalanceStartPrevious='));vm.runInContext(demon,ctx);
run("var demon={boss:true,side:'enemy',sp:'demonlord',st:{hp:6752,mp:606,patk:252,matk:252,pdef:282,mdef:282,spd:88},mp:606};prepareDemonEncounter([demon],'boss',6)");assert.equal(run('demon.st.patk'),246);assert.equal(run('demon.st.matk'),246);assert.equal(run('demon.st.hp'),5064);assert.equal(run('demon.st.pdef'),254);const stable=run('JSON.stringify(demon)');assert.equal(run("prepareDemonEncounter([demon],'boss',6)"),false);assert.equal(run('JSON.stringify(demon)'),stable);
run("var worldDemon={boss:true,side:'enemy',sp:'demonlord',immortalWorld:true,st:{hp:100,patk:100}};");assert.equal(run("prepareDemonEncounter([worldDemon],'boss',6)"),false);
run("var twins=[0,1].map(i=>({boss:true,side:'enemy',sp:'nidhogg',st:{hp:2300,patk:120,matk:120,pdef:120,mdef:120}}));prepareStageBossStrength(twins,'boss',5)");assert.equal(run('twins.every(u=>u.st.patk===248&&u.st.pdef===257&&u.st.hp===3450)'),true,'both Nidhogg bosses receive the same complete bonuses');
console.log('PASS sequential attack/defense buffs for each stage; both Nidhogg bosses scaled; unchanged aura/HP/training/world; no double stacking.');
