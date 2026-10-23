// Battle cards, command dock and combat layout
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0381-ucard

function ucard(u,i){const b=B(),fx=b.fx.filter(f=>f.id===u.id).map(f=>`<span class="fx ${f.c}">${f.t}</span>`).join(''),foe=u.side==='enemy';
 const sts=Object.keys(u.status).map(k=>`<span class="chip stchip" style="color:${STS[k].c}">${STS[k].n}</span>`).join('');
 const bs={};u.buffs.forEach(x=>{if(x.st)bs[x.st]=(bs[x.st]||0)+x.amt});
 const bf=Object.entries(bs).filter(([,v])=>v).map(([k,v])=>`<span class="chip stchip" style="color:var(--${v>0?'good':'bad'})">${SH[k]}${v>0?'↑':'↓'}</span>`).join('')+(u.taunt>0?'<span class="chip stchip" style="color:var(--gold)">ยั่วยุ</span>':'')+(u.charging?'<span class="chip stchip" style="color:var(--mp)">กำลังชาร์จ</span>':'')+(u.charge>1?`<span class="chip stchip" style="color:var(--mp)">พลัง×${u.charge}</span>`:'')+(u.form?`<span class="chip stchip" style="color:var(--seal)">${FORMS[u.form].n}</span>`:'');
 const sel=foe?(i===b.target&&u.hp>0&&!b.over?'tg':''):(i===b.atarget&&!b.over&&b.allies.length>1?'at':'');
 return `<button data-u="${u.id}" class="ucard ${foe?'foe':'ally'} ${sel} ${b.cur===u.id&&!b.over?'turn':''} ${u.hp<=0?'down':''}" data-a="bt" data-v="${foe?'target':'ally'}:${i}">
 ${portrait(u.img,foe?44:38,{form:u.evo||0})}<div class="grow"><span class="nm" ${u.kind==='player'?'data-user-content':''}>${esc(u.name)}</span><span class="meta"><span class="num">Lv ${u.lv}</span>${tChips(u.types)}${u.captured?'<span class="chip" style="color:var(--seal)">ถูกผนึก</span>':''}</span>
 ${(u.dots||[]).map(d=>`<small>${esc(d.n)} ${d.turns} เทิร์น</small>`).join('')}${u.taunt?`<small>ยั่วยุ ${u.taunt} เทิร์น</small>`:''}${u.immune?`<small>กัน${u.immune==='p'?'กายภาพ':'เวท'} 100%</small>`:''}${sts||bf?`<span class="meta">${sts}${bf}</span>`:''}
 ${bar(u.hp,u.st.hp)}<span class="meta num">HP ${u.hp}/${u.st.hp}${foe?' · '+scoreValue(u)+' คะแนน':` · MP ${u.mp}`} </span>${foe?'':bar(u.mp,u.st.mp,'mp')}</div>${fx}</button>`}
// @soulbeast-end 0381-ucard
// @soulbeast-unit 0382-vBattle

function vBattle(){const b=B(),u=uById(b.cur),P=S.P;
 const order=b.over?'':`<div class="order"><span class="grow">ลำดับตา: ${[b.cur,...b.queue].filter(Boolean).map(q=>[uById(q.replace('*','')),q.endsWith('*')]).filter(([x])=>x&&x.hp>0).slice(0,9).map(([x,e],i)=>`<span class="${i===0?'now':''}"><span ${x.kind==='player'?'data-user-content':''}>${esc(x.name.replace('★ ','').split(' ')[0])}</span>${e?' ×2':''}</span>`).join('')}</span>${b.allies.length>1?`<button class="btn sm" style="min-height:26px;padding:2px 8px;font-size:11px" data-a="bt" data-v="auto:1">อสูรออโต้ ${S.ui.autoPet?'เปิด':'ปิด'}</button>`:''}</div>`;
 let panel='';
 if(b.over){panel=(b.over.res==='win'&&b.kind==='boss'&&!ZN[b.meta-1].train?storyCard(b.meta,true):'')+`<div class="panel res"><h2 style="${b.over.res==='lose'?'color:var(--bad)':''}">${b.over.title}</h2><div class="lines">${b.over.lines.map(l=>`<div>${l}</div>`).join('')}</div><button class="btn pri full" data-a="bt" data-v="done">ไปต่อ</button></div>`}
 else if(b.menu==='wait'||!u||u.side==='enemy'){panel=`<div class="panel"><p class="sub" style="margin:0;text-align:center">${u?`${esc(u.name)} กำลังเคลื่อนไหว...`:'...'}</p></div>`}
 else{const t=curTarget(),al=curAlly(),head=`<div class="row wrap" style="gap:4px 10px"><b class="grow">ตาของ ${esc(u.name)}</b><span class="sub">เป้า: ${t?esc(t.name):'-'}${t?` · โดน ${Math.round(hitChance(u,t))}%`:''}${b.allies.length>1?` · ฝ่ายเรา: ${esc(al.name)}`:''}</span></div>`,back=`<button class="btn" data-a="bt" data-v="menu:main">ย้อนกลับ</button>`;
  const skBtn=id=>{const s=SK[id],off=['p','m','h','auto','status','debuff'].includes(s.t),m=off&&t&&!s.all?attackMultiplier(u,s,t):1,stab=s.el&&(u.stab.includes(s.el)||u.types.includes(s.el));
   const c=costOf(u,s),cd=cooldownOf(u,id),dis=cd>0||(c&&u.mp<c)||(s.gc&&P.gold<s.gc*u.lv);
   return `<button class="btn ${['heal','buff','form'].includes(s.t)?'seal':''}" data-a="bt" data-v="sk:${id}" ${dis?'disabled':''}>${skillElementIcon(u,s,id)}<span class="skill-name">${s.n}</span><small>${cd?'รอ '+cd+' เทิร์น · ':''}${c?c+' MP':'—'}${s.gc?' · '+fmt(s.gc*u.lv)+'฿':''} · ${skTag(s)}${stab?'★':''} ${multTxt(m)}</small></button>`};
  if(u.kind==='pet'||u.kind==='summon')panel=`<div class="panel">${head}<div class="acts">${u.skills.filter(id=>SK[id]).map(skBtn).join('')}${skBtn('rest')}</div><p class="sub" style="margin:0">แตะการ์ดศัตรูเพื่อเลือกเป้า · ×2 ได้ผลดี ×½ ไม่ค่อยได้ผล · ★ ธาตุเดียวกับผู้ใช้ +25%</p></div>`;
  else if(b.menu==='skill')panel=`<div class="panel">${head}<div class="acts">${u.skills.filter(s=>s!=='attack'&&SK[s]).map(skBtn).join('')}${skBtn('rest')}${back}</div><p class="sub" style="margin:0">สกิล "เลือกฝ่ายเรา" ใช้กับการ์ดฝ่ายเราที่เลือกไว้ (แตะเพื่อเปลี่ยน)</p></div>`;
  else if(b.menu==='item'){const its=Object.keys(CON).filter(k=>!CON[k].seal&&!CON[k].petExp&&P.items[k]>0);
   panel=`<div class="panel">${head}<p class="sub" style="margin:0">ใช้กับ: <b>${esc(al.name)}</b> — แตะการ์ดฝ่ายเราเพื่อเปลี่ยน</p><div class="lst">${its.length?its.map(k=>`<div class="item">${itemIcon(k)}<div class="grow"><b>${CON[k].n} ×${P.items[k]}</b><small>${CON[k].d}</small></div><button class="btn sm" data-a="bt" data-v="item:${k}" ${potionUseful(CON[k],al,al.st)?'':'disabled'}>ใช้</button></div>`).join(''):'<p class="sub">ไม่มียาในกระเป๋า</p>'}</div>${back}</div>`}
  else if(b.menu==='seal'){const its=Object.keys(CON).filter(k=>CON[k].seal&&P.items[k]>0);panel=`<div class="panel">${head}<p class="sub" style="margin:0">HP เป้าหมายยิ่งน้อยยิ่งผนึกง่าย ถ้าเป้าหมายหลับ แช่แข็ง หรืออัมพาต ผนึกง่ายขึ้นอีก 50%</p><div class="lst">${its.length?its.map(k=>`<div class="item">${itemIcon(k)}<div class="grow"><b>${CON[k].n} ×${P.items[k]}</b><small>โอกาสสำเร็จประมาณ <span class="num">${Math.round(sealChance(t,CON[k].seal)*100)}%</span></small></div><button class="btn sm seal" data-a="bt" data-v="seal:${k}" ${sealable(t)?'':'disabled'}>ขว้าง</button></div>`).join(''):'<p class="sub">ไม่มีผนึกเหลือ</p>'}</div>${back}</div>`}
  else if(b.menu==='swap'){const inF=b.allies.slice(1).map(x=>x.uid),ps=carriedPets().filter(p=>!inF.includes(p.uid)&&p.hp>0);
   panel=`<div class="panel">${head}<p class="sub" style="margin:0">${b.allies.length-1<clsSum(P.cls)?'มีช่องว่าง อสูรที่เลือกจะลงสนามเพิ่ม':`จะสลับกับ ${b.allies[b.atarget]&&b.allies[b.atarget].kind==='pet'?esc(b.allies[b.atarget].name):esc(b.allies[1]?b.allies[1].name:'-')} (แตะการ์ดอสูรฝ่ายเราเพื่อเลือก)`}</p><div class="lst">${ps.length?ps.map(p=>{const q=calcPet(p);return `<div class="item">${portrait(p.sp,36)}<div class="grow"><b>${petName(p)} <span class="num sub">Lv ${p.lv}</span></b><span class="row wrap" style="gap:3px">${tChips(SP[p.sp].t)}</span>${bar(p.hp,q.hp)}</div><button class="btn sm pri" data-a="bt" data-v="swap:${p.uid}">เรียก</button></div>`}).join(''):'<p class="sub">ไม่มีอสูรตัวอื่นที่พร้อมสู้</p>'}</div>${back}</div>`}
  else{const canSeal=b.enemies.some(sealable),canFlee=['wild','bandit','traveler'].includes(b.kind);
   panel=`<div class="panel">${head}<div class="acts">${skBtn('attack')}<button class="btn" data-a="bt" data-v="menu:skill">สกิล<small>${u.skills.length-1} ท่า</small></button><button class="btn" data-a="bt" data-v="menu:item">ไอเทม<small>ยา · แก้สถานะ</small></button>
   <button class="btn seal" data-a="bt" data-v="menu:seal" ${canSeal?'':'disabled'}>ผนึก<small>จับอสูร</small></button><button class="btn" data-a="bt" data-v="menu:swap">เรียกอสูร<small>ไม่เสียเทิร์น</small></button><button class="btn" data-a="bt" data-v="flee" ${canFlee?'':'disabled'}>หนี<small>${canFlee?'ลุ้นความเร็ว':'หนีไม่ได้'}</small></button></div></div>`}}
 return `<div class="field battle-enhanced"><div class="battle-toolbar"><b>⚔ เทิร์น ${b.round}</b>${!b.over&&teamAutoAllowed()?`<button class="btn sm ${S.ui.autoTeam?'pri':''}" data-a="teamAuto" aria-pressed="${!!S.ui.autoTeam}">ออโต้ทั้งทีม ${S.ui.autoTeam?'เปิด':'ปิด'}</button>`:''}<small>ออโต้เลือกสกิล · ไม่ใช้ยา/ผนึก · กดปิดเพื่อควบคุมเอง</small></div>${order}<div class="side" style="--n:${Math.min(2,b.enemies.length)}">${b.enemies.map((e,i)=>ucard(e,i)).join('')}</div>
 <div class="log" id="blog">${b.log.slice(-14).map(l=>`<p>${l}</p>`).join('')}</div>
 <div class="side" style="--n:${Math.min(2,b.allies.length)}">${b.allies.map((a,i)=>ucard(a,i)).join('')}</div>${panel}</div>`}
// @soulbeast-end 0382-vBattle
// @soulbeast-unit 0830-handlers-battleCommands

handlers.battleCommands=function(){S.ui.battleCommandsHidden=!S.ui.battleCommandsHidden;render();};
// @soulbeast-end 0830-handlers-battleCommands
// @soulbeast-unit 0876-compactPvpCommands

function compactPvpCommands(r,actor){if(r.replaying)return '<p>กำลังแสดงการต่อสู้ · ผลบันทึกแล้ว</p>';if(actor?.owner!==r.me)return '<p>รอ '+esc(actor?.name||'ผู้เล่นอีกฝ่าย')+'</p>';
 return '<p class="online-command-hint">แตะศัตรูเลือกเป้า · แตะฝ่ายเราเลือกเป้าฮีล/บัฟ</p><div class="acts">'+[...new Set([...(actor.skills||[]),'rest','defend'])].map(id=>{const sk=pvpSkill(id,true),cost=sk?costOf(actor,sk):0,cd=cooldownOf(actor,id);return '<button class="btn" data-a="pvpMove" data-v="'+id+'" '+(PVP.busy||PVP.pending||cost>actor.mp||cd>0?'disabled':'')+'>'+skillElementIcon(actor,sk,id)+'<span class="skill-name">'+esc(sk?.n||'ตั้งรับ')+'</span><small>'+(cd?'รอ '+cd+' เทิร์น':cost?'MP '+cost:id==='defend'?'ป้องกัน +50%':'')+(sk?.gc?' · เหรียญ '+sk.gc*actor.lv:'')+'</small></button>';}).join('')+'</div>';
}
// @soulbeast-end 0876-compactPvpCommands
// @soulbeast-unit 0879-compactPvpView

const compactPvpView=vPvp;
// @soulbeast-end 0879-compactPvpView
// @soulbeast-unit 0880-vPvp
vPvp=function(){return compactBattleReady('pvp')?compactOnlineBattle('pvp',PVP.room):compactPvpView();};
// @soulbeast-end 0880-vPvp
// @soulbeast-unit 0988-forestBattleView

const forestBattleView=vBattle;
// @soulbeast-end 0988-forestBattleView
// @soulbeast-unit 0989-vBattle
vBattle=function(){let html=forestBattleView();if(forestAutoLocked())html=html.replace(/<button\b[^>]*data-a="bt"[^>]*data-v="auto:1"[^>]*>[\s\S]*?<\/button>/g,'');if(S.ui.forestAutoNotice&&S.zone)html='<div class="card forest-auto-notice" role="status"><b>ปลดล็อกต่อสู้อัตโนมัติแล้ว!</b><p>เลเวล 10 ใช้ปุ่มออโต้ทีมให้ตัวละครและอสูรเลือกสกิลเองได้ กดปิดเพื่อกลับมาเล่นเอง</p><button class="btn sm" data-a="forestAutoNotice">เข้าใจแล้ว</button></div>'+html;return html;};
// @soulbeast-end 0989-vBattle
