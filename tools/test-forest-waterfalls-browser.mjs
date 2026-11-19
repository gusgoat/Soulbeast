import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '..', 'forest-waterfall-qa');
await mkdir(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/Soulbeast\//,'');
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(8852,'127.0.0.1',resolve));
const chrome=spawn(process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
  '--headless=new','--remote-debugging-port=9382',`--user-data-dir=${path.join(output,'chrome-profile')}`,
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
  const targets=await until(async()=>{const r=await fetch('http://127.0.0.1:9382/json/list');return (await r.json()).find(p=>p.type==='page');},'Chrome');
  socket=new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')console.log('BROWSER',m.params.args.map(a=>a.value||a.description).join(' ').slice(0,1000));});
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:8852/Soulbeast/tools/town-walk-demo/menu.html?screen=wild&zone=7'});
  await until(()=>evaluate(`typeof S!=='undefined' && !!S.zone?.walk`),'game bootstrap',45000);
  await evaluate(`window.qaBaseP=structuredClone(S.P);window.qaBaseZ=structuredClone(S.zone);S.P.tutorial.enabled=false;S.ui={};S.screen='zone';render();`);
  await ready();

  const audio=await evaluate(`(async()=>{
    const {startWaterfallAudio,waterfallGain}=await import('/Soulbeast/assets/forest-walk/waterfall-audio.js?v=waterfall-preview-2');
    const ctx=new AudioContext();await ctx.resume();const bus=ctx.createGain(),analyser=ctx.createAnalyser();analyser.fftSize=2048;bus.connect(analyser);analyser.connect(ctx.destination);
    const NativeAudio=window.Audio;window.qaRecordings=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);qaRecordings.push(this);}};
    let enabled=true;const api=startWaterfallAudio(()=>({enabled,context:ctx,destination:bus}));api.updateDistance(5);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<300;i++){if(qaRecordings[0].currentTime>.1)break;await wait(100);}
    const rec=qaRecordings[0];
    async function rms(){await wait(1000);let sum=0;for(let n=0;n<8;n++){const a=new Float32Array(2048);analyser.getFloatTimeDomainData(a);sum+=a.reduce((s,v)=>s+v*v,0)/a.length;await wait(40);}return Math.sqrt(sum/8);}
    const near=await rms(),loaded=rec.currentTime>0&&!rec.paused;api.updateDistance(27);const far=await rms();api.updateDistance(Infinity);const silent=await rms();
    api.updateDistance(5);bus.gain.value=0;const sliderZero=await rms();bus.gain.value=1;enabled=false;api.updateDistance(5);const muted=rec.paused;
    enabled=true;api.updateDistance(5);await wait(150);const resumed=!rec.paused;api.close();const closed=rec.paused&&!rec.getAttribute('src')&&ctx.state==='running';await ctx.close();
    return {loaded,loop:rec.loop,near,far,silent,sliderZero,muted,resumed,closed,curve:[0,5,12,20,27,34,80].map(d=>waterfallGain(d))};
  })()`);
  console.log('AUDIO',JSON.stringify(audio));assert(audio.loaded&&audio.loop);assert(audio.near>audio.far*2&&audio.far>0);assert(audio.silent<.0001&&audio.sliderZero<.0001);assert(audio.muted&&audio.resumed&&audio.closed);
  for(let i=1;i<audio.curve.length;i++)assert(audio.curve[i]<=audio.curve[i-1]);

  const steps=await evaluate(`(async()=>{
    const {createFootstepAudio,footstepSlice,footstepURL}=await import('/Soulbeast/assets/forest-walk/footstep-audio.js?v=waterfall-preview-2');
    const ctx=new AudioContext();await ctx.resume();const bus=ctx.createGain(),analyser=ctx.createAnalyser();analyser.fftSize=2048;bus.connect(analyser);analyser.connect(ctx.destination);
    const buffer=await ctx.decodeAudioData(await(await fetch(footstepURL('concrete-footsteps'))).arrayBuffer());
    const slices=Array.from({length:8},(_,i)=>footstepSlice(buffer,true,i)),lead=buffer.getChannelData(0).slice(0,Math.floor(buffer.sampleRate*.21));
    let enabled=true;const api=createFootstepAudio(()=>({enabled,context:ctx,destination:bus}));
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    async function hear(onTrail,running=false,speed=1){await api.step(running,onTrail,speed);let peak=0;for(let i=0;i<35;i++){await wait(10);const a=new Float32Array(2048);analyser.getFloatTimeDomainData(a);for(const v of a)peak=Math.max(peak,Math.abs(v));}return peak;}
    const trail=await hear(true),run=await hear(true,true,.65),outside=await hear(false);enabled=false;const muted=await hear(true);api.close();const ownerAlive=ctx.state==='running';await ctx.close();
    return {slices,leadPeak:Math.max(...lead.map(Math.abs)),trail,run,outside,muted,ownerAlive};
  })()`);
  console.log('FOOTSTEPS',JSON.stringify(steps));assert(steps.slices.every(s=>s.peak>steps.leadPeak*4));assert(steps.trail>.01&&steps.run>.01&&steps.outside>.01);assert(steps.muted<.0001&&steps.ownerAlive);
  for(const zone of [7,1,3,4,5])for(const map of ['spring','revival','cleanse']){
    await evaluate(`(()=>{S.P=structuredClone(qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';S.zone=structuredClone(qaBaseZ);S.zone.id=${zone};S.zone.ev=null;S.zone.fork=null;for(const k of ['secretSession','specialSession','riddleSession','taleSession'])delete S.zone[k];S.zone.walk={map:${JSON.stringify(map)},phase:'cleared',position:[1.05,-20],trapIndex:-1};render();})()`);
    await ready();await delay(150);
    const n=await evaluate(`Number(document.querySelector('.forest-walk-canvas').dataset.flowingWaterfalls)`);
    const expected=[7,1].includes(zone)?(map==='spring'?1:0):(map==='spring'?2:1);assert.equal(n,expected,zone+'/'+map+' waterfall source detection');
    if(map==='revival'&&zone===5||map==='spring'&&zone===7)await screenshot('flow-'+zone+'-'+map);
    console.log('PASS cascades',zone,map,n);
  }

  await evaluate(`window.qaDryPlayed=[];Sound.enabled=true;Sound.unlock().then(()=>{const base=Sound.ctx.createBufferSource.bind(Sound.ctx);Sound.ctx.createBufferSource=()=>{const src=base(),start=src.start.bind(src);src.start=(...args)=>{qaDryPlayed.push({duration:src.buffer?.duration,offset:args[1],rate:src.playbackRate.value});return start(...args);};return src;};})`);
  for(const onTrail of [true,false])for(const running of [false,true]){
    await evaluate(`S.P=structuredClone(qaBaseP);S.P.tutorial.enabled=false;S.ui={};S.battle=null;S.screen='zone';S.zone=structuredClone(qaBaseZ);S.zone.id=7;S.zone.ev=null;S.zone.fork=null;S.zone.walk={map:'footprints',phase:'cleared',position:[${onTrail?0:9},-36],trapIndex:-1};render();`);await ready();
    await evaluate('qaDryPlayed=[]');
    if(running)await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Shift',code:'ShiftLeft',windowsVirtualKeyCode:16});
    await key('keyDown');await delay(1800);await key('keyUp');
    if(running)await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Shift',code:'ShiftLeft',windowsVirtualKeyCode:16});
    const played=await evaluate('qaDryPlayed');assert(played.some(s=>onTrail?s.duration>7&&s.offset>=.38:s.duration<1&&s.offset===0),'actual '+(onTrail?'trail':'outside')+' '+(running?'run':'walk')+' clip: '+JSON.stringify(played));
    console.log('PASS actual keyboard footsteps',onTrail?'trail':'outside',running?'run':'walk',JSON.stringify(played));
  }
  assert.deepEqual(errors,[]);await writeFile(path.join(output,'verified.json'),JSON.stringify({audio,steps,forestWellScenes:15},null,2));
  console.log('PASS supplied waterfall MP3 playback, distance/slider/mute, shared context lifetime and all 15 well scenes');
}finally{
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
