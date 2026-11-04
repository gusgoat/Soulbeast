import {partyArt} from './online-party-art.mjs?v=normal-art-1';
import {connectDungeonParty,partyMotion} from '../../client/dungeon-party.mjs';
import {partyScene} from './online-party-scene.mjs';
import {localPartyWorld} from './online-party-local.mjs?v=local-explore-1';
import {mountPartyVitals} from './online-party-view.mjs';
import {partyRunController} from './online-party-controller.mjs?v=battle-close-4';
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d'),vitals=mountPartyVitals();
const base=new URL('../../',import.meta.url),images=new Map(),keys=new Set(),peers=new Map();
const visuals=partyArt();let selfDir=2,selfPhase=0,selfMoving=false;
const localWorld=localPartyWorld();let trapPlacements=[];
let camera=null;
let controller,connection,maze,nav,config,world={},traps=[],me=null,position=null,last=performance.now(),frameId,ready=false,seenBattle='';
let nextPulse=0,nextContact=0,heartbeatTimer;
const asset=value=>{try{const u=new URL(String(value).replace(/^\//,''),base);return u.origin===base.origin?u.href:null;}catch{return null;}};
let portraits={};void fetch(new URL('party-portraits.json',import.meta.url)).then(r=>r.json()).then(v=>{portraits=v;if(controller?.state?.battle)drawBattle(controller.state.battle);}).catch(()=>{});
function portrait(unit){const key=unit.sp||unit.img;if(unit.cls&&!unit.sp)return sealerSpriteCatalog[unit.cls]?.[unit.gender==='male'?'male':'female']?.portrait;return portraits[key+':'+(unit.evo||0)]||portraits[key]||(String(key).includes('/')?key:null);}
function picture(value){const src=asset(value);if(!src)return null;if(!images.has(src)){const im=new Image();im.src=src;images.set(src,im);}const im=images.get(src);return im.complete&&im.naturalWidth?im:null;}
function notice(text){$('notice').textContent=text;}
function freeze(){ready=false;keys.clear();$('interact').disabled=true;}
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
let commandKey='',clockOffset=0;
function battleControls(run){
 let box=$('partyCommands');if(!box){box=document.createElement('div');box.id='partyCommands';$('battleLog').before(box);}
 const w=run.waiting,key=JSON.stringify([run.id,run.status,w?.actor,w?.turn]);
 if(key!==commandKey){commandKey=key;box.replaceChildren();
  if(run.status!=='active')return;
  const mode=document.createElement('button');mode.textContent='เปิด / ปิดอัตโนมัติ';
  mode.onclick=()=>void controller.command('battleAuto',{battle:run.id,enabled:!controller.state?.autoPlayers?.[connection.code]});box.append(mode);
  const label=document.createElement('p');label.id='turnDeadline';box.append(label);
  if(w?.ownerCode===connection.code){
   const skill=document.createElement('select');skill.setAttribute('aria-label','เลือกพลัง');
   for(const choice of w.choices){const option=new Option(choice.name+' · MP '+choice.mp,choice.id);option.disabled=choice.disabled;skill.add(option);}
   skill.value=w.choices.find(choice=>!choice.disabled)?.id||'rest';
   const target=document.createElement('select');target.setAttribute('aria-label','เป้าหมายศัตรู');
   for(const u of run.battle.enemies.filter(u=>u.hp>0))target.add(new Option(u.name,u.id));
   const friend=document.createElement('select');friend.setAttribute('aria-label','เป้าหมายฝ่ายเรา');
   for(const u of run.battle.allies)friend.add(new Option(u.name+(u.hp<=0?' (หมดสติ)':''),u.id));
   const send=document.createElement('button');send.textContent='ยืนยันคำสั่ง';
   send.onclick=()=>void controller.command('battleCommand',{battle:run.id,actor:w.actor,turn:w.turn,skill:skill.value,target:target.value,friend:friend.value});
   box.append(skill,target,friend,send);
  }
 }
 const label=$('turnDeadline');if(label)label.textContent=w?
  (w.ownerCode===connection.code?'ตาของคุณ':'รอเพื่อนเลือกคำสั่ง')+' · '+Math.max(0,Math.ceil((w.deadline-Date.now()-clockOffset)/1000))+' วินาที':
  'กำลังดำเนินเทิร์น · '+(controller?.state?.autoPlayers?.[connection.code]?'คุณเปิดอัตโนมัติ':'คุณเลือกคำสั่งเอง');
}
function drawBattle(run){
 if(!run){$('battle').hidden=true;return;}
 if(run.kind==='solo'&&run.status!=='active'){seenBattle=run.id;$('battle').hidden=true;keys.clear();return;}
 if(run.status!=='active'&&seenBattle===run.id){$('battle').hidden=true;return;}
 $('battle').hidden=false;$('dismiss').hidden=run.status==='active';
 $('battle').querySelector('h2').textContent=run.status==='active'?(run.kind==='solo'?'ต่อสู้เดี่ยว · รอบ ':'ต่อสู้บอสปาร์ตี้ · รอบ ')+(run.battle?.round||1):run.result==='win'?'ชนะการต่อสู้':'สิ้นสุดการต่อสู้';
 battleControls(run);
 for(const side of ['allies','enemies']){$(side).replaceChildren();for(const unit of run.battle?.[side]||[]){
  const card=document.createElement('div');card.className='card';
  const raw=portrait(unit),src=raw&&(raw.startsWith(base.pathname)&&base.pathname!=='/'?new URL(raw,base).href:asset(raw));if(src){const image=document.createElement('img');image.src=src;image.alt='';card.append(image);}
  const name=document.createElement('strong');name.textContent=(unit.name||unit.cls||'ผู้ผนึก')+' · Lv '+(unit.lv||1);card.append(name);
  for(const stat of ['hp','mp']){const meter=document.createElement('meter');meter.max=Math.max(1,unit.st?.[stat]||1);meter.value=unit[stat]||0;meter.setAttribute('aria-label',stat.toUpperCase());card.append(meter);}
  $(side).append(card);
 }}
 $('battleLog').textContent=(run.battle?.log||[]).slice(-4).map(x=>typeof x==='string'?x:x.text||'').join('\n');
 $('dismiss').onclick=()=>{seenBattle=run.id;$('battle').hidden=true;};
}
const view={
 loadFloor(floor){config=MineFloors.get(floor);maze=MineLabyrinth.create(config.seed,{floor});visuals.setFloor(maze,config);peers.clear();localWorld.reset();trapPlacements=[];position=null;camera=null;$('title').textContent=`ชั้น ${floor} · ${config.name}`;},
 vitals:members=>vitals.update(members),
 roster(members){for(const code of peers.keys())if(!members.some(m=>m.code===code))peers.delete(code);me=members.find(m=>m.code===connection.code);},
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
 if(!$('battle').hidden){
  let errorBox=$('battleError');if(!errorBox){errorBox=document.createElement('p');errorBox.id='battleError';errorBox.setAttribute('role','status');$('battleLog').after(errorBox);}
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
  if(state.battle?.status!=='active')$('battleError')?.remove();
  if(!position&&member?.position)position={...member.position};
  if(state.battle?.status==='active'&&nextPulse!==Infinity)nextPulse=Math.min(nextPulse,performance.now()+750);
  ready=!!position;$('retry').hidden=true;$('interact').disabled=!ready;
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
 $('interact').onclick=()=>{
  if(!ready||controller.busy||!position)return;
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
  if(ready&&position&&nav&&controller.state?.battle?.status!=='active'){
   let dx=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a'));
   let dy=Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'));
   const length=Math.hypot(dx,dy),moving=length>0;selfMoving=moving;if(moving){selfDir=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;selfPhase+=dt*8;}
   if(moving){const speed=180,point={x:position.x+dx/length*speed*dt,y:position.y+dy/length*speed*dt/maze.flatten};
    if(nav.clear(position,point)&&controller.move(point,position))position=point;}
   controller.broadcast({...position,dir:(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8},moving,false);
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
addEventListener('keydown',e=>{if(moveKeys.has(e.key)){e.preventDefault();keys.add(e.key);}});addEventListener('keyup',e=>keys.delete(e.key));
for(const button of document.querySelectorAll('#pad button')){const key=button.dataset.dx?(Number(button.dataset.dx)<0?'ArrowLeft':'ArrowRight'):(Number(button.dataset.dy)<0?'ArrowUp':'ArrowDown');
 button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);keys.add(key);};button.onpointerup=button.onpointercancel=()=>keys.delete(key);}
addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();freeze();}else void controller?.refresh();});
addEventListener('pagehide',()=>{freeze();clearInterval(heartbeatTimer);cancelAnimationFrame(frameId);vitals.remove();void controller?.close();});
function render(){
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#07131c';ctx.fillRect(0,0,w,h);
 if(!maze||!position)return;const scale=.6,F=maze.flatten;
 const focus=camera||position;
 const screen=p=>({x:w/2+(p.x-focus.x)*scale,y:h/2+(p.y-focus.y)*scale*F});
 visuals.draw(ctx,w,h,focus,{...position,dir:selfDir,phase:selfPhase,moving:selfMoving},me,peers,world,localWorld,controller?.state?.chestClaims,traps,performance.now()/1000);
}

// Cache static maze pixels; only markers refresh at 5 Hz.
let miniMaze=null,miniBase=null,miniAt=0;
function renderMinimap(){
 if(!maze||!position||performance.now()-miniAt<200)return;miniAt=performance.now();
 const target=$('partyMini'),c=target.getContext('2d'),pad=12,W=target.width,H=target.height-42;
 const sx=(W-pad*2)/maze.width,sy=(H-pad*2)/maze.height;
 if(miniMaze!==maze){
  miniMaze=maze;miniBase=document.createElement('canvas');miniBase.width=W;miniBase.height=target.height;
  const b=miniBase.getContext('2d');b.fillStyle='#06131e';b.fillRect(0,0,W,target.height);
  b.fillStyle='#9a9279';for(let y=0;y<maze.rows;y++)for(let x=0;x<maze.cols;x++)if(maze.grid[y][x])b.fillRect(pad+x*maze.cell*sx,pad+y*maze.cell*sy,maze.cell*sx,maze.cell*sy);
 }
 c.drawImage(miniBase,0,0);
 function mark(p,text,color){if(!p)return;c.font='bold 15px Tahoma';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#06131e';c.strokeText(text,pad+p.x*sx,pad+p.y*sy+5);c.fillStyle=color;c.fillText(text,pad+p.x*sx,pad+p.y*sy+5);}
 mark(maze.rooms.find(r=>r.id==='boss').gate,'B',world.doorOpen?'#7cf5b6':'#ff6868');
 mark(maze.stairs,'↑','#fff');mark(maze.exit,'↓','#fff');
 for(const peer of peers.values())if(peer.member.exploring!==false)mark(peer,'●','#78cfff');
 mark(position,'▲','#fff16a');
 c.textAlign='left';c.font='12px Tahoma';c.fillStyle='#fff16a';c.fillText('▲ คุณ   ● เพื่อน',8,H+17);
 c.fillStyle='#ff9292';c.fillText('B ห้องบอส   ↑ ชั้นถัดไป',8,H+34);
}
$('miniToggle').onclick=()=>{const b=$('miniToggle'),expanded=b.classList.toggle('expanded');b.setAttribute('aria-expanded',String(expanded));b.setAttribute('aria-label',expanded?'ย่อแผนที่ดันเจี้ยน':'ขยายแผนที่ดันเจี้ยน');b.querySelector('span').textContent=expanded?'แตะเพื่อย่อแผนที่':'แผนที่ · แตะขยาย';};

const stick=$('joystick'),knob=stick.querySelector('span');
function stickMove(e){const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y),limit=r.width*.28,ratio=d?Math.min(1,limit/d):0;knob.style.transform=`translate(${x*ratio}px,${y*ratio}px)`;keys.clear();if(d>8){if(x/d>.35)keys.add('ArrowRight');if(x/d<-.35)keys.add('ArrowLeft');if(y/d>.35)keys.add('ArrowDown');if(y/d<-.35)keys.add('ArrowUp');}}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);stickMove(e);};stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))stickMove(e);};stick.onpointerup=stick.onpointercancel=()=>{keys.clear();knob.style.transform='';};
