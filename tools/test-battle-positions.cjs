const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
function suite(run,label){
 const r=code=>JSON.parse(run('JSON.stringify((()=>{'+code+'})())'));
 function setup(kind='wild',size=4){run(`S.P.gold=10000;S.P.cls='summoner';S.P.lv=40;S.P.hp=999;S.P.mp=999;S.P.pets=[];
  S.battle={kind:'${kind}',allies:[],enemies:[],queue:[],cur:'P',log:[],fx:[],used:[],round:1};
  for(const side of ['ally','enemy'])for(let i=0;i<${size};i++){const u=i?wildUnit('kappa',35,i):playerUnit();u.id=side+i;u.side=side;u.owner=side==='ally'?0:1;u.hp=u.st.hp;u.mp=999;u.skills=['shadow_clone','summon_golem','hire_merc'];S.battle[side==='ally'?'allies':'enemies'].push(u);}S.battle.cur='ally0';`);}
 for(const kind of ['wild','boss','npc','tower','pvp','raid','guildwar']){
  setup(kind);
  for(const side of ['allies','enemies'])for(const skill of ['shadow_clone','summon_golem','hire_merc']){
   const result=r(`const u=B().${side}[0],mp=u.mp,gold=S.P.gold;const ok=act(u,'${skill}',foesOf(u)[0],u);return {ok,mp:u.mp-mp,gold:S.P.gold-gold,count:B().${side}.length};`);
   assert.deepEqual(result,{ok:false,mp:0,gold:0,count:4},label+' '+kind+' '+side+' full cap');
  }
  const replacement=r(`const u=B().allies[0],old=B().allies[2];old.hp=0;old.kind='pet';old.uid=42;old.status={poison:3,confuse:2};S.P.pets=[{uid:42,hp:99,mp:10}];B().queue=[old.id,old.id+'*',B().allies[1].id];const ok=addTemporary(u,SK.shadow_clone);return {ok,len:B().allies.length,slot:B().allies[2].shadowOwner,oldQueued:B().queue.some(id=>id===old.id||id===old.id+'*'),pet:S.P.pets[0],retired:B().retiredUnits.length};`);
  assert.equal(replacement.ok,true,label);assert.equal(replacement.len,4);assert.equal(replacement.slot,'ally0');assert.equal(replacement.oldQueued,false);assert.equal(replacement.pet.hp,0);assert.deepEqual(replacement.pet.ailments,{poison:3,confuse:2});assert.equal(replacement.retired,1);
  assert.equal(run('battleHasRoom(B().allies[0])'),false);
  // Temporary replacements never expand the visible list or the retired reward archive.
  for(let i=0;i<30;i++)assert.deepEqual(r(`B().allies[2].hp=0;return {ok:addTemporary(B().allies[0],SK.summon_golem),len:B().allies.length,retired:B().retiredUnits.length};`),{ok:true,len:4,retired:1});
 }
 setup('wild',1);
 for(let n=2;n<=4;n++){assert.equal(run('addTemporary(B().allies[0],SK.shadow_clone)'),true);assert.equal(run('B().allies.length'),n);}
 assert.equal(run('addTemporary(B().allies[0],SK.shadow_clone)'),false);
 // Boss helpers reuse the exact dead enemy slot and do not erase living units.
 setup('boss');run('B().enemies[0].sp="demonlord";B().enemies[1].hp=0;');
 assert.deepEqual(r('const ok=bossSummonLegends(B().enemies[0],2);return {ok,len:B().enemies.length,helper:B().enemies[1].bossHelper,last:B().enemies[3].id};'),{ok:true,len:4,helper:true,last:'enemy3'});
 setup('world');run(`for(let owner=1;owner<4;owner++)for(let i=0;i<4;i++){const u=wildUnit('kappa',35,i);u.id='owner'+owner+'-'+i;u.side='ally';u.owner=owner;B().allies.push(u);}`);
 assert.equal(run('B().allies.length'),16);
 run('B().allies[6].hp=0;');
 assert.equal(run('addTemporary(B().allies[0],SK.shadow_clone)'),false,'Cannot take another owner’s dead slot');
 assert.equal(run('addTemporary(B().allies[4],SK.shadow_clone)'),true);
 assert.equal(run('B().allies[6].owner'),1);assert.equal(run('B().allies.length'),16);
 const replay=r(`const before={allies:B().allies.map(x=>({...x})),enemies:B().enemies.map(x=>({...x}))},fresh={...before.allies[3],id:'replacement'};const ids=before.allies.map(x=>x.id);ids[3]=fresh.id;applyClass10Replay(before,{spawns:[fresh],allyIds:ids,enemyIds:before.enemies.map(x=>x.id)});return {len:before.allies.length,id:before.allies[3].id,old:before.allies.some(x=>x.id===ids[3]&&x.id!=='replacement')};`);
 assert.deepEqual(replay,{len:16,id:'replacement',old:false},label+' replay keeps position');
 console.log('PASS '+label+': all battle caps, no costs when full, exact replacement, pet persistence, repeated summons, boss helpers, world ownership, replay slots');
}
const game=require('./game-context.cjs')('build/live-index.html');game.run('render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};');suite(game.run,'client');
game.run(`S.P.cls='beastking';const incoming=mkPet('kappa',35);S.P.pets=[{uid:42,hp:100,mp:10},incoming];S.P.carried=[42,incoming.uid];S.P.party=[42];
 S.battle={kind:'wild',allies:[playerUnit(),wildUnit('kappa',35,1),wildUnit('naga',35,2),wildUnit('kappa',35,3)],enemies:[wildUnit('kappa',35,0)],queue:[],cur:'P',log:[],fx:[],used:[],round:1,menu:'main',atarget:3,target:0};
 B().allies.forEach(u=>u.side='ally');B().allies[2].kind='pet';B().allies[2].uid=42;B().allies[2].hp=0;B().allies[2].status={burn:3};const liveSlot=B().allies[3].id;battleAction('swap:'+incoming.uid);`);
assert.equal(game.run('B().allies.length'),4);
assert.equal(game.run('B().allies[2].uid===incoming.uid'),true,'Reserve pet reuses the dead position');
assert.equal(game.run('B().allies[3].id===liveSlot'),true,'Calling into a dead position preserves living units');
assert.equal(game.run('S.P.pets[0].hp'),0);assert.equal(game.run('S.P.pets[0].ailments.burn'),3);
assert.equal(game.run('S.P.party.every(Number.isFinite)'),true,'Temporary units must not insert undefined pet IDs');
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'');
source=source.replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');
const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});
vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);
engine.testRun('S={P:'+game.run('JSON.stringify(S.P)')+',ui:{}}');suite(engine.testRun,'authoritative server');
