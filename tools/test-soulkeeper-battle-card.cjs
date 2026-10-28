const assert=require('node:assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const {run:r}=require('./game-context.cjs')(file);
 const before=r('JSON.stringify(S)'),actors=r('JSON.stringify(MOTION_ACTORS)');
 r('Math.random=()=>{throw Error("Card presentation consumed combat randomness")};');
 const ids=JSON.parse(r('JSON.stringify(Object.keys(CLS))'));
 for(const cls of ids)for(const gender of ['male','female']){
  const u={id:'P',kind:'player',cls,gender,img:'player',name:'ทดสอบชื่อผู้ผนึกที่ยาวมาก',lv:60,hp:100,mp:50,st:{hp:100,mp:50},types:['normal'],status:{},buffs:[],pas:[]};
  const html=r(`statusBattleCard('<button class="battle-vital"><span class="battle-face">'+unitPortrait(${JSON.stringify(u)},28)+'</span><div class="battle-meter"></div></button>',${JSON.stringify(u)})`);
  assert(html.includes('data-battle-card="full"'),cls+' '+gender);
  assert(html.includes('data-motion-actor="'+cls+'-'+gender+'"'),cls+' original motion missing');
 }
 const beast={id:'e0',sp:'dragon',evo:0,types:['dragon'],status:{},buffs:[],pas:[]};
 assert(r(`statusBattleCard('<button class="battle-vital"><span class="battle-face">'+portrait('dragon',28)+'</span></button>',${JSON.stringify(beast)})`).includes('data-battle-card="full"'));
 assert.equal(r('JSON.stringify(S)'),before);assert.equal(r('JSON.stringify(MOTION_ACTORS)'),actors,'Original images, source and melee anchors must remain unchanged');
 console.log('PASS '+file+': '+ids.length*2+' soulkeeper variants, shared card markup, original artwork/anchors, no save/RNG changes');
}

