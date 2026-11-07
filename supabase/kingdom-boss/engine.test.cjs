const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2],'utf8');
let now=Date.parse('2026-11-07T05:00:00Z');class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const math=Object.create(Math);math.random=()=>0.3;
const ctx=vm.createContext({Math:math,console,TextEncoder,TextDecoder,Uint8Array,Date:Clock,structuredClone,crypto:crypto.webcrypto,btoa,atob,sha256:v=>crypto.createHash('sha256').update(v).digest()});
vm.runInContext(source.split('const accountCors=')[0].replace(/^import .*\r?\n/gm,''),ctx);
const book=vm.runInContext('createWorkbook({})',ctx),utils=vm.runInContext('createUtilities(s=>sha256(new TextEncoder().encode(s)),()=>crypto.randomUUID())',ctx);
const send=packet=>ctx.createEngine(book,utils).dispatch(packet);
const starter=vm.runInContext("accountTemplates['swordsman|mandrake']",ctx);
const codes=['KBFIRST000000001','KBSECOND00000002'],pin='test123456';
for(let i=0;i<2;i++){
 const state=structuredClone(starter);Object.assign(state.P,{country:['blue','red'][i],code:codes[i],name:'KB QA '+i,lv:60});
 const r=send({action:'save',code:codes[i],pin,data:JSON.stringify(state)});assert(r.ok,JSON.stringify(r));
}
const tick=()=>send({action:'kingdom_boss_tick',_kbInternal:true,_kbTesting:true});
const first=tick();assert(first.ok&&first.event?.status==='active');assert.equal(first.event.start,now);
assert.deepEqual(tick().event,first.event);assert(!send({action:'kingdom_boss_tick'}).ok);
const round=first.event.id,{x,y}=first.event.position;
const act=(i,action,extra={})=>{
 const r=send({action:'kingdom_boss_'+action,code:codes[i],pin,round,_kbTesting:true,...extra});assert(r.ok,JSON.stringify(r));return r;
};
const a=act(0,'move',{map:first.event.country,x,y}),b=act(1,'move',{map:first.event.country,x,y});
assert.equal(a.fight.kind,'boss');assert.equal(b.fight.kind,'boss');assert.notEqual(a.fight.id,b.fight.id);
assert.equal(a.fight.battle.enemies[0].noseal,true);
now+=550;
const after=act(0,'poll',{fight:a.fight.id,turn:0});assert.equal(after.fight.turn,1);assert(after.fight.battle.turns===1);
assert.equal(act(0,'poll',{fight:a.fight.id,turn:0}).fight.turn,1);
assert.equal(act(1,'poll',{fight:b.fight.id,turn:-1}).fight.battle.enemies[0].hp,after.event.hp);
// Reduce the boss to 1 HP only in this isolated workbook; verify a real attack ends the round.
const row=book.tables.GuildState.find(r=>r[0]==='kb:'+round),weak=JSON.parse(row[1]);weak.hp=1;const replay=weak.fights[a.fight.id].battle;replay.queue=[];for(const ally of replay.allies){ally.hp=ally.st.hp;ally.st.spd=50000;ally.st.patk=50000;ally.status={};ally.dots=[];ally.buffs=[];}row[1]=JSON.stringify(weak);
let result=after;for(let tries=0;tries<15&&result.event.status==='active';tries++){
 now+=600;result=act(0,'poll',{fight:a.fight.id,turn:result.fight.turn});
}
assert.equal(result.event.status,'defeated');assert.equal(result.event.winner,'KB QA 0');assert.equal(tick().event.status,'defeated');
const ended=act(1,'poll',{fight:b.fight.id,turn:0});assert.notEqual(ended.fight.status,'active');
const load=()=>{const r=send({action:'load',code:codes[0],pin});assert(r.ok,JSON.stringify(r));return JSON.parse(r.data);};
const rewarded=load(),repeated=load();assert.equal(rewarded.P.gold,1150);assert.equal(rewarded.P.parts[first.event.species+'|0'],1);
assert.equal(rewarded.P.pets.at(-1).sp,first.event.species);assert.equal(rewarded.P.pets.at(-1).lv,10);
assert.equal(repeated.P.pets.length,rewarded.P.pets.length);assert.equal(repeated.P.gold,rewarded.P.gold);
const save=send({action:'save',code:codes[0],pin,data:JSON.stringify(rewarded)});assert(save.ok,JSON.stringify(save));assert.equal(load().P.parts[first.event.species+'|0'],1);
assert.equal(book.tables.CouponCredits.slice(1).filter(r=>r[3]==='kingdom-boss').length,1);
const messages=send({action:'mail_list',code:codes[0],pin});assert(messages.ok,JSON.stringify(messages));assert.equal(messages.messages.filter(m=>m.kind==='kingdomBoss').length,1);
now=first.event.start+7200000;const next=tick();assert.equal(next.event.start,now);assert.notEqual(next.event.id,round);
now=next.event.end;assert.equal(tick().event.status,'expired');
assert.equal(book.tables.CouponCredits.slice(1).filter(r=>r[3]==='kingdom-boss').length,1);
console.log('PASS: authoritative spawn, isolated concurrent fights, shared HP, turn replay, one winner, mail rewards and 12/14 Bangkok test rounds');
