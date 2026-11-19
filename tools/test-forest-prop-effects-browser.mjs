import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'forest-prop-effects-qa');
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
  const pixels=await evaluate(`(async()=>{
    const {createPropEffects,propEffectSpec,inPolygon}=await import('/Soulbeast/assets/forest-walk/prop-effects.js?v=fire-water-1');
    const {MOON_FRAMES}=await import('/Soulbeast/assets/forest-walk/moonlight-frames.js');const {DESERT_FRAMES}=await import('/Soulbeast/assets/forest-walk/desert-frames.js');const {DRAGON_FRAMES}=await import('/Soulbeast/assets/forest-walk/dragon-frames.js');
    const results=[];const random=Math.random;Math.random=()=>{throw Error('FX consumed gameplay RNG')};
    try{for(const id of ['trap-fire','lantern#4','seedmap#4','yggdrasil#0','reflections#0','waterways#0','waterways#5','bandit-camp','shrine','desert-traps#2','desert-waterways#0','desert-waterways#1','desert-waterways#2','desert-waterways#3','desert-waterways#5','desert-spring#1','dragon-traps#1','dragon-traps#2','dragon-forge#1','dragon-forge#3','dragon-beacon#1','dragon-beacon#2','dragon-spring#1']){
      const im=new Image();im.crossOrigin='anonymous';
      const [kit,part]=id.split('#');
      const mountain=kit.startsWith('dragon-'),desert=kit.startsWith('desert-');im.src=mountain?'/Soulbeast/assets/forest-walk/generated/dragon/'+kit.slice(7)+'.png':desert?'/Soulbeast/assets/forest-walk/generated/desert/'+kit.slice(7)+'.png':part!==undefined?'/Soulbeast/assets/forest-walk/generated/moonlight/'+kit+'.png':id==='trap-fire'?'/Soulbeast/assets/forest-walk/generated/trap-fire.png':'/Soulbeast/assets/forest-walk/art/forest-'+id+'.webp';
      await im.decode();const source=part!==undefined?(mountain?DRAGON_FRAMES[kit.slice(7)]:desert?DESERT_FRAMES[kit.slice(7)]:MOON_FRAMES[kit])[Number(part)]:null,specs=propEffectSpec({effectId:id});
      const fx=createPropEffects(im,source,specs),c=document.createElement('canvas');c.width=fx.base.width;c.height=fx.base.height;
      const x=c.getContext('2d',{willReadFrequently:true});
      const render=t=>{x.clearRect(0,0,c.width,c.height);x.drawImage(fx.base,0,0);fx.paint(x,0,0,c.width,c.height,t);return x.getImageData(0,0,c.width,c.height).data;};
      const a=render(0),b=render(777);let changed=0,outside=0;
      for(let i=0;i<a.length;i+=4)if(a.slice(i,i+4).some((v,j)=>v!==b[i+j])){changed++;if(specs[0].kind==='water'){const n=i/4;if(!inPolygon((n%c.width)/c.width,Math.floor(n/c.width)/c.height,specs[0].polygon))outside++;}}
      const same=createPropEffects(im,source,specs)===fx;
      const still=t=>{x.clearRect(0,0,c.width,c.height);x.drawImage(fx.base,0,0);fx.paint(x,0,0,c.width,c.height,t,true);return c.toDataURL();};
      results.push({id,masks:fx.masks,changed,outside,same,reduced:still(1000)===still(1800)});
    }}finally{Math.random=random;}return results;
  })()`);
  console.log('FX pixel diagnostics:',JSON.stringify(pixels));
  for(const p of pixels){if(p.id==='desert-spring#1')assert(p.masks[0].pixels>100,'white-waterfall mask must cover the stream');assert(p.changed>0,p.id+' must animate');assert(p.masks.every(m=>m.pixels>0),p.id+' missing artwork mask');assert(p.same&&p.reduced,p.id+' cache/reduced motion');assert.equal(p.outside,0,p.id+' water shimmer escaped its shoreline');}
  for(const [zone,map,scene,trap]of [[7,'footprints',null,2],[1,'footprints',null,2],[1,'training','moon',-1],[1,'training','moon-reflections',-1],[1,'training','yggdrasil',-1],[1,'training','after-moon',-1],[7,'bandit',null,-1],[7,'shrine',null,-1],[3,'footprints',null,2],[3,'training','encounter-3',-1],[3,'spring',null,-1],[4,'footprints',null,2],[4,'training','dragon-elements',-1],[4,'training','dragon-1',-1],[4,'spring',null,-1]]){
    await evaluate(`(()=>{
      S.P=structuredClone(qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';S.zone=structuredClone(qaBaseZ);S.zone.id=${zone};S.zone.ev=null;S.zone.fork=null;
      for(const k of ['secretSession','specialSession','riddleSession','taleSession'])delete S.zone[k];
      S.zone.walk={map:${JSON.stringify(map)},phase:'cleared',position:${trap===2?'[0,-33]':'[1.05,-20]'},trapIndex:${trap},scene:${scene?(zone===4?'DragonForestScenes':zone===3?'DesertForestScenes':'MoonlightForestScenes')+'.describe('+JSON.stringify(scene)+')':'null'}};render();
    })()`);
    await ready();await delay(200);
    const counts=await evaluate(`({fire:Number(document.querySelector('.forest-walk-canvas').dataset.animatedFireProps),water:Number(document.querySelector('.forest-walk-canvas').dataset.animatedWaterProps)})`);
    assert(counts.fire+counts.water>0,'effect not attached '+zone+'/'+map+'/'+scene);
    assert.equal(await evaluate('S.zone.walk.phase'),'cleared');assert.equal(await evaluate('!!S.battle'),false);
    await screenshot('effects-'+zone+'-'+(scene||map));console.log('PASS effect integration',zone,map,scene,counts);
  }
  assert.deepEqual(errors,[]);console.log('PASS PNG fire/water animation, masks, cache, reduced motion and four forest integrations');
}finally{
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
