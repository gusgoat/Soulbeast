const fs=require('fs'),assert=require('assert/strict'),acorn=require('module').createRequire(require('path').resolve('tools/runtime-build/modules.cjs'))('acorn');
const g=require('./game-context.cjs')('build/staging-index.html'),run=g.run,thai=/[ก-๙]/;
const dict=JSON.parse(run('JSON.stringify(GAME_TRANSLATIONS)'));
assert.deepEqual(Object.keys(dict.en).sort(),Object.keys(dict['zh-CN']).sort(),'Both languages must cover the same source keys');
for(const[lang,entries]of Object.entries(dict))for(const[key,value]of Object.entries(entries)){assert(value.trim(),lang+': empty translation '+key);assert(!thai.test(value),lang+': untranslated dictionary value '+key);}
const translate=(s,lang)=>run('translateGameText('+JSON.stringify(s)+','+JSON.stringify(lang)+',false)');
let checked=0;function check(s,where){if(typeof s!=='string'||!thai.test(s)||s==='฿')return;for(const lang of ['en','zh-CN'])assert(!thai.test(translate(s,lang)),where+' ['+lang+']: '+s);checked++;}
function walk(value,path){if(typeof value==='string')check(value,path);else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))walk(v,path+'.'+k);}
for(const name of run('Object.keys(SoulbeastContent)')){if(/ART|MUSIC|VOICE|PICTURE|SHAPE|TRANSLATION|LANGUAGE/.test(name))continue;walk(JSON.parse(run('JSON.stringify(SoulbeastContent['+JSON.stringify(name)+']())')),name);}
for(const dir of ['runtime','client'])for(const file of fs.readdirSync(dir).filter(f=>/\.(?:m?js)$/.test(f))){const ast=acorn.parse(fs.readFileSync(dir+'/'+file,'utf8'),{ecmaVersion:'latest',sourceType:'module',locations:true});function visit(n,parent){if(!n||typeof n!=='object')return;const explicit=parent?.type==='CallExpression'&&['ct','ctext','weaponText'].includes(parent.callee?.name);if(!explicit){if(n.type==='Literal')check(n.value,dir+'/'+file+':'+n.loc.start.line);if(n.type==='TemplateElement')check(n.value.cooked,dir+'/'+file+':'+n.loc.start.line);}for(const[k,v]of Object.entries(n))if(k!=='loc')if(Array.isArray(v))v.forEach(c=>visit(c,n));else if(v&&typeof v==='object')visit(v,n);}visit(ast);}
for(const id of run('Object.keys(SK)'))check(run('skillDesc('+JSON.stringify(id)+')').replace(/<[^>]*>/g,''),'skillDesc:'+id);
for(const catalog of ['SK','CLS','PAS','SP','ZN'])walk(JSON.parse(run('JSON.stringify('+catalog+')')),'active:'+catalog);
// A real text-node/attribute cycle verifies source restoration, not just dictionary presence.
const element=(attrs={},protectedContent=false)=>({nodeType:1,attrs,closest:()=>protectedContent?{}:null,getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;},querySelectorAll:()=>[]});
const root=element({'aria-label':'ตั้งสมาธิปัดป้อง'}),text={nodeValue:'ตั้งสมาธิปัดป้อง',parentElement:root},user=element({},true),name={nodeValue:'ลม',parentElement:user};
g.ctx.NodeFilter={SHOW_TEXT:4};g.ctx.document.documentElement={lang:'th'};g.ctx.document.createTreeWalker=()=>{const nodes=[text,name];return {nextNode:()=>nodes.shift()||null};};g.ctx.languageTestRoot=root;
for(const[lang,expected]of [['en','Focused Parry'],['zh-CN','凝神招架'],['th','ตั้งสมาธิปัดป้อง']]){run('GAME_LANGUAGE='+JSON.stringify(lang)+';applyGameLanguage(languageTestRoot)');assert.equal(text.nodeValue.trim(),expected);assert.equal(root.attrs['aria-label'].trim(),expected);assert.equal(name.nodeValue,'ลม','User content must remain unchanged');}
run('S.P.name="นักดาบลม"');assert.equal(run('translateGameText(S.P.name,"en")'),'นักดาบลม','Standalone custom names must be preserved');
assert.match(translate('ผสมธาตุที่ประทับกับการโจมตีปกติและสกิลโจมตีชั่วคราว ธาตุซ้ำนับครั้งเดียว','en'),/offensive skills/);
console.log('Localization passed: '+checked+' content/UI strings in English and Simplified Chinese; dictionary parity, attributes, user names and Thai round-trip.');
