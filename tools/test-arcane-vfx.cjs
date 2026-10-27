const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const g=require('./game-context.cjs')('build/live-index.html'),run=g.run;
const manifest=require('../content/projectile-effects-v5.json');assert.equal(manifest.assets.length,7);
for(const a of manifest.assets){const b=fs.readFileSync(a.path);assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b[25],6);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256);}
run('Math.random=()=>{throw Error("VFX must not consume combat RNG")};');const before=run('JSON.stringify(S)');
const samples={ms_mage20:'ice-high',wk_curse:'dark-high',ne_soul:'ghost-high',f_moonbeam:'holy-high',ms_mage60:'dragon-high',solar_mortivar_s5:'poison-high',ws_staff4:'psychic-high'};
for(const[id,asset]of Object.entries(samples)){const p=JSON.parse(run(`JSON.stringify(BattleEffects.profile('${id}').painted)`));assert.equal(p.asset,asset,id);assert.equal(p.kind,'beam');assert.equal(p.path,'assets/vfx/projectiles/v5/'+asset+'.png');assert(p.emission.x>=0&&p.emission.x<.1);}
for(const el of ['ice','dark','ghost','fairy','dragon','poison','psychic'])assert.equal(run(`BattleEffects.projectileArt('qa_low',{t:'m',el:'${el}',pw:50,mp:3},{mode:'projectile'} )`),null,'Low-tier '+el+' must retain original');
assert.equal(run('JSON.stringify(S)'),before,'Profiles must not modify saves');
for(const sex of ['male','female']){run(`S.P.cls='sniper';S.P.gender='${sex}';`);const a=JSON.parse(run('JSON.stringify(CharacterMotion.resolve(playerUnit()))'));for(const pose of ['hit','windup','power','threat','melee','meleeEffect'])assert(fs.existsSync(a.assets[pose]),sex+' '+pose);}
const animations=[],nodes=[];function node(){const n={style:{setProperty(){}},dataset:{},isConnected:true,closest:()=>({getBoundingClientRect:()=>({left:0,top:0,width:320,height:400})}),appendChild(){},setAttribute(){},remove(){this.removed=true;},animate(frames,options){const a={frames,options,cancel(){}};animations.push(a);return a;}};nodes.push(n);return n;}
g.ctx.document.createElement=node;g.ctx.from={x:40,y:300,size:44,node:node()};g.ctx.to={x:230,y:80,size:44,node:node()};g.ctx.L=node();
for(const id of Object.keys(samples)){const at=nodes.length;assert.equal(run(`BattleEffects.paintedTravel(L,from,to,BattleEffects.profile('${id}'))`),420);const a=animations.at(-1);assert.equal(a.options.easing,'linear');assert(a.frames.every(f=>f.transform===a.frames[0].transform),'Beam orientation must stay fixed');assert.equal(nodes[at].style.width,'320px');a.onfinish();assert(nodes[at].removed);}
run('BattleEffects.clear()');assert.equal(run('BattleEffects.live.size'),0);
// Compare state after restoring the intentionally selected QA character.
run("S.P.cls=JSON.parse("+JSON.stringify(before)+").P.cls;S.P.gender=JSON.parse("+JSON.stringify(before)+").P.gender;");
// No battle/save mutators are called by profile or painted travel.
assert.equal(run('JSON.stringify(S.battle)'),JSON.stringify(JSON.parse(before).battle));
console.log('PASS seven arcane alpha PNGs/hashes, advanced routing, low-tier preservation, both Archer pose sets, fixed beam angle, linear travel, 320px clipping and cleanup');
