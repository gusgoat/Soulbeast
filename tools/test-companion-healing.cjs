const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const game=require('./game-context.cjs')('build/live-index.html');
const bases=JSON.parse(game.run('JSON.stringify(Object.fromEntries(Object.keys(CLS).map(c=>[c,baseOf(c)])))'));
for(const file of ['runtime/combat.js','server/accounts/engine.ts']){
const source=fs.readFileSync(file,'utf8'),line=source.match(/const hm=[^\r\n]+;/)[0];
const context={hasPas:u=>u.healer,baseOf:c=>bases[c],isBalancedPvp:()=>context.mode==='pvp',B:()=>({kind:context.mode,towerRun:context.towerRun})};vm.createContext(context);
function multiplier(kind,side,healer,cls,mode='boss',towerRun=false){context.mode=mode;context.towerRun=towerRun;context.u={kind,side,healer,cls};return vm.runInContext('(function(){'+line+'return hm;})()',context);}
for(const kind of ['pet','npcpet','summon'])for(const side of ['ally','enemy']){assert.equal(multiplier(kind,side,false),.7);assert.equal(multiplier(kind,side,true),1.3*.7);}
assert.equal(multiplier('beast','ally',true),1.3*.7,'legacy friendly beast summons are included');
for(const kind of ['player','human']){assert.equal(multiplier(kind,'ally',false),1);assert.equal(multiplier(kind,'ally',true),1.3);}
assert.equal(multiplier('beast','enemy',true),1.3,'wild enemy and boss healing is unchanged');
for(const mode of ['pvp','wild','boss','world','raid','camp','guildwar','npc','tower']){
for(const kind of ['pet','npcpet','summon'])for(const cls of ['archdruid','sealmaster',undefined])assert.equal(multiplier(kind,'ally',false,cls,mode),.7,'companion/summon stays70% '+mode);
for(const kind of ['player','human'])for(const side of ['ally','enemy'])for(const [cls,base] of Object.entries(bases)){
 const scale=!['pvp','raid','camp','guildwar','tower','world'].includes(mode)&&['druid','summoner'].includes(base)?.7:1;
 assert(Math.abs(multiplier(kind,side,false,cls,mode)-scale)<1e-12);
 assert(Math.abs(multiplier(kind,side,true,cls,mode)-1.3*scale)<1e-12);
}
}
// Real tower floors use kind=npc plus a towerRun marker, not kind=tower.
for(const kind of ['player','human'])for(const side of ['ally','enemy'])for(const [cls,base] of Object.entries(bases)){
 assert.equal(multiplier(kind,side,false,cls,'npc','tower-test'),1,'real tower uses full healing '+cls);
 assert.equal(multiplier(kind,side,true,cls,'npc','tower-test'),1.3,'tower healer bonus '+cls);
 if(['druid','summoner'].includes(base))for(const solo of ['wild','boss','bandit','traveler','npc'])assert.equal(multiplier(kind,side,false,cls,solo),.7,'solo remains70% '+solo);
}
for(const kind of ['pet','npcpet','summon'])assert.equal(multiplier(kind,'ally',false,'sealmaster','npc','tower-test'),.7,'tower companion stays70%');
assert.equal(multiplier('summon','ally',true,'archdruid'),1.3*.7,'clones with copied class do not receive both reductions');
assert(source.includes('x.hp=Math.round(x.st.hp*sk.pw/100)'),'revival still bypasses normal healing multiplier');
assert(source.includes("heal(u,u.st.hp*(isBalancedPvp()?.035:.06))"),'passive regeneration unchanged');
assert(source.includes('heal(u,d*ls)'),'lifesteal unchanged');
console.log('PASS '+file+': pet skill heal70%; druid/summoner all human tiers heal100% in PVP/raid/camp/guildwar/world/tower including real npc+towerRun; solo70%, either side; other classes/revival/regen/lifesteal unchanged.');
}
