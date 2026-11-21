const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'../game-app.87fd16861796bebd.js'),'utf8');
function harness(){
 let now=10000,serial=0,active=false,reduced=false,pending=null;const timers=new Map(),videos=[],applied=[];
 const scope={console,Set,Map,Math,Number,Date:{now:()=>now},crypto:{randomUUID:()=> 'test-draw'},SHEET_URL:'local-test',COMMUNITY:{},S:{P:{},screen:'gacha'},SP:{normal:{n:'normal'},legend:{n:'legend',legendary:true},solar_a:{n:'A',solar:true},solar_b:{n:'B',solar:true}},GACHA:{busy:false,rewards:[]},handlers:{},
 window:{matchMedia:()=>({matches:reduced}),SoulbeastCinematics:{isOpen:()=>active,gacha(rewards){videos.push(Array.from(rewards,r=>r.key));active=true;}}},
 document:{querySelector:()=>null,querySelectorAll:()=>[]},setTimeout(fn,delay=0){const id=++serial;timers.set(id,{fn,at:now+delay});return id},clearTimeout:id=>timers.delete(id),
 Sound:{enabled:true,volume:.5,run:fn=>fn(),hiss(){}},ExtraAudio:{play(){}},Music:{tracks:{},sync(){}},render(){},toast(){},communityError:x=>x,communityBattleBusy:()=>false,communitySave:async()=>{},communityAuth:()=>({}),communityApplyData:(...args)=>applied.push(args),gachaReadPending:()=>pending,gachaStorePending:p=>{pending=p},lbPost:async()=>({ok:true,coupons:9,totalDraws:1,rarePity:0,legendPity:0,solarPity:0,data:{serverReceipt:true},accountSaveAt:123,rewards:[{type:'pet',key:'solar_a'}]})};
 const ctx=vm.createContext(scope);vm.runInContext(code.slice(code.indexOf('const GachaReveal='),code.indexOf('function vGacha()')),ctx);
 vm.runInContext(code.slice(code.indexOf('const ReleaseGacha='),code.indexOf('function gachaSortedRewards')),ctx);
 vm.runInContext(code.slice(code.indexOf('async function gachaCall(draw=0)'),code.indexOf('function gachaRewardCard')),ctx);
 const run=s=>vm.runInContext(s,ctx);
 function advance(ms){const until=now+ms;let guard=1000;while(guard--){const next=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();}assert.ok(guard>0);now=until;}
 function receipt(keys){active=false;scope.GACHA.rewards=keys.map(key=>({type:'pet',key}));run('gachaRevealSync()');advance(3000);}
 return {scope,run,advance,receipt,videos,applied,setActive:v=>active=v,setReduced:v=>reduced=v};
}
(async()=>{
 const h=harness();h.setReduced(true);await h.run('gachaCall(1)');h.advance(3000);assert.deepEqual(h.videos,[],'server receipt must not play intro');assert.equal(h.applied[0][0].serverReceipt,true);assert.equal(h.scope.GACHA.coupons,9);h.setReduced(false);
 h.receipt(['normal','solar_a','solar_b']);h.run('handlers.gachaRevealOne(0)');h.advance(650);assert.equal(h.videos.length,0);
 h.run('handlers.gachaRevealOne(1)');h.advance(649);assert.equal(h.videos.length,0);h.advance(1);assert.deepEqual(h.videos,[['solar_a']]);h.run('handlers.gachaRevealOne(1)');h.advance(800);assert.equal(h.videos.length,1);
 h.setActive(false);h.run('handlers.gachaRevealAll()');h.advance(650);assert.deepEqual(h.videos,[['solar_a'],['solar_b']]);h.setActive(false);h.run('handlers.gachaRevealAll()');h.advance(800);assert.equal(h.videos.length,2);
 h.receipt(['solar_a','solar_b']);h.run('handlers.gachaRevealOne(0)');h.advance(200);h.run('handlers.gachaRevealOne(1)');h.advance(649);assert.equal(h.videos.length,2);h.advance(1);assert.deepEqual(h.videos.at(-1),['solar_a','solar_b'],'rapid reveals must queue both videos');
 h.receipt(['solar_a']);h.run('handlers.gachaRevealOne(0)');h.setActive(true);h.advance(900);assert.equal(h.videos.length,3);h.setActive(false);h.advance(50);assert.equal(h.videos.length,4);
 h.receipt(['solar_b']);h.run('handlers.gachaRevealOne(0)');h.scope.GACHA.rewards=[];h.advance(650);assert.equal(h.videos.length,4,'stale receipt must not play');
 h.receipt(['solar_b']);h.run('handlers.gachaRevealOne(0)');h.scope.S.screen='town';h.advance(650);assert.equal(h.videos.length,4,'leaving gacha cancels pending intro');h.scope.S.screen='gacha';
 h.receipt(['solar_a']);h.setReduced(true);h.run('handlers.gachaRevealOne(0)');assert.equal(h.videos.length,4);h.advance(0);assert.deepEqual(h.videos.at(-1),['solar_a']);
 console.log('PASS gacha receipt stays secret; intro follows card flip; reveal-all, rapid clicks, duplicates, stale receipts, navigation and reduced motion');
})().catch(e=>{console.error(e);process.exitCode=1});
