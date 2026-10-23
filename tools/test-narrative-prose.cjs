const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const baseline=require('../content/narrative-prose/mechanics-baseline.json');
const proseKeys=new Set(['intro','scene','outcome','text','guard','decision','stages']);
function mechanics(x){if(Array.isArray(x))return x.map(mechanics);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!proseKeys.has(k)).map(([k,v])=>[k,mechanics(v)]));return x;}
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run,json=s=>JSON.parse(r('JSON.stringify('+s+')'));
 assert.equal(hash(mechanics(json('SoulbeastContent.WORLD_TALES()'))),baseline.WORLD_TALES);
 assert.equal(hash(mechanics(json('SoulbeastContent.SECRET_LOCATIONS()'))),baseline.SECRET_LOCATIONS);
 const tales=json('TALES_DATA'),secrets=json('SECRET_DATA');assert.equal(tales.quests.length,28);
 for(const q of tales.quests){assert(q.intro.includes('\n\n'),q.id);assert(q.scene.includes('\n\n'));assert(q.actions.every(a=>a.outcome.includes('\n\n')));if(q.kind==='short')continue;assert.equal(q.stages.length,q.targets.length);for(let i=0;i<q.stages.length;i++){
  r('S.screen="zone";S.battle=null;S.zone={id:'+q.targets[i]+',depth:3,log:[],taleSession:{id:'+JSON.stringify(q.id)+',followId:'+JSON.stringify(q.id)+',mode:"follow",token:"prose",result:[]}};');
  r('WorldTales.state().quests['+JSON.stringify(q.id)+']={id:'+JSON.stringify(q.id)+',kind:'+JSON.stringify(q.kind)+',status:"active",progress:'+i+',targets:'+JSON.stringify(q.targets)+'};');
  const html=r('WorldTales.view()');assert(html.includes(q.stages[i]),'Current witness must be shown: '+q.id+':'+i);assert(!html.includes(q.scene),'Final dilemma must wait until the question stage');
 }}
 for(const d of secrets.locations){assert(d.intro.includes('\n\n'));assert(d.guard.includes('\n\n'));assert.notEqual(d.intro,d.decision,'Secret entry cannot start at final decision');}
 for(const d of secrets.repeatableEvents){assert(d.text.includes('\n\n'));assert(d.choices.every(c=>c.outcome));}
 for(const d of secrets.riddles)assert(d.text.includes('\n\n'));
 const dictionaries=json('GAME_TRANSLATIONS');
 for(const lang of ['en','zh-CN'])assert(r('translateGameText(TALES_DATA.quests[0].intro,'+JSON.stringify(lang)+',false)').includes('\n\n'),'Translation must preserve paragraph breaks');
 for(const q of [...tales.quests,...tales.special])for(const text of [q.intro,q.scene,...(q.stages||[]),...q.actions.map(a=>a.outcome)].filter(Boolean))for(const lang of ['en','zh-CN'])assert(dictionaries[lang][text]&&!/[ก-๙]/.test(dictionaries[lang][text]),'Complete translation required');
 console.log('PASS '+file+': 28 expanded quests, 7 secret arrivals preserved, 7 events, 7 repeatable stories, 28 riddles; staged witnesses, complete EN/ZH and identical progression/rewards/puzzle answers/rates');
}
