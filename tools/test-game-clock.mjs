import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import clock from './town-walk-demo/game-clock.js';
import country from './hemant-walk-demo/encounter-rules.js';
import groups from './hemant-walk-demo/beast-groups.js';
import dungeon from './labyrinth-demo/encounter-rules.js';
import floors from './labyrinth-demo/floors.js';
import island from './island-demo/island-rules.js';
import {createEngine,createUtilities,createWorkbook} from '../supabase/functions/soulbeast-dungeon-party/engine.mjs';
import {partyEnemyAdapter} from '../supabase/functions/soulbeast-dungeon-party/source/server/accounts/dungeon-party-enemies.mjs';

const hour=h=>h*600_000;
assert.equal(clock.dayDuration,4*60*60_000);
for(const [time,phase,text] of [[0,'night','00:00'],[5,'dawn','05:00'],[7,'day','07:00'],[17,'dusk','17:00'],[19,'night','19:00'],[24,'night','00:00']]){
 const state=clock.at(hour(time));
 assert.equal(state.text,text);
 assert.equal(state.phase,phase);
 assert.equal(state.encounter,phase==='night'?'night':'day');
}
const window={SoulBeastClock:clock};
runInNewContext(readFileSync(new URL('./hemant-walk-demo/daylight.js',import.meta.url),'utf8'),{window});
assert.deepEqual([5,6,7,17,18,19,20].map(h=>window.CountryDaylight.at(hour(h)).night),[1,.5,0,0,.5,1,1]);

const engine=createEngine(createWorkbook({}),createUtilities(s=>createHash('sha256').update(s).digest(),randomUUID)).partyCombat;
const menu=readFileSync(new URL('./town-walk-demo/menu.html',import.meta.url),'utf8');
const data=menu.slice(menu.indexOf('const SoulbeastContent='),menu.indexOf('/* ================= CORE STATS'));
const base=runInNewContext(data+'\n({species:SoulbeastContent.SP(),zones:SoulbeastContent.ZN()})');
const original=engine.catalog(),species={...original.species,...base.species};
const zoneExtras=Array.from(menu.matchAll(/^ZN\.push\((\{id:[678],.*\})\);$/gm),m=>m[1]);
const zones=[...base.zones,...runInNewContext(menu.match(/^const stageSevenPools=.*;$/m)[0]+'\n['+zoneExtras.join(',')+']',{SP:species})];
const catalog={...original,species,zones,affinities:groups.groups};
let seed=42;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const verify=(entries,phase)=>entries.forEach(({sp})=>{if(sp)assert.ok(['both',phase].includes(clock.period(sp)),sp);});
for(const [time,phase] of [[12,'day'],[22,'night']]){
 const now=hour(time),night=phase==='night';
 for(const region of ['red','green','blue']){
  for(const level of [1,30,50]){
   const forestClears={};
   for(const unlocked of [null,7,1,2,3,4,5,6,8]){
    if(unlocked!==null)forestClears[unlocked]=1;
    for(let i=0;i<8;i++){
     const p={lv:level,forestClears};
     verify(country.plan(p,'shadow',catalog,random,region,now).units,phase);
     const bandits=country.plan(p,'bandit',catalog,random,region,now).units;
     verify(bandits,phase);
     assert.equal(bandits[0].nightAura,night);
     assert.ok(bandits.slice(1).every(p=>!p.nightAura));
    }
   }
  }
  for(const kind of ['shadow','bandit','portal']){
   for(let i=0;i<120;i++)verify(island.plan(region,{kind,lv:55,at:now},catalog,random),phase);
  }
 }
 for(let n=1;n<=7;n++){
  for(const kind of ['shadow','bandit']){
   for(let i=0;i<70;i++){
    const units=dungeon.plan(null,kind,catalog,floors.get(n),random,now).units;
    verify(units,phase);
    assert.equal(units.every(unit=>unit.nightAura===true),kind==='shadow'&&night);
   }
   const units=partyEnemyAdapter({engine,random:()=>.1,now:()=>now}).soloEnemies({floor:n},{kind});
   assert.ok(units.every(u=>!!u.nightAura===(kind==='shadow'&&night)));
   if(kind==='shadow')for(const u of units){
    const base=engine.beast(u.sp,u.lv,'base');
    for(const k of ['patk','matk','pdef','mdef']){
     const daytime=Math.round(base.st[k]*(k.endsWith('atk')?1.25:1.5));
     assert.equal(u.st[k],night?Math.round(daytime*1.15):daytime);
    }
    assert.equal(u.hp,Math.round(base.st.hp*1.5));
    assert.equal(u.mp,base.st.mp);
   }
  }
 }
}
assert.deepEqual(clock.filter(['golem','mandrake','wisp'],'day'),['golem','mandrake']);
assert.deepEqual(clock.filter(['golem','mandrake','wisp'],'night'),['golem','wisp']);
console.log('PASS clock rollover, twilight, encounter windows across every region/floor, and party aura stats');
