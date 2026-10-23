// Editorial source is in content/narrative-prose; this emits existing catalog factories.
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const root='content/narrative-prose',c={SoulbeastContent:{}};vm.createContext(c);
for(const f of ['narrative','secrets','localization'])vm.runInContext(fs.readFileSync('content/'+f+'.js','utf8'),c);
const tales=c.SoulbeastContent.WORLD_TALES(),secrets=c.SoulbeastContent.SECRET_LOCATIONS(),dict=c.SoulbeastContent.GAME_TRANSLATIONS(),names=c.SoulbeastContent.LANGUAGE_NAMES();
const fallback=require('./game-context.cjs')('build/staging-index.html');
const edits=[],langs=['th','en','zh-CN'],load=f=>JSON.parse(fs.readFileSync(root+'/'+f+'.json','utf8'));
const priorEdits=fs.existsSync(root+'/edit-manifest.json')?JSON.parse(fs.readFileSync(root+'/edit-manifest.json','utf8')).edits:[];
const proseKeys=new Set(['intro','scene','outcome','text','guard','decision','stages']);
function mechanics(x){if(Array.isArray(x))return x.map(mechanics);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!proseKeys.has(k)).map(([k,v])=>[k,mechanics(v)]));return x;}
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const balanceFile=root+'/mechanics-baseline.json';if(!fs.existsSync(balanceFile))fs.writeFileSync(balanceFile,JSON.stringify({WORLD_TALES:hash(mechanics(tales)),SECRET_LOCATIONS:hash(mechanics(secrets))},null,2)+'\n');
function register(triple){if(triple.length!==3||triple.some(s=>typeof s!=='string'||!s.trim()))throw Error('Incomplete prose translation');if(/[\u3400-\u9fff]/u.test(triple[0])||triple.slice(1).some(s=>/[ก-๙]/.test(s)))throw Error('Mixed-language prose: '+triple[0]);for(let i=1;i<3;i++)dict[langs[i]][triple[0]]=triple[i];return triple[0];}
for(const triple of load('interface'))register(triple);
function append(o,key,triple,path){if(!triple)return;register(triple);let old=o[key]||'';if(old.endsWith(triple[0]))return;const earlier=priorEdits.find(e=>e.path===path);if(earlier&&old.length===earlier.after)old=old.slice(0,earlier.before);const added=old?old+'\n\n'+triple[0]:triple[0];for(let i=1;i<3;i++){const prior=old?(dict[langs[i]][old]||fallback.run('translateGameText('+JSON.stringify(old)+','+JSON.stringify(langs[i])+',false)')):'';if(/[ก-๙]/.test(prior))throw Error('Untranslated prior prose: '+path);dict[langs[i]][added]=prior?prior+'\n\n'+triple[i]:triple[i];}o[key]=added;edits.push({path,before:old.length,after:added.length});}
const closings=load('closings');
for(const zone of ['training','moon','mist','desert','dragon','heaven','castle'])for(const[id,p]of Object.entries(load('quests-'+zone))){const q=tales.quests.find(q=>q.id===id);if(!q)throw Error(id);for(const key of ['intro','scene'])append(q,key,p[key],'quests.'+id+'.'+key);for(const[i,a]of q.actions.entries())append(a,'outcome',p.closing||closings[id],'quests.'+id+'.actions.'+i);}
for(const[id,steps]of Object.entries(load('stages'))){const q=tales.quests.find(q=>q.id===id);if(q.targets.length!==steps.length)throw Error('Stage count '+id);q.stages=steps.map(register);}
for(const[id,p]of Object.entries(load('events'))){const q=tales.special.find(q=>q.id===id);append(q,'scene',p.scene,'special.'+id+'.scene');for(const[i,a]of q.actions.entries())append(a,'outcome',p.outcomes?.[i],'special.'+id+'.actions.'+i);}
for(const[id,p]of Object.entries(load('secret-scenes'))){const d=secrets.locations.find(d=>d.id===id),q=tales.secrets.find(q=>q.zone===d.zone);append(d,'intro',p.intro,'locations.'+id+'.intro');append(d,'guard',p.guard,'locations.'+id+'.guard');append(q,'scene',p.decision,'secrets.'+id+'.scene');}
for(const[id,p]of Object.entries(load('repeatable'))){const d=secrets.repeatableEvents.find(d=>d.id===id);append(d,'text',p.text,'repeatable.'+id+'.text');for(const[i,choice]of d.choices.entries()){choice.outcome=register(p.outcomes[i]);}}
for(const[id,p]of Object.entries(load('riddles')))append(secrets.riddles.find(d=>d.id===id),'text',p,'riddles.'+id+'.text');
const expected=JSON.parse(fs.readFileSync(balanceFile,'utf8'));if(hash(mechanics(tales))!==expected.WORLD_TALES||hash(mechanics(secrets))!==expected.SECRET_LOCATIONS)throw Error('Prose must not change mechanics');
const emit=(f,data)=>fs.writeFileSync('content/'+f+'.js',"'use strict';\nObject.assign(SoulbeastContent,{"+Object.entries(data).map(([k,v])=>k+':()=> ('+JSON.stringify(v)+')').join(',')+'});\n');
emit('narrative',{WORLD_TALES:tales});emit('secrets',{SECRET_LOCATIONS:secrets});emit('localization',{GAME_TRANSLATIONS:dict,LANGUAGE_NAMES:names});
fs.writeFileSync(root+'/edit-manifest.json',JSON.stringify({version:1,quests:28,specialEvents:7,secretLocations:7,repeatableEvents:7,riddles:28,followStages:tales.quests.reduce((n,q)=>n+(q.stages?.length||0),0),edits:[...new Map([...priorEdits,...edits].map(e=>[e.path,e])).values()]},null,2)+'\n');
console.log('Expanded '+edits.length+' prose fields in all three languages; gameplay projection unchanged');
