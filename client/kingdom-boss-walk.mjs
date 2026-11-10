import {connectAccounts,accountRealtimeConfig} from './account-client.mjs?v=admin-session-20261107';
import {connectOnlineWalk} from './online-walk.mjs?v=admin-session-20261107';
import {gameContext} from './kingdom-boss-feed.mjs?v=kingdom-boss-patrol-1';
import {KINGDOM_BOSS_AGGRO_RADIUS,kingdomBossIdlePosition} from '../supabase/kingdom-boss/rules.mjs?v=kingdom-boss-chase-2';

const scene=window.kingdomBossWalkScene,context=gameContext();
if(scene&&context?.code)mount(scene,context);

function drawBossMarker(context,x,y,radius){
 context.beginPath();
 context.arc(x,y,radius,0,Math.PI*2);
 context.fillStyle='#ae272d';
 context.fill();
 context.lineWidth=2;
 context.strokeStyle='#ffe283';
 context.stroke();
}

function drawBossHealth(context,x,y,hp,maxHP){
 if(!Number.isFinite(hp)||!Number.isFinite(maxHP)||maxHP<=0)return;
 const current=Math.max(0,Math.min(hp,maxHP));
 const width=138,height=15,left=x-width/2;
 context.fillStyle='#28131a';
 context.fillRect(left,y,width,height);
 context.fillStyle='#b52738';
 context.fillRect(left,y,width*current/maxHP,height);
 context.lineWidth=1;
 context.strokeStyle='#ffe283';
 context.strokeRect(left,y,width,height);
 context.font='bold 11px Tahoma';
 context.textBaseline='middle';
 context.lineWidth=3;
 context.strokeStyle='#13090e';
 context.fillStyle='#fff4d5';
 const label=`HP ${Math.round(current)} / ${Math.round(maxHP)}`;
 context.strokeText(label,x,y+height/2,width-8);
 context.fillText(label,x,y+height/2,width-8);
}

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
 let health=null,healthWatch=null,realtimeClient=null,motion=null,playerPosition=null;
 const sameMap=()=>event?.country===scene.country;
 const now=()=>window.SoulbeastKingdomBoss?.now()??Date.now();
 const active=()=>event?.status==='active'&&now()<event.end;
 function bossPosition(){
  if(!event?.position)return null;
  if(event.motion==='patrol'&&event.home)return kingdomBossIdlePosition(event.home,event.idleSince,now());
  if(!motion||event.motion==='patrol')return event.position;
  const t=Math.min(1,(performance.now()-motion.at)/motion.duration);
  const {from,to}=motion;
  return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,dir:to.dir};
 }
 function stopHealthWatch(){
  const previous=healthWatch;
  healthWatch=null;
  if(previous?.channel)void realtimeClient.removeChannel(previous.channel).catch(()=>{});
 }
 async function watchHealth(){
  const round=event?.id;
  if(document.hidden||!sameMap()||!active()||!/^[0-9]+$/.test(round)||!['live','test'].includes(context.environment)){
   stopHealthWatch();return;
  }
  if(healthWatch?.round===round){
   if(healthWatch.channel&&Date.now()-healthWatch.authAt>60000){
    healthWatch.authAt=Date.now();
    void realtimeClient.realtime.setAuth().catch(()=>{});
   }
   return;
  }
  stopHealthWatch();
  const watch={round,channel:null,authAt:0};
  healthWatch=watch;
  try{
   if(!realtimeClient){
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.76.1');
    if(healthWatch!==watch)return;
    const {url,key}=accountRealtimeConfig;
    realtimeClient=createClient(url,key,{accessToken:()=>account.sessions.token()});
   }
   await realtimeClient.realtime.setAuth();
   if(healthWatch!==watch)return;
   watch.authAt=Date.now();
   const channel=realtimeClient.channel(`sb-kb-hp:${context.environment}:${round}`,{config:{private:true}});
   watch.channel=channel;
   channel.on('broadcast',{event:'hp'},({payload})=>{
    if(healthWatch!==watch||payload?.id!==event?.id||!Number.isSafeInteger(payload.rev)||
       payload.rev<=(health?.rev??event.rev)||!Number.isFinite(payload.hp)||!Number.isFinite(payload.maxHP)||payload.maxHP<=0)return;
    health=payload;
    if(payload.status!=='active')void window.SoulbeastKingdomBoss?.refresh();
   }).subscribe(status=>{
    if(healthWatch===watch&&status==='SUBSCRIBED')void window.SoulbeastKingdomBoss?.refresh();
   });
  }catch{
   if(healthWatch===watch)stopHealthWatch();
  }
 }
 document.addEventListener('visibilitychange',()=>void watchHealth());
 addEventListener('pagehide',stopHealthWatch);
 addEventListener('pageshow',e=>{if(e.persisted)void watchHealth();});
 const sync=e=>{
  if(event?.id!==e?.id){stayClear=false;resumed=false;lastMove=0;health=null;motion=null;}
  else if(e?.position&&e.motionAt!==event?.motionAt){
   const interval=e.motionAt-event.motionAt;
   motion={from:bossPosition()||e.position,to:e.position,at:performance.now(),
    duration:Number.isFinite(interval)?Math.max(140,Math.min(600,interval)):300};
  }
  event=e;button.hidden=!sameMap()||!active()||!!frame;
  if(!button.hidden){button.textContent='บอสอาณาจักร · '+event.name;button.title='ดูตำแหน่งบอสบนแผนที่ประเทศ';}
  if(sameMap()&&active()&&sprite!==event.species){sprite=event.species;art?.sync(sprite).catch(()=>{});}
  void watchHealth();
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
  frame.src=new URL('../tools/town-walk-demo/menu.html?v=projectile-2&partyBattle=1&kingdomBoss=1&city='+scene.country+'-capital',import.meta.url);
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

 async function move(){
  if(requesting||frame||!active()||!sameMap()||document.hidden||!scene.canMove())return;
  const position=playerPosition;
  const boss=bossPosition();if(!boss)return;
  const distance=Math.hypot(position.x-boss.x,(position.y-boss.y)*.64);
  const home=event.home||event.position,homeDistance=Math.hypot(position.x-home.x,(position.y-home.y)*.64);
  if(distance>110)stayClear=false;
  const prior=readBattle(),resume=!resumed&&prior?.round===event.id&&!prior.done;
  if(queued){const next=queued;queued=null;show(next);if(frame)return;}
  const near=distance<KINGDOM_BOSS_AGGRO_RADIUS+100||event.motion==='chase';
  if(!resume&&(Math.min(distance,homeDistance)>540||stayClear||Date.now()-lastMove<(near?300:700)))return;
  const round=event.id;lastMove=Date.now();requesting=true;
  try{
   let data;
   if(resume){resumed=true;data=await send('poll',{round,fight:prior.id,turn:-1});}
   else{
    if(near)await connection.flush(true);
    if(!scene.canMove()||event?.id!==round||document.hidden)return;
    const {x,y,running}=playerPosition;
    data=await send('move',{round,map:scene.country,x,y,running});
   }
   update(data);if(data.fight)show(data);
  }catch(error){lastMove=Date.now()+1200;if(distance<90)report(error.message==='save_conflict'?'บันทึกตัวละครก่อนเริ่มสู้กับบอส':'ยังเข้าร่วมไม่ได้ · ลองเดินเข้าหาบอสอีกครั้ง');}
  finally{requesting=false;}
 }
 window.walkKingdomBoss={tick(position,running){
  playerPosition={x:position.x,y:position.y,running};
  if(!requesting&&!frame)void move();
 },
 drawMinimap(context,worldWidth,worldHeight){
  if(!sameMap()||!active())return;
  const boss=bossPosition();if(!boss)return;
  const x=boss.x/worldWidth*context.canvas.width;
  const y=boss.y/worldHeight*context.canvas.height;
  context.save();
  drawBossMarker(context,x,y,6);
  context.restore();
 },draw(c,x,y,zoom,overview,time){
  if(!sameMap()||!active())return;
  const boss=bossPosition();if(!boss)return;
  const px=x(boss.x),py=y(boss.y);c.save();
  const running=event.motion==='chase'||event.motion==='return';
  if(overview){drawBossMarker(c,px,py,10);}
  else if(!art?.draw(c,px,py,210*zoom,boss.dir||0,running?time*1.7:time,!!event.motion)){c.beginPath();c.arc(px,py,20*zoom,0,Math.PI*2);c.fillStyle='#ae272d';c.fill();c.strokeStyle='#ffe283';c.stroke();}
  c.font='bold '+(overview?'13px':'14px')+' Tahoma';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#081924';c.fillStyle='#ffe694';
  const name='♛ '+event.name+' · Lv '+event.level,labelY=py-(overview?16:188*zoom);c.strokeText(name,px,labelY);c.fillText(name,px,labelY);
  if(!overview){
   const latest=health&&health.rev>event.rev?health:event;
   drawBossHealth(c,px,labelY+5,latest.hp,latest.maxHP);
  }
  c.restore();
 }};
}
