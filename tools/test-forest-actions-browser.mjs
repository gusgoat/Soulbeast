import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'forest-action-qa');
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
try{
 const targets=await until(async()=>{const r=await fetch('http://127.0.0.1:9341/json/list');return (await r.json()).find(p=>p.type==='page');},'Chrome');
 socket=new WebSocket(targets.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 await send('Page.enable');await send('Runtime.enable');if(process.env.SOULBEAST_TEST_ORIGIN?.startsWith('https:')){await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*/functions/v1/*']});}
 const origin=process.env.SOULBEAST_TEST_ORIGIN||'http://127.0.0.1:8831';
 await send('Page.navigate',{url:origin+'/Soulbeast/tools/town-walk-demo/menu.html?screen=wild&zone=7&release=forest-actions-2'});
 await until(()=>evaluate(`typeof S!=='undefined'&&!!S.P`),'bootstrap',45000);
 await evaluate(`S.P.tutorial.enabled=false;S.ui={};handlers.dozone(7);ForestWalk.mount(S.zone);S.screen='zone';render();window.baseP=structuredClone(S.P);window.baseZ=structuredClone(S.zone);`);await ready();
 for(const zone of [7,1,3,4]){
  await evaluate(`S.P=structuredClone(baseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';S.zone=structuredClone(baseZ);S.zone.id=${zone};S.zone.depth=4;S.zone.fork=null;S.zone.ev={type:'chest',chest:'wood',opened:false};S.zone.walk={map:'bush',phase:'cleared',trapIndex:-1,position:[3.75,-15],fork:[{k:'bush',h:false},{k:'spring',h:false}],side:0};render();`);
  await ready();await until(()=>evaluate(`!document.querySelector('.forest-walk-chest').hidden`),'near actual chest');
  for(const [width,height]of [[390,844],[480,800],[320,650],[844,390],[1280,800]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});await delay(150);
   assert(await evaluate(`(()=>{const b=document.querySelector('.forest-walk-chest'),r=b.getBoundingClientRect(),nav=document.querySelector('nav.bottom').getBoundingClientRect(),scene=document.querySelector('.forest-walk-scene').getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.left>=scene.left+scene.width*.5&&r.right<=scene.right&&r.bottom<=nav.top-40&&r.top>=scene.top&&b.contains(hit);})()`),'action obscured or outside scene '+zone+' '+width+'x'+height);
   if(width===390)await screenshot('zone-'+zone+'-chest-right');
   await evaluate(`document.querySelector('.forest-walk-fallback').hidden=false`);
   assert(await evaluate(`(()=>{const bs=[...document.querySelectorAll('.forest-walk-actions>.btn')];return bs.every(b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))&&r.bottom<=document.querySelector('nav.bottom').getBoundingClientRect().top-40;});})()`),'stacked actions obscured');
   await evaluate(`document.querySelector('.forest-walk-fallback').hidden=true`);
  }
  await evaluate(`document.querySelector('.forest-walk-chest').click()`);assert.equal(await evaluate('S.zone.ev.opened'),true);
  const after=await evaluate('JSON.stringify(S.P)');await evaluate(`document.querySelector('.forest-walk-chest').click()`);assert.equal(await evaluate('JSON.stringify(S.P)'),after,'duplicate chest reward');
  console.log('PASS zone '+zone+': right-hand scene actions above footer, five viewport sizes, real hit targets and native chest reward once');
  await evaluate(`S.zone.ev=null;S.zone.depth=10;S.zone.boss=structuredClone(ZN[${zone-1}].boss);S.zone.walk={map:'boss',phase:'pending',scene:${zone===7?'TrainingForestScenes':zone===4?'DragonForestScenes':zone===3?'DesertForestScenes':'MoonlightForestScenes'}.describe('boss'),position:[1.05,-22]};render();`);await ready();
  assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.bossStatues`),'2');
  await key('keyDown');await until(()=>evaluate(`!!document.querySelector('.forest-walk-story:not([hidden]) [data-a="boss"]')`),'original boss contact');await key('keyUp');
  const boss=await evaluate('S.zone.boss.sp');await evaluate('handlers.boss()');assert.equal(await evaluate('S.battle.kind'),'boss');assert.equal(await evaluate('S.battle.enemies[0].sp'),boss);await evaluate('BattleReady.wait(S.battle).then(()=>true)');
  console.log('PASS native '+boss+' battle with guardian doorway');

 }
 assert.deepEqual(errors,[]);
}catch(error){console.log('ACTION QA',errors,await evaluate(`({screen:typeof S==='undefined'?null:S.screen,body:document.body.innerText.slice(-1200)})`).catch(()=>null));throw error;}finally{if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
