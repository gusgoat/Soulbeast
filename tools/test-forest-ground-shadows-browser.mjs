import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'forest-ground-shadow-qa');
await mkdir(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/Soulbeast\//,'');
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(8851,'127.0.0.1',resolve));
const chrome=spawn(process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
  '--headless=new','--remote-debugging-port=9381',`--user-data-dir=${path.join(output,'chrome-profile')}`,
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
 const targets=await until(async()=>{const r=await fetch('http://127.0.0.1:9381/json/list');return (await r.json()).find(p=>p.type==='page');},'Chrome');
 socket=new WebSocket(targets.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 await send('Page.enable');await send('Runtime.enable');if(process.env.SOULBEAST_TEST_ORIGIN?.startsWith('https:')){await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*/functions/v1/*']});}
 const origin=process.env.SOULBEAST_TEST_ORIGIN||'http://127.0.0.1:8851';
 await send('Page.navigate',{url:origin+'/Soulbeast/tools/town-walk-demo/menu.html?screen=wild&zone=7&release=forest-shadows-preview-1'});
 await until(()=>evaluate(`typeof S!=='undefined'&&!!S.P`),'bootstrap',45000);
 await evaluate(`S.P.tutorial.enabled=false;S.ui={};handlers.dozone(7);ForestWalk.mount(S.zone);S.screen='zone';render();window.baseP=structuredClone(S.P);window.baseZ=structuredClone(S.zone);`);await ready();

 const pixels=await evaluate(`(()=>{
  const results=[];
  for(const dpr of [1,1.5,2])for(const copies of [1,2]){
   const c=document.createElement('canvas');c.width=240*dpr;c.height=200*dpr;const surface=c.getContext('2d',{willReadFrequently:true});surface.setTransform(dpr,0,0,dpr,0,0);surface.fillStyle='#fff';surface.fillRect(0,0,240,200);
   const art=document.createElement('canvas');art.width=16;art.height=60;const im=art.getContext('2d');im.fillStyle='#ff6040';im.fillRect(0,0,16,60);
   const shadows=WalkGroundShadows.create();shadows.resize(c.width,c.height,240,200);const front=shadows.begin(.64,0,[],x=>x,y=>y,1);
   for(let i=0;i<copies;i++)shadows.sprite(front,78,130).drawImage(art,70,70,16,60);
   shadows.finish(surface);const data=surface.getImageData(0,0,c.width,c.height).data;let n=0,xs=0,ys=0,bottomLeft=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(data[i]<data[i+1]&&data[i+1]<data[i+2]&&data[i]<245){const px=x/dpr,py=y/dpr;n++;xs+=px;ys+=py;if(px<65||py>132)bottomLeft++;}}
   const at=(x,y)=>[...surface.getImageData(Math.round(x*dpr),Math.round(y*dpr),1,1).data];
   results.push({dpr,copies,n,cx:xs/n,cy:ys/n,bottomLeft,actor:at(80,127),shade:at(98,119)});shadows.release();
  }return results;
 })()`);
 for(const p of pixels){assert(p.n>100&&p.cx>88&&p.cy<130,'shadow did not project upper right');assert.equal(p.bottomLeft,0,'shadow projected wrong direction');assert.deepEqual(p.actor,[255,96,64,255],'shadow covered actor');assert(p.shade[0]<220,'density comparison missed the shadow');}
 for(const dpr of [1,1.5,2])assert.deepEqual(pixels.find(p=>p.dpr===dpr&&p.copies===1).shade,pixels.find(p=>p.dpr===dpr&&p.copies===2).shade,'overlapping shadows doubled darkness');
 console.log('PASS Country silhouette direction, three DPRs, overlap density and foreground occlusion',JSON.stringify(pixels));
 await evaluate('window.shadowBaseZ=structuredClone(S.zone)');
 for(const zone of [7,1,3,4]){
  await evaluate(`S.battle=null;S.ui={};S.zone=structuredClone(shadowBaseZ);S.zone.id=${zone};S.zone.ev=null;S.zone.depth=4;S.zone.fork=null;S.zone.walk={map:'footprints',phase:'cleared',position:[0,-30],trapIndex:-1};render()`);await ready();
  await until(()=>evaluate(`document.querySelector('.forest-walk-canvas')?.dataset.groundShadows==='country-upper-right'&&Number(document.querySelector('.forest-walk-canvas')?.dataset.shadowCasters)>0`),'shadow pipeline');await delay(200);await screenshot('shadows-zone-'+zone);
  assert.equal(await evaluate('S.zone.walk.phase'),'cleared');assert.equal(await evaluate('!!S.battle'),false);if(zone===4)assert.equal(await evaluate(`document.querySelector('.forest-walk-canvas').dataset.treeRenderer`),'mountain-pine-png');
  console.log('PASS original trees and directional shadows in forest',zone);
 }
 assert.deepEqual(errors,[]);console.log('PASS four forest shadow integrations without gameplay transitions');
}finally{if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
