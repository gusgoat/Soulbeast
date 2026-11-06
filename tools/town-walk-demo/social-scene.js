/* Player actions: authenticated online invitations, with isolated local preview support. */
(()=>{'use strict';const presence=window.walkPresence,key='soulbeast-walk-preview-player-v1',matchKey='soulbeast-local-duel-v1',channel=new BroadcastChannel('soulbeast-local-duel-signals-v1'),dialog=document.createElement('dialog');dialog.id='walkPeerDialog';document.body.append(dialog);let binding=null,publicId='',registered='',attempted='',syncAt=0,syncing=false,pending=null,friendIds=new Set();
const me=()=>presence.player(),host=p=>String(p?.walkId||p?.code||[p?.name,p?.cls,p?.country].join('|')),peer=id=>presence.peers.get(id),fresh=v=>v&&performance.now()-v.seen<5000,can=()=>binding&&binding.canInteract(),send=(type,target,extra={})=>channel.postMessage({type,target,from:presence.session,place:binding?.place(),...extra});
function close(){dialog.close();binding?.stop()}function title(text){dialog.replaceChildren();const header=document.createElement('header'),h=document.createElement('h2'),x=document.createElement('button');h.textContent=text;x.textContent='×';x.setAttribute('aria-label','ปิดเมนูผู้เล่น');x.onclick=()=>pending?cancel():close();header.append(h,x);dialog.append(header)}function text(message){const p=document.createElement('p');p.textContent=message;dialog.append(p);return p}function button(label,fn,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=fn;dialog.append(b);return b}function show(){if(!dialog.open)dialog.showModal();binding?.stop()}function notice(message){title('ผู้ผนึกในพื้นที่');text(message);button('กลับไปเดินต่อ',close);show()}
async function register(){if(onlineMode||syncing||!me())return;syncing=true;try{const result=await walkSocialEngine.dispatch(me(),{action:'social_sync'});if(result.ok){publicId=result.me.id;registered=host(me());friendIds=new Set(result.friends.map(p=>p.id))}}catch(e){console.warn('Local player directory:',e.message)}finally{syncing=false}}
const onlineMode=!!sessionStorage.getItem('soulbeast-online-walk-v1');
let connection;
async function onlineConnection(){
 return connection ||= (await import('../../client/online-walk.mjs?v=peer-social-20261104')).connectOnlineWalk();
}
async function social(action,extra={}){
 if(!onlineMode)return walkSocialEngine.dispatch(me(),{action,...extra});
 return (await onlineConnection()).social(action,extra);
}
function nearbyPlayer(position){
 if(!can())return null;
 let best=null,distance=125;
 for(const [id,p] of presence.peers){
  if(!valid(id))continue;
  const d=Math.hypot(position.x-p.x,(position.y-p.y)*.64);
  if(d<distance){distance=d;best=id;}
 }
 return best;
}
function talkNear(position){const id=nearbyPlayer(position);if(id==null||id===false)return false;profile(id);return true;}
function valid(id){const p=peer(id);return fresh(p)&&(onlineMode?!!p.player?.id:p.player?.socialId&&p.player.socialId!==publicId)}
function store(result){sessionStorage.setItem(matchKey,JSON.stringify({host:host(me()),result}));close();binding.duel()}
async function leave(request){if(!request?.result)return;try{await walkSocialEngine.dispatch(me(),{action:'pvp_leave',room:request.result.room.id,token:request.result.token})}catch{}}
async function cancel(reason='ยกเลิกคำท้าแล้ว'){const request=pending;if(!request)return;pending=null;clearTimeout(request.timer);send('decline',request.other,{request:request.id});if(request.outgoing)await leave(request);notice(reason)}
async function challenge(id){if(!valid(id)||!can()||pending)return notice('ผู้เล่นไม่พร้อมหรือออกจากพื้นที่แล้ว');const target=peer(id);if(target.player.busy)return notice('ผู้เล่นกำลังทำกิจกรรม กรุณารอสักครู่');title('ท้าประลอง PVP');text('กำลังเตรียมคำท้า…');show();try{const result=await walkSocialEngine.dispatch(me(),{action:'pvp_create',pets:me().party});if(!result.ok)throw Error(result.error);if(result.room.status!=='waiting'){title('มีการประลองค้างอยู่');text('กลับเข้าห้องเดิมเพื่อประลองต่อหรือออกจากห้อง');button('กลับเข้าห้องประลอง',()=>store(result));show();return}if(!valid(id)){await leave({result});return notice('ผู้เล่นออกจากพื้นที่แล้ว')}const request={id:crypto.randomUUID(),other:id,outgoing:true,result,expires:Date.now()+60000};pending=request;request.timer=setTimeout(()=>cancel('คำท้าหมดเวลาแล้ว'),60000);send('invite',id,{request:request.id,room:result.room.id,expires:request.expires});title('รอการตอบรับ');text('ส่งคำท้าให้ '+target.player.name+' แล้ว · หมดเวลาใน 60 วินาที');button('ยกเลิกคำท้า',()=>cancel());show()}catch(e){notice('ยังท้าประลองไม่ได้: '+e.message)}}
async function onlineProfile(id,p){
 title(p.name||'ผู้ผนึก');text('กำลังตรวจรายชื่อออนไลน์…');button('กลับไปเดินต่อ',close);show();
 try{
  const conn=await onlineConnection();
  const [target,result]=await Promise.all([conn.socialTarget(id),conn.social('social_sync')]);
  if(!dialog.open)return;
  title(p.name||'ผู้ผนึก');
  if(!target){text('ยังยืนยันบัญชีของผู้เล่นนี้ไม่ได้');button('กลับไปเดินต่อ',close);return;}
  const isFriend=result.friends.some(player=>player.id===target),incoming=result.friendRequests?.incoming?.some(player=>player.id===target),outgoing=result.friendRequests?.outgoing?.some(player=>player.id===target);
  const run=async(action)=>{try{if(!valid(id)||await conn.socialTarget(id)!==target)return notice('ผู้เล่นออกจากพื้นที่แล้ว');const reply=await social(action,{target});if(!reply.ok)throw Error(reply.error);if(action!=='friend_challenge')return onlineProfile(id,p);onlineWaitingUntil=Date.now()+65000;notice('ส่งคำท้าประลองแล้ว · รอเพื่อนยอมรับคำท้า');}catch(e){notice('ดำเนินการไม่สำเร็จ · '+e.message);}};
  button(isFriend?'เป็นเพื่อนแล้ว':incoming?'ยอมรับคำขอเป็นเพื่อน':outgoing?'ส่งคำขอแล้ว · รอการยอมรับ':'ส่งคำขอเป็นเพื่อน',()=>run(incoming?'friend_request_accept':'friend_add'),isFriend||(!incoming&&outgoing));
  if(!isFriend&&incoming)button('ปฏิเสธคำขอ',()=>run('friend_request_decline'));
  if(!isFriend&&outgoing)button('ยกเลิกคำขอ',()=>run('friend_request_cancel'));
  button(isFriend?'ชวน PVP':'ชวน PVP · เพิ่มเพื่อนก่อน',()=>run('friend_challenge'),!isFriend);
  button('กลับไปเดินต่อ',close);
 }catch(e){if(dialog.open)notice('โหลดรายชื่อออนไลน์ไม่สำเร็จ · '+e.message);}
}
function profile(id){if(!valid(id)||!can())return;const v=peer(id),p=v.player;if(onlineMode)return onlineProfile(id,p);title(p.name||'ผู้ผนึก');const entry=sealerSpriteCatalog[p.cls]?.[p.gender==='male'?'male':'female'];if(entry?.portrait){const im=document.createElement('img');im.className='peer-portrait';im.src=new URL(entry.portrait,location.origin+'/').href;im.alt=p.name;dialog.append(im)}text((sealerSpriteCatalog[p.cls]?.name||p.cls)+' · Lv '+p.lv+' · '+({blue:'เหมันตคีรี',green:'พนาสมุทร',red:'อัคนีบรรพต'}[p.country]||''));text('ออนไลน์ในพื้นที่เดียวกัน');button(friendIds.has(p.socialId)?'เป็นเพื่อนแล้ว':'เพิ่มเพื่อน',async()=>{if(!valid(id))return notice('ผู้เล่นออกจากพื้นที่แล้ว');try{const r=await walkSocialEngine.dispatch(me(),{action:'friend_add',target:p.socialId});if(!r.ok)throw Error(r.error);friendIds=new Set(r.friends.map(f=>f.id));profile(id);text('เพิ่มเพื่อนแล้ว')}catch(e){text('เพิ่มเพื่อนไม่สำเร็จ: '+e.message)}},friendIds.has(p.socialId));button('ท้าประลอง PVP',()=>challenge(id),!!p.busy);button('กลับไปเดินต่อ',close);show()}
channel.onmessage=async({data:d})=>{if(!binding||!d||d.target!==presence.session||d.place!==binding.place()||!fresh(peer(d.from)))return;if(d.type==='invite'){if(!valid(d.from)||pending||!can()||dialog.open||!Number.isFinite(d.expires)||d.expires<Date.now()||d.expires>Date.now()+61000){send('decline',d.from,{request:d.request});return}pending={id:d.request,other:d.from,outgoing:false,expires:d.expires};pending.timer=setTimeout(()=>cancel('คำท้าหมดเวลาแล้ว'),Math.max(0,d.expires-Date.now()));title('คำท้าประลอง PVP');text(peer(d.from).player.name+' ต้องการประลองกับคุณ');text('ใช้ผู้ผนึกและทีมอสูรเดิม · ไม่เดิมพัน และไม่หัก HP/MP ในเกมหลัก');button('ยอมรับคำท้า',async()=>{const request=pending;if(!request||!valid(d.from)||Date.now()>d.expires)return cancel('ผู้ท้าประลองไม่อยู่ในพื้นที่แล้ว');try{const result=await walkSocialEngine.dispatch(me(),{action:'pvp_join',room:d.room,pets:me().party});if(!result.ok)throw Error(result.error);clearTimeout(request.timer);pending=null;send('accepted',d.from,{request:d.request});store(result)}catch(e){cancel('เข้าประลองไม่ได้: '+e.message)}});button('ปฏิเสธคำท้า',()=>cancel('ปฏิเสธคำท้าแล้ว'));show()}else if(d.type==='accepted'&&pending?.outgoing&&pending.id===d.request&&pending.other===d.from){const request=pending;pending=null;clearTimeout(request.timer);try{const result=await walkSocialEngine.dispatch(me(),{action:'pvp_poll',room:request.result.room.id,token:request.result.token});if(!result.ok)throw Error(result.error);store({...result,token:request.result.token})}catch(e){notice('เข้าประลองไม่ได้: '+e.message)}}else if(d.type==='decline'&&pending?.id===d.request&&pending.other===d.from){const request=pending;pending=null;clearTimeout(request.timer);if(request.outgoing)await leave(request);notice('คำท้าถูกปฏิเสธหรือยกเลิกแล้ว')}};
function bind(options){binding=options;const tools=document.querySelector('.tools')||document.querySelector('aside'),list=document.createElement('button');list.className='peer-list-button';list.setAttribute('aria-label','ผู้เล่นในพื้นที่');list.textContent='♟';tools?.append(list);list.onclick=()=>{if(!can())return;title('ผู้เล่นในพื้นที่เดียวกัน');let count=0;for(const [id,p]of presence.peers)if(valid(id)){count++;button(p.player.name+' · Lv '+p.player.lv,()=>profile(id))}if(!count)text('ยังไม่มีผู้เล่นอื่นในพื้นที่');button('กลับไปเดินต่อ',close);show()};options.canvas.addEventListener('click',event=>{if(!can()||dialog.open)return;const rect=options.canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const hits=[...presence.peers].filter(([id,p])=>{const h=p.hitbox;return valid(id)&&h&&((Math.abs(x-h.x)<55*h.scale&&y>h.y-156*h.scale&&y<h.y+15*h.scale)||(Math.abs(x-h.x)<(h.labelWidth||150)/2&&y>h.y-154*h.scale-65&&y<h.y-154*h.scale+12))});if(!hits.length)return;event.preventDefault();event.stopImmediatePropagation();profile(hits[0][0])},true);addEventListener('message',e=>{const frame=document.querySelector('#townMenu,#regionMenu,#menuFrame');if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;if(e.data?.type==='walk-social-refresh'){register();return}if(e.data?.type!=='walk-peer-action')return;const candidate=[...presence.peers].find(([id,p])=>valid(id)&&p.player.socialId===e.data.target);binding.closeMenu();if(candidate)challenge(candidate[0]);else notice('ผู้เล่นไม่ได้อยู่ในพื้นที่เดียวกันแล้ว')});register()}
let onlinePollAt=0,onlinePolling=false,onlineInvite='',onlineWaitingUntil=0;
async function pollOnline(){
 if(onlinePolling||document.hidden||!can())return;
 onlinePolling=true;onlinePollAt=Date.now();
 try{
  const result=await social('social_sync');
  if(!result.ok||!can())return;
  if(result.match){close();binding.duel(true);return;}
  const incoming=result.incoming;
  if(!incoming?.from){onlineInvite='';return;}
  if(onlineInvite===incoming.id||dialog.open&&onlineWaitingUntil<Date.now())return;
  onlineInvite=incoming.id;title('คำท้าประลอง PVP');text(incoming.from.name+' ต้องการประลองกับคุณ');
  text('ยอมรับเพื่อเข้าห้อง PVP ด้วยกัน แล้วกดยืนยันทีม');
  const reply=async action=>{
   try{
    const r=await social(action,{invite:incoming.id});if(!r.ok)throw Error(r.error);
    onlineInvite='';close();if(r.match)binding.duel(true);
   }catch(e){onlineInvite='';notice('ตอบคำท้าไม่สำเร็จ · '+e.message);}
  };
  button('ยอมรับคำท้า',()=>reply('friend_accept'));button('ปฏิเสธคำท้า',()=>reply('friend_decline'));show();
 }catch(e){console.warn('Online PVP invitations:',e.message);}
 finally{onlinePolling=false;}
}
function tick(){if(!binding)return;if(onlineMode){if(Date.now()-onlinePollAt>=(onlineWaitingUntil>Date.now()?3000:10000))pollOnline();return;}const now=performance.now();if(host(me())!==attempted||now-syncAt>15000){attempted=host(me());syncAt=now;register()}if(pending&&!fresh(peer(pending.other)))cancel('ผู้เล่นออกจากพื้นที่แล้ว')}
dialog.addEventListener('cancel',event=>{if(pending){event.preventDefault();cancel()}});
window.walkSocial={bind,tick,talkNear,hasNearby:position=>!!nearbyPlayer(position),get publicId(){return publicId},get busy(){return !!pending||dialog.open||!!binding&&!can()},get isOpen(){return dialog.open}};
})();
