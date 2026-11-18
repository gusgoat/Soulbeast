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
  // Match the country breakpoints and actual PNG artwork on desktop/mobile.
  for(const [width,height,expected] of [[1280,800,150],[390,844,150],[360,800,136],[844,500,120]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await delay(150);
    const style=await evaluate(`(()=>{const j=document.querySelector('.forest-walk-stick'),s=getComputedStyle(j),k=getComputedStyle(j.firstElementChild);return {width:j.getBoundingClientRect().width,height:j.getBoundingClientRect().height,knob:parseFloat(k.width),base:getComputedStyle(j,'::before').backgroundImage,head:k.backgroundImage};})()`);
    assert.equal(style.width,expected);assert.equal(style.height,expected);assert.equal(style.knob,54);
    assert(style.base.includes('joystick-base.png.webp')&&style.head.includes('joystick-knob.png.webp'));
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  const rect=await evaluate(`(()=>{const r=document.querySelector('.forest-walk-stick').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,r:r.width*.33}})()`);
  const drag=async strength=>send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y-rect.r*strength,button:'left',buttons:1});
  const moving=()=>evaluate(`document.querySelector('.forest-walk-canvas').dataset.moving`);
  const running=()=>evaluate(`document.querySelector('.forest-walk-canvas').dataset.running`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',buttons:1,clickCount:1});
  await drag(.08);await delay(250);assert.equal(await moving(),'false','dead zone');
  await drag(.35);await until(async()=>await moving()==='true','small tilt walking');assert.equal(await running(),'false');
  await drag(.85);await until(async()=>await running()==='true','large tilt running');
  await drag(.67);await delay(250);assert.equal(await running(),'true','country run hysteresis');
  await drag(.45);await until(async()=>await running()==='false','ease back to walking');assert.equal(await moving(),'true');
  await screenshot('forest-country-joystick');
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',buttons:0,clickCount:1});
  await until(async()=>await moving()==='false','release stops');
  assert.equal(await evaluate(`document.querySelector('.forest-walk-stick').classList.contains('active')`),false);
  assert.equal(await evaluate(`document.querySelector('.forest-walk-stick span').style.transform`),'');
  assert.deepEqual(errors,[]);
  console.log('PASS country PNG skin, 150/136/120px sizes, 54px knob, dead zone, walk/run tilt, hysteresis and release stops');
} finally {
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
