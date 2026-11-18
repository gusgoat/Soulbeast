import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'moonlight-forest-qa');
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
async function ready(){try{await until(()=>evaluate(`document.querySelector('.forest-walk-canvas')?.dataset.avatarRenderer==='3d' && !document.querySelector('.forest-walk-fallback:not([hidden])') && !document.querySelector('.forest-walk-note p')?.textContent.includes('กำลังโหลด')`),'scene load',90000);}catch(e){console.log('Scene diagnostics',await evaluate(`({note:document.querySelector('.forest-walk-note')?.textContent,screen:S.screen,walk:S.zone?.walk,body:document.body.innerText.slice(-1300)})`));await screenshot('failure');throw e;}}
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
  const target=process.env.SOULBEAST_TEST_ORIGIN||'http://127.0.0.1:8831';
  await send('Page.navigate',{url:target+'/Soulbeast/tools/town-walk-demo/menu.html?screen=wild&zone=1&release=moonlight-20261119'+(process.argv.includes('--storage')?'&storage=1':'')});
  await until(()=>evaluate(`typeof S!=='undefined' && !!S.P`),'game bootstrap',45000);
  await evaluate(`S.P.forestClears={...(S.P.forestClears||{}),7:1};handlers.dozone(1);ForestWalk.mount(S.zone);`);
  await evaluate(`window.qaBaseP=structuredClone(S.P);window.qaBaseZ=structuredClone(S.zone);S.P.tutorial.enabled=false;S.ui={};S.screen='zone';render();`);
  await ready();
  const profiles=await evaluate('MoonlightForestScenes.ids');
  for(const id of profiles){
    await evaluate(`(()=>{
      S.P=structuredClone(window.qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';
      S.zone=structuredClone(window.qaBaseZ);const z=S.zone;
      for(const k of ['secretSession','specialSession','riddleSession','taleSession','warpGate','falseBoss','storyRun','secretRun','specialRun','riddleRun','taleRun'])delete z[k];
      z.depth=4;z.ev=null;z.fork=null;z.log=[];
      const id=${JSON.stringify(id)},scene=MoonlightForestScenes.describe(id);
      z.walk={map:id==='boss'?'boss':'training',phase:'pending',scene,position:[1.05,-16],side:0};
      if(id==='boss'){z.depth=10;return render();}
      let kind='villager';
      if(id==='yggdrasil'){kind='secret';z.secretRun={location:id,offered:true};}
      else if(id==='moon'){kind='specialEvent';z.specialRun={used:false,offered:true};}
      else if(SECRET_DATA.riddles.some(d=>d.id===id)){
        const group=SECRET_DATA.riddles.find(d=>d.id===id).group;kind=group==='reward'?'riddleReward':'riddleHazard';
        z.riddleRun={reward:{id:null},hazard:{id:null}};z.riddleRun[group]={id,offered:true,used:false,depth:5};
      }else {
        // A saved native tale session must still require walking to the conversation.
        z.taleSession={token:crypto.randomUUID(),mode:id==='encounter-1'?'special':'offer',id:id==='villager'?null:id,result:[]};
        if(id==='villager')z.taleSession={token:crypto.randomUUID(),mode:'rumor',text:scene.title,result:[]};
        if(id==='after-moon'){
          const source='quest:moon-3';WorldTales.state().aftermaths[source]={zone:1,source,title:scene.title,heard:2,at:0,availableAfter:0,repaired:false};
          z.taleSession={token:crypto.randomUUID(),mode:'aftermath',id:'after:'+source,source,result:[]};
        }
      }
      z.storyRun={version:1,planned:true,selected:{kind,id:null,depth:5},offered:true,used:null,followed:false};
      z.walk.fork=[{k:kind,h:false},{k:'spring',h:false}];
      render();
    })()`);
    await ready();
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.sceneryRenderer`),'png');
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.moonlightScenery`),id);
    if(['yggdrasil','moon-reflections','moon-1','moon-3','boss'].includes(id))await screenshot(id+'-png-approach');
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
    assert.equal(await evaluate(`document.querySelector('.forest-walk-note b').textContent`),await evaluate(`MoonlightForestScenes.describe(${JSON.stringify(id)}).title`));
    const origin=await evaluate('S.zone.walk.menuOrigin');
    if(id==='yggdrasil'){
      await evaluate(`handlers.secretArrival(Secret.token());`);
      await evaluate(`(()=>{for(let n=0;n<8&&Secret.session().event!=="encounter";n++){if(Secret.session().event==="puzzle")handlers.secretPuzzle(Secret.token()+"|"+Secret.location().correct);else handlers.secretNext(Secret.token());}})()`);
      await evaluate(`handlers.secretFight(Secret.token());`);
      assert.equal(await evaluate('S.battle.kind'),'secret');
      await evaluate('BattleReady.wait(S.battle).then(()=>true)');
      await evaluate(`endBattle('win');handlers.bt('done');`);
      await ready();
      assert.equal(await evaluate('S.zone.secretSession.id'),'yggdrasil');
      assert.equal(await evaluate('S.zone.walk.map'),'training');
      assert(await evaluate(`!!document.querySelector('.forest-walk-story:not([hidden]) [data-a="secretLeave"]')`));
      await evaluate(`(()=>{handlers.secretNext(Secret.token());const d=Secret.location(),c=d.choices.find(c=>Secret.allowed(c)&&(!c.requireVictory||Secret.session().battleWon));handlers.secretChoose(Secret.token()+"|"+c.id);handlers.secretLeave(Secret.token());})()`);
      await returnedTo(origin,id);
      await screenshot('firstpact-returned-to-place');
      console.log('PASS original secret combat and return to first pact scene');
    }
    if(id==='moon-reflections'||id==='boss')await screenshot(id+'-desktop');
    if(id==='moon-reflections'){
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
      assert(await evaluate(`(()=>{const p=document.querySelector('.forest-walk-story'),r=p.getBoundingClientRect(),area=document.querySelector('.forest-walk-layout').getBoundingClientRect();return r.width<=390&&Math.abs(r.height-area.height)<1&&Math.abs(r.top-area.top)<1&&r.bottom<=innerHeight+1;})()`));
      assert.equal(await evaluate(`document.querySelector('main').scrollTop`),0,'native focus scrolled the forest out of view');
      await screenshot(id+'-mobile');
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
      // Dispatch the actual token-bearing choice twice: the native guard must prevent duplicate rewards.
      const receipt=await evaluate(`S.zone.riddleSession.token+'|'+ForestRiddle.data().answer`);
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
    if(!['yggdrasil','moon-reflections','boss'].includes(id)){
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
  for(const map of ['entrance','footprints','bandit','stranger','shrine','spring','revival','cleanse','village','hospital','bush','mist','ruins','exit']){
    await evaluate(`(()=>{
      S.P=structuredClone(window.qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';S.zone=structuredClone(window.qaBaseZ);
      for(const k of ['secretSession','specialSession','riddleSession','taleSession','warpGate','falseBoss'])delete S.zone[k];
      S.zone.ev=null;S.zone.fork=null;S.zone.depth=4;
      const map=${JSON.stringify(map)},kind={footprints:'beast'}[map]||map;
      S.zone.walk={map,phase:'cleared',position:map==='entrance'?[0,-43.05]:[1.05,-22],trapIndex:-1,disposition:.8,fork:[{k:kind,h:false},{k:'spring',h:false}],side:0};
      if(map==='entrance')S.zone.depth=0;render();
    })()`);
    await ready();
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.forestTheme`),'moonlight');
    assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.treeRenderer`),'blender-png');
    if(['entrance','village','spring','ruins','bush'].includes(map))await screenshot('moonlight-'+map);
    console.log('PASS moonlight PNG and Blender props '+map);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS Moonlight native events and all ordinary scenery; '+output);
}catch(error){
  console.log('Browser failure',errors,await evaluate(`({screen:S.screen,walk:S.zone?.walk,note:document.querySelector('.forest-walk-note')?.textContent})`).catch(()=>null));
  await screenshot('failure').catch(()=>{});throw error;
}finally{
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
