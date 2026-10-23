const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),vm=require('vm');
const d=require('../content/solar-beasts.json'),art=require('../content/solar-art/art-manifest.json');
assert.equal(d.beasts.length,8);assert.equal(art.assets.length,56);assert.equal(new Set(art.assets.map(a=>a.sha256)).size,56);
for(const a of art.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(a.path)).digest('hex'),a.sha256);assert.deepEqual(a.cropBox,[0,0,...a.sourceSize]);}
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'');source=source.slice(0,source.indexOf('const sbCanonical='));source=source.replace('return {dispatch(packet)','return {evaluate:s=>eval(s),dispatch(packet)');
const sc=vm.createContext({console,Date,Math:Object.create(Math),JSON,Uint8Array,TextEncoder,TextDecoder,structuredClone,crypto:crypto.webcrypto,btoa,atob});vm.runInContext(source,sc);const engine=vm.runInContext('createEngine(createWorkbook(),{})',sc),server=s=>engine.evaluate(s);
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run,json=s=>JSON.parse(r('JSON.stringify('+s+')'));
 assert.equal(json('GACHA_RATES').reduce((n,a)=>n+a[1],0),10000);assert.equal(json('GACHA_RATES').find(a=>a[0]==='beast')[1],1990);assert.equal(json('GACHA_RATES').find(a=>a[0]==='solarBeast')[1],10);
 assert.equal(r('gachaCategory(.992,0,0)'),'solarBeast');assert.equal(r('gachaCategory(.9929999,0,0)'),'solarBeast');assert.equal(r('gachaCategory(.993,0,0)'),'eternal');
 assert.equal(json('gachaPools().solarBeast').length,8);
 for(const b of d.beasts){
  const q=json(`SP.${b.id}`);assert(q.solar&&q.gachaOnly&&!q.legendary);assert.equal(r(`beastRarity(SP.${b.id})`),'solar');assert.equal(r(`beastFrameKind('${b.id}')`),'solar');
  assert.equal(q.sk.length,5);assert.equal(q.sig,b.skills[5].id);assert.equal(new Set([...q.sk,q.sig]).size,6);assert.deepEqual(q.t,b.types);
  const wager={type:'pet',pet:{sp:b.id}};assert.equal(r(`wagerClass(${JSON.stringify(wager)})`),'pet:solar');assert.equal(server(`wagerClass(${JSON.stringify(wager)})`),'pet:solar');
  // No other reward category may select a Solar beast.
  for(const key of ['beast','rare','legendBeast'])assert(!r(`gachaPools().${key}.includes('${b.id}')`));
  assert(!r(`ZN.some(z=>z.sp.includes('${b.id}')||z.rare.includes('${b.id}'))`));
  assert(r(`portrait('${b.id}',64)`).includes('frame-solar'));assert(r(`portrait('${b.id}',64)`).includes('assets/beasts/solar/'+b.id+'.webp'));
  for(const lv of [1,5,11,18,25,35,60]){
   const p={sp:b.id,lv,form:0,pts:{hp:4,patk:3,matk:2}},s=json(`calcPet(${JSON.stringify(p)})`),ref=json(`calcPet(${JSON.stringify({...p,sp:b.ref})})`);
   for(const k of Object.keys(s))assert.equal(s[k],Math.round(ref[k]*1.3),b.id+' '+lv+' '+k);
   assert.equal(JSON.stringify(server(`calcPet(${JSON.stringify(p)})`)),JSON.stringify(s));
   const ids=json(`petSkills(${JSON.stringify(p)})`),expected=b.skills.filter((_,i)=>lv>=(i===5?35:d.normalSkillLevels[i])).map(s=>s.id);
   assert.deepEqual(ids,['attack',...expected]);assert.deepEqual(JSON.parse(JSON.stringify(server(`petSkills(${JSON.stringify(p)})`))),ids);
  }
  for(const s of b.skills){assert.deepEqual(json(`SK.${s.id}`),s.definition);assert.equal(JSON.stringify(server(`SK.${s.id}`)),JSON.stringify(s.definition));for(const k of Object.keys(s.definition.st||{}))assert(r(`!!STS.${k}`));assert(r(`skillPicture(null,SK.${s.id},'${s.id}')`).includes(s.id+'.webp'));assert(r(`!!BattleEffects.profile('${s.id}').legend`));}
  for(const lang of ['en','zh-CN'])for(const text of [b.names[0],b.lore[0],...b.skills.map(s=>s.names[0])])assert(!/[\u0e00-\u0e7f]/.test(r(`translateGameText(${JSON.stringify(text)},'${lang}',false)`)));
 }
 assert.deepEqual(json('Object.keys(SP).filter(k=>SP[k].solar)'),d.beasts.map(b=>b.id));
 assert(r("SK.solar_aureolith_s2.taunt===3&&SK.solar_aureolith_s2.bf.pdef>=.4"));
 r('render=()=>{};Sound.fx=()=>{};Math.random=()=>.01;');
 for(const b of d.beasts)for(const s of b.skills){
  r(`var actor=wildUnit('${b.id}',60,0),target=wildUnit('wisp',60,1),friend=wildUnit('wisp',60,2);actor.id='solar-actor';actor.side='ally';actor.hp=Math.round(actor.st.hp/3);actor.mp=9999;target.id='solar-target';target.types=['normal'];target.hp=999999;target.st.hp=999999;friend.id='solar-friend';friend.side='ally';friend.hp=${s.definition.revAll?'0':'Math.round(friend.st.hp/3)'};S.battle={kind:'beast',allies:[actor,friend],enemies:[target],log:[],fx:[],round:1,cur:actor.id,target:0};S.screen='battle';var beforeSolarHp=actor.hp,beforeFriendHp=friend.hp;`);
  assert.equal(r(`act(actor,'${s.id}',target,friend)`),true,s.id+' must execute');
  if(['p','m','h'].includes(s.definition.t))assert(r('target.hp<999999'),s.id+' must deal damage');
  if(s.definition.t==='heal')assert(r('actor.hp>beforeSolarHp'),s.id+' must heal');
  if(s.definition.revAll)assert(r('friend.hp>0'),s.id+' must revive a fallen companion');
  if(s.definition.taunt)assert.equal(r('actor.taunt'),3);
 }
 const book=r("S.ui.dexRarity='solar';fullBestiary('')");assert(book.includes('0.1%'));assert(!book.includes('ค่าสถานะ +30%'));assert(!book.includes('solarPair'));
 console.log('PASS '+file+': eight isolated Solar beasts, 48 skills/unlocks, 30% private scaling at seven levels, server parity, exact 0.1% base interval, complete EN/ZH, art and red frames');
}
const cp=server("sheet_('GachaTransactions',COMMUNITY_LEDGER)");
server("sheet_('GachaTransactions',COMMUNITY_LEDGER).appendRow(['pre-solar','SOLARTEST2345',JSON.stringify({revision:1,count:999,gachaPityVersion:2,legendPity:7,rewards:[]}),'done'])");assert.equal(server("gachaSolarPity_('SOLARTEST2345')"),0);
server("sheet_('GachaTransactions',COMMUNITY_LEDGER).appendRow(['new-solar','SOLARTEST2345',JSON.stringify({revision:2,count:10,gachaPityVersion:3,legendPity:17,solarPity:10,rewards:[]}),'done'])");assert.equal(server("gachaSolarPity_('SOLARTEST2345')"),10);
server("sheet_('GachaTransactions',COMMUNITY_LEDGER).appendRow(['pending-solar','SOLARTEST2345',JSON.stringify({revision:3,count:1,gachaPityVersion:3,solarPity:0,rewards:[]}),'pending'])");assert.equal(server("gachaSolarPity_('SOLARTEST2345')"),10,'Uncommitted draws cannot move pity');
