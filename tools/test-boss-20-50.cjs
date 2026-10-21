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
assert.equal(run('u.st.hp'),id===4?2875:3450);assert.equal(run('u.st.patk'),id===4?120:180);assert.equal(run('u.st.mdef'),id===4?120:180);
const before=run('JSON.stringify(u)');run(`applyBossAura(u);prepareStageBossStrength([u],'boss',${id})`);assert.equal(run('JSON.stringify(u)'),before,'bonuses must not stack twice');
}
run("var online={boss:true,side:'enemy',immortalWorld:true,st:{hp:100,patk:100}};");assert.equal(run("prepareStageBossStrength([online],'boss',5)"),false);
run("var wrong={boss:true,side:'enemy',sp:'other',st:{hp:100,patk:100}};");assert.equal(run("prepareStageBossStrength([wrong],'boss',1)"),false);
assert(exploration.includes('โจมตี +20% · ป้องกัน +20%'));
console.log('PASS aura20/20; four stage bonuses50%; dragonHP25%; unchanged HP/MP/speed; no double stacking; world boss/species guards; UI20%');
