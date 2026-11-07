import {connectAccounts} from './account-client.mjs?v=admin-session-20261107';
import {connectOnlineWalk} from './online-walk.mjs?v=admin-session-20261107';
import {gameContext} from './kingdom-boss-feed.mjs?v=kingdom-boss-20261107';

const scene=window.kingdomBossWalkScene,context=gameContext();
if(scene&&context?.code)mount(scene,context);

function mount(scene,context){
 const account=connectAccounts(()=>{}),connection=connectOnlineWalk(undefined,{client:account});
 const send=(action,extra)=>account.game('kingdom_boss_'+action,{code:context.code,...extra},context.environment);
 const doneKey='soulbeast-kb-battle:'+context.environment+':'+context.code;
 const button=document.createElement('button');button.type='button';button.hidden=true;
 button.style.cssText='position:fixed;z-index:85;top:calc(var(--walk-top, 0px) + 70px);left:10px;padding:7px 10px;max-width:52vw;background:#102831ed;border:1px solid #e4bc68;color:#ffedb1;border-radius:9px;font:600 12px Tahoma,sans-serif';
 document.body.append(button);button.onclick=()=>{if(scene.canMove()||scene.overview())scene.openMap();};
 const art=window.RareBossSprites?.create();
 let event=null,sprite='',frame=null,fight=null,queued=null,lastMove=0,ready=false,visible=false,waitTurn=null,
  polling=null,requesting=false,withdrawing=false,stayClear=false,resumed=false,feedback=null;
 const sameMap=()=>event?.country===scene.country;
 const active=()=>event?.status==='active'&&(window.SoulbeastKingdomBoss?.now()||Date.now())<event.end;
 const sync=e=>{
  if(event?.id!==e?.id){stayClear=false;lastMove=0;}
  event=e;button.hidden=!sameMap()||!active()||!!frame;
  if(!button.hidden){button.textContent='บอสอาณาจักร · '+event.name;button.title='ดูตำแหน่งบอสบนแผนที่ประเทศ';}
  if(sameMap()&&active()&&sprite!==event.species){sprite=event.species;art?.sync(sprite).catch(()=>{});}
 };
 addEventListener('soulbeast-kingdom-boss-update',e=>sync(e.detail));
 sync(window.SoulbeastKingdomBoss?.event||null);
 const update=data=>{if(data.event)window.SoulbeastKingdomBoss?.accept(data.event);};
 function report(text){
  feedback?.remove();const message=document.createElement('p');feedback=message;message.setAttribute('role','status');message.textContent=text;
  message.style.cssText='position:fixed;left:8px;right:8px;bottom:100px;z-index:10001;margin:auto;max-width:380px;padding:10px;background:#102831;color:#ffedb1;border:1px solid #e4bc68;border-radius:8px;text-align:center;pointer-events:none';
  document.body.append(message);setTimeout(()=>{message.remove();if(feedback===message)feedback=null;},2800);
 }
 function drawBattle(){
  if(!ready||!fight||!frame)return;
  const p=window.walkPresence?.player();
  frame.contentWindow.postMessage({type:'party-battle-state',code:context.code,auto:true,clockOffset:0,
   member:p?{name:p.name,cls:p.cls,gender:p.gender,country:p.country,level:p.lv}:null,
   run:{...fight,status:fight.status==='active'?'active':'done',presentation:{turn:fight.turn}}},location.origin);
 }
 function show(data){
  if(!data.fight?.battle)return;
  const stored=readBattle();if(stored?.id===data.fight.id&&stored.done)return;
  if(!scene.canMove()){queued=data;return;}
  fight=data.fight;fight.round=data.event.id;fight.respawn=data.respawn;fight.hospital=data.hospital;
  sessionStorage.setItem(doneKey,JSON.stringify({id:fight.id,round:fight.round}));
  frame=document.createElement('iframe');frame.id='regionMenu';frame.title='ต่อสู้กิจกรรมบอสอาณาจักร';
  frame.src=new URL('../tools/town-walk-demo/menu.html?v=kingdom-boss-20261107&partyBattle=1&kingdomBoss=1&city='+scene.country+'-capital',import.meta.url);
  frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';
  scene.pause();button.hidden=true;document.body.append(frame);
 }
 function readBattle(){try{return JSON.parse(sessionStorage.getItem(doneKey)||'null');}catch{return null;}}
 function close(){
  clearTimeout(polling);polling=null;frame?.remove();frame=null;ready=visible=false;waitTurn=null;stayClear=true;
  sessionStorage.setItem(doneKey,JSON.stringify({id:fight.id,round:fight.round,done:true}));
  const respawn=fight.respawn,hospital=fight.hospital,reward=fight.reward;fight=null;
  if(respawn){location.assign(new URL('../tools/town-walk-demo/index.html?city='+encodeURIComponent(respawn)+(hospital?'&arrival=hospital':''),import.meta.url));return;}
  scene.resume();sync(event);
  if(reward)void connection.reloadWalk().then(()=>{scene.refresh();for(const id of ['hudTop','hudBottom'])document.getElementById(id)?.contentWindow?.postMessage({type:'walk-hud-refresh'},location.origin);}).catch(()=>{});
 }
 function schedule(ms=520){clearTimeout(polling);if(visible&&fight?.status==='active'&&!document.hidden)polling=setTimeout(()=>void advance(),ms);}
 async function advance(leave=false){
  if(!fight||requesting||document.hidden||fight.status!=='active'){if(leave)schedule();return;}
  requesting=true;
  const prev=fight,round=prev.round;
  try{
   const data=await send(leave?'leave':'poll',{round,fight:prev.id,turn:prev.turn});update(data);
   if(fight!==prev)return;
   if(!data.fight){fight={...prev,status:'expired',result:'expired'};drawBattle();return;}
   fight={...data.fight,round,respawn:data.respawn,hospital:data.hospital};drawBattle();
   if(fight.status==='active'){
    if(fight.turn!==prev.turn&&fight.battle.effects?.length){waitTurn=fight.turn;schedule(10000);}
    else schedule();
   }
  }catch{report('เชื่อมต่อการต่อสู้ขัดข้อง · กำลังลองใหม่');schedule(2200);}
  finally{requesting=false;withdrawing=false;}
 }
 addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;
  const d=e.data;if(d?.type==='party-battle-ready'){ready=true;drawBattle();return;}
  if(!fight||d?.battle!==fight.id)return;
  if(d.type==='party-battle-visible'){visible=true;if(fight.status==='active')schedule();}
  if(d.type==='party-battle-presented'&&d.turn===waitTurn){waitTurn=null;schedule();}
  if(d.type==='party-battle-done'&&fight.status!=='active')close();
  if(d.type==='kingdom-boss-withdraw'&&!withdrawing&&!requesting){withdrawing=true;clearTimeout(polling);void advance(true);}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(polling);else if(waitTurn!=null)schedule(1500);else schedule();});

 async function move(position,running){
  if(requesting||frame||!active()||!sameMap()||document.hidden||!scene.canMove())return;
  const distance=Math.hypot(position.x-event.position.x,(position.y-event.position.y)*.64);
  if(distance>110)stayClear=false;
  const prior=readBattle(),resume=!resumed&&prior?.round===event.id&&!prior.done;
  if(!resume&&(distance>540||stayClear||Date.now()-lastMove<900))return;
  if(queued){const next=queued;queued=null;show(next);if(frame)return;}
  const round=event.id,x=position.x,y=position.y;lastMove=Date.now();requesting=true;
  try{
   let data;
   if(resume){resumed=true;data=await send('poll',{round,fight:prior.id,turn:-1});}
   else{
    if(distance<140)await connection.flush(true);
    if(!scene.canMove()||event?.id!==round)return;
    data=await send('move',{round,map:scene.country,x,y,running});
   }
   update(data);if(data.fight)show(data);
  }catch(error){lastMove=Date.now()+1200;if(distance<90)report(error.message==='save_conflict'?'บันทึกตัวละครก่อนเริ่มสู้กับบอส':'ยังเข้าร่วมไม่ได้ · ลองเดินเข้าหาบอสอีกครั้ง');}
  finally{requesting=false;}
 }
 window.walkKingdomBoss={tick(position,running){if(!requesting&&!frame)void move(position,running);},draw(c,x,y,zoom,overview,time){
  if(!sameMap()||!active()||!event?.position)return;
  const px=x(event.position.x),py=y(event.position.y);c.save();
  if(overview){c.beginPath();c.arc(px,py,10,0,Math.PI*2);c.fillStyle='#ae272d';c.fill();c.lineWidth=2;c.strokeStyle='#ffe283';c.stroke();}
  else if(!art?.draw(c,px,py,210*zoom,0,time,false)){c.beginPath();c.arc(px,py,20*zoom,0,Math.PI*2);c.fillStyle='#ae272d';c.fill();c.strokeStyle='#ffe283';c.stroke();}
  c.font='bold '+(overview?'13px':'14px')+' Tahoma';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#081924';c.fillStyle='#ffe694';
  const name='♛ '+event.name+' · Lv '+event.level,labelY=py-(overview?16:188*zoom);c.strokeText(name,px,labelY);c.fillText(name,px,labelY);c.restore();
 }};
}
