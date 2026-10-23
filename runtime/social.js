// Friends and leaderboards
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0002-LBL

const LBL={hp:'พลังชีวิต (HP)',mp:'พลังเวทย์ (MP)',patk:'โจมตีกายภาพ',matk:'โจมตีเวทย์',pdef:'ป้องกันกายภาพ',mdef:'ป้องกันเวทย์',acc:'ความแม่นยำ',eva:'การหลบหลีก',spd:'ความเร็ว',crit:'โอกาสคริติคอล %'};
// @soulbeast-end 0002-LBL
// @soulbeast-unit 0322-LB

const LB={rows:null,busy:0,lastKey:'',lastAt:0,err:''};
// @soulbeast-end 0322-LB
// @soulbeast-unit 0323-LBTAB

const LBTAB={score:{n:'คะแนนสะสม',v:r=>fmt(r.score||0)+' คะแนน',k:r=>r.score||0},lv:{n:'เลเวล',v:r=>`Lv ${r.level}`,k:r=>r.level*1e9+(r.exp||0)},
 zone:{n:'ด่านไกลสุด',v:r=>r.clears?`ปราบจอมมาร ${r.clears} ครั้ง`:(r.zoneName||`ด่าน ${r.zone}`),k:r=>(r.clears||0)*1e6+(r.zone||0)*1e3+r.level},
 caught:{n:'จับอสูร',v:r=>`${r.caught} ชนิด`,k:r=>r.caught*1e4+r.seen},
 seen:{n:'ค้นพบอสูร',v:r=>`${r.seen} ชนิด`,k:r=>r.seen*1e4+r.caught},
 legend:{n:'ของในตำนาน',v:r=>`${r.legend} ชิ้น`,k:r=>r.legend*1e3+r.level}};
// @soulbeast-end 0323-LBTAB
// @soulbeast-unit 0325-lbEntry

function lbEntry(){const P=S.P,zm=clamp(P.zoneMax,1,6),seen=Object.keys(P.seen).filter(k=>SP[k]&&!SP[k].noseal).length;
 return {score:S.P.score||0,profile:S.P.profile||'',gender:P.gender,id:pid(),name:String(P.name).slice(0,20),cls:P.cls,clsName:CLS[P.cls].n,lv:P.lv,exp:P.exp,zone:zm,zoneName:ZN[zm-1].n,seen,caught:Object.keys(P.caught).filter(k=>SP[k]).length,legend:Object.keys(P.legend||{}).length,clear:P.cleared||0}}
// @soulbeast-end 0325-lbEntry
// @soulbeast-unit 0327-lbPost

async function lbPost(body){return sheetRequest({method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)})}
// @soulbeast-end 0327-lbPost
// @soulbeast-unit 0328-lbSubmit

async function lbSubmit(force){if(!SHEET_URL||!S.P||S.P.lbOff)return;
 if(LB.pending){await LB.pending;if(!force)return;if(!S.P||S.P.lbOff)return}
 const e=lbEntry(),key=JSON.stringify(e);
 if(key===LB.lastKey||(!force&&Date.now()-LB.lastAt<60000))return;
 LB.lastAt=Date.now();
 LB.pending=(async()=>{try{const r=await lbPost(e);if(!r.ok)throw new Error('submit failed');LB.lastKey=key}catch(err){LB.lastKey=''}})();
 try{await LB.pending}finally{LB.pending=null}}
// @soulbeast-end 0328-lbSubmit
// @soulbeast-unit 0329-lbLoad

async function lbLoad(){if(!SHEET_URL)return;LB.busy=1;LB.err='';render();await lbSubmit(true);
 try{const r=await fetch(SHEET_URL+(SHEET_URL.includes('?')?'&':'?')+'t='+Date.now());const j=await r.json();if(!r.ok||!j||j.ok!==true||!Array.isArray(j.rows))throw new Error('Invalid leaderboard');LB.rows=j.rows}
 catch(e){LB.err=window.claude?'กระดานคะแนนเชื่อมกับ เซิร์ฟเวอร์ออนไลน์ ใช้ได้ในเวอร์ชัน GitHub':'โหลดกระดานคะแนนไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต แล้วกดรีเฟรช';LB.rows=LB.rows||[]}LB.busy=0;render()}
// @soulbeast-end 0329-lbLoad
// @soulbeast-unit 0330-vLeader

function vLeader(){const tab=S.ui.lb||'score',T=LBTAB[tab];
 const head=`<div class="row"><h2 class="grow">หอเกียรติยศ</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>`;
 if(!SHEET_URL)return `<div class="stack">${head}<div class="card"><p class="sub" style="margin:0">ยังไม่ได้เชื่อมกระดานคะแนนกับ เซิร์ฟเวอร์ออนไลน์ ใส่ลิงก์ ระบบออนไลน์ ในบรรทัด SHEET_URL ของไฟล์ index.html</p></div></div>`;
 const me=pid().slice(-6),ranked=(LB.rows||[]).filter(r=>typeof r.level==='number').sort((a,b)=>T.k(b)-T.k(a)).map((r,i)=>({...r,displayRank:i+1})),rows=ranked.filter((r,i)=>i<20||r.pid===me);
 return `<div class="stack">${head}<p class="sub" style="margin:0">20 อันดับแรกและอันดับของคุณ · บันทึกลง เซิร์ฟเวอร์ออนไลน์ อัตโนมัติเมื่อกลับเข้าเมือง (ไม่เกินนาทีละครั้ง)</p>
 <div class="tabs">${Object.entries(LBTAB).map(([k,t])=>`<button class="${tab===k?'on':''}" data-a="lbtab" data-v="${k}">${t.n}</button>`).join('')}</div>
 ${LB.err?`<p class="sub" style="margin:0;color:var(--bad)">${LB.err}</p>`:''}
 ${LB.rows===null||LB.busy&&!rows.length?'<p class="sub">กำลังโหลดอันดับ...</p>':rows.length?`<div class="lst">${rows.map((r,i)=>`<div class="item lbrow ${r.pid===me?'me':''}"><span class="lbn num">${r.displayRank<=3?['🥇','🥈','🥉'][r.displayRank-1]:r.displayRank}</span>${r.profile?`<img src="${esc(r.profile)}" alt="รูปโปรไฟล์" width="38" height="38" style="border-radius:50%">`:portrait('cls:'+(CLS[r.cls]?r.cls:'swordsman'),34,{gender:r.gender,legacy:!['male','female'].includes(r.gender)})}<div class="grow"><b>${esc(r.name||'ผู้ผนึก')}${r.pid===me?' <span class="badge">คุณ</span>':''}</b><small>${esc(r.clsName||'')} · Lv ${r.level} · ค้นพบ ${r.seen} · จับ ${r.caught}${r.clears?' · 🏆':''}</small></div><b class="num" style="color:var(--gold);text-align:right">${esc(T.v(r))}</b></div>`).join('')}</div>`:'<p class="sub">ยังไม่มีใครอยู่ในกระดาน</p>'}
 <div class="row wrap" style="gap:8px"><button class="btn sm" data-a="lbload" ${LB.busy?'disabled':''}>${LB.busy?'กำลังโหลด...':'รีเฟรช'}</button>${S.P.lbOff?'<button class="btn sm pri" data-a="lbtoggle">แสดงชื่อของฉันในกระดาน</button>':'<button class="btn sm" data-a="lbtoggle">ซ่อนชื่อของฉันจากกระดาน</button>'}</div></div>`}
// @soulbeast-end 0330-vLeader
// @soulbeast-unit 0570-COMMUNITY


const COMMUNITY={busy:false,error:'',friends:[],online:[],incoming:null,serverTime:0,code:'',ready:false,match:null};
// @soulbeast-end 0570-COMMUNITY
// @soulbeast-unit 0574-communityError

function communityError(message){const errors={
 'game update required':['กรุณาอัปเดตเกมก่อนรับรางวัลใหม่','Please update the game before receiving new rewards','请先更新游戏以领取新奖励'],'gacha update required':['กรุณาอัปเดตเกมก่อนสุ่มกาชา','Please update the game before drawing','请先更新游戏再抽奖'],'not enough coupons':['คูปองไม่พอ','Not enough coupons','兑换券不足'],'friends full':['เพื่อนเต็ม30คนแล้ว','Friend limit reached (30)','好友已满（30人）'],
 'friend offline':['เพื่อนออฟไลน์แล้ว','Your friend is offline','好友已离线'],'challenge expired':['คำท้าหมดอายุแล้ว','Challenge expired','挑战已过期'],
 'challenge cooldown':['รอ30วินาทีก่อนท้าครั้งถัดไป','Wait 30 seconds before another challenge','请等待30秒再发起挑战'],'challenge pending':['มีคำท้าที่รอคำตอบอยู่','A challenge is already pending','已有待回复的挑战'],
 'account banned':['บัญชีถูกระงับ กรุณาติดต่อผู้ดูแล','Account suspended. Contact the administrator.','账号已停用，请联系管理员'],
 'gacha stale':['เซฟอีกเครื่องมีผลสุ่มใหม่ โปรดโหลดเซฟออนไลน์ก่อน','New draw results exist. Load your online save first.','有新的抽奖结果，请先读取在线存档'],
 'finish other battle':['จบการต่อสู้หรือออกจากห้องเดิมก่อน','Finish your battle or leave the current room first','请先结束战斗或退出当前房间'],
 'pin':['PINไม่ตรงกับเซฟออนไลน์','Incorrect online save PIN','在线存档PIN错误'],'bad action':['ต้องอัปเดตเซิร์ฟเวอร์ก่อนใช้ระบบนี้','Update the server to use this feature','请先更新服务器'],
 'notfound':['บันทึกเซฟออนไลน์ก่อนใช้งาน','Save your game online first','请先在线保存游戏']};return errors[message]?ct(...errors[message]):ct('เชื่อมต่อไม่สำเร็จ: ','Connection failed: ','连接失败：')+String(message||'network');}
// @soulbeast-end 0574-communityError
// @soulbeast-unit 0575-communityAuth

function communityAuth(){return {code:ensureCode(),pin:S.P.cpin||''};}
// @soulbeast-end 0575-communityAuth
// @soulbeast-unit 0576-communityBattleBusy

function communityBattleBusy(){return !!(S.zone||S.battle&&!S.battle.over||['waiting','lobby','active'].includes(PVP.room?.status)||['lobby','starting','active'].includes(WORLD.room?.status)||CAMP.room?.status==='active');}
// @soulbeast-end 0576-communityBattleBusy
// @soulbeast-unit 0577-communitySave

async function communitySave(){if(S.battle&&!S.battle.over||GS.busy)throw Error('finish other battle');const r=await lbPost({action:'save',...communityAuth(),data:gsData(),name:S.P.name,clsName:CLS[S.P.cls].n,lv:S.P.lv});if(!r.ok)throw Error(r.error);applyAccount(r.account);applyDemonRewardReceipts(r);S.P.gsAt=r.at;GS.lastAt=Date.now();GS.lastJson=gsData();if(r.coupons!=null)GACHA.coupons=r.coupons;return r;}
// @soulbeast-end 0577-communitySave
// @soulbeast-unit 0578-communityApplyData

function communityApplyData(data){if(!data)return;const raw=JSON.parse(data),pin=S.P.cpin,code=ensureCode();if(!raw.P)throw Error('bad data');S.P=raw.P;S.P.code=code;S.P.cpin=pin;normalizePack();initDiscovery();save();GS.lastJson=gsData();}
// @soulbeast-end 0578-communityApplyData
// @soulbeast-unit 0589-communityAvatar

function communityAvatar(p,size=48){return p.avatar?`<img class="friend-avatar" width="${size}" height="${size}" src="${esc(p.avatar)}" alt="">`:portrait('cls:'+p.cls,size,{gender:p.gender,legacy:!['male','female'].includes(p.gender)});}
// @soulbeast-end 0589-communityAvatar
// @soulbeast-unit 0590-communityFriendCard

function communityFriendCard(p,friend){const elapsed=Math.max(0,COMMUNITY.serverTime-p.lastSave),when=p.lastSave?new Date(p.lastSave).toLocaleString(gameLocale()):ct('ไม่ทราบ','Unknown','未知');return `<article class="card row friend-card">${communityAvatar(p)}<div class="grow"><b data-user-content>${esc(p.name)}</b><small>Lv ${p.lv} · ${esc(CLS[p.cls]?.n||p.cls)}</small><small><i class="presence-dot ${p.online?'online':''}" aria-hidden="true"></i><span translate="no">${p.online?ct('ออนไลน์ · บันทึกใน5นาทีที่ผ่านมา','Online · Saved within 5 minutes','在线 · 5分钟内保存'):ct('ออฟไลน์ · บันทึกล่าสุด ','Offline · Last saved ','离线 · 最后保存 ')+when}</span></small></div><div class="stack friend-actions">${friend?`<button class="btn sm pri" data-a="friendChallenge" data-v="${p.id}" ${!p.online||COMMUNITY.busy?'disabled':''} translate="no">${ct('ท้าสู้','Challenge','挑战')}</button><button class="btn sm danger" data-a="friendRemove" data-v="${p.id}" ${COMMUNITY.busy?'disabled':''}>Unfriend</button>`:`<button class="btn sm" data-a="friendAdd" data-v="${p.id}" ${COMMUNITY.busy||COMMUNITY.friends.length>=30?'disabled':''} translate="no">${ct('เพิ่มเพื่อน','Add Friend','添加好友')}</button>`}</div></article>`;}
// @soulbeast-end 0590-communityFriendCard
// @soulbeast-unit 0591-vFriends

function vFriends(){return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('รายชื่อเพื่อน','Friend List','好友列表')} ${COMMUNITY.friends.length}/30</h2><button class="btn sm" data-a="communityRefresh" ${COMMUNITY.busy?'disabled':''} translate="no">${ct('รีเฟรช','Refresh','刷新')}</button></div><p class="sub" translate="no">${ct('ไฟเขียวหมายถึงมีการบันทึกออนไลน์ใน5นาทีที่ผ่านมา คำท้าหมดอายุภายใน60วินาที','A green dot means an online save within 5 minutes. Challenges expire after 60 seconds.','绿灯表示5分钟内在线保存过。挑战将在60秒后过期。')}</p>${COMMUNITY.error?`<p class="warn" translate="no">${esc(COMMUNITY.error)}</p>`:''}<div class="stack">${COMMUNITY.friends.map(p=>communityFriendCard(p,true)).join('')||`<p translate="no">${ct('ยังไม่มีเพื่อน','No friends yet','暂无好友')}</p>`}</div><h3 translate="no">${ct('ผู้เล่นที่ออนไลน์ทั้งหมด','All Online Players','所有在线玩家')} · ${COMMUNITY.online.length}</h3><div class="stack">${COMMUNITY.online.map(p=>communityFriendCard(p,COMMUNITY.friends.some(f=>f.id===p.id))).join('')||`<p translate="no">${ct('ยังไม่มีผู้เล่นอื่นออนไลน์','No other players online','暂无其他玩家在线')}</p>`}</div></div>`;}
// @soulbeast-end 0591-vFriends
// @soulbeast-unit 0592-communityCall

async function communityCall(action='social_sync',extra={},saveFirst=false){if(COMMUNITY.busy||GACHA.busy||!S.P||!SHEET_URL)return;COMMUNITY.busy=true;COMMUNITY.error='';try{if(saveFirst)await communitySave();const r=await lbPost({action,...communityAuth(),...extra});if(!r.ok)throw Error(r.error);Object.assign(COMMUNITY,{friends:r.friends||[],online:r.online||[],incoming:r.incoming,serverTime:r.serverTime||Date.now(),ready:true,code:ensureCode()});if(r.match&&!communityBattleBusy()){PVP.code=ensureCode();PVP.pending=null;pvpReceive(r.match);S.screen='pvp';await lbPost({action:'friend_ack',...communityAuth(),invite:r.match.invite});COMMUNITY.incoming=null;pvpSessionSave();pvpSchedule();}if(action==='friend_challenge')toast(ct('ส่งคำท้าแล้ว','Challenge sent','已发送挑战'));}catch(e){COMMUNITY.error=communityError(e.message);if(action!=='social_sync'||S.screen==='friends')toast(COMMUNITY.error);}finally{COMMUNITY.busy=false;if(S.screen==='friends'||S.screen==='pvp'||COMMUNITY.incoming)render();}}
// @soulbeast-end 0592-communityCall
// @soulbeast-unit 0593-communityChallengeOverlay

function communityChallengeOverlay(){const incoming=COMMUNITY.incoming;if(!incoming?.from||incoming.expires<(COMMUNITY.serverTime||Date.now())||communityBattleBusy()||S.ui.confirm)return '';const p=incoming.from;return `<div class="overlay community-invite"><div class="card stack" role="dialog" aria-modal="true"><h3 translate="no">${ct('มีเพื่อนท้าประลอง','A Friend Challenges You','好友邀请对战')}</h3><div class="row">${communityAvatar(p,64)}<div><b data-user-content>${esc(p.name)}</b><small>Lv ${p.lv} · ${esc(CLS[p.cls]?.n||p.cls)}</small></div></div><p translate="no">${ct('ยอมรับเพื่อสร้างและเข้าห้องPVPพร้อมกัน จากนั้นยืนยันทีมในห้อง','Accept to create and enter a PvP room together, then confirm your teams in the lobby.','接受后双方自动进入PVP房间，然后在大厅确认队伍。')}</p><div class="row"><button class="btn pri" data-a="friendAccept" data-v="${incoming.id}" ${COMMUNITY.busy?'disabled':''} translate="no">${ct('ตกลง','Accept','接受')}</button><button class="btn" data-a="friendDecline" data-v="${incoming.id}" ${COMMUNITY.busy?'disabled':''} translate="no">${ct('ยกเลิก','Decline','拒绝')}</button></div></div></div>`;}
// @soulbeast-end 0593-communityChallengeOverlay
// @soulbeast-unit 0596-communityBaseGo

const communityBaseGo=go;
// @soulbeast-end 0596-communityBaseGo
// @soulbeast-unit 0597-go

go=function(screen){if(GACHA.busy){toast(ct('กำลังตรวจผลสุ่ม กรุณารอสักครู่','Checking draw results, please wait','正在核验抽奖结果，请稍候'));return;}if(['gacha','friends'].includes(screen)&&communityBattleBusy()){toast(communityError('finish other battle'));return;}communityBaseGo(screen);if(screen==='gacha')gachaCall();if(screen==='friends')communityCall('social_sync',{},true);};
// @soulbeast-end 0597-go
// @soulbeast-unit 0598-communityBaseRender

const communityBaseRender=render;
// @soulbeast-end 0598-communityBaseRender
// @soulbeast-unit 0599-render

render=function(){communityBaseRender();const app=document.getElementById('app');if(app?.insertAdjacentHTML)app.insertAdjacentHTML('beforeend',communityChallengeOverlay());applyGameLanguage(app);};
// @soulbeast-end 0599-render
// @soulbeast-unit 0600-communityBaseSettings

const communityBaseSettings=vSettings;
// @soulbeast-end 0600-communityBaseSettings
// @soulbeast-unit 0601-vSettings

vSettings=function(){return communityBaseSettings()+`<div class="card row wrap"><button class="btn" data-a="go" data-v="weaponbook" translate="no">${ct('ตำราอาวุธ','Weapon Guide','武器图鉴')}</button><button class="btn" data-a="go" data-v="friends" translate="no">${ct('รายชื่อเพื่อน','Friend List','好友列表')}</button></div>`;};
// @soulbeast-end 0601-vSettings
// @soulbeast-unit 0606-handlers-communityRefresh

handlers.communityRefresh=()=>communityCall('social_sync',{},true);
// @soulbeast-end 0606-handlers-communityRefresh
// @soulbeast-unit 0607-handlers-friendAdd

handlers.friendAdd=v=>communityCall('friend_add',{target:v});
// @soulbeast-end 0607-handlers-friendAdd
// @soulbeast-unit 0608-handlers-friendRemove
handlers.friendRemove=v=>communityCall('friend_remove',{target:v});
// @soulbeast-end 0608-handlers-friendRemove
// @soulbeast-unit 0609-handlers-friendChallenge

handlers.friendChallenge=v=>{if(communityBattleBusy())return toast(communityError('finish other battle'));communityCall('friend_challenge',{target:v},true);};
// @soulbeast-end 0609-handlers-friendChallenge
// @soulbeast-unit 0610-handlers-friendAccept

handlers.friendAccept=v=>{if(communityBattleBusy())return toast(communityError('finish other battle'));communityCall('friend_accept',{invite:v},true);};
// @soulbeast-end 0610-handlers-friendAccept
// @soulbeast-unit 0611-handlers-friendDecline

handlers.friendDecline=v=>communityCall('friend_decline',{invite:v});
// @soulbeast-end 0611-handlers-friendDecline
// @soulbeast-unit 0614-communityBaseGsSave

const communityBaseGsSave=gsSave;
// @soulbeast-end 0614-communityBaseGsSave
// @soulbeast-unit 0615-gsSave

gsSave=async function(manual,newPin){if(GACHA.busy)return;return communityBaseGsSave(manual,newPin);};
// @soulbeast-end 0615-gsSave
// @soulbeast-unit 0616-communityBaseLbPost

const communityBaseLbPost=lbPost;
// @soulbeast-end 0616-communityBaseLbPost
// @soulbeast-unit 0617-lbPost

lbPost=async function(body){return communityBaseLbPost(body.id&&!body.code&&S.P?{...body,...communityAuth()}:body);};
// @soulbeast-end 0617-lbPost
// @soulbeast-unit 0684-reliabilityCommunity

const reliabilityCommunity=communityCall;
// @soulbeast-end 0684-reliabilityCommunity
// @soulbeast-unit 0685-communityCall
communityCall=async function(action='social_sync',extra={},saveFirst=false){if(COMMUNITY.busy||GACHA.busy)return;if(action==='social_sync'&&S.screen!=='friends')return reliabilityCommunity(action,extra,saveFirst);return withOnline(action,()=>reliabilityCommunity(action,extra,saveFirst));};
// @soulbeast-end 0685-communityCall
// @soulbeast-unit 0692-lbLoad

lbLoad=async function(){if(!SHEET_URL||LB.busy)return;return withOnline('leaderboard',async()=>{LB.busy=1;LB.err='';render();try{await lbSubmit(true);const result=await sheetRequest({method:'GET',cache:'no-store'});if(!result.ok||!Array.isArray(result.rows))throw Error('Invalid leaderboard');LB.rows=result.rows;}catch(e){LB.err=onlineMessage(e);LB.rows=LB.rows||[];}finally{LB.busy=0;render();}});};
// @soulbeast-end 0692-lbLoad
// @soulbeast-unit 0694-handlers-lbtoggle
handlers.lbtoggle=()=>withOnline('leaderboard',reliabilityLbToggle);
// @soulbeast-end 0694-handlers-lbtoggle
// @soulbeast-unit 0697-reliabilityCommunityError

const reliabilityCommunityError=communityError;
// @soulbeast-end 0697-reliabilityCommunityError
// @soulbeast-unit 0698-communityError
communityError=function(message){return message==='busy'?onlineMessage(message):reliabilityCommunityError(message);};
// @soulbeast-end 0698-communityError
// @soulbeast-unit 0941-towerCommunityBusy

const towerCommunityBusy=communityBattleBusy;
// @soulbeast-end 0941-towerCommunityBusy
// @soulbeast-unit 0942-communityBattleBusy
communityBattleBusy=function(){return towerActive()||towerCommunityBusy();};
// @soulbeast-end 0942-communityBattleBusy
