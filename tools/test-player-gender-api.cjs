const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const acorn=require('module').createRequire(require('path').resolve('tools/runtime-build/modules.cjs'))('acorn');
const [beforePath,afterPath]=process.argv.slice(2);if(!beforePath||!afterPath)throw Error('Provide downloaded baseline and patched API');
const before=fs.readFileSync(beforePath,'utf8'),after=fs.readFileSync(afterPath,'utf8');assert.equal(require('./player-gender-api-patch.cjs')(before),after);
function engine(source){
 const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'module'}),fn=n=>ast.body.find(x=>x.type==='FunctionDeclaration'&&x.id.name===n),engine=fn('createEngine'),ret=engine.body.body.at(-1);
 assert.equal(ret.type,'ReturnStatement');
 const exposed=source.slice(engine.start,ret.start)+`return {hero(p){S={P:JSON.parse(JSON.stringify(p)),battle:null};return JSON.parse(JSON.stringify(playerUnit()));},directory:communityDirectory_,profiles:communityProfiles_,guild:code=>guildProfile_(code)};}`;
 const ctx={console,structuredClone,Date,TextEncoder,TextDecoder,Uint8Array,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};vm.createContext(ctx);
 vm.runInContext(source.slice(fn('createWorkbook').start,fn('createWorkbook').end)+'\n'+exposed+'\nthis.make=createEngine;this.work=createWorkbook;',ctx);
 const workbook=ctx.work({PlayerDirectory:[['publicId','code','name','level','class','avatar','lastSave'],['legacy-id','LEGACYTEST','เดิม',3,'mage','',1]],Coupons:[['code','name','coupons','totalDraws','rarePity','legendPity','updated','banned','reason','revision','creditCursor','bossClears','leaderboardId']]});
 const api=ctx.make(workbook,{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,text)=>Array.from(crypto.createHash('sha256').update(text).digest())});return {api,workbook};
}
const old=engine(before),fresh=engine(after),g=require('./game-context.cjs')('build/live-index.html');
const classes=JSON.parse(g.run('JSON.stringify(Object.keys(CLS))'));
for(const cls of classes)for(const gender of [undefined,'male','female','invalid']){
 const p=JSON.parse(g.run('JSON.stringify(S.P)'));p.cls=cls;p.gender=gender;
 const a=JSON.parse(JSON.stringify(old.api.hero(p))),b=JSON.parse(JSON.stringify(fresh.api.hero(p)));assert.equal(b.gender,['male','female'].includes(gender)?gender:undefined);delete b.gender;
 assert.deepEqual(b,a,cls+' appearance metadata must not change any combat field');
}
const legacyBefore=JSON.stringify(fresh.workbook.tables.PlayerDirectory[1]);
for(const [code,gender]of [['NEWMALETEST','male'],['NEWFEMALETEST','female'],['NEWOLDTEST',undefined]])fresh.api.directory(code,{name:code,cls:'swordsman',lv:3,gender});
assert.equal(JSON.stringify(fresh.workbook.tables.PlayerDirectory[1]),legacyBefore);
let profiles=fresh.api.profiles();assert.equal(profiles.find(p=>p.code==='LEGACYTEST').gender,undefined);
assert.equal(profiles.find(p=>p.code==='NEWMALETEST').gender,'male');assert.equal(profiles.find(p=>p.code==='NEWFEMALETEST').gender,'female');assert.equal(profiles.find(p=>p.code==='NEWOLDTEST').gender,undefined);
fresh.api.directory('NEWFEMALETEST',{name:'ย้ายอาชีพ',cls:'archmage',lv:40,gender:'female'});profiles=fresh.api.profiles();assert.equal(profiles.find(p=>p.code==='NEWFEMALETEST').gender,'female');assert.equal(profiles.find(p=>p.code==='NEWFEMALETEST').cls,'archmage');
assert.equal(fresh.api.guild('NEWFEMALETEST').gender,'female');assert.equal(fresh.api.guild('LEGACYTEST').gender,undefined);
console.log('PASS downloaded API: 252 class/gender snapshots preserve every combat field; existing 7-column directory row preserved; new/legacy profiles and guild gender retained');
