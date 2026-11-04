import {connectDungeonParty,partyMotion} from '../../client/dungeon-party.mjs';
import {partyScene} from './online-party-scene.mjs?v=local-motion-1';
import {mountPartyVitals,remotePartyMotion} from './online-party-view.mjs';
import {partyRunController} from './online-party-controller.mjs?v=local-motion-1';
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d'),vitals=mountPartyVitals();
const base=new URL('../../',import.meta.url),images=new Map(),keys=new Set(),peers=new Map();
const enemyMotion=remotePartyMotion({delay:180,maxPrediction:600});
let camera=null;
let controller,connection,maze,nav,config,world={},traps=[],me=null,position=null,last=performance.now(),frameId,ready=false,seenBattle='';
let nextPulse=0,nextContact=0;
const asset=value=>{try{const u=new URL(String(value).replace(/^\//,''),base);return u.origin===base.origin?u.href:null;}catch{return null;}};
function picture(value){const src=asset(value);if(!src)return null;if(!images.has(src)){const im=new Image();im.src=src;images.set(src,im);}const im=images.get(src);return im.complete&&im.naturalWidth?im:null;}
function notice(text){$('notice').textContent=text;}
function freeze(){ready=false;keys.clear();$('interact').disabled=true;}
function offerReturn(city,automatic=false){
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
 if(run.status!=='active'&&seenBattle===run.id)return;
 $('battle').hidden=false;$('dismiss').hidden=run.status==='active';
 $('battle').querySelector('h2').textContent=run.status==='active'?'ต่อสู้ปาร์ตี้ · รอบ '+(run.battle?.round||1):run.result==='win'?'ชนะการต่อสู้':'สิ้นสุดการต่อสู้';
 battleControls(run);
 for(const side of ['allies','enemies']){$(side).replaceChildren();for(const unit of run.battle?.[side]||[]){
  const card=document.createElement('div');card.className='card';
  const src=unit.img&&asset(unit.img);if(src){const image=document.createElement('img');image.src=src;image.alt='';card.append(image);}
  const name=document.createElement('strong');name.textContent=(unit.name||unit.cls||'ผู้ผนึก')+' · Lv '+(unit.lv||1);card.append(name);
  for(const stat of ['hp','mp']){const meter=document.createElement('meter');meter.max=Math.max(1,unit.st?.[stat]||1);meter.value=unit[stat]||0;meter.setAttribute('aria-label',stat.toUpperCase());card.append(meter);}
  $(side).append(card);
 }}
 $('battleLog').textContent=(run.battle?.log||[]).slice(-4).map(x=>typeof x==='string'?x:x.text||'').join('\n');
 $('dismiss').onclick=()=>{seenBattle=run.id;$('battle').hidden=true;};
}
const view={
 loadFloor(floor){config=MineFloors.get(floor);maze=MineLabyrinth.create(config.seed,{floor});peers.clear();enemyMotion.clear();position=null;camera=null;$('title').textContent=`ชั้น ${floor} · ${config.name}`;},
 vitals:members=>vitals.update(members),
 roster(members){for(const code of peers.keys())if(!members.some(m=>m.code===code))peers.delete(code);me=members.find(m=>m.code===connection.code);},
 world(data){world=data||{};nav=MineLabyrinth.navigation(maze,{bossDoorOpen:world.doorOpen,bossCleared:world.boss==='defeated',discovered:{mini:true},treasureDoorOpen:world.boss==='defeated'});
  const now=performance.now();
  for(const [id,enemy] of Object.entries(world.enemies||{})){
   if(enemy.state==='roaming'&&enemy.position)enemyMotion.receive(id,{...enemy.position,moving:enemy.moving},now);
   else enemyMotion.remove(id);
  }
  $('progress').textContent=`อสูรเงา ${world.kills?.shadow||0}/${world.rules?.shadows||0} · โจร ${world.kills?.bandit||0}/${world.rules?.bandits||0} · ${world.doorOpen?'เปิดห้องบอสแล้ว':'รวบรวมยอดปราบเพื่อเปิดห้องบอส'}`;},
 peer:(member,p)=>peers.set(member.code,{member,...p}),traps:value=>{traps=value;},
 stopSolo(){keys.clear();$('battle').hidden=true;},enterBoss(){keys.clear();notice('รวมทีมต่อสู้บอส · เลือกคำสั่งในเทิร์นของคุณ');},battle:drawBattle,
 respawn(destination){freeze();notice('พ่ายแพ้ · ออกจากปาร์ตี้แล้ว');
  // Navigation is restricted to our own town page; never use a server-supplied URL.
  const city=typeof destination==='string'?destination:destination?.city;
  offerReturn(city,true);},
 complete(){freeze();$('battle').hidden=true;notice('พิชิตดันเจี้ยนสำเร็จแล้ว');
  offerReturn();
 }
};
function failure(error){
 if(['not_your_turn','stale_turn','invalid_skill','invalid_target','invalid_auto_mode'].includes(error.message)){
  notice('คำสั่งใช้ไม่ได้หรือเทิร์นเปลี่ยนแล้ว · เลือกคำสั่งใหม่');return;
 }
 freeze();$('retry').hidden=false;notice(error.message==='login_required'?'กรุณาเข้าสู่ระบบออนไลน์ก่อน':'เชื่อมต่อปาร์ตี้ไม่ได้ · หยุดเดินชั่วคราว กดเชื่อมต่ออีกครั้ง');
}
try{
 connection=connectDungeonParty();const roomId=new URL(location.href).searchParams.get('room');
 if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(roomId||''))throw Error('invalid_room');
 const scene=partyScene({code:connection.code,roomId,view});
 controller=partyRunController({connection,roomId,scene,openMotion:partyMotion,onError:failure,onState:(state,queued=[])=>{
  clockOffset=state.serverTime-Date.now();
  if(state.departure||state.state!=='active')return;
  const member=state.members.find(m=>m.code===connection.code);
  position=member?.position?{...member.position}:null;
  // Keep steps taken while the request was in flight, checking them again from
  // the confirmed position in case the server stopped us at a wall.
  if(position&&nav){
   let valid=0;
   for(const point of queued){
    if(!nav.clear(position,point))break;
    position={...point};valid++;
   }
   queued.length=valid;
  }
  ready=!!position;$('retry').hidden=true;$('interact').disabled=!ready;
  notice(state.battle?.status==='active'?'เลือกคำสั่งภายใน 12 วินาที · หากไม่เลือกจะเปิดอัตโนมัติ':'WASD / ลูกศร หรือปุ่มเดิน');
 }});
 $('retry').onclick=()=>void controller.refresh();
 $('interact').onclick=()=>{
  if(!ready||controller.busy||!position)return;
  const confirmed=me?.position;if(!confirmed)return;
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
 function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!document.hidden&&ready&&!controller.busy&&now>=nextPulse){
   nextPulse=now+250;
   void controller.pulse();
  }
  if(ready&&position&&nav&&controller.state?.battle?.status!=='active'){
   let dx=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a'));
   let dy=Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'));
   const length=Math.hypot(dx,dy),moving=length>0;
   if(moving){const speed=180,point={x:position.x+dx/length*speed*dt,y:position.y+dy/length*speed*dt/maze.flatten};
    if(nav.clear(position,point)&&controller.move(point,position))position=point;}
   controller.broadcast({...position,dir:(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8},moving,false);
   const confirmed=me?.position;
   if(!controller.busy&&confirmed&&now>=nextContact){const target=Object.entries(world.enemies||{}).find(([,e])=>e.state==='roaming'&&e.position&&nav.distance(confirmed,e.position)<38&&nav.clear(confirmed,e.position));
    if(target){nextContact=now+500;void controller.command('claim',{enemy:target[0]});}
    else if(world.doorOpen&&world.boss==='guarding'&&nav.distance(confirmed,world.bossPosition||maze.boss)<65&&nav.clear(confirmed,world.bossPosition||maze.boss)){
     nextContact=now+500;void controller.command('bossContact');
    }}
  }
  if(position){
   if(!camera)camera={...position};
   const follow=1-Math.exp(-dt*24);
   camera.x+=(position.x-camera.x)*follow;
   camera.y+=(position.y-camera.y)*follow;
  }
  scene.frame();render();frameId=requestAnimationFrame(frame);
 }
 frameId=requestAnimationFrame(frame);
}catch(error){failure(error);}
const moveKeys=new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
addEventListener('keydown',e=>{if(moveKeys.has(e.key)){e.preventDefault();keys.add(e.key);}});addEventListener('keyup',e=>keys.delete(e.key));
for(const button of document.querySelectorAll('#pad button')){const key=button.dataset.dx?(Number(button.dataset.dx)<0?'ArrowLeft':'ArrowRight'):(Number(button.dataset.dy)<0?'ArrowUp':'ArrowDown');
 button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);keys.add(key);};button.onpointerup=button.onpointercancel=()=>keys.delete(key);}
addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();freeze();}else void controller?.refresh();});
addEventListener('pagehide',()=>{freeze();cancelAnimationFrame(frameId);vitals.remove();void controller?.close();});
function render(){
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#07131c';ctx.fillRect(0,0,w,h);
 if(!maze||!position)return;const scale=.6,F=maze.flatten;
 const focus=camera||position;
 const screen=p=>({x:w/2+(p.x-focus.x)*scale,y:h/2+(p.y-focus.y)*scale*F});
 const palettes={mine:['#223344','#62616b'],desert:['#59432e','#cbb482'],jungle:['#15392c','#71824b'],snow:['#416275','#d5e8ee'],castle:['#261d35','#615364'],lava:['#321d22','#8e4934']},colors=palettes[config.theme];
 const rx=Math.ceil(w/scale/maze.cell/2)+1,ry=Math.ceil(h/scale/F/maze.cell/2)+1,cx=Math.floor(focus.x/maze.cell),cy=Math.floor(focus.y/maze.cell);
 for(let y=Math.max(0,cy-ry);y<=Math.min(maze.rows-1,cy+ry);y++)for(let x=Math.max(0,cx-rx);x<=Math.min(maze.cols-1,cx+rx);x++){
  const p=screen({x:x*maze.cell,y:y*maze.cell});ctx.fillStyle=colors[maze.grid[y][x]?1:0];ctx.fillRect(p.x,p.y,maze.cell*scale+1,maze.cell*scale*F+1);
 }
 function token(p,color,label,img,size=32){const at=screen(p);if(at.x< -100||at.y< -100||at.x>w+100||at.y>h+100)return;const im=img&&picture(img);if(im)ctx.drawImage(im,at.x-size/2,at.y-size,size,size);else{ctx.fillStyle=color;ctx.beginPath();ctx.arc(at.x,at.y,10,0,Math.PI*2);ctx.fill();}ctx.font='11px Tahoma';ctx.textAlign='center';ctx.fillStyle='#fff3d4';ctx.fillText(label||'',at.x,at.y-size-4);}
 for(const t of traps){if(!t.remaining&&!t.burst)continue;const at=screen(t);ctx.save();
  const radius=t.burst?290*(1-.45*t.burst):290;
  ctx.globalAlpha=t.burst||.7;ctx.strokeStyle=({blast:'#ffb354',poison:'#73ee6d',fire:'#ff5d37',electric:'#db82ff',ice:'#7bdfff'})[t.type];
  ctx.lineWidth=t.burst?3+6*t.burst:3;ctx.beginPath();ctx.ellipse(at.x,at.y,radius*scale,radius*scale*F,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 const now=performance.now();
 for(const [id,e] of Object.entries(world.enemies||{}))if(e.state==='roaming'&&e.position){
  const animated=enemyMotion.position(id,now);
  const visible=animated&&nav.clear(e.position,animated)?animated:e.position;
  token(visible,e.kind==='bandit'?'#d08059':'#9c76e8',e.kind==='bandit'?'โจรป่า':'อสูรเงา');
 }
 if(world.boss!=='defeated')token(world.bossPosition||maze.boss,'#ee574d',config.bossName,config.bossArt,90);
 const gate=maze.rooms.find(r=>r.id==='boss').gate;token(gate,'#dfbf73',world.doorOpen?'ประตูเปิด':'ห้องบอส');token(maze.stairs,'#91d5e8','ชั้นถัดไป');
 token(maze.mini,'#8de6ec','บ่อน้ำศักดิ์สิทธิ์');
 for(const chest of maze.chests)token(chest,controller.state?.chestClaims?.[chest.id]?'#777':'#e2b654',controller.state?.chestClaims?.[chest.id]?'เปิดแล้ว':chest.big?'หีบบอส':'หีบสมบัติ');
 for(const peer of peers.values())if(peer.member.exploring!==false)token(peer,'#85c8e4',peer.member.name,peer.member.avatar);
 if(me?.exploring!==false)token(focus,'#efda8a',me?.name,me?.avatar);
}
