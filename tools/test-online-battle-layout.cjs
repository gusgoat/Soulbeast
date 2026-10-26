const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const {run:r}=require('./game-context.cjs')(file);
 r(`render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};
 var raidAllies=Array.from({length:16},(_,i)=>{const u=i%4?wildUnit('kappa',35,i):playerUnit();u.id='raid-'+i;u.owner=Math.floor(i/4);u.side='ally';u.hp=u.st.hp;u.mp=u.st.mp;return u;});
 var raidBoss=wildUnit('demonlord',60,0);raidBoss.id='boss';raidBoss.immortalWorld=true;raidBoss.owner=-1;
 var raid={id:'OFFLINE',me:0,status:'active',players:Array.from({length:4},()=>({auto:false})),battle:{kind:'world',allies:raidAllies,enemies:[raidBoss],cur:raidAllies[0].id,round:1,queue:[],log:[],fx:[],target:0,atarget:0,menu:'main'}};
 WORLD.room=raid;WORLD.friend='raid-5';`);
 const snapshot=r('JSON.stringify(raid.battle)'),html=r("compactOnlineBattle('world',raid)");
 assert.equal(r('JSON.stringify(raid.battle)'),snapshot,'Rendering must not alter battle units or rewards');
 assert(html.includes('world-arena'));assert.equal((html.match(/world-player-card /g)||[]).length,16);
 for(let i=0;i<16;i++)assert.equal((html.match(new RegExp('data-v="raid-'+i+'"','g'))||[]).length,1,'One live target per player card');
 assert(html.includes('world-unit-inspection'));assert(html.includes('HP '));assert(html.includes('our-side'));
 assert.equal((html.match(/data-a="onlineCommands"/g)||[]).length,1);
 r("ONLINE_COMPACT.hidden=false;handlers.onlineCommands();");assert.equal(r('ONLINE_COMPACT.hidden'),true);
 assert(r("compactOnlineBattle('world',raid)").includes('class="online-command-body" hidden'));
 r('handlers.onlineCommands();');assert.equal(r('ONLINE_COMPACT.hidden'),false);
 // World summons may be appended in another owner's order; each owner still has one row.
 r('raid.battle.allies=[...raidAllies.slice(4),...raidAllies.slice(0,4)];');
 const ordered=r("compactOnlineBattle('world',raid)");assert(ordered.indexOf('data-v="raid-0"')<ordered.indexOf('data-v="raid-4"'));
 r("raid.battle.allies=raidAllies.filter(u=>u.id!=='raid-2');");
 const empty=r("compactOnlineBattle('world',raid)");assert.equal((empty.match(/world-player-card /g)||[]).length,15);assert.equal((empty.match(/world-empty-position/g)||[]).length,1);assert(!empty.includes('data-v="raid-2"'));
 r('raid.battle.allies=raidAllies;');
 for(const mode of ['pvp','camp','guildwar']){
  r(`var duel={...raid,players:[{auto:false},{auto:false}],battle:{...raid.battle,kind:'${mode}',allies:raidAllies.slice(0,4),enemies:raidAllies.slice(4,8).map(u=>({...u,side:'enemy'}))}};PVP.friend='raid-0';PVP.target='raid-4';`);
  const duel=r(`compactOnlineBattle('${mode}',duel)`);assert(duel.includes('standard-arena'));assert.equal((duel.match(/class="online-combat-side /g)||[]).length,2);assert.equal((duel.match(/data-u="raid-/g)||[]).length,8);assert.equal((duel.match(/data-a="onlineCommands"/g)||[]).length,1);
 }
 r("S.battle={...duel.battle,kind:'npc',meta:1,towerRun:true,towerFloor:12,cur:duel.battle.allies[0].id,used:[],menu:'main',over:null};S.ui.battleCommandsHidden=false;");
 assert(r('vBattle()').includes('data-a="battleCommands"'));
 r('handlers.battleCommands();');assert(r('vBattle()').includes('id="battleCommandBody" class="battle-command-body" hidden'));
 console.log('PASS '+file+': 16 world targets, owner rows/dead positions, nonmutating rendering, detail values, eight-card online modes and manual command toggles including tower');
}
