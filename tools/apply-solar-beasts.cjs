'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const acorn=require('module').createRequire(path.resolve('tools/runtime-build/modules.cjs'))('acorn');
const d=require('../content/solar-beasts.json');
function readFactory(file,key){const c={SoulbeastContent:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),c);return JSON.parse(JSON.stringify(c.SoulbeastContent[key]()));}
function factory(file,key,value){let s=fs.readFileSync(file,'utf8'),found;function walk(n){if(!n||typeof n!=='object')return;if(n.type==='Property'&&(n.key.name||n.key.value)===key&&n.value.type==='ArrowFunctionExpression')found=n.value.body;for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(acorn.parse(s,{ecmaVersion:'latest'}));if(!found)throw Error('Missing factory '+key);fs.writeFileSync(file,s.slice(0,found.start)+JSON.stringify(value)+s.slice(found.end));}
const translations=readFactory('content/localization.js','GAME_TRANSLATIONS');
const add=([th,en,zh])=>{translations.en[th]=en;translations['zh-CN'][th]=zh;};
add(['อสูรตำนานสุริยัน','Solar Legendary Beasts','日耀传说妖兽']);add(['กาชาปองเท่านั้น · โอกาสพื้นฐาน 0.1% · การันตีภายใน 300 ครั้ง','Gachapon only · Base chance 0.1% · Guaranteed within 300 draws','仅限扭蛋 · 基础概率0.1% · 300抽内必得']);
add(['สุริยัน · กรอบแดงสามมิติ','Solar · Sculpted red frame','日耀 · 立体红框']);
for(const b of d.beasts){add(b.names);add(b.lore);add(['แก่น'+b.names[0],b.names[1]+' Core',b.names[2]+'核心']);add(['เศษผนึก'+b.names[0],b.names[1]+' Seal Fragment',b.names[2]+'封印碎片']);for(const s of b.skills)add(s.names);}
factory('content/localization.js','GAME_TRANSLATIONS',translations);
const moduleCode=`// Solar rarity definitions are additive; existing species and skill records remain intact.
// @soulbeast-unit 1095-solarBeasts
const SolarBeasts={
 definitions:${JSON.stringify(d.beasts)},
 install(){for(const b of this.definitions){
  SP[b.id]={n:b.names[0],o:b.lore[0],t:b.types,em:'☀',r:99,rare:1,solar:1,gachaOnly:1,solarPair:b.ref,b:SP[b.ref].b.slice(),sk:b.skills.slice(0,5).map(s=>s.id),sig:b.skills[5].id,skillLevels:${JSON.stringify(d.normalSkillLevels)},signatureLevel:${d.signatureLevel},pas:b.pas,art:'assets/beasts/solar/'+b.id+'.webp',parts:[['แก่น'+b.names[0],0],['เศษผนึก'+b.names[0],0]]};
  for(const s of b.skills){SK[s.id]={...s.definition};if(typeof VSKID!=='undefined')VSKID.set(SK[s.id],s.id);}
  if(typeof BattleEffects!=='undefined')BattleEffects.legends[b.id]=b.theme;
 }
 if(typeof BEAST_RARITY_LABELS!=='undefined')BEAST_RARITY_LABELS.solar='อสูรตำนานสุริยัน';
 if(typeof BEAST_FRAME_LABELS!=='undefined')BEAST_FRAME_LABELS.solar=['สุริยัน · กรอบแดงสามมิติ','Solar · Sculpted red frame','日耀 · 立体红框'];
 }
};
SolarBeasts.install();
// @soulbeast-end 1095-solarBeasts
`;
fs.writeFileSync('runtime/solarBeasts.js',moduleCode);
const m=JSON.parse(fs.readFileSync('runtime/manifest.json','utf8'));
m.modules.solarBeasts={file:'solarBeasts.js',description:'Solar Legendary rarity, eight gacha-exclusive beasts and 48 signature skills',units:1};
if(!m.order.includes('1095-solarBeasts'))m.order.splice(m.order.indexOf('1076-ExpressionStatement'),0,'1095-solarBeasts');
m.units['1095-solarBeasts']={module:'solarBeasts',names:['SolarBeasts'],type:'SolarBeasts'};
fs.writeFileSync('runtime/manifest.json',JSON.stringify(m,null,2)+'\n');
// Keep the authoritative engine's content definitions identical to the client module.
let server=fs.readFileSync('server/accounts/engine.ts','utf8');
const start='// Solar rarity definitions are additive;',end='// @soulbeast-end 1095-solarBeasts';
if(server.includes(start)){const a=server.indexOf(start),z=server.indexOf(end,a)+end.length;server=server.slice(0,a)+moduleCode.trim()+server.slice(z);}
else{const at=server.indexOf('return {dispatch(packet)');if(at<0)throw Error('Missing engine entry');server=server.slice(0,at)+moduleCode+'\n'+server.slice(at);}
fs.writeFileSync('server/accounts/engine.ts',server);
console.log('Registered eight Solar beasts, 48 skills, complete translations and exact server/client definitions');
