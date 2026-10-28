const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const raw=JSON.parse(require('./game-context.cjs')('build/live-index.html').run('JSON.stringify(S)'));
let now=Date.parse('2026-10-29T12:00:00+07:00');class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const source=fs.readFileSync('build/accounts/index.ts','utf8').split('const accountTemplates=')[0].replace(/^import .*\r?\n/gm,'');
const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Date:Clock,structuredClone,crypto:crypto.webcrypto,btoa,atob,sha256:v=>crypto.createHash('sha256').update(v).digest()});vm.runInContext(source,ctx);
const book=vm.runInContext('createWorkbook({})',ctx),utilities=vm.runInContext('createUtilities(s=>sha256(new TextEncoder().encode(s)),()=>crypto.randomUUID())',ctx),engine=ctx.createEngine(book,utilities);
const ids={a:'BLUECHARACTER001',b:'BLUECHARACTER002',g:'GREENCHARACTER01',r:'REDCHARACTER001',r2:'REDCHARACTER002',r3:'REDCHARACTER003',r4:'REDCHARACTER004'};
// Codes must be exactly 16 characters for the public account API; the engine supports legacy codes too.
for(const k in ids)ids[k]=ids[k].padEnd(16,'X');
const call=(key,action,extra={})=>ctx.createEngine(book,utilities).dispatch({action,code:ids[key]||key,pin:'123456',...extra});
const save=(key,country)=>{const state=structuredClone(raw);state.P.code=ids[key];state.P.name='ทดสอบ '+key;if(country)state.P.country=country;const r=call(key,'save',{data:JSON.stringify(state),name:state.P.name,lv:state.P.lv});assert(r.ok,JSON.stringify(r));};
const read=id=>JSON.parse(book.tables.GuildState.find(r=>r[0]===id)[1]);const put=(id,value)=>book.tables.GuildState.find(r=>r[0]===id)[1]=JSON.stringify(value);
save('a','blue');save('b','blue');save('g','green');for(const key of ['r','r2','r3','r4'])save(key,'red');
let v=call('a','country_status');assert(v.ok,JSON.stringify(v));assert.equal(v.me.country,'blue');assert.equal(v.me.location,'blue-capital');assert.equal(v.map.locations.length,37);assert(!JSON.stringify(v.map).includes(ids.r));
assert.equal(call('a','country_choose',{country:'red'}).error,'country immutable');
const loaded=call('a','load'),tamper=JSON.parse(loaded.data);tamper.P.country='red';assert.equal(call('a','save',{data:JSON.stringify(tamper)}).error,'country immutable');delete tamper.P.country;assert(call('a','save',{data:JSON.stringify(tamper)}).ok);assert.equal(JSON.parse(call('a','load').data).P.country,'blue');
assert.equal(call('a','country_action',{kind:'move',target:'red-capital'}).error,'country adjacent required');
assert.equal(call('a','country_action',{kind:'move',target:'blue-city-1',item:'pot'}).error,'country automatic only');
now=Date.parse('2026-10-29T21:59:59+07:00');assert.equal(call('a','mail_list').messages.length,0);
now+=1000;let daily=call('a','mail_list');assert.equal(daily.messages.length,1);assert.equal(daily.messages[0].kind,'daily');assert.equal(daily.messages[0].gold,280);assert.equal(daily.messages[0].coupons,0);const dailyDelta=daily.account.delta;assert.equal(call('a','mail_list').account.delta,dailyDelta);assert.equal(call('b','mail_list').messages[0].gold,280,'Every country character receives a daily share, without entering the mode');
v=call('a','country_action',{kind:'move',target:'blue-city-1'});assert(v.ok);assert(v.me.used);assert.equal(v.me.location,'blue-city-1');assert.equal(call('a','country_action',{kind:'defend'}).error,'country daily limit');assert.equal(call('a','country_team').error,'country capital only');
now+=86400000;v=call('a','country_action',{kind:'move',target:'blue-capital'});assert(v.ok);assert(v.me.team.every(u=>u.hp===u.st.hp&&u.mp===u.st.mp));
// Set an isolated border scenario, then use real automatic battle code. Four defenders require two daily attacks.
for(const k of ['a','b']){const m=read('cw:m:'+ids[k]);m.location='blue-village-9';m.team.forEach(u=>{u.st.patk=u.st.matk=10000;u.st.hp=u.hp=10000;u.skills=['attack'];});m.lastActionDay='';put('cw:m:'+ids[k],m);}
for(const k of ['r','r2','r3','r4']){const m=read('cw:m:'+ids[k]);m.location='red-village-1';m.team.forEach(u=>{u.hp=u.st.hp=1;u.mp=0;u.st.spd=1;u.st.patk=u.st.matk=1;u.skills=['attack'];});put('cw:m:'+ids[k],m);}
const mainSave=JSON.parse(call('a','load').data).P;v=call('a','country_action',{kind:'attack',target:'red-village-1'});assert(v.ok,JSON.stringify(v));assert(v.last.battle);assert.equal(v.last.players.length,4);assert.equal(v.last.winner,0);assert.equal(v.last.remaining,2);assert.equal(v.last.captured,false);assert.equal(v.me.location,'blue-village-9');assert.equal(JSON.parse(call('a','load').data).P.hp,mainSave.hp,'War damage must not touch forest HP');
assert.equal(read('cw:m:'+ids.b).lastActionDay,'','Random assistance does not spend the helper action');
const casualties=['r','r2','r3','r4'].map(k=>read('cw:m:'+ids[k])).filter(m=>m.location==='red-capital');assert.equal(casualties.length,2);assert(casualties.every(m=>m.team.every(u=>u.hp===u.st.hp&&u.mp===u.st.mp)));assert(casualties.every(m=>m.lastActionDay));
now+=86400000;v=call('a','country_action',{kind:'attack',target:'red-village-1'});assert(v.ok,JSON.stringify(v));assert.equal(v.last.captured,true);assert.equal(v.me.location,'red-village-1');assert.equal(v.map.locations.find(x=>x.id==='red-village-1').owner,'blue');
// Full-capacity checks happen at the authoritative action, not from browser counts.
let gm=read('cw:m:'+ids.g);gm.location='green-village-1';put('cw:m:'+ids.g,gm);for(let i=0;i<16;i++)book.tables.GuildState.push(['cw:m:full'+i,JSON.stringify({...gm,code:'full'+i,name:'ฐานเต็ม',location:'green-city-1'})]);
assert.equal(call('g','country_action',{kind:'move',target:'green-city-1'}).error,'country base full');assert(!call('g','country_status').me.used);
// Initialize a prior-period boundary and verify exactly-once payouts, rational carry, private mail and credits.
for(let i=book.tables.GuildState.length-1;i>0;i--)if(book.tables.GuildState[i][0].startsWith('cw:m:full'))book.tables.GuildState.splice(i,1);
now=Date.parse('2026-10-31T23:59:59+07:00');assert.equal(call('a','mail_list').messages.filter(m=>m.kind==='monthly').length,0);
now+=1000;let monthly=call('a','mail_list'),award=monthly.messages.find(m=>m.kind==='monthly');assert.equal(award.rank,1);assert.equal(award.coupons,10);assert.equal(award.score,21);assert.equal(call('g','mail_list').messages.find(m=>m.kind==='monthly').coupons,5);assert.equal(call('r','mail_list').messages.find(m=>m.kind==='monthly').gold,1000);
const monthlyBalance=monthly.coupons;assert.equal(call('a','mail_list').coupons,monthlyBalance);assert.equal(call('a','mail_list').messages.filter(m=>m.kind==='monthly').length,1);
for(const k of Object.keys(ids)){const m=read('cw:m:'+ids[k]);assert.equal(m.location,m.country+'-capital');assert.equal(m.lastActionDay,'');assert(m.team.every(u=>u.hp===u.st.hp&&u.mp===u.st.mp));}
assert.equal(read('cw:l:red-village-1').owner,'red');assert.equal(read('cw:season:2026-10').ranks[0].country,'blue');assert.equal(call('a','country_status').season,'2026-11');
// A new-season conquest also verifies weekly fractional rewards independently of monthly reset.
put('cw:l:red-village-1',{id:'red-village-1',owner:'blue'});
now=Date.parse('2026-11-01T23:58:59+07:00');assert.equal(call('a','mail_list').messages.filter(m=>m.kind==='weekly').length,0);
now=Date.parse('2026-11-01T23:59:00+07:00');v=call('a','mail_list');v.messages=v.messages.filter(m=>m.kind==='weekly');assert(v.ok);assert.equal(v.messages.length,1);assert(v.messages[0].delivered);const amount=v.messages[0].gold,coupons=v.messages[0].coupons;assert.equal(amount,2850);assert.equal(coupons,2);assert.equal(v.messages[0].couponFraction.n,'1');assert.equal(v.messages[0].couponFraction.d,'16');
const campDelta=v.account.delta;assert.equal(call('a','mail_list').account.delta,campDelta);assert.equal(call('a','mail_list').coupons,v.coupons);assert.equal(call('g','mail_read',{mail:v.messages[0].id}).error,'mail not found');assert(call('a','mail_read',{mail:v.messages[0].id}).ok);assert(call('a','mail_list').messages.find(m=>m.id===v.messages[0].id).read);
now+=604800000;v=call('a','mail_list');v.messages=v.messages.filter(m=>m.kind==='weekly');assert.equal(v.messages.length,2);assert.equal(v.messages[0].couponFraction.n,'1');assert.equal(v.messages[0].couponFraction.d,'8');
console.log('PASS permanent nation, legacy-save preservation, daily action, adjacency/capacity, capital heal, PVP roster, actual 2-v-2 automatic combat, two-day conquest, casualties/respawn, helper rights, HP isolation, exact weekly fractional rewards, no duplicate credits and private read-only reward mail.');
// Smaller formations still execute the same authoritative combat and terrain comes from the base.
for(const [attackers,defenders]of [[2,1],[1,1]]){
 const a=read('cw:m:'+ids.a),b=read('cw:m:'+ids.b);a.location='blue-village-9';a.lastActionDay='';a.team.forEach(u=>u.hp=u.st.hp);b.location=attackers===2?a.location:'blue-capital';put('cw:m:'+ids.a,a);put('cw:m:'+ids.b,b);
 const ownerKey='cw:l:red-village-1';put(ownerKey,{id:'red-village-1',owner:'red'});
 for(const [i,k]of ['r','r2','r3','r4'].entries()){const m=read('cw:m:'+ids[k]);m.location=i<defenders?'red-village-1':'red-capital';m.team.forEach(u=>{u.hp=1;u.st.hp=1;});put('cw:m:'+ids[k],m);}
 const result=call('a','country_action',{kind:'attack',target:'red-village-1',terrain:'snow'});assert(result.ok,JSON.stringify(result));assert.equal(result.last.attackers,attackers);assert.equal(result.last.defenders,defenders);assert.equal(result.last.players.length,attackers+defenders);assert.equal(result.last.terrain,'volcano');assert.equal(result.last.battle.terrain,'volcano');
}
console.log('PASS daily 22:00 Bangkok boundary, country-wide eligibility, duplicate prevention, actual 2-v-1 and 1-v-1 combat, and authoritative terrain after ownership changes.');
{
 const restoreNow=now;now=Date.parse('2026-10-29T12:00:00+07:00');const freshBook=ctx.createWorkbook({}),fresh=p=>ctx.createEngine(freshBook,utilities).dispatch(p),code='MONTHLATEBLUE001';
 for(const [country,id]of [['blue',code],['green','MONTHLATEGREEN01'],['red','MONTHLATERED0001']]){const state=structuredClone(raw);state.P.country=country;assert(fresh({action:'save',code:id,pin:'123456',data:JSON.stringify(state)}).ok);}
 freshBook.tables.GuildState.push(['cw:l:red-village-1',JSON.stringify({id:'red-village-1',owner:'blue'})]);
 now=Date.parse('2026-11-02T08:00:00+07:00');const mails=fresh({action:'mail_list',code,pin:'123456'}).messages;
 assert.equal(mails.filter(m=>m.kind==='monthly').length,1);assert.equal(mails.find(m=>m.kind==='monthly').score,21);assert.equal(mails.find(m=>m.kind==='weekly').pool.gold,5600,'Late weekly settlement must use reset ownership after the monthly boundary');assert.equal(mails.find(m=>m.kind==='daily'&&m.week==='2026-10-31').gold,570);assert.equal(mails.find(m=>m.kind==='daily'&&m.week==='2026-11-01').gold,560);assert.equal(fresh({action:'mail_list',code,pin:'123456'}).messages.length,mails.length);
 now=restoreNow;console.log('PASS monthly rank prizes per character, midnight payout/reset, capital respawn/full health, preserved country, duplicate prevention, tied rankings and chronological catch-up across daily/monthly/weekly boundaries.');
}
(async()=>{
 // Two separate devices race for the final city slot through the real snapshot/CAS service.
 for(const key of ['race1','race2']){ids[key]=('GREEN'+key.toUpperCase()).padEnd(16,'0');save(key,'green');const m=read('cw:m:'+ids[key]);m.location=key==='race1'?'green-village-1':'green-village-2';put('cw:m:'+ids[key],m);}
 const resident=read('cw:m:'+ids.g);for(let i=0;i<15;i++)book.tables.GuildState.push(['cw:m:capacity'+i,JSON.stringify({...resident,code:'capacity'+i,location:'green-city-1'})]);
 let tables=structuredClone(book.tables),revision=0,conflicts=0;const receipts=new Map();
 const rpc=async(name,args)=>{
  if(name==='sb_engine_snapshot')return {data:{mode:'test',revision,tables:structuredClone(tables),receipt:receipts.get(args.p_request)}};
  if(name==='sb_engine_commit'){if(args.p_expected!==revision){conflicts++;return {data:{conflict:true}};}Object.assign(tables,structuredClone(args.p_changes));revision++;receipts.set(args.p_request,{digest:args.p_digest,result:args.p_result});return {data:{result:args.p_result}};}
  if(['sb_record_activity','sb_engine_auth_failure'].includes(name))return {data:{}};throw Error(name);
 };
 const service=ctx.createGameService({rpc}),packets=['race1','race2'].map(key=>({action:'country_action',code:ids[key],pin:'123456',kind:'move',target:'green-city-1',_sbRequest:crypto.randomUUID()}));
 const results=await Promise.all(packets.map(p=>service(p,'test')));assert.equal(results.filter(x=>x.ok).length,1);assert.equal(results.find(x=>!x.ok).error,'country base full');assert(conflicts>=1,'Race must exercise the CAS retry');
 const roster=tables.GuildState.filter(r=>r[0].startsWith('cw:m:')).map(r=>JSON.parse(r[1]));assert.equal(roster.filter(m=>m.location==='green-city-1').length,16);const winning=results.findIndex(x=>x.ok);const commits=revision;assert.deepEqual(await service(packets[winning],'test'),results[winning]);assert.equal(revision,commits,'Lost response must return its original receipt without spending twice');
 const loser=roster.find(m=>m.code===packets[1-winning].code);assert.equal(loser.lastActionDay,'');console.log('PASS actual CAS concurrency: one of two city-slot contenders succeeds; loser retains action; lost-response retry returns original receipt without duplicate commit.');
})().catch(e=>{console.error(e);process.exitCode=1;});
