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
 const order=b.over?'':`<div class="order portrait-turn-order"><small class="turn-order-label" translate="no">${ct('ลำดับตา:','Turn order:','行动顺序：')}</small><div class="turn-order-list" role="list" aria-label="${ct('ลำดับตา','Turn order','行动顺序')}" translate="no">${[b.cur,...b.queue].filter(Boolean).map(q=>[uById(q.replace('*','')),q.endsWith('*')]).filter(([x])=>x&&x.hp>0).slice(0,9).map(([x,e],i)=>{const current=i===0&&x.id===b.cur,label=x.name+' · '+(x.side==='ally'?ct('ทีมเรา','Our team','我方'):ct('ทีมศัตรู','Enemy team','敌方'))+(current?' · '+ct('กำลังออกตา','Current turn','当前行动'):'')+(e?' · ×2':'');return `<div class="turn-order-entry ${x.side==='ally'?'ally':'enemy'}${current?' current':''}" role="listitem" data-turn-unit="${esc(x.id)}" aria-label="${esc(label)}" title="${esc(label)}" ${current?'aria-current="step"':''}>${unitPortrait(x,32,{own:x.kind==='player'&&x.id==='P'})}${e?'<small class="turn-order-extra" aria-hidden="true">×2</small>':''}</div>`;}).join('')}</div><b class="battle-round" translate="no">⚔ ${ct('เทิร์น','Turn','回合')} ${b.round}</b></div>`;
 let panel='';
 if(b.over){panel=(b.over.res==='win'&&b.kind==='boss'&&!ZN[b.meta-1].train?storyCard(b.meta,true):'')+`<div class="panel res"><h2 style="${b.over.res==='lose'?'color:var(--bad)':''}">${b.over.title}</h2><div class="lines">${b.over.lines.map(l=>`<div>${l}</div>`).join('')}</div><button class="btn pri full" data-a="bt" data-v="done">ไปต่อ</button></div>`}
 else if(b.menu==='wait'||!u||u.side==='enemy'){panel=`<div class="panel"><p class="sub" style="margin:0;text-align:center">${u?`${esc(u.name)} กำลังเคลื่อนไหว...`:'...'}</p></div>`}
 else if(BattleSkillTarget.current())panel='<div class="panel">'+BattleSkillTarget.banner()+'</div>';
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
 return `<div class="field battle-enhanced">${order}${panel}</div>`}
// @soulbeast-end 0382-vBattle
// @soulbeast-unit 0830-handlers-battleCommands

// Pending choices are UI-only. No MP, cooldown, save or turn mutation until a target is tapped.
const BattleSkillTarget={pending:null,confirming:null,
 side(sk){if(!sk||sk.all||sk.rt||sk.summon)return '';if(['heal','buff'].includes(sk.t))return sk.tg==='ally'?'ally':'';return ['p','m','h','auto','status','debuff'].includes(sk.t)?'enemy':'';},
 context(){if(S.screen==='pvp'){const r=PVP.room,b=r?.battle,u=b&&[...b.allies,...b.enemies].find(x=>x.id===b.cur);return r?.status==='active'&&!r.replaying&&!PVP.busy&&!PVP.pending&&u?.owner===r.me?{mode:'pvp',b,u,key:r.id+':'+r.rev+':'+b.cur}:null;}if(S.screen!=='battle')return null;const b=B(),u=b&&uById(b.cur);return b&&!b.over&&u?.side==='ally'&&u.hp>0&&!teamAutoUnit(u)&&!['wait','end'].includes(b.menu)?{mode:'local',b,u,key:[b.round,b.cur,b.queue.join(',')].join('|')}:null;},
 current(){const p=this.pending,c=this.context();if(!p)return null;if(!c||p.mode!==c.mode||p.key!==c.key||(c.mode==='local'&&p.b!==c.b)){this.pending=null;return null;}return p;},
 valid(u,side){const p=this.current(),c=this.context();if(!p||!c||p.side!==side||!u)return false;const sk=pvpSkill(p.skill,c.mode==='pvp');if(side==='ally')return u.hp>0||!!(sk.rev&&u.kind!=='player');if(u.hp<=0||class10Invisible(u))return false;const foes=[...c.b.allies,...c.b.enemies].filter(x=>x.side!==c.u.side),forced=foes.find(x=>x.hp>0&&x.taunt>0&&!class10Invisible(x));return !forced||forced.id===u.id;},
 begin(id){if(this.confirming===id)return false;const c=this.context(),sk=pvpSkill(id,c?.mode==='pvp'),side=this.side(sk);if(!c||!side)return false;if(costOf(c.u,sk)>c.u.mp||cooldownOf(c.u,id)>0)return false;this.pending={...c,skill:id,side};const units=c.mode==='local'?(side==='enemy'?c.b.enemies:c.b.allies):[...c.b.enemies,...c.b.allies].filter(u=>side==='enemy'?u.side!==c.u.side:u.side===c.u.side),eligible=units.filter(u=>this.valid(u,side));if(eligible.length===1){this.confirm(side,c.mode==='local'?units.indexOf(eligible[0]):eligible[0].id);return true;}if(!eligible.length){this.pending=null;return false;}if(c.mode==='local')BattleCommandFocus.pending='arena';render();if(c.mode==='pvp')this.focusOnline();return true;},
 confirm(side,value){const p=this.current(),c=this.context();if(!p||!c)return false;const units=c.mode==='local'?(side==='enemy'?c.b.enemies:c.b.allies):[...c.b.enemies,...c.b.allies].filter(u=>side==='enemy'?u.side!==c.u.side:u.side===c.u.side),u=c.mode==='local'?units[Number(value)]:units.find(u=>u.id===value);if(!this.valid(u,side))return true;this.pending=null;this.confirming=p.skill;try{if(c.mode==='local'){if(side==='enemy')c.b.target=Number(value);else c.b.atarget=Number(value);battleAction('sk:'+p.skill);}else{if(side==='enemy')PVP.target=value;else PVP.friend=value;handlers.pvpMove(p.skill);}}finally{this.confirming=null;}return true;},
 cancel(){const c=this.context();this.pending=null;if(c?.mode==='local')BattleCommandFocus.pending='commands';render();},
 attrs(u,side){return this.current()?' data-skill-target="'+(this.valid(u,side)?'valid':'invalid')+'"'+(this.valid(u,side)?'':' disabled')+' ':'';},
 banner(){const p=this.current();return p?'<div class="battle-target-prompt" role="status"><div><b>'+esc(SK[p.skill]?.n||p.skill)+'</b><span>'+(p.side==='enemy'?ct('แตะการ์ดศัตรูเพื่อใช้สกิล','Tap an enemy to use this skill','点击敌方卡牌施放技能'):ct('แตะการ์ดฝ่ายเราเพื่อใช้สกิล','Tap an ally to use this skill','点击友方卡牌施放技能'))+'</span></div><button class="btn sm" data-a="battleTargetCancel">'+ct('ยกเลิก','Cancel','取消')+'</button></div>':'';},
 focusOnline(){const board=document.querySelector('.online-combat-scroll'),side=board?.querySelector?.(this.pending?.side==='ally'?'.our-side':'.opponent-side');if(board&&side)board.scrollTop+=side.getBoundingClientRect().top-board.getBoundingClientRect().top;}
};
handlers.battleTargetCancel=()=>BattleSkillTarget.cancel();
const targetPvpMove=handlers.pvpMove,targetPvpEnemy=handlers.pvpTarget,targetPvpAlly=handlers.pvpFriend;
handlers.pvpMove=id=>{if(!BattleSkillTarget.begin(id))return targetPvpMove(id);};
handlers.pvpTarget=id=>{if(!BattleSkillTarget.confirm('enemy',id))return targetPvpEnemy(id);};
handlers.pvpFriend=id=>{if(!BattleSkillTarget.confirm('ally',id))return targetPvpAlly(id);};

// Presentation only: never advance turns or change battle/save data.
const BattleCommandFocus={
 battle:null,turn:'',menu:'',pending:'',ticket:0,
 ready(){const b=B(),u=b&&uById(b.cur);return !!(b&&!b.over&&u?.side==='ally'&&u.hp>0&&!teamAutoUnit(u)&&!['wait','end'].includes(b.menu)&&!(typeof MotionTimeline!=='undefined'&&MotionTimeline.busy()));},
 prepare(){const b=B();if(b!==this.battle){this.battle=b;this.turn='';this.pending='';this.ticket++;}if(!b)return;
  const key=this.ready()?[b.round,b.cur,b.queue.join(',')].join('|'):'';
  if(key&&key!==this.turn){S.ui.battleCommandsHidden=false;this.pending='commands';}
  else if(!key&&this.turn)this.pending='arena';
  if(key&&this.menu!==b.menu)this.pending='commands';if(BattleSkillTarget.current()&&this.pending==='commands')this.pending='arena';this.menu=b.menu;this.turn=key;
 },
 commit(){this.turn='';this.pending='arena';this.ticket++;this.scroll('arena');},
 scroll(where){const main=document.querySelector('main'),target=main?.querySelector?.(where==='commands'?'.battle-command-dock':'.battle-vitals');if(!main||!target||!main.getBoundingClientRect)return;const viewport=main.getBoundingClientRect(),rect=target.getBoundingClientRect();const delta=where==='commands'?rect.bottom-viewport.bottom+12:rect.top-viewport.top-12;main.scrollTop+=delta;},
 sync(){if(!this.pending)return;const where=this.pending,battle=this.battle,ticket=++this.ticket;this.pending='';
  (window.requestAnimationFrame||setTimeout)(()=>{if(ticket!==this.ticket||B()!==battle||!battle)return;if(where==='commands'&&(!this.ready()||S.ui.battleCommandsHidden))return;this.scroll(where);});
 }
};
handlers.battleCommands=function(){S.ui.battleCommandsHidden=!S.ui.battleCommandsHidden;BattleCommandFocus.ticket++;if(!S.ui.battleCommandsHidden)BattleCommandFocus.pending='commands';render();};
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
