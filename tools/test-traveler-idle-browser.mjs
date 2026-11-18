import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'traveler-idle-qa');
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
  socket=new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')console.log('BROWSER',m.params.args.map(a=>a.value||a.description).join(' ').slice(0,1000));});
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:8831/Soulbeast/tools/town-walk-demo/menu.html?screen=wild&zone=7'});
  await until(()=>evaluate(`typeof S!=='undefined' && !!S.zone?.walk`),'game bootstrap',45000);
  await evaluate(`window.qaBaseP=structuredClone(S.P);window.qaBaseZ=structuredClone(S.zone);S.P.tutorial.enabled=false;S.ui={};S.screen='zone';render();`);
  await ready();
  await evaluate(`(async()=>{
    window.qaRootFrame=(await import('/Soulbeast/assets/forest-walk/moonlight-frames.js')).MOON_FRAMES.lantern[1];
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(im,...a){
      if(this.canvas.classList.contains('forest-walk-canvas')){
        if(im instanceof HTMLCanvasElement&&im.width===588)window.qaDepth=[];
        window.qaDepth ||= [];
        if(im.src?.includes('/moonlight/lantern.png')&&a.length===8&&a.slice(0,4).every((v,i)=>v===qaRootFrame[i]))qaDepth.push('rear-root');
        if((im instanceof ImageBitmap||im instanceof HTMLCanvasElement&&im.width===256)&&a.length===4&&Math.abs(a[2]-164*.72)<.1)qaDepth.push('idle-traveler');
      }
      return draw.call(this,im,...a);
    };
    S.P=structuredClone(qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';S.zone=structuredClone(qaBaseZ);S.zone.id=1;
    S.zone.ev=null;S.zone.fork=null;
    for(const k of ['secretSession','specialSession','riddleSession','taleSession'])delete S.zone[k];
    S.zone.walk={map:'stranger',phase:'pending',disposition:.8,position:[-4.5,-14],trapIndex:-1,fork:[{k:'stranger',h:false},{k:'spring',h:false}],side:0};
    render();
  })()`);
  await ready();await delay(1000);
  const order=await evaluate('window.qaDepth');
  console.log('Observed actual canvas depth order:',order);
  await screenshot(process.env.EXPECT_OCCLUSION?'traveler-idle-before':'traveler-idle-after');
  if(!process.env.EXPECT_OCCLUSION){
    assert(order.includes('rear-root')&&order.includes('idle-traveler'));
    assert(order.indexOf('rear-root')<order.indexOf('idle-traveler'),'rear root must not paint over the waiting traveler head');
    assert.equal(await evaluate(`!!S.battle||!!document.querySelector('.forest-walk-story:not([hidden])')`),false,'waiting traveler should stay idle');
    assert.deepEqual(errors,[]);
    console.log('PASS idle traveler remains in front of rear props; original waiting interaction unchanged');
  }
}finally{
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
