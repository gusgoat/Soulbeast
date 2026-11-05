/* Local-machine preview transport. BroadcastChannel is intentionally not an online server. */
(()=>{'use strict';const key='soulbeast-walk-preview-player-v1',peers=new Map(),channel=new BroadcastChannel('soulbeast-walk-presence-v1'),session=crypto.randomUUID();let locationId='',lastSend=0,lastState=null;function raster(im,w,h){const tile=document.createElement('canvas');tile.width=w;tile.height=h;tile.getContext('2d').drawImage(im,0,0,w,h);im.raster=tile}
let online=null;const onlineMode=!!sessionStorage.getItem('soulbeast-online-walk-v1');
if(onlineMode)import('../../client/online-walk.mjs?v=companions-20261105').then(m=>{online=m.connectOnlineWalk();if(online){m.mountDungeonInvitations(online,peers);setInterval(()=>online.flush(),2500);addEventListener('walk-player-saved',()=>online.flush());}}).catch(console.error);
const flags={};for(const id of ['blue','green','red']){const im=new Image();im.onload=()=>raster(im,64,42);im.src=new URL('../../assets/ui/country-war/flag-'+id+'-v1.webp',document.currentScript.src).href;flags[id]=im}
let playerRaw,playerCache;function player(){try{const raw=sessionStorage.getItem(key);if(raw!==playerRaw){playerRaw=raw;playerCache=JSON.parse(raw||'null')}return playerCache}catch{return null}}
const frames={};
function label(c,x,y,p){if(!p)return;const name=String(p.name||p.n||'ผู้ผนึก').slice(0,30),cls=window.sealerSpriteCatalog?.[p.cls]?.name||p.cls||'ผู้ผนึก',premium=window.WalkNameplates?.owned(p),src=window.WalkNameplates?.asset(p);if(src&&!frames[src]){frames[src]=new Image();const skin=frames[src];skin.onload=()=>raster(skin,660,152);skin.src=src}const im=frames[src];c.save();c.font='12px Tahoma';c.textAlign='center';const text=name,sub=cls+' · Lv '+p.lv,w=Math.max(220,Math.min(330,Math.max(c.measureText(text).width,c.measureText(sub).width)+100)),h=premium?76:64;c.fillStyle='#091b2ce8';if(im?.naturalWidth)c.drawImage(im.raster||im,x-w/2,y-h+12,w,h);else{c.fillRect(x-w/2+20,y-40,w-40,40);c.strokeStyle='#d5c18a';c.strokeRect(x-w/2+20,y-40,w-40,40)}const flag=flags[p.country];if(flag?.naturalWidth)c.drawImage(flag.raster||flag,x-10,y-49,20,13);c.fillStyle='#fff0c0';c.shadowColor='#000';c.shadowBlur=3;c.fillText(text,x,y-27,w-100);c.font='11px Tahoma';c.fillText(sub,x,y-13,w-100);c.restore();return w}
channel.onmessage=({data:d})=>{if(onlineMode||!d||d.session===session)return;if(d.type==='leave'){if(peers.has(d.session))releasePeer(peers.get(d.session));peers.delete(d.session);return}if(d.type==='hello'){if(lastState)channel.postMessage(lastState);return}if(d.type!=='position'||typeof d.place!=='string'||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!window.sealerSpriteCatalog?.[d.player?.cls])return;if(d.player?.socialId&&d.player.socialId===window.walkSocial?.publicId)return;if(d.place!==locationId){if(peers.has(d.session))releasePeer(peers.get(d.session));peers.delete(d.session);return}let p=peers.get(d.session);if(!p){p={sprite:window.RemoteWalkSprite.create(),x:d.x,y:d.y};peers.set(d.session,p)}Object.assign(p,{targetX:d.x,targetY:d.y,dir:d.dir,moving:!!d.moving,running:!!d.running,player:d.player,seen:performance.now()});p.sprite.sync(d.player).catch(()=>{})};
let nextHeartbeat=0,heartbeatPending=false,lastDraw=0,lastCompanionTick=0,companionScene='';
const localCompanion=window.CompanionFollowers?.create();
function releasePeer(peer){peer.sprite.release();peer.companion?.release();}
function samplePeer(peer,row,seen){
 const sameDirection=peer.dir===row.dir&&peer.running===row.running;
 const elapsed=seen-(peer.sampleAt??seen);
 const dx=row.x-(peer.targetX??row.x),dy=row.y-(peer.targetY??row.y);
 if(!row.moving||!sameDirection||elapsed>1500||Math.hypot(dx,dy)>400){
  peer.vx=peer.vy=0;
 }else if(elapsed>=100&&(dx||dy)){
  peer.vx=dx/elapsed;
  peer.vy=dy/elapsed;
 }
 if(!row.moving||dx||dy||!sameDirection||peer.sampleAt==null)peer.sampleAt=seen;
}
function advancePeer(peer,now,dt){
 const ahead=peer.moving?Math.min(550,Math.max(0,now-peer.sampleAt)+120):0;
 const x=peer.targetX+(peer.vx||0)*ahead,y=peer.targetY+(peer.vy||0)*ahead;
 const smoothing=now<(peer.quickUntil||0)?55:90;
 const blend=1-Math.exp(-dt/smoothing);
 if(Math.hypot(x-peer.x,y-peer.y)>400){peer.x=x;peer.y=y;return;}
 peer.x+=(x-peer.x)*blend;
 peer.y+=(y-peer.y)*blend;
}
let realtime,realtimeLoading=false,realtimeFailed=false,lastRealtimePeerAt=-Infinity;
const realtimeStatus=document.getElementById('walkRealtimeStatus');
function showRealtimeStatus(now){
 if(!realtimeStatus||!online?.walkRealtimeTest)return;
 const label=realtime?.ready
  ? now-lastRealtimePeerAt<2000?'WebSocket · รับตำแหน่งเพื่อนแล้ว':'WebSocket · รอเพื่อนขยับ'
  : realtimeFailed?'ใช้ระบบเดิม · WebSocket เชื่อมต่อไม่ได้':'กำลังเชื่อมต่อ WebSocket · ใช้ระบบเดิม';
 if(realtimeStatus.textContent!==label)realtimeStatus.textContent=label;
 realtimeStatus.hidden=false;
}
function receiveRealtime(id,row){
 const peer=peers.get(id);
 if(!peer||!row||!Number.isSafeInteger(row.seq)||row.seq<1||
    !Number.isInteger(row.dir)||row.dir<0||row.dir>7||
    ![row.x,row.y].every(v=>Number.isFinite(v)&&v>=0&&v<=50000)||
    typeof row.moving!=='boolean'||typeof row.running!=='boolean')return;
 const now=performance.now();
 if(row.seq<=(peer.realtimeSeq||0)&&now-(peer.realtimeAt||0)<1600)return;
 if(peer.moving!==row.moving||peer.running!==row.running||peer.dir!==row.dir)peer.quickUntil=now+220;
 lastRealtimePeerAt=now;
 if(Object.prototype.hasOwnProperty.call(row,'companion'))peer.walkCompanion=window.CompanionFollowers?.normalize(row.companion)||null;
 samplePeer(peer,row,now);
 Object.assign(peer,{targetX:row.x,targetY:row.y,dir:row.dir,moving:row.moving,running:row.running,realtimeAt:now,realtimeSeq:row.seq});
}
function syncPeers(place,p,moving,running){const now=performance.now();if(!online||heartbeatPending||now<nextHeartbeat||place.startsWith('mine'))return;nextHeartbeat=now+600;heartbeatPending=true;online.heartbeat(place.includes(':')?place:'town:'+place,p,moving,running).then(rows=>{if(place!==locationId)return;const ids=new Set(rows.map(row=>row.id));
 if(online.walkRealtimeTest&&/^(country:(blue|green|red)|town:(blue|green|red)-(capital|city-[1-4]|village-([1-9]|1[0-6])))$/.test(place)){
  if(realtime)realtime.update(place,ids,receiveRealtime);
  else if(!realtimeLoading){
   realtimeLoading=true;
   online.openWalkRealtime().then(connection=>{realtime=connection;}).catch(()=>{realtimeFailed=true;});
  }
 }
 for(const [id,peer] of peers)if(!ids.has(id)){releasePeer(peer);peers.delete(id);}const seen=performance.now();for(const row of rows){if(!window.sealerSpriteCatalog?.[row.cls])continue;let peer=peers.get(row.id);if(!peer){peer={sprite:window.RemoteWalkSprite.create(),x:row.x,y:row.y};peers.set(row.id,peer);}if(seen-(peer.realtimeAt??-Infinity)<750){Object.assign(peer,{player:row,seen});peer.sprite.sync(row).catch(()=>{});continue;}samplePeer(peer,row,seen);Object.assign(peer,{targetX:row.x,targetY:row.y,dir:row.dir,moving:row.moving,running:row.running,player:row,seen});peer.sprite.sync(row).catch(()=>{});}}).catch(()=>{nextHeartbeat=performance.now()+3000;}).finally(()=>{heartbeatPending=false;});}
function tick(place,p,moving,running){if(onlineMode&&!place.includes(':'))place='town:'+place;window.walkSocial?.tick();window.DungeonPartyPresence?.publish();if(locationId!==place&&realtime){realtime.reset();lastRealtimePeerAt=-Infinity;}locationId=place;const now=performance.now();if(localCompanion){const elapsed=lastCompanionTick?Math.min((now-lastCompanionTick)/1000,.05):0;lastCompanionTick=now;if(companionScene!==place){localCompanion.reset(p);companionScene=place;}localCompanion.sync(window.CompanionFollowers.first(player()));localCompanion.update(elapsed,p);}for(const [id,v]of peers)if(now-v.seen>5000){releasePeer(v);peers.delete(id)}if(onlineMode){showRealtimeStatus(now);realtime?.send(place,p,moving,running);syncPeers(place,p,moving,running);return;}if(now-lastSend<150)return;lastSend=now;const me=player();if(!me)return;lastState={type:'position',session,place,x:p.x,y:p.y,dir:p.dir,moving,running,player:{name:me.name||me.n,cls:me.cls,gender:me.gender,lv:me.lv,country:me.country,walkFusion:me.walkFusion||null,walkCompanion:window.CompanionFollowers?.first(me)||null,entitlements:{premiumNameplates:window.WalkNameplates?.owned(me)||false},socialId:window.walkSocial?.publicId||'',busy:window.walkSocial?.busy||false}};channel.postMessage(lastState)}
function draw(c,sx,sy,scale,phase){const now=performance.now(),dt=lastDraw?Math.min(now-lastDraw,100):16;lastDraw=now;localCompanion?.draw(c,sx,sy,scale);for(const p of peers.values()){if(onlineMode)advancePeer(p,now,dt);else{p.x+=(p.targetX-p.x)*.24;p.y+=(p.targetY-p.y)*.24;}if(window.CompanionFollowers){p.companion??=window.CompanionFollowers.create();p.companion.sync(p.walkCompanion===undefined?p.player?.walkCompanion:p.walkCompanion);p.companion.update(dt/1000,p);p.companion.draw(c,sx,sy,scale);}p.hitbox={x:sx(p.x),y:sy(p.y),scale};p.walkPhase=(p.walkPhase||0)+(p.moving?dt/1000*13*(p.running?360/220:1):0);p.sprite.draw(c,sx(p.x),sy(p.y),156*scale,p.dir,p.walkPhase,p.moving,p.running);p.hitbox.labelWidth=label(c,sx(p.x),sy(p.y)-154*scale,p.player)}}
setInterval(()=>{const now=performance.now();if(lastState&&now-lastSend>900){window.walkSocial?.tick();lastSend=now;lastState={...lastState,moving:false,running:false,player:{...lastState.player,walkCompanion:window.CompanionFollowers?.first(player())||null,entitlements:{premiumNameplates:window.WalkNameplates?.owned(player())||false},socialId:window.walkSocial?.publicId||'',busy:window.walkSocial?.busy||false}};channel.postMessage(lastState)}},1000);
addEventListener('pagehide',()=>channel.postMessage({type:'leave',session}));channel.postMessage({type:'hello',session});window.walkPresence={tick,draw,label,player,peers,session,localCompanion};
})();
