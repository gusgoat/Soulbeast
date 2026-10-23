// PvP rooms, actions, stakes and timeout
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0185-PVP

/* PVP client: server snapshots are kept outside the RPG state. */
const PVP={room:null,token:'',code:'',busy:false,error:'',timer:null,pending:null,target:'',friend:''};
// @soulbeast-end 0185-PVP
// @soulbeast-unit 0186-pvpSessionSave

function pvpSessionSave(){try{localStorage.setItem('sealbeast_pvp_v1',JSON.stringify({endpoint:String(window.SHEET_URL||'').trim(),room:PVP.room?.id||'',token:PVP.token,code:PVP.code,pending:PVP.pending}))}catch(e){}}
// @soulbeast-end 0186-pvpSessionSave
// @soulbeast-unit 0187-pvpSessionLoad

function pvpSessionLoad(){try{const p=JSON.parse(localStorage.getItem('sealbeast_pvp_v1')||'{}');if(p.endpoint===String(window.SHEET_URL||'').trim()&&p.token&&p.room){PVP.token=p.token;PVP.code=p.code;PVP.restore=p.room;PVP.pending=p.pending||null}}catch(e){}}
// @soulbeast-end 0187-pvpSessionLoad
// @soulbeast-unit 0188-pvpSessionLoad

pvpSessionLoad();
// @soulbeast-end 0188-pvpSessionLoad
// @soulbeast-unit 0189-pvpError

function pvpError(message){return ({'bad action':'ต้องอัปเดต ระบบต่อสู้ แล้ว Deploy เวอร์ชันใหม่ก่อนใช้ PVP',pin:'PIN ของเซฟไม่ตรงกับ เซิร์ฟเวอร์ออนไลน์',notfound:'ไม่พบเซฟบน ระบบออนไลน์ โปรดบันทึกเซฟก่อน','room not found':'ไม่พบห้องนี้','room expired':'ห้องหมดอายุ','room full':'ห้องมีผู้เล่นครบแล้ว','same player':'ใช้ตัวละครเดียวกันสู้กันไม่ได้','already in room':'ตัวละครนี้อยู่ในห้องอื่น กดเชื่อมต่อห้องเดิม','no active room':'ไม่มีห้องที่ยังเปิดอยู่',unauthorized:'สิทธิ์ห้องหมดอายุหรือเปิดจากอีกเครื่อง กดเชื่อมต่อห้องเดิม','bad points':'แต้มสถานะในเซฟเกินเกณฑ์ PVP','bad class':'อาชีพไม่ตรงกับระดับเลเวล','bad equipment':'อุปกรณ์ในเซฟไม่ตรงกับระดับหรือช่อง','bad weapon':'อาวุธไม่ตรงกับอาชีพ','not your turn':'ยังไม่ถึงเทิร์นของคุณ','stale turn':'เทิร์นเปลี่ยนแล้ว กำลังตรวจข้อมูลใหม่','items not allowed':'PVP ห้ามใช้ยาและไอเท็มรักษา','illegal skill':'สกิลนี้ใช้ไม่ได้','not enough mp':'MP ไม่พอ','not enough gold':'เหรียญเฉพาะแมตช์ไม่พอ','not lobby':'ห้องเริ่มหรือปิดไปแล้ว กดรีเฟรช','not active':'การประลองจบแล้ว','stake changed':'เดิมพันมีการเปลี่ยน โปรดตรวจของอีกฝ่ายแล้วกดยืนยันใหม่','stake unavailable':'ของเดิมพันไม่พอหรือไม่อยู่ในเซฟออนไลน์','stake pet must rest':'อสูรต้องพักค่ายและไม่เฝ้าค่าย จึงใช้เดิมพันได้','stake history full':'เปลี่ยนเดิมพันครบจำนวนที่รองรับแล้ว'})[message]||'เชื่อมต่อ PVP ไม่สำเร็จ: '+String(message||'โปรดลองอีกครั้ง')}
// @soulbeast-end 0189-pvpError
// @soulbeast-unit 0190-pvpSchedule

function pvpSchedule(){clearTimeout(PVP.timer);if(PVP.room?.replaying)return;if(S.screen==='pvp'&&PVP.token&&!document.hidden&&(!PVP.room||['waiting','lobby','active'].includes(PVP.room.status)))PVP.timer=setTimeout(()=>pvpRequest({action:'pvp_poll'},true),PVP.room?.status==='active'?2500:8000)}
// @soulbeast-end 0190-pvpSchedule
// @soulbeast-unit 0191-pvpReceive

function pvpReceive(result){PVP.balanceVersion=result.balanceVersion||0;applyAccount(result.account);const prior=PVP.room;PVP.room=result.room;PVP.clock=Date.now()-PVP.room.serverTime;observeUnits([...PVP.room.battle.allies,...PVP.room.battle.enemies]);PVP.audioAt=Date.now();if(result.token)PVP.token=result.token;PVP.restore=PVP.room.id;if(PVP.pending&&(PVP.room.rev>PVP.pending.rev||PVP.room.status==='finished'))PVP.pending=null;pvpSessionSave();
 if(S.screen==='pvp'){render();if(prior&&PVP.room.rev>prior.rev){const b=PVP.room.battle,units=[...b.allies,...b.enemies],oldUnits=[...prior.battle.allies,...prior.battle.enemies];for(const u of units){const old=oldUnits.find(x=>x.id===u.id);if(old&&old.hp>0&&u.hp<=0)Sound.cry(u.sp,true)}if(PVP.room.status==='active'&&b.effects?.length){VQ.push(...BattleEffects.enrich(b.effects,PVP.room.last?.actor||prior.battle.cur));const critical=b.effects.find(e=>e.k==='hit'&&e.crit);const cast=b.effects.find(e=>e.k==='cast');if(critical)ExtraAudio.skill(critical.skill,units.find(x=>x.id===PVP.room.last?.actor),true);else if(cast)Sound.skill(cast.skill,units.find(x=>x.id===cast.id));else if(b.effects.some(e=>e.k==='charge'))Sound.fx('charge');else if(PVP.room.last?.skill==='defend')Sound.fx('shield');else{const hit=b.effects.find(e=>e.k==='hit');if(hit)Sound.skill(hit.skill,units.find(x=>x.id===PVP.room.last?.actor))}(window.requestAnimationFrame||setTimeout)(flushVfx)}if(PVP.room.status==='finished'&&prior.status!=='finished'){if(b.effects?.length){VQ.push(...BattleEffects.enrich(b.effects,PVP.room.last?.actor||prior.battle.cur));(window.requestAnimationFrame||setTimeout)(flushVfx);}Sound.fx(PVP.room.winner===PVP.room.me?'win':'lose')}}}}
// @soulbeast-end 0191-pvpReceive
// @soulbeast-unit 0192-pvpRequest

async function pvpRequest(packet,silent=false){if(PVP.busy||PVP.room?.replaying)return;PVP.busy=true;if(!silent){PVP.error='';render()}try{const body={room:PVP.room?.id||PVP.restore,token:PVP.token,...packet};const r=await lbPost(body);if(!r.ok){if(packet.action==='pvp_move'){PVP.pending=null;pvpSessionSave()}throw new Error(r.error)}if(!r.room||r.pvpVersion!==1)throw new Error('bad action');PVP.error='';pvpReceive(r)}catch(e){PVP.error=pvpError(e.message);if(!silent)toast(PVP.error)}finally{PVP.busy=false;if(S.screen==='pvp')render();pvpSchedule()}}
// @soulbeast-end 0192-pvpRequest
// @soulbeast-unit 0193-pvpConnect

async function pvpConnect(mode){if(PVP.busy||!S.P)return;if(S.zone||S.battle){toast('กลับเมืองก่อนเข้า PVP');return}const room=String(document.getElementById('pvpRoomCode')?.value||'').trim().toUpperCase();if(mode==='join'&&!/^[A-F0-9]{8}$/.test(room)){toast('รหัสห้องต้องมี 8 ตัว');return}
 PVP.busy=true;PVP.error='';render();try{const code=ensureCode(),P=S.P;const saved=await lbPost({action:'save',code,pin:P.cpin||'',data:gsData(),name:P.name,clsName:CLS[P.cls].n,lv:P.lv});if(!saved.ok)throw new Error(saved.error);P.gsAt=saved.at;GS.lastJson=gsData();GS.lastAt=Date.now();save();const r=await lbPost({action:'pvp_'+mode,code,pin:P.cpin||'',room});if(!r.ok)throw new Error(r.error);PVP.code=code;PVP.pending=null;pvpReceive(r)}catch(e){PVP.error=pvpError(e.message);toast(PVP.error)}finally{PVP.busy=false;if(S.screen==='pvp')render();pvpSchedule()}}
// @soulbeast-end 0193-pvpConnect
// @soulbeast-unit 0194-pvpCard

function pvpCard(u,own,me){const chosen=own?PVP.friend===u.id:PVP.target===u.id;return `<button class="ucard ${own?'ally':'foe'} ${chosen?(own?'at':'tg'):''} ${u.hp<=0?'down':''}" data-u="${u.id}" data-a="${own?'pvpFriend':'pvpTarget'}" data-v="${u.id}" ${!own&&u.hp<=0?'disabled':''}>${unitPortrait(u,46,{own:u.owner===me})}<div class="grow"><span class="nm" ${u.kind==='player'?'data-user-content':''}>${esc(u.name)}</span><span class="sub num">Lv ${u.lv}${u.hp<=0?' · หมดสติ':''}</span>${bar(u.hp,u.st.hp)}<span class="meta num">HP ${u.hp}/${u.st.hp} · MP ${u.mp}/${u.st.mp}</span><span class="meta">${Object.keys(u.status).map(k=>STS[k]?STS[k].n:'').filter(Boolean).join(' · ')}</span></div></button>`}
// @soulbeast-end 0194-pvpCard
// @soulbeast-unit 0195-vPvpBase

function vPvpBase(){const r=PVP.room;let content;
 if(!r){content=`<div class="card stack"><h3>ประลองด้วยตัวละครเซฟเดิม</h3><p class="sub" style="margin:0">ใช้เลเวล อาชีพ อุปกรณ์ แต้ม และทีมอสูรที่จัดไว้ ระบบบันทึกเซฟก่อนสร้างหรือเข้าห้อง เริ่ม PVP ด้วย HP/MP เต็มเฉพาะแมตช์ ผลแพ้ชนะไม่หัก EXP เหรียญ หรือ HP ในเกมหลัก</p><div class="row wrap"><button class="btn pri" data-a="pvpCreate" ${PVP.busy?'disabled':''}>สร้างห้อง</button><button class="btn" data-a="pvpResume" ${PVP.busy?'disabled':''}>เชื่อมต่อห้องเดิม</button></div><input id="pvpRoomCode" type="text" maxlength="8" autocomplete="off" placeholder="รหัสห้อง 8 ตัว"><button class="btn seal" data-a="pvpJoin" ${PVP.busy?'disabled':''}>เข้าห้องด้วยรหัส</button></div>`}
 else{const b=r.battle,all=[...b.allies,...b.enemies],own=all.filter(u=>u.owner===r.me),foes=all.filter(u=>u.owner!==r.me),actor=all.find(u=>u.id===b.cur),mine=r.status==='active'&&actor?.owner===r.me;
 if(!own.some(u=>u.id===PVP.friend))PVP.friend=own[0]?.id||'';if(!foes.some(u=>u.id===PVP.target&&u.hp>0))PVP.target=foes.find(u=>u.hp>0)?.id||'';
 let panel='';if(r.status==='waiting')panel='<p class="sub">รออีกฝ่ายเข้าห้อง ส่งรหัสห้องให้เพื่อน</p>';
 if(r.status==='lobby')panel=`<div class="card stack"><h3>ยืนยันทีมและเดิมพันก่อนเริ่ม</h3>${wagerPanel(r)}<p class="sub" style="margin:0">ทีมล็อกจากเซฟตอนเข้าห้อง ห้ามใช้ยาและไอเท็มรักษาทุกชนิด สกิลรักษายังใช้ได้ · ไม่จับอสูรหรือขโมยของจริง · เลือกคำสั่งใน 30 วินาที หมดเวลาจะเปิดออโต้ · ครบ 30 เทิร์นไม่มีผู้ชนะถือว่าเสมอ</p><div>${r.players.map(p=>`<span data-user-content>${esc(p.name)}</span> · Lv ${p.lv} · ${p.ready?'ยืนยันแล้ว':'ยังไม่ยืนยัน'}`).join('<br>')}</div><button class="btn pri" data-a="pvpReady" ${PVP.busy||PVP.stakeBusy||r.players[r.me].ready?'disabled':''}>ยืนยันทีมพร้อมสู้</button></div>`;
 if(r.status==='active'){const seconds=Math.max(0,Math.ceil((r.deadline-r.serverTime)/1000));panel=`<div class="panel">${foldCard('เดิมพันที่ตกลงไว้',wagerPanel(r))}${onlineAutoButton('pvp')}<b>${mine?'ตาของคุณ: ':'รออีกฝ่าย: '}${esc(actor?.name||'')}</b><div class="sub">เหรียญจำลองในแมตช์ ${fmt(r.gold)} · เทิร์นที่จบ ${b.turns||0}/30 · รอบ ${b.round} · เลือกคำสั่งใน 30 วินาที หมดเวลาจะเปิดออโต้</div>${mine&&!r.replaying?`<p class="sub" style="margin:0">แตะศัตรูเลือกเป้าหมาย และแตะฝ่ายเราเพื่อเลือกเป้าหมายรักษา/บัฟ</p><div class="acts">${[...new Set([...actor.skills,'rest','defend'])].map(id=>{const sk=pvpSkill(id,true),mp=sk?costOf(actor,sk):0;return `<button class="btn" data-a="pvpMove" data-v="${id}" ${PVP.busy||PVP.pending||mp>actor.mp||cooldownOf(actor,id)>0?'disabled':''}>${skillElementIcon(actor,sk,id)}<span class="skill-name">${esc(sk?.n||'ตั้งรับ')}</span><small>${cooldownOf(actor,id)?'รอ '+cooldownOf(actor,id)+' เทิร์น':mp?'MP '+mp:id==='defend'?'ป้องกัน +50%':''}${sk?.gc?' · เหรียญ '+sk.gc*actor.lv:''}${sk?.cd?' · คูลดาวน์ '+sk.cd:''}</small></button>`}).join('')}</div>`:''}</div>`}
 if(r.status==='finished')panel=`<div class="card stack"><h2>${r.winner===-1?'เสมอ / ห้องปิด':r.winner===r.me?'คุณชนะ':'คุณแพ้'}</h2><p>${esc(r.reason)}</p>${wagerPanel(r)}<p class="sub">ผลเดิมพันบันทึกบนเซิร์ฟเวอร์แล้ว</p><button class="btn pri" data-a="pvpClear">กลับหน้าสร้างห้อง</button></div>`;
 content=`<div class="card row wrap"><div class="grow"><span class="sub">รหัสห้อง</span><h2 class="num">${r.id}</h2></div><button class="btn sm" data-a="pvpCopy">คัดลอก</button><button class="btn sm" data-a="pvpResume" ${PVP.busy?'disabled':''}>เชื่อมต่อใหม่</button><button class="btn sm" data-a="pvpPoll" ${PVP.busy?'disabled':''}>รีเฟรช</button></div><h3>ฝ่ายคุณ</h3><div class="lst">${own.map(u=>pvpCard(u,true,r.me)).join('')}</div>${foes.length?`<h3>ฝ่ายตรงข้าม</h3><div class="lst">${foes.map(u=>pvpCard(u,false,r.me)).join('')}</div>`:''}${panel}<div class="log">${b.log.map(line=>`<p>${esc(line)}</p>`).join('')}</div>${PVP.pending?'<div class="card stack"><p class="sub">ยังไม่ทราบผลคำสั่งล่าสุด ตรวจสถานะหรือส่งคำสั่งเดิมซ้ำได้โดยไม่คิดเป็นเทิร์นใหม่</p><button class="btn" data-a="pvpRetry">ส่งคำสั่งเดิมอีกครั้ง</button></div>':''}${['waiting','lobby','active'].includes(r.status)?'<button class="btn danger" data-a="pvpLeave">ออกจากห้อง / ยอมแพ้</button>':''}`}
 return `<div class="stack"><div class="row"><h2 class="grow">PVP · ผู้ผนึกดวลกัน</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><p class="sub" style="margin:0">ตรวจคำสั่งระหว่างสู้ประมาณทุก 2.5 วินาทีเมื่อเปิดหน้านี้ ไม่ควรปิดหน้าขณะเป็นตาของคุณ · กติกาสมดุลใหม่: คริสูงสุด 65% · โบนัสความเร็วท้ายรอบคู่ · อสูรยั่วยุตั้งรับเปิดเกม · รวมทุกตัว 30 เทิร์น</p>${r&&PVP.balanceVersion!==4?'<div class="card" style="color:var(--bad)">เซิร์ฟเวอร์ยังใช้กติกาเดิม ต้องอัปเดตระบบก่อนเริ่มห้องใหม่</div>':''}${PVP.error?`<div class="card" style="color:var(--bad)">${esc(PVP.error)}</div>`:''}${content}</div>`}
// @soulbeast-end 0195-vPvpBase
// @soulbeast-unit 0275-pvpOffense


function pvpOffense(u,k,v){
 if(!isBalancedPvp()||!['patk','matk'].includes(k))return v;
 if(u.kind==='player'){
  if(['gladiator','paladin'].includes(u.cls))v+=(u.st.pdef+u.st.mdef)*.25;
  if(u.cls==='paladin')v=Math.max(v,u.st[k==='patk'?'matk':'patk']*.9);
  if(u.cls==='sage'&&k==='matk')v*=1.25;
  if((u.cls==='gunner'||u.cls==='marksman')&&k==='patk')v*=1.15;
  if(u.cls==='wildgod'&&u.form)v*=1.05;
  // Retain a bounded benefit for legacy critical/speed allocations without moving saved points.
  if(baseOf(u.cls)==='thief'){const legacy=Math.min(1,Math.max(0,u.st.spd/Math.max(u.st.patk,u.st.matk)-.8));v*=1+legacy*(Math.min(.25,Math.max(0,u.st.crit-65)*.004)+.15);}
 }else if(u.kind==='pet'){
  const hero=sideOf(u).find(x=>x.kind==='player');if(hero&&['sealmaster','spiritlord'].includes(hero.cls))v*=1.25;
 }
 return v;
}
// @soulbeast-end 0275-pvpOffense
// @soulbeast-unit 0276-pvpDamageFactor

function pvpDamageFactor(u,t){if(!isBalancedPvp())return 1;let f=1;
 if(u.kind==='player'&&baseOf(u.cls)==='gladiator'&&!['gladiator','paladin'].includes(u.cls))f*=1.2;
 if(t.kind==='player'&&['sealmaster','spiritlord'].includes(t.cls)&&sideOf(t).some(x=>x.kind==='pet'&&x.hp>0))f*=.8;
 if(t.kind==='player'&&t.cls==='wildgod')f*=.85;
 return f;
}
// @soulbeast-end 0276-pvpDamageFactor
// @soulbeast-unit 0277-isBalancedPvp


function isBalancedPvp(){return !!(S&&S.battle&&S.battle.kind==='pvp')}
// @soulbeast-end 0277-isBalancedPvp
// @soulbeast-unit 0278-pvpSkill

function pvpSkill(id,inPvp=isBalancedPvp(),mode=null){const sk=SK[id];if(sk&&(mode==='world'||isWorldBattle()))return sk.taunt?{...sk,taunt:1,cd:Math.max(3,sk.cd||0),_pvpId:id}:sk;if(!sk||!inPvp)return sk;let changes=null;
 const tune={ms_thief20:{pw:180,cb:10,cd:3},ms_thief40:{pw:35,cd:3},as_sonic:{pw:50,cd:3},rn_wander:{pw:230,cb:15,cd:3},nj_clone:{bf:{eva:.7,spd:.2}}};
 if(tune[id])changes=tune[id];
 if(id==='dr_leaf'||id==='ms_druid10')changes={cd:2};
 if(sk.all&&sk.t==='m')changes={...changes,pw:sk.basePower||sk.pw,areaScale:.65};
 return changes?{...sk,...changes,_pvpId:id}:sk;
}
// @soulbeast-end 0278-pvpSkill
// @soulbeast-unit 0374-vPvp

function vPvp(){return (PVP.room?.status==='active'?'':activityBackdrop('pvp','PVP · ประลองกับผู้ผนึกคนอื่น'))+vPvpBase();}
// @soulbeast-end 0374-vPvp
// @soulbeast-unit 0445-stakeApply


function stakeApply(P,events){P.stakeApplied=Array.isArray(P.stakeApplied)?P.stakeApplied:[];P.items=P.items||{};P.owned=P.owned||[];P.pets=P.pets||[];for(const e of events||[]){if(P.stakeApplied.includes(e.id))continue;const a=e.asset;if(a.type==='gold')P.gold=(Number(P.gold)||0)+e.sign*a.qty;else if(a.type==='item')P.items[a.key]=Math.max(0,(P.items[a.key]||0)+e.sign*a.qty);else if(a.type==='gear'){if(e.sign<0){const i=P.owned.indexOf(a.key);if(i>=0)P.owned.splice(i,1)}else P.owned.push(a.key)}else if(a.type==='pet'){if(e.sign<0){P.pets=P.pets.filter(p=>p.uid!==a.pet.uid);P.party=(P.party||[]).filter(id=>id!==a.pet.uid);P.carried=(P.carried||[]).filter(id=>id!==a.pet.uid)}else{const pet=JSON.parse(JSON.stringify(a.pet));if(P.pets.some(p=>p.uid===pet.uid))pet.uid=Number(''+Date.now().toString().slice(-10)+'9');P.pets.push(pet);P.seen=P.seen||{};P.caught=P.caught||{};P.seen[pet.sp]=1;P.caught[pet.sp]=1;}}P.stakeApplied.push(e.id)}return P;}
// @soulbeast-end 0445-stakeApply
// @soulbeast-unit 0474-wagerPanel


function wagerPanel(r){const v=r.wagers||{rev:0,offers:[null,null]},mine=v.offers[r.me],other=v.offers[1-r.me],busy=PVP.busy||PVP.stakeBusy;return `<div class="card stack wager-panel"><h3>◈ ของเดิมพัน · เลือกไม่เดิมพันได้</h3><div class="wager-pair">${[r.me,1-r.me].map(i=>`<div><small>${i===r.me?'ของคุณ':'ของอีกฝ่าย'}</small><b>${esc(v.offers[i]?.label||'ไม่เดิมพัน')}</b>${v.offers[i]?.pet?portrait(v.offers[i].pet.sp,54,{form:v.offers[i].pet.form}):v.offers[i]?.type==='gear'||v.offers[i]?.type==='item'?itemIcon(v.offers[i].key,42):''}</div>`).join('')}</div>${r.status==='lobby'?`<label>เลือกของของคุณ<select id="wagerPick"><option value="none:">ไม่เดิมพัน</option><option value="gold:">เงิน</option>${Object.entries(S.P.items||{}).filter(([id,n])=>CON[id]&&n>0).map(([id,n])=>`<option value="item:${id}">${esc(CON[id].n)} · มี ${n}</option>`).join('')}${[...new Set(S.P.owned)].filter(id=>EQ[id]).map(id=>`<option value="gear:${id}">${esc(EQ[id].n)}</option>`).join('')}${storedPets().map(p=>`<option value="pet:${p.uid}">${esc(petName(p))} Lv ${p.lv}</option>`).join('')}</select></label><label>จำนวน (เงินหรือไอเท็ม)<input id="wagerQty" type="number" min="1" step="1" value="1"></label><button class="btn seal" data-a="wagerOffer" ${busy?'disabled':''}>ฝาก / เปลี่ยนของเดิมพัน</button><small>ของที่ฝากจะถูกพักไว้จนจบแมตช์ การเปลี่ยนเดิมพันยกเลิกการยืนยันของทั้งคู่ · อสูรต้องพักค่ายและไม่ได้เฝ้าค่าย</small>`:''}${r.status==='finished'?`<small>${r.winner===-1?'เสมอหรือยกเลิก · คืนของให้เจ้าของ':'ผู้ชนะได้รับของเดิมพันทั้งสองฝั่งแล้ว'} · รับของได้จากเซฟออนไลน์เมื่อเชื่อมต่อ</small>`:'<small>ผู้แพ้เสียของที่ฝากให้ผู้ชนะ · เสมอคืนของ · ออกจากห้องระหว่างสู้ถือว่ายอมแพ้</small>'}</div>`}
// @soulbeast-end 0474-wagerPanel
// @soulbeast-unit 0475-accountBeforeStakes

const accountBeforeStakes=applyAccount;
// @soulbeast-end 0475-accountBeforeStakes
// @soulbeast-unit 0476-applyAccount
applyAccount=function(a){if(a?.stakes&&S.P)stakeApply(S.P,a.stakes);accountBeforeStakes(a)};
// @soulbeast-end 0476-applyAccount
// @soulbeast-unit 0510-replayPvpReceive


const replayPvpReceive=pvpReceive;
// @soulbeast-end 0510-replayPvpReceive
// @soulbeast-unit 0511-pvpReceive
pvpReceive=function(result){replayPvpReceive(result);localReplay('pvp',result.room);};
// @soulbeast-end 0511-pvpReceive
// @soulbeast-unit 0680-reliabilityPvp

const reliabilityPvp=pvpRequest;
// @soulbeast-end 0680-reliabilityPvp
// @soulbeast-unit 0681-pvpRequest
pvpRequest=async function(packet,silent=false){if(silent||PVP.busy)return reliabilityPvp(packet,silent);return withOnline(packet.action,()=>reliabilityPvp(packet,silent));};
// @soulbeast-end 0681-pvpRequest
// @soulbeast-unit 0690-reliabilityPvpConnect

const reliabilityPvpConnect=pvpConnect;
// @soulbeast-end 0690-reliabilityPvpConnect
// @soulbeast-unit 0691-pvpConnect
pvpConnect=async function(mode){if(PVP.busy)return;return withOnline('pvp_'+mode,()=>reliabilityPvpConnect(mode));};
// @soulbeast-end 0691-pvpConnect
// @soulbeast-unit 0695-reliabilityPvpError

const reliabilityPvpError=pvpError;
// @soulbeast-end 0695-reliabilityPvpError
// @soulbeast-unit 0696-pvpError
pvpError=function(message){return message==='busy'?onlineMessage(message):reliabilityPvpError(message);};
// @soulbeast-end 0696-pvpError
// @soulbeast-unit 0734-wagerClass

function wagerClass(a){if(!a)return 'none';if(a.type==='gold')return 'gold';if(a.type==='pet'){const q=SP[a.pet?.sp];return 'pet:'+(q?.legendary?'legendary':q?.rare?'rare':'normal');}if(a.type==='gear'){const q=EQ[a.key];return 'gear:'+(q?.worldLegend?'eclipse':q?.legend?'legendary':q?.craft?'crafted':'normal');}if(a.type==='item'){const q=CON[a.key];return 'item:'+(q?.rareLoot?'rare':q?.price>=1000?'premium':'normal');}return 'invalid';}
// @soulbeast-end 0734-wagerClass
// @soulbeast-unit 0735-wagersMatch

function wagersMatch(a,b){return (!a&&!b)||!!(a&&b&&wagerClass(a)===wagerClass(b));}
// @soulbeast-end 0735-wagersMatch
// @soulbeast-unit 0758-balanceWagerPanel

const balanceWagerPanel=wagerPanel;
// @soulbeast-end 0758-balanceWagerPanel
// @soulbeast-unit 0759-wagerPanel
wagerPanel=function(r){let html=balanceWagerPanel(r);const other=r.wagers?.offers?.[1-r.me];if(!other)return html;html=html.replace(/<option value="([^"]+)"([^>]*)>([\s\S]*?)<\/option>/g,(full,value,attrs,label)=>{const [type,key]=value.split(':');if(type==='none')return full;const asset=type==='pet'?{type,pet:S.P.pets.find(p=>String(p.uid)===key)}:{type,key};return wagerClass(asset)===wagerClass(other)?full:'';});return html;};
// @soulbeast-end 0759-wagerPanel
// @soulbeast-unit 0760-balancePvpError

const balancePvpError=pvpError;
// @soulbeast-end 0760-balancePvpError
// @soulbeast-unit 0761-pvpError
pvpError=function(m){return m==='stake rarity mismatch'?'ของเดิมพันต้องเป็นชนิดและความหายากเดียวกันทั้งสองฝ่าย':balancePvpError(m);};
// @soulbeast-end 0761-pvpError
// @soulbeast-unit 0893-statusPvpCard

const statusPvpCard=pvpCard;
// @soulbeast-end 0893-statusPvpCard
// @soulbeast-unit 0894-pvpCard
pvpCard=function(u,own,me){return statusBattleCard(statusPvpCard(u,own,me),u);};
// @soulbeast-end 0894-pvpCard
// @soulbeast-unit 0897-PVP_TIMEOUT_POLL

let PVP_TIMEOUT_POLL='';
// @soulbeast-end 0897-PVP_TIMEOUT_POLL
// @soulbeast-unit 0898-pvpTurnTimeText

function pvpTurnTimeText(){const r=PVP.room;if(!r||r.replaying||r.status!=='active')return r?.replaying?'รีเพลย์':'';const actor=[...r.battle.allies,...r.battle.enemies].find(u=>u.id===r.battle.cur);if(r.players[actor?.owner]?.auto)return 'ออโต้';return Math.max(0,Math.ceil((r.deadline-(Date.now()-(PVP.clock||0)))/1000))+' วินาที';}
// @soulbeast-end 0898-pvpTurnTimeText
