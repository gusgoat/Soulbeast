const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const raw=JSON.parse(require('./game-context.cjs')('build/live-index.html').run('JSON.stringify(S)'));
let now=Date.parse('2026-10-29T12:00:00+07:00');class Clock extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
const source=fs.readFileSync('build/accounts/index.ts','utf8').split('const accountTemplates=')[0].replace(/^import .*\r?\n/gm,'');
const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Date:Clock,structuredClone,crypto:crypto.webcrypto,btoa,atob,sha256:v=>crypto.createHash('sha256').update(v).digest()});vm.runInContext(source,ctx);
const utilities=ctx.createUtilities(s=>crypto.createHash('sha256').update(s).digest(),()=>crypto.randomUUID());
const at=s=>now=Date.parse(s+'+07:00');
function world(){
 at('2026-10-29T12:00:00');const book=ctx.createWorkbook({}),codes={},id=k=>codes[k]||=(k.toUpperCase()+'COUNTRY').padEnd(16,'0');
 const call=(k,action,extra={})=>ctx.createEngine(book,utilities).dispatch({action,code:id(k),pin:'123456',...extra});
 const read=key=>{const r=book.tables.GuildState.find(r=>r[0]===key);return r&&JSON.parse(r[1]);},put=(key,value)=>{const r=book.tables.GuildState.find(r=>r[0]===key);if(r)r[1]=JSON.stringify(value);else book.tables.GuildState.push([key,JSON.stringify(value)]);};
 const save=(k,country)=>{const state=structuredClone(raw);state.P.code=id(k);state.P.name='ทดสอบ '+k;if(country)state.P.country=country;const result=call(k,'save',{data:JSON.stringify(state),name:state.P.name,lv:state.P.lv});assert(result.ok,JSON.stringify(result));return id(k);};
 const member=k=>read('cw:m:'+id(k)),edit=(k,fn)=>{const m=member(k);fn(m);put('cw:m:'+id(k),m);return m;},mails=k=>call(k,'mail_list').messages;
 const place=(k,location,guard=false)=>edit(k,m=>{m.location=location;m.lastActionDay='';m.deadUntil=null;m.capitalGuard=guard;m.capitalWounded=guard;m.slotSince=guard||!location.endsWith('capital')?now:null;m.team.forEach(u=>{u.hp=u.st.hp;u.mp=u.st.mp;});});
 return {book,id,call,read,put,save,member,edit,mails,place};
}
function guardRows(w,count){const base=w.member('a');for(let i=0;i<count;i++){const code='FAKEGUARD'+String(i).padStart(7,'0');w.put('cw:m:'+code,{...structuredClone(base),code,name:'ผู้ป้องกัน '+i,location:'blue-capital',capitalGuard:true,capitalWounded:true,slotSince:now,lastParticipation:now});}}
{
 const w=world();for(const [k,n]of [['a','blue'],['b','blue'],['c','blue'],['g','green'],['r','red']])w.save(k,n);
 let v=w.call('a','country_status');assert(v.ok);assert.equal(v.me.country,'blue');assert.equal(v.map.locations.length,37);assert.equal(v.map.locations.find(n=>n.id==='blue-capital').count,0,'Reserves do not occupy guard slots');assert(!JSON.stringify(v.map).includes(w.id('r')));
 assert.equal(w.call('a','country_choose',{country:'red'}).error,'country immutable');const old=JSON.parse(w.call('a','load').data);old.P.country='red';assert.equal(w.call('a','save',{data:JSON.stringify(old)}).error,'country immutable');delete old.P.country;assert(w.call('a','save',{data:JSON.stringify(old)}).ok);assert.equal(JSON.parse(w.call('a','load').data).P.country,'blue');
 assert.equal(w.call('a','country_action',{kind:'move',target:'red-capital'}).error,'country adjacent required');assert.equal(w.call('a','country_action',{kind:'move',target:'blue-city-1',item:'pot'}).error,'country automatic only');
 assert(w.call('c','country_action',{kind:'move',target:'blue-city-1'}).ok);
 at('2026-10-29T21:59:59');assert.equal(w.mails('a').length,0);at('2026-10-29T22:00:00');v=w.call('a','mail_list');assert.equal(v.messages[0].gold,780);assert.equal(v.messages[0].members,2);assert.equal(v.messages[0].pool.capitals,1);assert.equal(w.mails('c')[0].gold,780);assert.equal(w.mails('b').length,0,'Nation membership alone gives no reward');const delta=v.account.delta;assert.equal(w.call('a','mail_list').account.delta,delta);assert.equal(w.call('g','mail_read',{mail:v.messages[0].id}).error,'mail not found');
 at('2026-10-31T22:00:00');const cDaily=w.mails('c').find(m=>m.kind==='daily'&&m.week==='2026-10-31');assert.equal(cDaily.gold,1560,'An offline occupant remains eligible; inactive reserve excluded');assert.equal(w.mails('a').filter(m=>m.kind==='daily').length,1,'Mail reads do not renew participation');
 at('2026-11-01T00:00:00');assert.equal(w.mails('a').find(m=>m.kind==='monthly').coupons,10);assert.equal(w.mails('c').find(m=>m.kind==='monthly').coupons,10);assert.equal(w.mails('b').length,0);assert.equal(w.member('c').location,'blue-capital');assert.equal(w.member('c').slotSince,null);assert(!w.member('c').capitalGuard);
 at('2026-11-01T23:59:00');v=w.call('a','mail_list');const weekly=v.messages.find(m=>m.kind==='weekly');assert.equal(weekly.gold,4800);assert.equal(weekly.coupons,2);assert.equal(weekly.couponFraction.n,'1');assert.equal(weekly.couponFraction.d,'2');assert.equal(w.mails('b').length,0);
 at('2026-11-08T23:59:00');assert.equal(w.mails('a').filter(m=>m.kind==='weekly').length,1,'Last-week entry cannot earn an inactive week');assert.equal(w.mails('c').filter(m=>m.kind==='weekly').length,1,'Season reset must not silently enroll capital reserves');
 console.log('PASS permanent nations, privacy, action validation, daily 22:00 boundary, capital pools, eligible-only divisor, offline slots, inactive exclusions across day/week/month, fractional carry, private mail and no duplicate credits.');
}
{
 const w=world();for(const [k,n]of [['a','blue'],['b','blue'],['g','green'],['r','red']])w.save(k,n);
 for(const k of ['a','g','r'])w.call(k,'country_status');w.put('cw:l:red-city-1',{id:'red-city-1',owner:'blue'});w.put('cw:l:red-village-1',{id:'red-village-1',owner:'blue'});
 at('2026-11-02T08:00:00');const mails=w.mails('a'),monthly=mails.find(m=>m.kind==='monthly');assert.equal(monthly.score,53);assert.equal(monthly.rank,1);assert.equal(monthly.coupons,10);assert.equal(w.mails('g').find(m=>m.kind==='monthly').coupons,5);assert.equal(w.mails('r').find(m=>m.kind==='monthly').gold,1000);assert.equal(w.mails('b').length,0);
 assert.equal(w.read('cw:l:red-city-1').owner,'red');assert.equal(w.read('cw:season:2026-10').ranks[0].score,53);assert.equal(w.call('a','country_status').season,'2026-11');assert.equal(mails.find(m=>m.kind==='weekly').pool.gold,9600,'Late settlement must reset ownership before the next weekly reward');const count=mails.length;assert.equal(w.mails('a').length,count);assert(w.member('a').team.every(u=>u.hp===u.st.hp&&u.mp===u.st.mp));
 console.log('PASS village/city/capital 1/4/16 scores, eligible-only per-person monthly prizes, atomic monthly reset, archived standings, and chronological catch-up over daily/monthly/weekly boundaries.');
}
{
 const w=world();for(const k of ['a','b','c'])w.save(k,'blue');guardRows(w,30);
 w.edit('a',m=>{m.team[0].hp=1;m.team[0].mp=0;});assert(w.call('a','country_status').me.team.every(u=>u.hp===u.st.hp&&u.mp===u.st.mp),'Reserve automatically heals');
 assert(w.call('a','country_action',{kind:'defend'}).ok);assert(w.call('b','country_action',{kind:'defend'}).ok);assert.equal(w.call('c','country_action',{kind:'defend'}).error,'country guard full');assert(!w.member('c').lastActionDay);
 w.edit('a',m=>{m.team[0].hp=3;m.team[0].mp=1;});let v=w.call('a','country_status');assert.equal(v.me.team[0].hp,3);assert.equal(v.me.team[0].mp,1);assert.equal(w.call('a','country_team').error,'country guard healing locked');
 w.edit('a',m=>m.team[0].hp=0);v=w.call('a','country_status');assert(v.me.deadUntil);assert.equal(v.me.team[0].hp,0);assert(!v.me.capitalGuard);assert.equal(v.map.locations.find(n=>n.id==='blue-capital').count,31);assert(w.call('c','country_action',{kind:'defend'}).ok,'Death immediately frees a slot');
 const participated=w.member('a').lastParticipation;for(const packet of [{action:'country_team'},{action:'country_action',kind:'move',target:'blue-city-1'},{action:'country_action',kind:'defend'},{action:'country_action',kind:'attack',target:'red-city-1'}])assert.equal(w.call('a',packet.action,packet).error,'country dead until tomorrow');assert.equal(w.member('a').lastParticipation,participated);
 at('2026-10-29T23:59:59');assert(w.call('a','country_status').me.deadUntil);at('2026-10-30T00:00:00');v=w.call('a','country_status');assert(!v.me.deadUntil);assert(!v.me.used);assert(!v.me.capitalGuard);assert(v.me.team.every(u=>u.hp===u.st.hp&&u.mp===u.st.mp));
 // Leaving and returning cannot bypass the guard's until-death healing lock.
 w.edit('b',m=>m.team[0].hp=2);assert(w.call('b','country_action',{kind:'move',target:'blue-city-1'}).ok);at('2026-10-31T00:00:00');v=w.call('b','country_action',{kind:'move',target:'blue-capital'});assert.equal(v.me.team[0].hp,2);assert.equal(w.call('b','country_team').error,'country guard healing locked');
 console.log('PASS 32 first-come guard slots, reserve healing, guard HP/MP lock, no roster-heal exploit, immediate vacancy on any death, dead-day action lock, and full-health next-day reserve respawn.');
}
for(const [attackers,defenders,capital]of [[2,2,true],[2,1,false],[1,1,false]]){
 const w=world();for(const [k,n]of [['a','blue'],['b','blue'],['r','red'],['r2','red'],['reserve','red']])w.save(k,n);
 const target=capital?'red-capital':'red-village-1',origin=capital?'red-city-1':'blue-village-9';if(capital)w.put('cw:l:'+origin,{id:origin,owner:'blue'});
 w.place('a',origin);if(attackers===2)w.place('b',origin);for(const k of ['a','b'])w.edit(k,m=>m.team.forEach(u=>{u.st.hp=u.hp=10000;u.st.patk=u.st.matk=10000;u.skills=['attack'];}));
 for(const k of ['r',...(defenders===2?['r2']:[])]){w.place(k,target,capital);w.edit(k,m=>m.team.forEach(u=>{u.st.hp=u.hp=1;u.st.spd=1;u.st.patk=u.st.matk=1;u.skills=['attack'];}));}
 const forest=JSON.parse(w.call('a','load').data).P.hp,v=w.call('a','country_action',{kind:'attack',target,terrain:'snow'});assert(v.ok,JSON.stringify(v));assert.equal(v.last.players.length,attackers+defenders);assert.equal(v.last.attackers,attackers);assert.equal(v.last.defenders,defenders);assert.equal(v.last.terrain,'volcano');assert(v.last.captured);assert.equal(w.read('cw:l:'+target).owner,'blue');assert.equal(JSON.parse(w.call('a','load').data).P.hp,forest);assert(w.member('r').deadUntil);assert.equal(w.member('r').team[0].hp,0);if(attackers===2)assert.equal(w.member('b').lastActionDay,'');
 if(capital){assert(w.member('a').capitalGuard);assert(!w.member('reserve').deadUntil,'Unregistered capital residents must not enter combat');assert(!v.last.players.some(p=>p.name.includes('reserve')));assert.equal(v.ranks.find(r=>r.country==='blue').score,68);at('2026-10-30T00:00:00');const revived=w.call('r','country_status');assert(!revived.me.deadUntil);assert(!revived.me.capitalGuard);assert.equal(revived.me.location,'red-capital');assert(revived.map.locations.some(n=>n.id==='red-capital'&&n.owner==='blue'),'Home refuge remains visible after capital capture');}
}
console.log('PASS real automatic 2-v-2/2-v-1/1-v-1 battles, capital conquest, registered defenders only, captured capital scores/flags, reserve sanctuary, helper rights, next-day casualties, terrain authority and forest HP isolation.');
{
 const w=world();for(const [k,n]of [['a','blue'],['b','blue'],['r','red'],['r2','red'],['r3','red']])w.save(k,n);w.put('cw:l:red-city-1',{id:'red-city-1',owner:'blue'});
 for(const k of ['a','b']){w.place(k,'red-city-1');w.edit(k,m=>m.team.forEach(u=>{u.st.hp=u.hp=10000;u.st.patk=u.st.matk=10000;u.skills=['attack'];}));}for(const k of ['r','r2','r3']){w.place(k,'red-capital',true);w.edit(k,m=>m.team.forEach(u=>{u.hp=u.st.hp=1;u.st.spd=1;u.skills=['attack'];}));}
 let v=w.call('a','country_action',{kind:'attack',target:'red-capital'});assert.equal(v.last.remaining,1);assert(!v.last.captured);assert.equal(w.read('cw:l:red-capital'),undefined);
 at('2026-10-30T00:00:00');v=w.call('a','country_action',{kind:'attack',target:'red-capital'});assert(v.last.captured);assert.equal(v.last.defenders,1,'Yesterday casualties respawn as reserves, without reclaiming guard slots');assert.equal(v.pool.gold,14600);assert.equal(v.pool.couponEighths,52);assert.equal(v.dailyPool.gold,2660);
 console.log('PASS a capital with three guards requires two daily attacks; yesterday casualties never reclaim slots or rejoin defense automatically; captured capitals transfer reward income.');
}
(async()=>{
 for(const capital of [false,true]){
  const w=world();for(const k of ['a','b'])w.save(k,'blue');let target,kind;
  if(capital){guardRows(w,31);target=undefined;kind='defend';}else{w.place('a','blue-village-1');w.place('b','blue-village-2');const base=w.member('a');for(let i=0;i<15;i++)w.put('cw:m:city'+i,{...structuredClone(base),code:'city'+i,location:'blue-city-1'});target='blue-city-1';kind='move';}
  let tables=structuredClone(w.book.tables),revision=0,conflicts=0;const receipts=new Map();const rpc=async(name,args)=>{if(name==='sb_engine_snapshot')return {data:{mode:'test',revision,tables:structuredClone(tables),receipt:receipts.get(args.p_request)}};if(name==='sb_engine_commit'){if(args.p_expected!==revision){conflicts++;return {data:{conflict:true}};}Object.assign(tables,structuredClone(args.p_changes));revision++;receipts.set(args.p_request,{digest:args.p_digest,result:args.p_result});return {data:{result:args.p_result}};}if(['sb_record_activity','sb_engine_auth_failure'].includes(name))return {data:{}};throw Error(name);};
  const service=ctx.createGameService({rpc}),packets=['a','b'].map(k=>({action:'country_action',code:w.id(k),pin:'123456',kind,...(target?{target}:{}),_sbRequest:crypto.randomUUID()})),results=await Promise.all(packets.map(p=>service(p,'test')));assert.equal(results.filter(r=>r.ok).length,1);assert.equal(results.find(r=>!r.ok).error,capital?'country guard full':'country base full');assert(conflicts>=1);const won=results.findIndex(r=>r.ok),commits=revision;assert.deepEqual(await service(packets[won],'test'),results[won]);assert.equal(revision,commits);const rows=tables.GuildState.filter(r=>r[0].startsWith('cw:m:')).map(r=>JSON.parse(r[1]));assert.equal(rows.find(m=>m.code===packets[1-won].code).lastActionDay,'');assert.equal(rows.filter(m=>capital?m.capitalGuard:m.location===target).length,capital?32:16);
 }
 console.log('PASS real CAS races for final city and capital-guard slots: one winner, loser retains daily action, lost-response receipts do not double-spend.');
})().catch(e=>{console.error(e);process.exitCode=1;});
