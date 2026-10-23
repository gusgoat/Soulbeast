const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),vm=require('vm');
const g=require('./game-context.cjs')('build/staging-index.html');
const run=g.run;
const art=JSON.parse(fs.readFileSync('content/individual-skill-art.json','utf8')).skills;
const skills=JSON.parse(run('JSON.stringify(SK)'));
assert.deepEqual(Object.keys(skills).filter(k=>k.startsWith('enchant_')).sort(),['electric','fire','flying','ground','water'].map(e=>'enchant_'+e).sort());
for(const id of Object.keys(skills))assert(art.some(a=>a.id===id),'Missing artwork '+id);
const hashes=new Set(),locations=new Set();
for(const a of art){
 const location=a.path||a.kind+':'+a.index;assert(!locations.has(location),'Reused skill art '+a.id);locations.add(location);
 if(a.path){const buf=fs.readFileSync(a.path),hash=crypto.createHash('sha256').update(buf).digest('hex');assert.equal(hash,a.sha256);assert(!hashes.has(hash),'Identical image '+a.id);hashes.add(hash);}
 const html=run(`skillPicture(null,SK[${JSON.stringify(a.id)}],${JSON.stringify(a.id)})`);
 assert(html.includes(a.path||'signatures-'+a.kind+'.webp'),'Wrong image binding '+a.id);
 assert(html.includes('skill-raster'),'Skill must use a complete painted crop '+a.id);
}
run("var enchanted={stab:['normal'],types:['normal'],enchant:'electric'};");
assert.equal(run("JSON.stringify(effectiveElement(enchanted,SK.sw_magnum))"),'["fire","electric"]');
assert.equal(run("effectiveElement(enchanted,SK.attack)"),'electric');
assert.equal(run("effectiveElement({...enchanted,enchant:'fire'},SK.sw_magnum)"),'fire');
for(const t of ['p','m','h','auto'])assert.equal(run(`JSON.stringify(effectiveElement(enchanted,{t:'${t}',el:'water'}))`),'["water","electric"]');
for(const t of ['heal','buff','form','status','debuff','rest'])assert.equal(run(`effectiveElement(enchanted,{t:'${t}',el:'water'})`),'water');
for(const el of ['fire','electric','ground','water','flying'])for(const target of Object.keys(JSON.parse(run('JSON.stringify(EL)')))){
 assert.equal(run(`attackMultiplier({...enchanted,enchant:'${el}'},{t:'p',el:'fire'},{types:['${target}'],pas:[],buffs:[]})`),run(`typeMult(${JSON.stringify([...new Set(['fire',el])])},['${target}'])`));
}
assert.equal(run("attackMultiplier({...enchanted,enchant:'ground'},{t:'m',el:'fire'},{types:['normal'],pas:['levitate'],buffs:[]})"),0);
assert.equal(run("attackMultiplier({...enchanted,enchant:'water'},{t:'h',el:'electric'},{types:['ground'],pas:[],buffs:[]})"),0,'An immune component blocks the composite attack');
assert.equal((run("skillElementOnly(enchanted,SK.sw_magnum,'sw_magnum')").match(/class="element-icon/g)||[]).length,2);
// Authoritative online engine must expose the exact same rules and catalogue as the client.
const server=fs.readFileSync('server/accounts/engine.ts','utf8');
for(const file of ['runtime/core.js','runtime/catalogs.js']){
 const src=fs.readFileSync(file,'utf8');
 for(const unit of file.endsWith('core.js')?['0010-typeMult','0101-effectiveElement']:['0082-ForOfStatement','0084-CLS-swordsman']){
  const body=src.split('// @soulbeast-unit '+unit)[1].split('// @soulbeast-end '+unit)[0].trim();assert(server.replaceAll('\r','').includes(body.replaceAll('\r','')),'Server rule drift '+unit);
 }
}
// Exercise the actual hitOne pipeline, rather than just the effectiveness helper.
run(`Sound.fx=()=>{};ExtraAudio.play=()=>{};ExtraAudio.skill=()=>{};Math.random=()=>.99;
 var attacker=playerUnit();attacker.st={...attacker.st,patk:100,matk:100,crit:0};attacker.stab=['normal'];attacker.types=['normal'];attacker.pas=[];attacker.buffs=[];attacker.status={};
 var victim=wildUnit('kappa',10,0);victim.types=['water'];victim.st={...victim.st,hp:100000,pdef:100,mdef:100};victim.hp=100000;victim.pas=[];victim.buffs=[];victim.status={};
 S.battle={kind:'wild',allies:[attacker],enemies:[victim],log:[],fx:[]};
 var testSkill={n:'ไฟทดสอบ',t:'m',el:'fire',pw:100,acc:100};
 hitOne(attacker,testSkill,victim,1);var ordinary=100000-victim.hp;victim.hp=100000;attacker.enchant='electric';hitOne(attacker,testSkill,victim,1);var infused=100000-victim.hp;`);
assert(run('ordinary>0'));assert(Math.abs(run('infused-ordinary*2'))<=1,'Magic damage must include infused electricity');
console.log('PASS distinct artwork for all '+Object.keys(skills).length+' skills + defend; five enchantments; physical/magic/hybrid damage, duplicate/neutral elements, immunities, levitate, badges and server parity.');
