import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'city-forest-qa');
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
const child=evaluate,snap=screenshot;
try{
 const targets=await until(async()=>{const r=await fetch('http://127.0.0.1:9341/json/list');return (await r.json()).find(p=>p.type==='page');},'Chrome');
 socket=new WebSocket(targets.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 await send('Page.enable');await send('Runtime.enable');if(process.env.SOULBEAST_TEST_ORIGIN?.startsWith('https:')){await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*/functions/v1/*']});}
 const origin=process.env.SOULBEAST_TEST_ORIGIN||'http://127.0.0.1:8831';
 await send('Page.navigate',{url:origin+'/Soulbeast/tools/town-walk-demo/menu.html?screen=wild&zone=7&release=forest-actions-2'});
 await until(()=>evaluate(`typeof S!=='undefined'&&!!S.P`),'bootstrap',45000);
 await evaluate(`S.P.tutorial.enabled=false;S.ui={};handlers.dozone(7);ForestWalk.mount(S.zone);S.screen='zone';render();window.baseP=structuredClone(S.P);window.baseZ=structuredClone(S.zone);`);await ready();
 await child(`while(S.P.lv<60)gainExp(S.P,Math.max(0,need(S.P.lv)-S.P.exp),true);HeroLevelNotice.queue.length=0;document.querySelectorAll('.toast').forEach(el=>el.remove());window.cityBaseP=structuredClone(S.P);window.cityBaseZ=structuredClone(S.zone);window.qaSiteCases=ForestQuestSites.stories.map((story,i)=>{for(const q of window.WorldQuestData.quests)for(const choice of q.choices||[{id:null,steps:q.steps}]){const steps=choice.steps||q.steps;const step=steps.findIndex(o=>o.type==='forestSearch'&&[1,3,4,7].includes(o.zone));if(step>=0&&ForestQuestSites.describe(q)?.id==='city-quest-'+i)return {questId:q.id,choice:choice.id,step,zone:steps[step].zone,site:ForestQuestSites.describe(q)};}throw Error('Missing test story '+i)});`);
 const cases=await child('qaSiteCases');
 for(const test of cases){
  await child(`(()=>{const t=${JSON.stringify(test)},q=window.WorldQuestData.quests.find(q=>q.id===t.questId);S.P=structuredClone(cityBaseP);S.P.country=q.country;S.P.worldQuests={accepted:{},completed:{}};if(q.requires)S.P.worldQuests.completed[q.requires]=1;window.WalkQuestEngine.accept(S.P,q,t.choice);const steps=window.WalkQuestEngine.steps(S.P,q);for(let i=0;i<t.step;i++)for(let n=0;n<(steps[i].count||1);n++)window.WalkQuestEngine.emit(S.P,window.WorldQuestData.quests,{...steps[i],id:crypto.randomUUID(),country:window.WalkQuestEngine.objectiveCountry(q,steps[i])||q.country,questId:q.id,objectiveStep:i,depth:10});const o=steps[t.step],country=window.WalkQuestEngine.objectiveCountry(q,o)||q.country;S.P.country=country;S.ui={};S.battle=null;S.screen='zone';S.zone=structuredClone(cityBaseZ);S.zone.id=o.zone;S.zone.depth=o.depth||(o.target==='moon-gem'?3:2);S.zone.ev=null;S.zone.fork=null;S.zone.walk={map:'footprints',phase:'cleared',trapIndex:-1,position:[t.site.position[0],t.site.position[1]-4.5]};render();})()`);
  await until(()=>child(`document.querySelector('.forest-walk-canvas')?.dataset.questSites?.includes('${test.site.id}')&&!document.querySelector('.forest-walk-note p')?.textContent.includes('กำลังโหลด')`),'site load '+test.site.id);
  assert.equal(await child('S.P.worldQuests.accepted['+JSON.stringify(test.questId)+'].step'),test.step);
  await delay(150);await snap('city-site-'+test.site.id);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowUp',code:'ArrowUp',windowsVirtualKeyCode:38});
  await until(()=>child(`S.zone.walk.showSearch&&S.zone.walk.questSite==='${test.site.id}'&&!!document.querySelector('.forest-walk-search-panel:not([hidden])')`),'physical contact '+test.site.id,15000);
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowUp',code:'ArrowUp',windowsVirtualKeyCode:38});
  const pos=await child('S.zone.walk.position'),gold=await child('S.P.gold');
  assert(await child(`getComputedStyle(document.querySelector('.forest-walk-mount')).display==='none'`),'menu not full screen');
  assert.equal(await child(`document.querySelector('.forest-walk-search-panel h2').textContent`),test.site.label);
  await child(`window.staleQuestButton=document.querySelector('.forest-walk-search-panel [data-quest-id="${test.questId}"] button.quest-answer');if(!staleQuestButton)throw Error('missing native action');staleQuestButton.click();`);
  assert.equal(await child('S.P.worldQuests.accepted['+JSON.stringify(test.questId)+'].step'),test.step+1);
  assert.equal(await child('S.P.gold'),gold,'paid on discovery');
  await until(()=>child(`!S.zone.walk.showSearch&&document.querySelector('.forest-walk-canvas')?.dataset.avatarRenderer==='3d'&&!document.querySelector('.forest-walk-note p')?.textContent.includes('กำลังโหลด')`),'same-place return');
  const after=await child('S.zone.walk.position');assert(Math.hypot(pos[0]-after[0],pos[1]-after[1])<.05,'return moved player');
  const state=await child('JSON.stringify(S.P.worldQuests)');await child('staleQuestButton.click()');assert.equal(await child('JSON.stringify(S.P.worldQuests)'),state,'duplicate action');
  console.log('PASS physical story site',test.site.id,test.questId,'zone',test.zone);
 }


 // Several accepted quests must have independent locations and buttons.
 await child(`(()=>{S.P=structuredClone(cityBaseP);S.P.country='blue';S.P.worldQuests={accepted:{},completed:{}};const E=window.WalkQuestEngine,D=window.WorldQuestData;for(const id of ['blue-capital:lost','blue-capital:resident-0']){const q=D.quests.find(q=>q.id===id);E.accept(S.P,q);const steps=E.steps(S.P,q);for(let i=0;steps[i].type!=='forestSearch';i++)for(let n=0;n<(steps[i].count||1);n++)E.emit(S.P,D.quests,{...steps[i],id:crypto.randomUUID(),country:E.objectiveCountry(q,steps[i])||q.country,questId:q.id,objectiveStep:i,depth:10});}S.zone=structuredClone(cityBaseZ);S.zone.id=7;S.zone.depth=3;S.zone.ev=null;S.zone.fork=null;S.zone.walk={map:'footprints',phase:'cleared',trapIndex:-1,position:[-13,-35.5]};S.battle=null;render()})()`);
 await until(()=>child(`JSON.parse(document.querySelector('.forest-walk-canvas')?.dataset.questSites||'[]').length===2&&!document.querySelector('.forest-walk-note p')?.textContent.includes('กำลังโหลด')`),'two sites');
 await key('keyDown');await until(()=>child(`S.zone.walk.showSearch&&document.querySelector('.forest-walk-search-panel:not([hidden])')`),'two-quest contact');await key('keyUp');
 assert(await child(`(()=>{const other=document.querySelector('.forest-walk-search-panel [data-quest-id="blue-capital:resident-0"]');return other.hidden&&getComputedStyle(other).display==='none'})()`),'unrelated quest visible');
 const unrelated=await child(`JSON.stringify(S.P.worldQuests.accepted['blue-capital:resident-0'])`);
 await child(`document.querySelector('.forest-walk-search-panel [data-quest-id="blue-capital:resident-0"] button.quest-answer').click()`);
 assert.equal(await child(`JSON.stringify(S.P.worldQuests.accepted['blue-capital:resident-0'])`),unrelated,'wrong location completed quest');
 const before=await child('S.zone.walk.position');await child(`document.querySelector('.forest-walk-search-panel [data-quest-id="blue-capital:lost"] button.quest-answer').click();document.querySelector('.forest-walk-search-panel>button').click()`);
 await until(()=>child(`!S.zone.walk.showSearch&&JSON.parse(document.querySelector('.forest-walk-canvas')?.dataset.questSites||'[]').length===1&&!document.querySelector('.forest-walk-note p')?.textContent.includes('กำลังโหลด')`),'one remaining site');
 const after=await child('S.zone.walk.position');assert(Math.hypot(before[0]-after[0],before[1]-after[1])<.05);assert.equal(await child(`JSON.stringify(S.P.worldQuests.accepted['blue-capital:resident-0'])`),unrelated);
 for(const [width,height]of [[320,650],[390,844],[844,390]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await delay(150);assert(await child(`(()=>{const b=document.querySelector('.forest-walk-quest-guide'),r=b.getBoundingClientRect(),nav=document.querySelector('nav.bottom').getBoundingClientRect();return !b.hidden&&r.bottom<nav.top&&b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))})()`),'quest guide hidden by footer');}
 assert.deepEqual(errors,[]);console.log('PASS 25 PNG physical story sites, isolated concurrent quests, exact returns and mobile quest guide');
}finally{if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
