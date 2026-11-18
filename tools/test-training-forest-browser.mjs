import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'training-forest-qa');
await mkdir(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/Soulbeast\//,'');
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(8831,'127.0.0.1',resolve));
const chrome=spawn(process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
  '--headless=new','--remote-debugging-port=9341',`--user-data-dir=${path.join(output,'chrome-profile')}`,
  '--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','about:blank'
],{windowsHide:true,stdio:'ignore'});
let socket,serial=0;
const pending=new Map(),errors=[];
async function until(fn,label,ms=30000){const end=Date.now()+ms;let last;while(Date.now()<end){try{last=await fn();if(last)return last;}catch(e){last=e.message;}await delay(100);}throw Error(label+': '+JSON.stringify(last));}
function send(method,params={}){const id=++serial;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},30000);pending.set(id,{resolve:x=>{clearTimeout(timeout);resolve(x);},reject:e=>{clearTimeout(timeout);reject(e);}});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png'});await writeFile(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));}
async function key(type,key='ArrowUp'){await send('Input.dispatchKeyEvent',{type,key,code:key,windowsVirtualKeyCode:38,nativeVirtualKeyCode:38});}
async function ready(){try{await until(()=>evaluate(`document.querySelector('.forest-walk-canvas')?.dataset.avatarRenderer==='3d' && !document.querySelector('.forest-walk-fallback:not([hidden])') && !document.querySelector('.forest-walk-note p')?.textContent.includes('กำลังโหลด')`),'scene load');}catch(e){console.log('Scene diagnostics',await evaluate(`({note:document.querySelector('.forest-walk-note')?.textContent,screen:S.screen,walk:S.zone?.walk,body:document.body.innerText.slice(-1300)})`));await screenshot('failure');throw e;}}
async function returnedTo(origin,id){
  await ready();
  const actual=await evaluate(`({map:S.zone.walk.map,scene:S.zone.walk.scene?.id,position:S.zone.walk.position,phase:S.zone.walk.phase,session:!!(S.zone.secretSession||S.zone.specialSession||S.zone.riddleSession||S.zone.taleSession),visible:document.querySelector('.forest-walk-mount').getBoundingClientRect().height>100})`);
  assert.equal(actual.map,origin.map,id+' changed the walking map');
  assert.equal(actual.scene,origin.scene?.id,id+' changed the place picture');
  assert.equal(actual.phase,'cleared');assert(!actual.session);assert(actual.visible);
  assert(actual.position.every((v,i)=>Math.abs(v-origin.position[i])<.001),id+' reset the walking position');
}
try{
  const targets=await until(async()=>{const r=await fetch('http://127.0.0.1:9341/json/list');return (await r.json()).find(p=>p.type==='page');},'Chrome');
  socket=new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')console.log('BROWSER',m.params.args.map(a=>a.value||a.description).join(' ').slice(0,1000));});
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:8831/Soulbeast/tools/town-walk-demo/menu.html?screen=wild&zone=7'});
  await until(()=>evaluate(`typeof S!=='undefined' && !!S.zone?.walk`),'game bootstrap',45000);
  await evaluate(`window.qaBaseP=structuredClone(S.P);window.qaBaseZ=structuredClone(S.zone);S.P.tutorial.enabled=false;S.ui={};S.screen='zone';render();`);
  await ready();
  const profiles=await evaluate('TrainingForestScenes.ids');
  for(const id of profiles){
    await evaluate(`(()=>{
      S.P=structuredClone(window.qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';
      S.zone=structuredClone(window.qaBaseZ);const z=S.zone;
      for(const k of ['secretSession','specialSession','riddleSession','taleSession','warpGate','falseBoss','storyRun','secretRun','specialRun','riddleRun','taleRun'])delete z[k];
      z.depth=4;z.ev=null;z.fork=null;z.log=[];
      const id=${JSON.stringify(id)},scene=TrainingForestScenes.describe(id);
      z.walk={map:id==='boss'?'boss':'training',phase:'pending',scene,position:[1.05,-16],side:0};
      if(id==='boss'){z.depth=10;return render();}
      let kind='villager';
      if(id==='firstpact'){kind='secret';z.secretRun={location:id,offered:true};}
      else if(id==='training'){kind='specialEvent';z.specialRun={used:false,offered:true};}
      else if(SECRET_DATA.riddles.some(d=>d.id===id)){
        const group=SECRET_DATA.riddles.find(d=>d.id===id).group;kind=group==='reward'?'riddleReward':'riddleHazard';
        z.riddleRun={reward:{id:null},hazard:{id:null}};z.riddleRun[group]={id,offered:true,used:false,depth:5};
      }else {
        // A saved native tale session must still require walking to the conversation.
        z.taleSession={token:crypto.randomUUID(),mode:id==='encounter-7'?'special':'offer',id:id==='villager'?null:id,result:[]};
        if(id==='villager')z.taleSession={token:crypto.randomUUID(),mode:'rumor',text:scene.title,result:[]};
        if(id==='after-training'){
          const source='quest:training-3';WorldTales.state().aftermaths[source]={zone:7,source,title:scene.title,heard:2,at:0,availableAfter:0,repaired:false};
          z.taleSession={token:crypto.randomUUID(),mode:'aftermath',id:'after:'+source,source,result:[]};
        }
      }
      z.storyRun={version:1,planned:true,selected:{kind,id:null,depth:5},offered:true,used:null,followed:false};
      z.walk.fork=[{k:kind,h:false},{k:'spring',h:false}];
      render();
    })()`);
    await ready();
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.sceneryRenderer`),'png');
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.trainingScenery`),id);
    if(['firstpact','training-bells','training-1','training-3','boss'].includes(id))await screenshot(id+'-png-approach');
    assert.equal(await evaluate(`!!document.querySelector('.forest-walk-story:not([hidden])')`),false,id+' opened before contact');
    await key('keyDown');
    await until(()=>evaluate(`!!document.querySelector('.forest-walk-story:not([hidden])')`),id+' contact',15000);
    await key('keyUp');
    assert(await evaluate(`(()=>{
      const layout=document.querySelector('.forest-walk-layout'),panel=layout.querySelector('.forest-walk-story:not([hidden])');
      const whole=layout.getBoundingClientRect(),menu=panel.getBoundingClientRect();
      return getComputedStyle(layout.querySelector('.forest-walk-mount')).display==='none'
        && Math.abs(menu.width-whole.width)<1 && Math.abs(menu.height-whole.height)<1
        && Math.abs(menu.top-whole.top)<1;
    })()`),id+' menu must fill the scene and hide the walking map');
    assert.equal(await evaluate(`document.querySelector('.forest-walk-note b').textContent`),await evaluate(`TrainingForestScenes.describe(${JSON.stringify(id)}).title`));
    const origin=await evaluate('S.zone.walk.menuOrigin');
    if(id==='firstpact'){
      await evaluate(`handlers.secretArrival(Secret.token());`);
      for(const [width,height,mobile] of [[1280,800,false],[390,844,true]]){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await delay(150);
        assert(await evaluate(`(()=>{const grid=document.querySelector('.secret-choice-grid'),buttons=[...grid.querySelectorAll('button')],a=buttons[0].getBoundingClientRect(),b=buttons[1].getBoundingClientRect();return buttons.length===2&&Math.abs(a.top-b.top)<1&&a.width<grid.clientWidth*.55&&a.height<220;})()`),'first-pact choices must be compact and share a row');
        if(mobile){
          await evaluate(`(()=>{const grid=document.querySelector('.secret-choice-grid'),panel=grid.closest('.forest-walk-story');panel.scrollTop+=grid.getBoundingClientRect().top-panel.getBoundingClientRect().top-36;})()`);
          await screenshot('firstpact-compact-choices-mobile');
        }
      }
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
      await evaluate(`handlers.secretFight(Secret.token());`);
      assert.equal(await evaluate('S.battle.kind'),'secret');
      await evaluate('BattleReady.wait(S.battle).then(()=>true)');
      await evaluate(`endBattle('win');handlers.bt('done');`);
      await ready();
      assert.equal(await evaluate('S.zone.secretSession.id'),'firstpact');
      assert.equal(await evaluate('S.zone.walk.map'),'training');
      assert(await evaluate(`!!document.querySelector('.forest-walk-story:not([hidden]) [data-a="secretLeave"]')`));
      await evaluate('handlers.secretLeave(Secret.token())');
      await returnedTo(origin,id);
      await screenshot('firstpact-returned-to-place');
      console.log('PASS original secret combat and return to first pact scene');
    }
    if(id==='training-bells'||id==='boss')await screenshot(id+'-desktop');
    if(id==='training-bells'){
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
      assert(await evaluate(`(()=>{const p=document.querySelector('.forest-walk-story'),r=p.getBoundingClientRect(),area=document.querySelector('.forest-walk-layout').getBoundingClientRect();return r.width<=390&&Math.abs(r.height-area.height)<1&&Math.abs(r.top-area.top)<1&&r.bottom<=innerHeight+1;})()`));
      assert.equal(await evaluate(`document.querySelector('main').scrollTop`),0,'native focus scrolled the forest out of view');
      await screenshot(id+'-mobile');
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
      // Dispatch the actual token-bearing choice twice: the native guard must prevent duplicate rewards.
      const receipt=await evaluate(`document.querySelector('[data-a="riddleAnswer"]')?.dataset.v`);
      if(receipt) {
        await evaluate(`handlers.riddleAnswer(${JSON.stringify(receipt)})`);
        const after=await evaluate('JSON.stringify(S.P)');
        await evaluate(`handlers.riddleAnswer(${JSON.stringify(receipt)})`);
        assert.equal(await evaluate('JSON.stringify(S.P)'),after,'duplicate riddle reward');
        await evaluate(`handlers.riddleLeave(S.zone.riddleSession.token)`);
        await ready();
        assert.equal(await evaluate('S.zone.walk.map'),'training','did not return to the same riddle map');
        assert.equal(await evaluate('S.zone.depth'),5);
        assert(await evaluate(`document.querySelector('.forest-walk-mount').getBoundingClientRect().height>100`),'walking map did not return after closing the full-page menu');
        await returnedTo(origin,id);
      }
    }
    if(!['firstpact','training-bells','boss'].includes(id)){
      await evaluate(`(()=>{
        if(S.zone.riddleSession){const q=S.zone.riddleSession;ForestRiddle.choose(q.token,ForestRiddle.data().answer);ForestRiddle.leave(q.token);}
        else if(S.zone.specialSession){const q=S.zone.specialSession;ForestSpecial.choose(q.token,ForestSpecial.data().choices[0].id);ForestSpecial.leave(q.token);}
        else if(S.zone.taleSession){
          const q=S.zone.taleSession;
          if(q.mode==='aftermath')WorldTales.helpAfter(q.token,'later');
          else if(q.mode==='offer')WorldTales.accept(q.token);
          else if(q.mode==='special'){
            const d=WorldTales.choiceData(),i=d.actions.findIndex(a=>!a.effects.battle&&WorldTales.canPay(a.effects));
            if(i<0)throw Error('No noncombat special choice');WorldTales.choose(q.token,i);
          }
          WorldTales.leave(q.token);
        }
      })()`);
      await returnedTo(origin,id);
    }
    console.log('PASS walk/contact/layout '+id);
  }
  // Walk onto every planned trap through the real game, then return from its original combat.
  for(let index=0;index<6;index++){
    await evaluate(`(()=>{
      S.P=structuredClone(window.qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';
      S.zone=structuredClone(window.qaBaseZ);const z=S.zone;z.depth=1;z.ev=null;z.fork=null;z.log=[];
      for(const k of ['secretSession','specialSession','riddleSession','taleSession','warpGate','falseBoss'])delete z[k];
      z.storyRun={planned:true,selected:null,used:'villager',offered:true};z.riddleRun={reward:{id:null},hazard:{id:null}};
      z.walk={map:'footprints',phase:'pending',position:[0,-32],trapIndex:${index},fork:[{k:'beast',h:false},{k:'spring',h:false}],side:0};
      S.P.hp=pStats().hp;S.P.mp=pStats().mp;render();
    })()`);
    await ready();
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.trainingScenery`),['trap-quicksand','trap-leeches','trap-fire','trap-spikes','trap-rocks','trap-vines'][index]);
    await key('keyDown');
    await until(()=>evaluate(`S.ui.trapNotice?.index===${index} && !!S.battle`),'trap '+index);
    await key('keyUp');
    assert.equal(await evaluate('S.zone.depth'),2,'trap incremented depth twice');
    if(index===0)await screenshot('trap-contact');
    await evaluate('BattleReady.wait(S.battle).then(()=>true)');
    await evaluate(`handlers.trapNoticeClose();endBattle('flee');handlers.bt('done');`);
    await ready();
    assert.equal(await evaluate('S.zone.walk.phase'),'cleared');
    assert.equal(await evaluate('S.zone.depth'),2);
    assert.equal(await evaluate('!!S.battle || !!S.ui.trapNotice'),false);
    console.log('PASS planned trap '+index+' and native battle return');
  }
  await evaluate(`(()=>{
    S.P=structuredClone(window.qaBaseP);S.P.tutorial.enabled=false;S.P.country='blue';S.P.worldQuests={accepted:{},completed:{}};S.ui={};S.battle=null;S.screen='zone';
    S.zone=structuredClone(window.qaBaseZ);const z=S.zone;z.depth=2;z.ev=null;z.log=[];z.fork=[{k:'spring'},{k:'village'}];
    for(const k of ['secretSession','specialSession','riddleSession','taleSession','warpGate','falseBoss'])delete z[k];
    z.walk={map:'entrance',phase:'cleared',position:[7,-30]};
    const q=window.WorldQuestData.quests.find(q=>q.id==='blue-capital:lost');if(!q)throw Error('Missing rescue quest');
    window.WalkQuestEngine.accept(S.P,q);render();
  })()`);
  await ready();
  assert(await evaluate(`!!document.querySelector('.forest-walk-search-panel[hidden] #walkQuestSearch')`),'quest discovery appeared before walking');
  await key('keyDown');
  await until(()=>evaluate(`!!document.querySelector('.forest-walk-search-panel:not([hidden])')`),'quest marker contact');
  await key('keyUp');
  const searchPosition=await evaluate('S.zone.walk.position');
  await evaluate(`window.qaSearchButton=document.querySelector('#walkQuestSearch button');qaSearchButton.click()`);
  const questAfter=await evaluate(`JSON.stringify(S.P.worldQuests)`);
  await evaluate('qaSearchButton.click()');
  assert.equal(await evaluate('JSON.stringify(S.P.worldQuests)'),questAfter,'duplicate rescue objective');
  assert(await evaluate(`S.P.worldQuests.accepted['blue-capital:lost'].step>0`));
  await ready();
  assert((await evaluate('S.zone.walk.position')).every((v,i)=>Math.abs(v-searchPosition[i])<.001),'rescue menu reset the walking position');
  console.log('PASS rescue quest walk/contact, original objective, stale-click guard');
  // The branch HUD must use each side's real destination and match the next loaded map.
  for(const scenario of ['ready-left','ready-right','pending-preview']){
    await evaluate(`(()=>{
      S.P=structuredClone(window.qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';
      S.zone=structuredClone(window.qaBaseZ);const z=S.zone;
      for(const k of ['secretSession','specialSession','riddleSession','taleSession','warpGate','falseBoss'])delete z[k];
      z.depth=2;z.ev=null;z.log=[];z.storyRun={planned:true,selected:null,used:'villager',offered:true};
      const scenario=${JSON.stringify(scenario)};
      z.fork=scenario==='pending-preview'?null:[{k:'spring',h:false},{k:'village',h:false}];
      z.walk={map:scenario==='pending-preview'?'bush':'entrance',phase:scenario==='pending-preview'?'pending':'cleared',position:[-14,14.7]};
      if(scenario==='pending-preview'){z.walk.fork=[{k:'bush',h:false},{k:'spring',h:false}];z.walk.side=0;}
      render();
    })()`);
    await ready();
    await until(()=>evaluate(`!document.querySelector('.forest-walk-destination').hidden`),'left branch destination');
    if(scenario!=='pending-preview')assert.equal(await evaluate(`document.querySelector('.forest-walk-destination').textContent`),'ทางซ้าย → ลำธารใส');
    const planned=await evaluate('JSON.stringify(S.zone.fork||S.zone.walk.routePreview.fork)');
    const beforeDepth=await evaluate('S.zone.depth');
    await evaluate(`S.zone.walk={...S.zone.walk,position:[14,14.7]};render()`);
    await ready();
    await until(()=>evaluate(`document.querySelector('.forest-walk-destination').textContent.startsWith('ทางขวา → ')`),'right branch destination');
    if(scenario!=='pending-preview')assert.equal(await evaluate(`document.querySelector('.forest-walk-destination').textContent`),'ทางขวา → หมู่บ้านกลางป่า');
    assert.equal(await evaluate('JSON.stringify(S.zone.fork||S.zone.walk.routePreview.fork)'),planned,'switching branches rerolled destinations');
    assert.equal(await evaluate('S.zone.depth'),beforeDepth,'preview consumed a step');
    if(scenario==='pending-preview')assert.equal(await evaluate('S.zone.fork'),null,'preview committed a future fork early');
    await screenshot('next-destination-'+scenario);
    const side=scenario==='ready-right'?1:0;
    await evaluate(`S.zone.walk={...S.zone.walk,position:${side?'[35.7,36.4]':'[-34.3,34.6]'}};window.qaRouteWalk=S.zone.walk;render()`);
    await ready();await key('keyDown');
    await until(()=>evaluate('S.zone.walk!==window.qaRouteWalk'),'branch exit loaded map');
    await key('keyUp');
    assert.equal(await evaluate('JSON.stringify(S.zone.walk.fork)'),planned,'loaded fork differs from the shown destinations');
    assert.equal(await evaluate('S.zone.walk.side'),side);
    if(scenario!=='pending-preview')assert.equal(await evaluate('S.zone.walk.map'),side?'village':'spring');
    else assert.equal(await evaluate('S.zone.depth'),beforeDepth+1);
    console.log('PASS '+scenario+': left/right HUD and matching original exit');
  }
  for(const [name,position,inside] of [['front',[1.05,-21],false],['inside',[1.05,-11.9],true],['behind',[1.05,-7.8],true]]) {
    await evaluate(`(()=>{
      S.P=structuredClone(window.qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';
      S.zone=structuredClone(window.qaBaseZ);
      for(const k of ['secretSession','specialSession','riddleSession','taleSession'])delete S.zone[k];
      S.zone.depth=4;S.zone.ev=null;S.zone.fork=null;
      S.zone.walk={map:'training',phase:'cleared',scene:TrainingForestScenes.describe('training-bells'),position:${JSON.stringify(position)}};
      render();
    })()`);
    await ready();await delay(700);
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.sceneryLayers`),'11');
    const faded=await evaluate(`Number(document.querySelector('.forest-walk-canvas').dataset.fadedLayers)`);
    if(inside)assert(faded>0,'pavilion cutouts should reveal the actor '+name);
    else assert.equal(faded,0,'roof restored outside pavilion');
    await screenshot('training-bells-layered-'+name);
  }
  console.log('PASS pavilion ground/raised cutouts, actor visibility inside and behind, roof restoration in front');
  assert.deepEqual(errors,[]);
  console.log('PASS all training maps in real Chrome; screenshots: '+output);
}catch(error){
  console.log('Browser failure',errors,await evaluate(`({screen:S.screen,walk:S.zone?.walk,depth:S.zone?.depth,secret:S.zone?.secretSession,story:S.zone?.storyRun,notice:S.ui,body:document.body.innerText.slice(-1800)})`).catch(()=>null));
  await screenshot('failure').catch(()=>{});
  throw error;
}finally{
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
