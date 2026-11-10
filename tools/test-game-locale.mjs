import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInContext,createContext} from 'node:vm';
import test from 'node:test';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const context=createContext({window:{}});
for(const file of ['game-data-registry.5350fd57c39d09dd.js','game-data-localization.4e97f22b85950411.js',
 'game-data-secrets.b755c3d1bd3b2d7e.js','game-data-narrative.3437bb33483fc5e0.js',
 'client/game-locale-extra.js','tools/town-walk-demo/world-quests-data.js']){
 runInContext(read(file),context,{filename:file});
}
const legacy=runInContext('SoulbeastContent.GAME_TRANSLATIONS()',context);
const content=JSON.parse(read('client/game-locale-content.json'));
for(const [source,[en,zh]] of Object.entries(context.window.SoulbeastExtraTranslations)){
 legacy.en[source]=en;
 legacy['zh-CN'][source]=zh;
}
const th=/[\u0e01-\u0e3a\u0e40-\u0e4e]/u;
const text=(source,language)=>content[source]?.[language]||legacy[language][source];
function check(value){
 if(typeof value==='string'&&th.test(value)){
  for(const language of ['en','zh-CN']){
   const translated=text(value.trim(),language);
   assert.ok(translated?.trim()&&!th.test(translated),`${language} missing: ${value}`);
  }
 }else if(value&&typeof value==='object'){
  Object.values(value).forEach(check);
 }
}
test('quest dialogue, choices, objectives and results have exact translations in English and Simplified Chinese',()=>{
 const map=context.window.WorldQuestData;
 assert.ok(map.quests.length>=462);
 check(map);
 check(runInContext('SoulbeastContent.WORLD_TALES()',context));
 check(runInContext('SoulbeastContent.SECRET_LOCATIONS()',context));
});
test('the supplemental dictionary contains no blank or unknown-token translations',()=>{
 for(const [source,translations] of Object.entries(content)){
  assert.ok(th.test(source),source);
  for(const [language,value] of Object.entries(translations)){
   assert.ok(['en','zh-CN'].includes(language),language);
   assert.ok(typeof value==='string'&&value.trim()&&!th.test(value)&&!/(?:⁇|<unk>)/u.test(value),`${language}: ${source}`);
  }
 }
});
