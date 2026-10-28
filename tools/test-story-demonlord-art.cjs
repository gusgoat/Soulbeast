const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const r=require('./game-context.cjs')(file).run;
 r("S.screen='battle';S.battle=null;var castle=wildUnit('demonlord',60,0,'จอมมาร');var world={...castle,id:'worldboss',immortalWorld:true};");
 const state=r('JSON.stringify(S)'),unit=r('JSON.stringify(castle)');
 assert.equal(r('CharacterMotion.resolve(castle).id'),'demonlord-story');assert.equal(r('CharacterMotion.resolve(world).id'),'demonlord');
 r("S.screen='world';");assert.equal(r('CharacterMotion.resolve(castle).id'),'demonlord');r("S.screen='battle';");
 assert.equal(r('JSON.stringify(S)'),state);assert.equal(r('JSON.stringify(castle)'),unit,'Image routing must not change species, stats, skills, drops or reward identifiers');
 const pose=r("JSON.stringify(CharacterMotion.resolve(castle).assets)");assert(!pose.includes('demonlord-idle-v1.webp'));assert(pose.includes('demonlord-story-v1/idle.png'));
 const d=JSON.parse(fs.readFileSync('content/world-boss-original-art-hashes.json','utf8'));
 for(const [pose,hash]of Object.entries(d)){const path=r(`CharacterMotion.resolve(world).assets['${pose}']`);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash,'Original world boss '+pose);}
 console.log('PASS '+file+': story castle and original half-body world boss use separate artwork; world hashes and all gameplay fields preserved');
}
