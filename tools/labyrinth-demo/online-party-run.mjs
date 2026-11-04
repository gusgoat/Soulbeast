import {partyMenu} from './online-party-menu.mjs?v=shared-shell-2';
import {partyArt} from './online-party-art.mjs?v=shared-shell-1';
import {connectDungeonParty,partyMotion} from '../../client/dungeon-party.mjs';
import {partyScene} from './online-party-scene.mjs';
import {localPartyWorld} from './online-party-local.mjs?v=solo-ui-2';
import {mountPartyVitals} from './online-party-view.mjs';
import {partyRunController} from './online-party-controller.mjs?v=battle-close-4';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),vitals=mountPartyVitals();
const base=new URL('../../',import.meta.url),images=new Map(),keys=new Set(),peers=new Map();
const visuals=partyArt();let selfDir=0,selfPhase=0,selfMoving=false;
const localWorld=localPartyWorld();let trapPlacements=[];
let camera=null;
let controller,connection,maze,nav,config,world={},traps=[],me=null,position=null,last=performance.now(),frameId,ready=false,seenBattle='';
let nextPulse=0,nextContact=0,heartbeatTimer;
$('action').hidden=false;$('action').disabled=true;$('action').textContent='สำรวจ / เปิดประตู';
const asset=value=>{try{const u=new URL(String(value).replace(/^\//,''),base);return u.origin===base.origin?u.href:null;}catch{return null;}};
let portraits={};void fetch(new URL('party-portraits.json',import.meta.url)).then(r=>r.json()).then(v=>{portraits=v;if(controller?.state?.battle)drawBattle(controller.state.battle);}).catch(()=>{});
function portrait(unit){const key=unit.sp||unit.img;if(unit.cls&&!unit.sp)return sealerSpriteCatalog[unit.cls]?.[unit.gender==='male'?'male':'female']?.portrait;return portraits[key+':'+(unit.evo||0)]||portraits[key]||(String(key).includes('/')?key:null);}
function picture(value){const src=asset(value);if(!src)return null;if(!images.has(src)){const im=new Image();im.src=src;images.set(src,im);}const im=images.get(src);return im.complete&&im.naturalWidth?im:null;}
let noticeTimer;
function notice(text){const toast=$('toast');toast.textContent=text;toast.style.opacity=1;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>toast.style.opacity=0,4000);}
function freeze(){ready=false;keys.clear();$('action').disabled=true;}
function offerReturn(city,automatic=false){
 $('leaveParty').hidden=true;$('retry').hidden=true;
 const button=$('returnHome');button.hidden=false;
 button.onclick=async()=>{
  if(button.disabled)return;button.disabled=true;
  try{
   const player=await connection.restoreWalk();
   const destination=/^(blue|green|red)-capital$/.test(city||'')?city:
    (['blue','green','red'].includes(player.country)?player.country:'blue')+'-capital';
   location.assign(new URL('../town-walk-demo/index.html?city='+destination,import.meta.url));
  }catch{notice('โหลดเซฟล่าสุดไม่สำเร็จ · กดกลับเมืองหลวงอีกครั้ง');button.disabled=false;}
 };
 if(automatic)void button.onclick();
}
const menus=partyMenu({canOpen:()=>ready&&controller?.state?.battle?.status!=='active',request:data=>connection.run(new URL(location.href).searchParams.get('room'),'inventory',data),refresh:()=>controller.refresh(),getFloor:()=>config?.id,onOpen:()=>{keys.clear();selfMoving=false;}});
let clockOffset=0, shownBattle=null, battleFrameReady=false;
const battleFrame=$('partyBattleFrame');
function sendBattle(){
 if(!shownBattle||!battleFrameReady)return;
 battleFrame.contentWindow.postMessage({type:'party-battle-state',run:shownBattle,code:connection.code,
  auto:!!controller?.state?.autoPlayers?.[connection.code],clockOffset,member:me},location.origin);
}
addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==battleFrame.contentWindow)return;
 const message=event.data;
 if(message?.type==='party-battle-ready'){battleFrameReady=true;sendBattle();return;}
 if(!shownBattle||$('battle').hidden||message?.battle!==shownBattle.id)return;
 if(message.type==='party-battle-done'&&shownBattle.status!=='active'){
  seenBattle=shownBattle.id;drawBattle(null);window.focus();return;
 }
 if(shownBattle.status!=='active')return;
 if(message.type==='party-battle-auto')void controller.command('battleAuto',{battle:shownBattle.id,enabled:!!message.enabled});
 if(message.type==='party-battle-command'){
  const turn=shownBattle.waiting;
  if(turn?.ownerCode!==connection.code||message.turn!==turn.turn||message.actor!==turn.actor)return;
  void controller.command('battleCommand',{battle:shownBattle.id,actor:turn.actor,turn:turn.turn,skill:message.skill,target:message.target,friend:message.friend});
 }
});
function drawBattle(run){
 if(!run||(run.status!=='active'&&(run.kind==='solo'||seenBattle===run.id))){
  shownBattle=null;$('battle').hidden=true;$('battleError').hidden=true;
  if(run?.kind==='solo'){seenBattle=run.id;keys.clear();}
  return;
 }
 if(menus.open)menus.close();
 if(shownBattle?.id!==run.id){
  battleFrameReady=false;
  battleFrame.src=`../town-walk-demo/menu.html?screen=hero&v=party-solo-ui-2&partyBattle=shared-battle-2&dungeon=${encodeURIComponent(config?.id||'mine-floor-1')}`;
 }
 shownBattle=run;$('battle').hidden=false;sendBattle();
}
const view={
 loadFloor(floor){config=MineFloors.get(floor);maze=MineLabyrinth.create(config.seed,{floor});visuals.setFloor(maze,config);peers.clear();localWorld.reset();trapPlacements=[];position=null;camera=null;document.documentElement.dataset.floor=floor;document.querySelector('header small').textContent=`มหาเขาวงกต · ชั้น ${floor} / 7`;document.querySelector('header h1').textContent=config.name;document.querySelector('#mapPanel small').textContent=`ชั้น ${floor} · ${config.name}`;document.title=`มหาเขาวงกต · ${config.name}`;},
 vitals:members=>vitals.update(members),
 roster(members){for(const code of peers.keys())if(!members.some(m=>m.code===code))peers.delete(code);me=members.find(m=>m.code===connection.code);menus.update(me);},
 world(data){world=data||{};nav=MineLabyrinth.navigation(maze,{bossDoorOpen:world.doorOpen,bossCleared:world.boss==='defeated',discovered:{mini:true},treasureDoorOpen:world.boss==='defeated'});
  localWorld.receive(world,connection.code,performance.now());
  if(!trapPlacements.length)trapPlacements=DungeonTraps.create(maze,nav,{}, {seed:config.seed+71371,count:35}).list;

  $('progress').textContent=`อสูรเงา ${world.kills?.shadow||0}/${world.rules?.shadows||0} · โจร ${world.kills?.bandit||0}/${world.rules?.bandits||0} · กับดักเหลือ ${trapPlacements.length-(world.traps||[]).filter(t=>t.state==='spent').length} · ${world.doorOpen?'เปิดห้องบอสแล้ว':'รวบรวมยอดปราบเพื่อเปิดห้องบอส'}`;},
 peer:(member,p)=>peers.set(member.code,{member,...p}),traps:value=>{traps=value;},
 stopSolo(){keys.clear();$('battle').hidden=true;},enterBoss(){keys.clear();notice('รวมทีมต่อสู้บอส · เลือกคำสั่งในเทิร์นของคุณ');},battle:drawBattle,
 respawn(destination,reason){freeze();notice(reason==='left'?'ออกจากดันเจี้ยนและปาร์ตี้แล้ว':'พ่ายแพ้ · ออกจากปาร์ตี้แล้ว');
  // Navigation is restricted to our own town page; never use a server-supplied URL.
  const city=typeof destination==='string'?destination:destination?.city;
  offerReturn(city,true);},
 complete(){freeze();$('battle').hidden=true;notice('พิชิตดันเจี้ยนสำเร็จแล้ว');
  offerReturn();
 }
};
function failure(error){
 $('loading').hidden=true;
 if(!$('battle').hidden){
  const errorBox=$('battleError');errorBox.hidden=false;
  errorBox.textContent='อัปเดตการต่อสู้ไม่สำเร็จ ('+String(error.code||error.message||'network')+') · ระบบจะลองเชื่อมต่ออีกครั้ง';
 }
 if(['party_unavailable','party_not_member'].includes(error.message)){
  freeze();$('battle').hidden=true;notice('ห้องปาร์ตี้สิ้นสุดแล้วหรือคุณออกจากห้องแล้ว');
  offerReturn();return;
 }
 if(['trap_not_due','trap_unavailable','trap_out_of_reach','movement_wrong_floor'].includes(error.message))return;
 if(['not_your_turn','stale_turn','invalid_skill','invalid_target','invalid_auto_mode'].includes(error.message)){
  notice('คำสั่งใช้ไม่ได้หรือเทิร์นเปลี่ยนแล้ว · เลือกคำสั่งใหม่');return;
 }
 if(error.message==='login_required')freeze();$('retry').hidden=false;notice(error.message==='login_required'?'กรุณาเข้าสู่ระบบออนไลน์ก่อน':'กำลังเชื่อมต่อปาร์ตี้ใหม่ · เดินต่อได้ รอยืนยันกิจกรรม');
}
try{
 connection=connectDungeonParty();const roomId=new URL(location.href).searchParams.get('room');
 if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(roomId||''))throw Error('invalid_room');
 const scene=partyScene({code:connection.code,roomId,view});
 controller=partyRunController({connection,roomId,scene,openMotion:partyMotion,onError:failure,localExploration:true,getPosition:()=>position?{...position}:null,onState:(state,queued=[])=>{
  clockOffset=state.serverTime-Date.now();
  if(state.departure||state.state!=='active')return;
  const member=state.members.find(m=>m.code===connection.code);
  // Reconcile the overlay even if the scene already consumed this revision.
  drawBattle(state.battle);
  $('battleError').hidden=true;
  if(!position&&member?.position)position={...member.position};
  if(state.battle?.status==='active'&&nextPulse!==Infinity)nextPulse=Math.min(nextPulse,performance.now()+750);
  ready=!!position;if(ready)window.WalkLoading.ready();$('retry').hidden=true;$('action').disabled=!ready;
  notice(state.battle?.status==='active'?'เลือกคำสั่งภายใน 12 วินาที · หากไม่เลือกจะเปิดอัตโนมัติ':'WASD / ลูกศร หรือปุ่มเดิน');
 }});
 $('leaveParty').onclick=async()=>{
  if(!window.confirm('ออกจากดันเจี้ยนและปาร์ตี้เพื่อกลับเมืองหลวงหรือไม่?'))return;
  const button=$('leaveParty');button.disabled=true;
  try{
   while(controller.busy)await new Promise(resolve=>setTimeout(resolve,50));
   if(!button.hidden)await controller.command('leave');
  }finally{button.disabled=false;}
 };
 $('retry').onclick=()=>void controller.refresh();
 $('action').onclick=()=>{
  if(menus.open||!ready||controller.busy||!position)return;
  const confirmed=position;if(!confirmed)return;
  const near=p=>nav.distance(confirmed,p)<210;
  const door=maze.rooms.find(r=>r.id==='boss').gate;
  const chest=maze.chests.find(c=>!controller.state?.chestClaims?.[c.id]&&nav.distance(confirmed,c)<145&&nav.clear(confirmed,c));
  if(chest)void controller.command('chest',{chest:chest.id});
  else if(nav.distance(confirmed,maze.mini)<180&&nav.clear(confirmed,maze.mini))void controller.command('heal');
  else if(near(door)&&!world.doorOpen)void controller.command('openDoor');
  else if(near(maze.stairs)&&world.boss==='defeated')void controller.command('nextFloor');
  else notice('เดินเข้าใกล้หีบ บ่อน้ำ ประตูห้องบอส หรือประตูชั้นถัดไป');
 };
 void controller.refresh();
 // Combat progression must not depend on the canvas drawing successfully.
 heartbeatTimer=setInterval(()=>{
  if(!document.hidden&&ready&&!controller.busy&&performance.now()>=nextPulse){
   nextPulse=Infinity;
   void controller.pulse().finally(()=>{nextPulse=performance.now()+(controller.state?.battle?.status==='active'?750:5000);});
  }
 },100);
 function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!menus.open&&$('mapPanel').hidden&&!window.WalkControls?.editing&&ready&&position&&nav&&controller.state?.battle?.status!=='active'){
   let dx=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a'));
   let dy=Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'));
   const length=Math.hypot(dx,dy),moving=length>0;selfMoving=moving;if(moving){selfDir=(Math.round(-Math.atan2(dx,dy)/(Math.PI/4))+8)%8;selfPhase+=dt*8;}
   if(moving){const speed=180,point={x:position.x+dx/length*speed*dt,y:position.y+dy/length*speed*dt/maze.flatten};
    if(nav.clear(position,point)&&controller.move(point,position))position=point;}
   controller.broadcast({...position,dir:selfDir},moving,false);
   localWorld.update(dt,position,nav,world,maze.boss,now);
   localWorld.trigger(trapPlacements,position,nav,now);
   traps=[...localWorld.effects.values()];
   const trapRequest=localWorld.request();
   if(trapRequest&&!controller.busy&&now>=nextContact){
    nextContact=now+750;void controller.command(trapRequest.action,{trap:trapRequest.trap,position:trapRequest.position});
   }
   const confirmed=position;
   if(!controller.busy&&confirmed&&now>=nextContact){const target=[...localWorld.enemies.entries()].find(([,e])=>e.state==='roaming'&&e.position&&nav.distance(confirmed,e.position)<38&&nav.clear(confirmed,e.position));
    if(target){nextContact=now+500;void controller.command('claim',{enemy:target[0],enemyPosition:{...target[1].position}});}
    else if(world.doorOpen&&world.boss==='guarding'&&nav.distance(confirmed,localWorld.boss||world.bossPosition||maze.boss)<65&&nav.clear(confirmed,localWorld.boss||world.bossPosition||maze.boss)){
     nextContact=now+500;void controller.command('bossContact',{enemyPosition:{...(localWorld.boss||maze.boss)}});
    }}
  }
  if(position){
   if(!camera)camera={...position};
   const follow=1-Math.exp(-dt*24);
   camera.x+=(position.x-camera.x)*follow;
   camera.y+=(position.y-camera.y)*follow;
  }
  scene.frame();render();renderMinimap();frameId=requestAnimationFrame(frame);
 }
 frameId=requestAnimationFrame(frame);
}catch(error){failure(error);}
const moveKeys=new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
addEventListener('keydown',e=>{if(!menus.open&&moveKeys.has(e.key)){e.preventDefault();keys.add(e.key);}});addEventListener('keyup',e=>keys.delete(e.key));
addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();freeze();}else void controller?.refresh();});
addEventListener('pagehide',()=>{freeze();clearInterval(heartbeatTimer);cancelAnimationFrame(frameId);vitals.remove();void controller?.close();});
function render(){
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#07131c';ctx.fillRect(0,0,w,h);
 if(!maze||!position)return;
 const focus=camera||position;
 const screen=p=>({x:w/2+(p.x-focus.x)*scale,y:h/2+(p.y-focus.y)*scale*F});
 visuals.draw(ctx,w,h,focus,{...position,dir:selfDir,phase:selfPhase,moving:selfMoving},me,peers,world,localWorld,controller?.state?.chestClaims,traps,performance.now()/1000);
}

// Cache static maze pixels; only markers refresh at 5 Hz.
const miniLayers=new WeakMap();let miniAt=0;
function renderMinimap(){
 if(!maze||!position||performance.now()-miniAt<200)return;miniAt=performance.now();
 drawMinimap($('mini'));
 if(!$('mapPanel').hidden)drawMinimap($('atlas'));
}
function drawMinimap(target){
 const c=target.getContext('2d'),sx=target.width/maze.width,sy=target.height/maze.height;
 const key=JSON.stringify([world.doorOpen,world.boss==='defeated']);
 let cached=miniLayers.get(target);
 if(cached?.maze!==maze||cached.key!==key){
  const canvas=document.createElement('canvas');canvas.width=target.width;canvas.height=target.height;
  const layer=canvas.getContext('2d');layer.fillStyle=config.theme==='jungle'?'#102d1c':config.theme==='desert'?'#332218':'#071018';layer.fillRect(0,0,canvas.width,canvas.height);
  layer.fillStyle=config.theme==='jungle'?'#a3aa6b':config.theme==='desert'?'#c19a60':'#526771';
  for(let y=0;y<maze.rows;y++)for(let x=0;x<maze.cols;x++){
   if(world.boss!=='defeated'&&maze.rooms.some(r=>r.lockedByBoss&&x>=r.x0&&x<=r.x1&&y>=r.y0&&y<=r.y1))continue;
   if(maze.grid[y][x]===1||maze.grid[y][x]===2&&maze.rooms.some(r=>r.door[0]===x&&r.door[1]===y&&(r.bossEntrance&&world.doorOpen||r.lockedByBoss&&world.boss==='defeated')))layer.fillRect(x*maze.cell*sx,y*maze.cell*sy,maze.cell*sx+.2,maze.cell*sy+.2);
  }
  layer.strokeStyle='#2592a3';layer.lineWidth=Math.max(1,canvas.width/300);layer.beginPath();maze.river.forEach((p,i)=>i?layer.lineTo(p.x*sx,p.y*sy):layer.moveTo(p.x*sx,p.y*sy));layer.stroke();
  cached={maze,key,canvas};miniLayers.set(target,cached);
 }
 c.drawImage(cached.canvas,0,0);
 const mark=(p,kind,color,size)=>WalkMapSymbols.draw(c,kind,p.x*sx,p.y*sy,size,color);
 mark(maze.exit,'gate','#82d6b6',10);mark(maze.stairs,'gate',world.boss==='defeated'?'#88ffdf':'#bf9d65',10);
 if(world.boss!=='defeated')mark(maze.boss,'boss','#e99d6a',12);
 if(config.rest)mark(maze.mini,'well','#72ffe7',10);
 for(const chest of maze.chests)if((!chest.room||world.boss==='defeated')&&!controller.state?.chestClaims?.[chest.id]&&nav.distance(chest,position)<650)mark(chest,'chest','#eac779',target.id==='mini'?7:12);
 for(const peer of peers.values())if(peer.member.exploring!==false)mark(peer,'person','#78deed',12);
 mark(position,'person','#fff3a0',14);
}
function showMap(open){$('mapPanel').hidden=!open;keys.clear();miniAt=0;renderMinimap();}
$('mapButton').onclick=()=>showMap(true);
$('closeMap').onclick=()=>showMap(false);
$('guide').onclick=()=>notice('เดินสำรวจพร้อมเพื่อน · กด E เพื่อสำรวจ · กด M เพื่อเปิดแผนที่');
addEventListener('keydown',event=>{
 if(menus.open||!$('battle').hidden||event.repeat)return;
 if(event.key.toLowerCase()==='m')showMap($('mapPanel').hidden);
 if(event.key==='Escape'&&!$('mapPanel').hidden)showMap(false);
 if(event.key.toLowerCase()==='e'&&$('mapPanel').hidden)$('action').click();
});

const stick=$('joystick'),knob=stick.querySelector('b');
function stickMove(e){const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y),limit=r.width*.28,ratio=d?Math.min(1,limit/d):0;knob.style.transform=`translate(${x*ratio}px,${y*ratio}px)`;keys.clear();if(d>8){if(x/d>.35)keys.add('ArrowRight');if(x/d<-.35)keys.add('ArrowLeft');if(y/d>.35)keys.add('ArrowDown');if(y/d<-.35)keys.add('ArrowUp');}}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);stickMove(e);};stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))stickMove(e);};stick.onpointerup=stick.onpointercancel=()=>{keys.clear();knob.style.transform='';};
