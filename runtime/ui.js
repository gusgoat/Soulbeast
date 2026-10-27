// Screen views, routing and UI events
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0113-esc

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// @soulbeast-end 0113-esc
// @soulbeast-unit 0210-skTagBase

function skTagBase(s){if(s.ct)return s.all?'2 ตา หมู่':'2 ตา';if(['heal','buff'].includes(s.t))return s.tg==='team'?'ทั้งทีม':s.tg==='ally'?'เลือกฝ่ายเรา':'ตัวเอง';if(s.t==='form')return 'แปลงร่าง';if(s.all)return 'หมู่';if(s.hits)return `${s.hits} ครั้ง`;return 'เดี่ยว'}
// @soulbeast-end 0210-skTagBase
// @soulbeast-unit 0211-skTag

function skTag(s){return (s.t==='p'?'กายภาพ · ':s.t==='m'?'เวท · ':s.t==='h'?'ผสม · ':s.t==='auto'?'ตามอาวุธ · ':s.summon?'อัญเชิญ · ':'')+skTagBase(s)}
// @soulbeast-end 0211-skTag
// @soulbeast-unit 0212-skillDesc

function skillDesc(id){const s=SK[id],a=[];if(s.el)a.push(elementIcon(s.el));if(s.cd)a.push('คูลดาวน์ '+s.cd+' เทิร์น');if(s.trueD)a.push('ทะลุพลังป้องกัน');if(s.immune)a.push('ป้องกัน'+(s.immune==='p'?'กายภาพ':'เวท')+' 100% จนจบเทิร์นถัดไป');if(s.summon)a.push('เรียกผู้ช่วย '+s.life+' เทิร์น'+(s.pctGold?' จ่ายเงิน 10% คลาสก่อนหน้า/เลเวล 85% · ออโต้จ้างไม่เกิน 1 ครั้งต่อการต่อสู้':''));if(s.dot)a.push('จบเทิร์นเสีย HP '+Math.round(s.dot.rate*100)+'% นาน '+s.dot.turns+' เทิร์น');if(s.enchant)a.push(`เพิ่มธาตุ${EL[s.enchant]?.n||s.enchant} ผสมกับการโจมตีปกติและสกิลโจมตี 3 เทิร์น · ธาตุซ้ำนับครั้งเดียว`);
 if(['p','m','h','auto'].includes(s.t))a.push(`${s.t==='p'?'กายภาพ':s.t==='m'?'เวทย์':s.t==='h'?'ผสม':'ตามอาวุธ'} พลัง ${s.pw}${s.hits?` × ${s.hits} ครั้ง${s.rt?' สุ่มเป้า':''}`:''}`);
 if(s.t==='heal')a.push(`ฟื้น HP ${s.pw}% ของ HP สูงสุดเป้าหมาย + 50% ของพลังเวทผู้ใช้ ก่อนตัวคูณฟื้นฟู${s.rev||s.revAll?' ชุบชีวิตได้':''}${s.cure?' ล้างสถานะ':''}`);
 if(s.t==='form')a.push(`เปลี่ยนเป็น${FORMS[s.form].n} ได้สกิลประจำร่าง และสายดรูอิดยังใช้สกิลร่างคนได้ทุกท่า`);
 if(s.bf){const pos=Object.entries(s.bf).filter(([,v])=>v>0),neg=Object.entries(s.bf).filter(([,v])=>v<0);
  if(pos.length)a.push(`เพิ่ม ${pos.map(([k,v])=>`${SH[k]} ${Math.round(v*100)}%`).join(' ')}`);
  if(neg.length)a.push(`${['buff','heal'].includes(s.t)?'ลดของตัวเอง':'ลดของเป้า'} ${neg.map(([k,v])=>`${SH[k]} ${Math.round(-v*100)}%`).join(' ')}`);
  if(s.tn)a.push(`${s.tn} ตา`)}
 if(s.st)a.push(Object.entries(s.st).map(([k,v])=>`${STS[k].n} ${Math.round(v*100)}%`).join(' '));
 if(s.ct)a.push('ตาแรกรวบรวมพลัง ตาถัดไปปล่อยท่าอัตโนมัติ');if(s.charge)a.push(`การโจมตีครั้งถัดไปแรง ×${s.charge}${s.tg==='team'?' ทั้งทีม':''}`);
 if(s.pas)a.push(`ได้ผล${PAS[s.pas].n}`);if(s.taunt)a.push('ยั่วยุ 3 เทิร์น: บังคับเป้าท่าเดี่ยว ไม่กันท่าหมู่');if(s.ls)a.push(`ดูดเลือด ${s.ls*100}%`);if(s.pi)a.push(`เมินเกราะ ${s.pi*100}%`);if(s.cb)a.push(`คริ +${s.cb}%`);
 if(s.acc>=100)a.push('ไม่พลาด');if(s.steal)a.push('ขโมยของ');if(s.gold)a.push('ได้เงิน');if(s.self)a.push(`เสีย HP ตัวเอง ${s.self*100}%`);if(s.ls&&s.t==='heal')a.push('');
 if(s.gc)a.push(`จ่าย ${s.gc}×Lv เหรียญ`);if(s.mp)a.push(`${s.mp} MP`);return a.filter(Boolean).join(' · ')}
// @soulbeast-end 0212-skillDesc
// @soulbeast-unit 0218-VSKID

const VSKID=new Map(Object.entries(SK).map(([id,sk])=>[sk,id]));
// @soulbeast-end 0218-VSKID
// @soulbeast-unit 0224-vParts

function vParts(L,x,y,c,shape,n,dist,up){for(let i=0;i<n;i++){const a=i*2.399963,r=dist*(.5+(i%7)*.1);vSpawn(L,'vx-p '+shape,[x,y],c,null,{'--dx':Math.cos(a)*r+'px','--dy':(Math.sin(a)*r+up*28)+'px','--rot':i*53+'deg'});}}
// @soulbeast-end 0224-vParts
// @soulbeast-unit 0346-toast

function toast(t){if(/ไม่พอ|ไม่ได้|ไม่สำเร็จ|ผิด|ไม่ตรง|หมดอายุ/.test(t))ExtraAudio.play('error');else if(/สำเร็จ/.test(t))ExtraAudio.play('quest');const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}
// @soulbeast-end 0346-toast
// @soulbeast-unit 0347-go

function forestReturnScreen(){return S.P.hp*5<pStats().hp*4?'hospital':'town';}
function go(s){if(WORLD?.room?.status==='active'&&!['world','town','hero','team','bag','settings'].includes(s)){toast('จบบอสโลกหรือถอนตัวก่อนเริ่มโหมดอื่น');return;}if(s==='world'){S.screen='world';render();wbCall(WORLD.roomId?'wb_poll':'wb_status');return;}if(S.zone&&['town','shop','hospital','arena','forge','leader','pvp','camp','world'].includes(s)){toast('ออกจากป่าไม่ได้ จนกว่าจะชนะบอส เจอทางออก หรือพ่ายแพ้');return}if(s==='wild'){if(S.battle)s='battle';else if(S.zone)s='zone';else S.ui.forestChoice=null;}
 S.screen=s;clearTimeout(PVP.timer);if(s==='pvp'){if(PVP.code&&S.P&&PVP.code!==ensureCode()){PVP.room=null;PVP.token='';PVP.restore='';PVP.pending=null;pvpSessionSave()}if(PVP.token)pvpSchedule()}S.ui.petView=null;save();render();if(s==='leader')lbLoad();document.querySelector('main')?.scrollTo(0,0)}
// @soulbeast-end 0347-go
// @soulbeast-unit 0352-handlers

const handlers={
 genderpick:v=>{if(S.screen!=='start'||!['male','female'].includes(v))return;S.ui.gender=v;render()},
 trapNoticeClose:()=>{delete S.ui.trapNotice;save();render()},
 pvpCreate:()=>pvpConnect('create'),pvpJoin:()=>pvpConnect('join'),pvpResume:()=>pvpConnect('resume'),pvpReady:()=>pvpRequest({action:'pvp_ready',wagerRev:PVP.room?.wagers?.rev||0}),pvpPoll:()=>pvpRequest({action:'pvp_poll'}),
 pvpTarget:id=>{PVP.target=id;render()},pvpFriend:id=>{PVP.friend=id;render()},
 pvpMove:id=>{if(PVP.busy||PVP.pending||!PVP.room)return;const request=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,'0')).join('');PVP.pending={action:'pvp_move',rev:PVP.room.rev,request,skill:id,target:PVP.target,friend:PVP.friend};pvpSessionSave();pvpRequest(PVP.pending)},
 pvpRetry:()=>{if(PVP.pending)pvpRequest(PVP.pending)},
 pvpCopy:()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(PVP.room.id).then(()=>toast('คัดลอกรหัสห้องแล้ว'),()=>toast('รหัสห้อง: '+PVP.room.id));else toast('รหัสห้อง: '+PVP.room.id)},
 pvpLeave:()=>{S.ui.confirm={msg:'ออกจากห้อง? ถ้าเริ่มประลองแล้วถือว่ายอมแพ้ แต่ไม่หักข้อมูลเกมหลัก',act:'pvpDoLeave'};render()},pvpDoLeave:()=>{S.ui.confirm=null;pvpRequest({action:'pvp_leave'})},
 pvpClear:()=>{clearTimeout(PVP.timer);PVP.room=null;PVP.token='';PVP.restore='';PVP.pending=null;PVP.error='';pvpSessionSave();render()},

 couponShop:()=>{if(handlers.accountOpenShop)return handlers.accountOpenShop();if(window.SOULBEAST_PLATFORM==='android'){toast(ct('กรุณาเข้าสู่บัญชีเกมก่อนเปิดร้านคูปอง','Sign in to your game account before opening the coupon shop.','请先登录游戏账户再打开兑换券商店。'));return;}window.location.assign('topup.html');},
 soundtoggle:async()=>{Sound.enabled=!Sound.enabled;Sound.save();if(!Sound.enabled)Sound.mute();else{const ready=await Sound.unlock();if(ready)Sound.fx('blessing');else toast('เบราว์เซอร์ยังไม่พร้อมเล่นเสียง ลองกดเปิดเสียงอีกครั้ง')}render()},
 go:v=>go(v),
 surrender:()=>{if(!S.zone)return;const band=S.battle&&['bandit','traveler'].includes(S.battle.kind);S.ui.confirm={msg:band?'ยอมตายและกลับเมือง? ใช้บทลงโทษแพ้โจร: เสียเหรียญ 25% เสีย EXP 15% ตามเกณฑ์เดิม และอาจถูกขโมยอสูรหรือไอเท็ม':'ยอมตายและกลับเมือง? เสียเหรียญ 10% ของที่มี และ EXP 8% ของค่าที่ต้องใช้ขึ้นเลเวล (ไม่เกิน EXP ที่มี ไม่ลดเลเวล) คุณกับอสูรในทีมรับโทษ EXP และคุณฟื้น HP 30% ที่โรงพยาบาล',act:'dosurrender'};render()},
 dosurrender:()=>surrenderForest(),
 story:()=>{S.ui.storyReturn=S.screen;S.screen='story';render();document.querySelector('main')?.scrollTo(0,0)},
 storyback:()=>{S.screen=S.ui.storyReturn||(S.P?(S.zone?'zone':'town'):'start');delete S.ui.storyReturn;render()},
 clspick:v=>{S.ui.cls=v;render()},starterpick:v=>{const n=clsSum(S.ui.cls||'swordsman');let a=starterSel().filter(k=>k!==v);if(a.length===starterSel().length){a.push(v);if(a.length>n)a.shift()}if(!a.length)a=[v];S.ui.starters=a;render()},
 craft:v=>{const P=S.P,c=CRAFT[v];if(!canCraft(v)){toast('วัตถุดิบหรือเงินไม่พอ');return}c.mats.forEach(([k,n])=>{P.parts[k]-=n;if(!P.parts[k])delete P.parts[k]});P.gold-=c.gold;ExtraAudio.play('forge');const id=craftId(v);P.owned.push(id);save();render();toast(`หลอม ${EQ[id].n} สำเร็จ!`)},
 forgetab:v=>{S.ui.forge=+v;render()},
 newgame:()=>{const name=(document.getElementById('nm').value||'').trim()||'ผู้ผนึก',cls=S.ui.cls||'swordsman',gender=S.ui.gender==='female'?'female':'male',sts=starterSel();
  S={ver:6,screen:'town',ui:{},zone:null,battle:null,P:{name:name.slice(0,20),cls,gender,lv:3,exp:0,gold:150,pts:{},free:10,eq:{weapon:`wp_${CLS[cls].w}0`},owned:[],items:{pot:5,seal1:5,eth:2,antidote:1,calm:1},parts:{},pets:[],party:[],legend:{},zoneMax:1,arena:{},seen:{},caught:{},uid:1}};
  const s=pStats();S.P.hp=s.hp;S.P.mp=s.mp;sts.forEach(st=>{const p=mkPet(st,3);S.P.pets.push(p);S.P.party.push(p.uid);S.P.seen[st]=1;S.P.caught[st]=1});save();render();toast(`${sts.map(k=>SP[k].n).join(' และ ')} เข้ามาอยู่ในผนึกของคุณ`)},
 shoptab:v=>{if(v==='wpall'){S.ui.allw=!S.ui.allw;v='wp'}S.ui.shop=v;render()},tier:v=>{S.ui.tier=+v;render()},teamtab:v=>{S.ui.team=v;S.ui.petView=null;render()},herotab:v=>{S.ui.hero=v;render()},
 buy:v=>{const P=S.P,it=EQ[v]||CON[v];if(!it||it.rareLoot||it.worldLegend)return;const pr=priceOf(it);if(P.gold<pr){toast('เหรียญไม่พอ');return}if(it.lv&&P.lv<it.lv&&!EQ[v]){toast(`ต้องเลเวล ${it.lv}`);return}
  P.gold-=pr;ExtraAudio.play('buy');if(EQ[v])P.owned.push(v);else P.items[v]=(P.items[v]||0)+1;save();render();toast(`ซื้อ ${it.n} แล้ว`)},
 sellpart:v=>{const [key,all]=v.split('~'),P=S.P,[sp,i]=key.split('|'),pr=partPrice(SP[sp].parts[+i][1]),n=all?P.parts[key]:1;if(!(P.parts[key]>0))return;
  P.parts[key]-=n;P.gold+=pr*n;if(!P.parts[key])delete P.parts[key];save();render();toast(`ขายได้ ${fmt(pr*n)} เหรียญ`)},
 sellgear:v=>{const P=S.P,i=P.owned.indexOf(v);if(i<0)return;P.owned.splice(i,1);const g=Math.floor(EQ[v].price/2);P.gold+=g;save();render();toast(`ขายได้ ${fmt(g)} เหรียญ`)},
 equip:v=>{const P=S.P,it=EQ[v],i=P.owned.indexOf(v);if(i<0||!it)return;if(P.eq[it.slot]===v){toast('สวมรุ่นนี้อยู่แล้ว ชิ้นในกระเป๋าเป็นชิ้นสำรอง');return;}if(P.lv<it.lv){toast(`ต้องเลเวล ${it.lv}`);return}
  
  P.owned.splice(i,1);if(P.eq[it.slot])P.owned.push(P.eq[it.slot]);P.eq[it.slot]=v;ExtraAudio.play('equip');const s=pStats();P.hp=Math.min(P.hp,s.hp);P.mp=Math.min(P.mp,s.mp);save();render()},
 unequip:v=>{const P=S.P;if(v==='weapon'){toast('ต้องมีอาวุธติดตัวเสมอ');return}if(P.eq[v]){P.owned.push(P.eq[v]);delete P.eq[v]}const s=pStats();P.hp=Math.min(P.hp,s.hp);P.mp=Math.min(P.mp,s.mp);save();render()},
 pt:v=>{const P=S.P;if(P.free<=0)return;P.pts[v]=(P.pts[v]||0)+1;P.free--;if(v==='hp')P.hp+=PER.hp;if(v==='mp')P.mp+=PER.mp;save();render()},
 ppt:v=>{const [uid,k]=v.split(':'),p=petBy(+uid);if(!p||p.free<=0)return;p.pts[k]=(p.pts[k]||0)+1;p.free--;if(k==='hp')p.hp+=PER.hp;if(k==='mp')p.mp+=PER.mp;save();render()},
 promote:v=>{const c=CLS[v];S.ui.confirm={msg:`เลื่อนอาชีพเป็น "${c.n}"? ${c.d} — เลือกแล้วเปลี่ยนกลับไม่ได้`,act:'dopromote',v};render()},
 dopromote:v=>{const P=S.P;if(CLS[v].p!==P.cls||!canPromote(P))return;P.cls=v;S.ui.confirm=null;fixParty();const s=pStats();P.hp=s.hp;P.mp=s.mp;save();render();toast(`เลื่อนอาชีพเป็น ${CLS[v].n} แล้ว!`)},
 heal:()=>{if(allFull()){toast('ทุกคนพลังเต็มอยู่แล้ว ไม่ต้องรักษา');return}const P=S.P,c=healCost();P.gold-=c;fullHeal();save();render();toast(P.gold<0?`รักษาเรียบร้อย ติดหนี้วิหาร ${fmt(-P.gold)} เหรียญ`:`รักษาเรียบร้อย จ่าย ${fmt(c)} เหรียญ`)},
 arena:v=>{if(S.zone)return;const n=NPC[+v];if(S.P.hp<=0){toast('ต้องรักษาตัวก่อน');return}
  const es=[humanUnit(n.n,n.cls,n.lv,0)];n.pets.forEach(([sp,lv],i)=>{const u=wildUnit(sp,lv,i+1);u.name=`${u.name}ของ${n.n.split(' ')[0]}`;u.kind='npcpet';es.push(u)});startBattle(es,'npc',+v);save();render()},
 zone:v=>{if(S.P.hp<=0){toast('ต้องรักษาตัวก่อน');return}S.ui.confirm={msg:`เข้า${ZN[+v-1].n}? เข้าไปแล้วจะกลับเมืองไม่ได้ จนกว่าจะชนะบอส เจอทางออก หรือพ่ายแพ้ เตรียมยาและผนึกให้พร้อม`,act:'dozone',v};render()},
 dozone:v=>{S.ui.confirm=null;S.zone={id:+v,depth:0,log:[`เข้าสู่${ZN[+v-1].n}`],fork:null,ev:null,boss:forestBossFor(ZN[+v-1])};newFork();go('zone')},
 fork:v=>{const door=S.zone?.fork?.[+v];if(!door)return;const type=door.k;chooseFork(+v);playWalk(type,+v)},
 cont:()=>{newFork();save();render();document.querySelector('main')?.scrollTo(0,0)},
 openchest:()=>{const ev=S.zone.ev;if(!ev||ev.opened)return;const out=openChest(ev.chest);ev.opened=true;ev.got=out;zlog(`เปิด${CHESTS[ev.chest].n} ได้ ${out.join(', ')}`.slice(0,120));save();render()},
 exitzone:()=>{S.zone=null;S.screen=forestReturnScreen();save();render();toast(S.screen==='hospital'?'ออกจากป่ากลับเมือง · HP ต่ำกว่า 80% พามาที่โรงพยาบาล':'ออกจากป่ากลับสู่นครพันผนึกได้อย่างปลอดภัย')},
 boss:()=>{const base=ZN[S.zone.id-1],z={...base,boss:forestPassed(base)?(S.zone.boss||base.boss):base.boss};zlog(`เผชิญหน้ากับ${z.boss.n}!`);const es=[wildUnit(z.boss.sp,z.boss.lv,0,z.boss.n)];
  if(z.id===5&&z.boss.sp==='nidhogg')es.push(wildUnit(z.boss.sp,z.boss.lv,es.length,z.boss.n));
  if(z.final){const d=es[0];['hp','patk','matk','pdef','mdef'].forEach(k=>d.st[k]=Math.round(d.st[k]*(k==='hp'?1.4:1.08)));if(z.boss.sp==='demonlord')for(const k of ['patk','matk'])d.st[k]=Math.round(d.st[k]*.85);d.hp=d.st.hp;d.skills.push(SP[z.boss.sp].sig);
   Object.keys(CLS).filter(k=>tierOf(k)===2).sort(()=>Math.random()-.5).slice(0,2).forEach((c,i)=>{const h=humanUnit('แม่ทัพปีศาจ'+CLS[c].n,c,50,i+1);es.push(h)})}
  for(let i=0;i<z.mini;i++){const u=wildUnit(pick(z.sp),z.lv[1]-1,es.length);u.name='สมุน'+u.name;es.push(u)}startBattle(es,'boss',z.id);save();render()},
 vbuy:v=>{const P=S.P,it=CON[v];if(!it||it.rareLoot)return;const pr=Math.round(priceOf(it)*1.25);if(P.gold<pr){toast('เหรียญไม่พอ');return}if(it.lv&&P.lv<it.lv){toast(`ต้องเลเวล ${it.lv}`);return}P.gold-=pr;ExtraAudio.play('buy');P.items[v]=(P.items[v]||0)+1;save();render();toast(`ซื้อ ${it.n} แล้ว`)},
 vsell:v=>toast('หมู่บ้านกลางป่าไม่มีบริการรับซื้อของ'),
 zheal:()=>{if(allFull()){toast('ทุกคนพลังเต็มอยู่แล้ว ไม่ต้องรักษา');return}const P=S.P,c=Math.round(healCost()*1.5);P.gold-=c;fullHeal();S.zone.ev.healed=true;save();render();toast(`รักษาเรียบร้อย จ่าย ${fmt(c)} เหรียญ`)},
 bt:v=>battleAction(v),
 partytoggle:v=>{const P=S.P,u=+v,n=clsSum(P.cls);if(P.party.includes(u)){if(P.party.length<=1){toast('ต้องมีอสูรในทีมอย่างน้อย 1 ตัว');return}P.party=P.party.filter(x=>x!==u)}
  else{if(P.party.length>=n){P.party.shift()}P.party.push(u)}save();render()},
 petview:v=>{S.ui.petView=v===''?null:+v;render();document.querySelector('main')?.scrollTo(0,0)},
 release:v=>{S.ui.confirm={msg:`ปล่อย ${petName(petBy(+v))} คืนสู่ป่า? การกระทำนี้ย้อนกลับไม่ได้`,act:'dorelease',v};render()},
 dorelease:v=>{const P=S.P;if(P.pets.length<=1){toast('ต้องมีอสูรอย่างน้อย 1 ตัว');S.ui.confirm=null;render();return}P.pets=P.pets.filter(p=>p.uid!==+v);fixParty();S.ui.confirm=null;S.ui.petView=null;save();render()},
 cancel:()=>{S.ui.confirm=null;render()},
 cloudsave:()=>cloudSave(),
 lbtab:v=>{S.ui.lb=v;render()},lbload:()=>lbLoad(),
 lbtoggle:async()=>{const P=S.P;P.lbOff=!P.lbOff;save();if(P.lbOff){const me=pid().slice(-6);LB.rows=(LB.rows||[]).filter(r=>r.pid!==me);LB.lastKey='';toast('ซ่อนชื่อของคุณจากกระดานแล้ว');render();if(SHEET_URL){try{if(LB.pending)await LB.pending;const r=await lbPost({action:'delete',id:pid()});if(!r.ok)throw new Error('delete failed')}catch(e){toast('ซ่อนในเครื่องแล้ว แต่ลบบน ระบบออนไลน์ ไม่สำเร็จ โปรดแสดงชื่อแล้วลองซ่อนอีกครั้ง')}}}else{toast('แสดงชื่อของคุณในกระดานแล้ว');lbLoad()}},
 gssave:()=>gsSave(true),
 gssetpin:()=>{const v=(document.getElementById('gsnewpin')?.value||'').trim();if(!/^[0-9A-Za-z]{4,12}$/.test(v)){toast('PIN ต้องเป็นตัวเลขหรือตัวอักษร 4–12 ตัว');return}gsSave(true,v)},
 gsload:()=>gsLoad(document.getElementById('gscode')?.value,document.getElementById('gspin')?.value),
 copycode:()=>{const c=fmtCode(ensureCode());try{navigator.clipboard.writeText(c).then(()=>toast('คัดลอกรหัสผู้เล่นแล้ว'),()=>toast('รหัสผู้เล่น: '+c))}catch(e){toast('รหัสผู้เล่น: '+c)}},
 copysave:()=>{const c=saveCode();const ok=()=>toast('คัดลอกรหัสเซฟแล้ว นำไปวางในเครื่องอื่นได้');try{navigator.clipboard.writeText(c).then(ok,()=>{S.ui.showCode=1;render();toast('คัดลอกอัตโนมัติไม่ได้ กดค้างที่กล่องรหัสเพื่อคัดลอก')})}catch(e){S.ui.showCode=1;render()}},
 dlsave:()=>{try{const b=new Blob([saveCode()],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`sealbeast-${S.P.name}-Lv${S.P.lv}.txt`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){S.ui.showCode=1;render();toast('ดาวน์โหลดไม่ได้ ใช้การคัดลอกรหัสเซฟแทน')}},
 loadcode:()=>askLoadCode(document.getElementById('savein')?.value),
 pickfile:()=>{const el=document.getElementById('saveFile');el.value='';el.click()},
 doloadcode:()=>{if(!PENDING)return;S=PENDING;PENDING=null;GS.lastJson='';GS.lastAt=0;LB.lastKey='';LB.lastAt=0;S.ui={};S.battle=null;S.screen=S.zone?'zone':'town';migrate();save();render();toast('โหลดเซฟแล้ว')},
 cloudload:()=>{if(!S.P){cloudLoad();return}S.ui.confirm={msg:'โหลดเซฟจากคลาวด์? ความคืบหน้าในเครื่องนี้ที่ยังไม่ได้บันทึกขึ้นคลาวด์จะถูกแทนที่',act:'docloudload'};render()},
 docloudload:()=>{S.ui.confirm=null;cloudLoad()},
 use:v=>{const [id,who]=v.split(':'),P=S.P,it=CON[id];if(!(P.items[id]>0))return;
  if(who==='P'){const s=pStats();if(it.hp)P.hp=Math.min(s.hp,P.hp+taleRecoveryAmount(it,'hp'));if(it.mp)P.mp=Math.min(s.mp,P.mp+taleRecoveryAmount(it,'mp'))}
  else{const p=petBy(+who);if(!p)return;if(!S.P.carried?.includes(p.uid)){toast('อสูรตัวนี้พักที่ค่าย นำติดตัวก่อนใช้ยา');return}const s=calcPet(p);if(it.rev){if(p.hp>0){toast('อสูรตัวนี้ยังไม่หมดสติ');return}Sound.fx('revive');p.hp=Math.round(s.hp*it.rev)}else{if(p.hp<=0){toast('ต้องใช้ธูปเรียกวิญญาณก่อน');return}if(it.hp)p.hp=Math.min(s.hp,p.hp+taleRecoveryAmount(it,'hp'));if(it.mp)p.mp=Math.min(s.mp,p.mp+taleRecoveryAmount(it,'mp'))}}
  P.items[id]--;ExtraAudio.play(it.cure?'heal':'drink');save();render();toast(`ใช้ ${it.n} แล้ว`)},
 img:()=>{},
 delimg:v=>{delete IMG[v];saveImg();render()},
 reset:()=>{S.ui.confirm={msg:'เริ่มเกมใหม่? ข้อมูลตัวละครและอสูรทั้งหมดจะหายไป (รูปที่ใส่ไว้ยังอยู่)',act:'doreset'};render()},
 doreset:()=>{S={screen:'start',ui:{}};save();render()},
};
// @soulbeast-end 0352-handlers
// @soulbeast-unit 0359-TOWN_ART

const TOWN_ART=SoulbeastContent.TOWN_ART();
// @soulbeast-end 0359-TOWN_ART
// @soulbeast-unit 0360-CAREER_GUIDE

const CAREER_GUIDE=SoulbeastContent.CAREER_GUIDE();
// @soulbeast-end 0360-CAREER_GUIDE
// @soulbeast-unit 0361-careerGuide

function careerGuide(cls){return CAREER_GUIDE[cls]||CAREER_GUIDE[baseOf(cls)]||{pro:'เลือกอุปกรณ์และทีมให้เหมาะกับสายอาชีพ',con:'ควรตรวจทักษะและค่าสถานะก่อนเลื่อนขั้น'};}
// @soulbeast-end 0361-careerGuide
// @soulbeast-unit 0364-townTile

function townTile(action,value,art,title,description,tag='',opt={}){return `<button type="button" class="town-tile ${opt.hero?'town-forest':''} ${opt.feature?'town-feature':''} ${opt.className||''}" data-a="${action}" data-v="${value}" ${opt.disabled?'disabled':''}><img src="${art}" alt="" decoding="async" ${opt.hero?'fetchpriority="high"':'loading="lazy"'}>${tag?`<span class="town-tag">${tag}</span>`:''}<span class="town-tile-copy"><strong>${title}</strong><small>${description}</small><span class="town-tile-cta">${opt.cta||'เข้าร่วมกิจกรรม'} <span aria-hidden="true">→</span></span></span></button>`;}
// @soulbeast-end 0364-townTile
// @soulbeast-unit 0365-townNavArt

function townNavArt(key){const p=party()[0],src=key==='town'?BUILTIN_SCENES[1]:key==='wild'?latestForestArt():key==='hero'?(IMG.player||classPortraitSource(S.P.cls,S.P.gender)):key==='team'?(BUILTIN_ART[p?.sp]||BUILTIN_ART.kappa):(ITEM_ART.chest||ITEM_ART.pot);return `<img class="town-nav-art" src="${src}" alt="" decoding="async">`;}
// @soulbeast-end 0365-townNavArt
// @soulbeast-unit 0367-vTown

function vTown(){const P=S.P,s=pStats();return `<div class="stack town-home"><div class="town-welcome"><span class="town-eyebrow">นครพันผนึก · จุดเริ่มต้นการผจญภัย</span><h2>วันนี้จะออกผจญภัยที่ไหน?</h2><p>เริ่มที่ป่าเพื่อเก็บเลเวล ค้นพบอสูร และหาอุปกรณ์ใหม่</p></div>
 ${townTile('go','wild',latestForestArt(),'เข้าป่า · เริ่มผจญภัย','เลือกพื้นที่ แล้วออกสำรวจทางแยก ต่อสู้ และผนึกอสูรคู่ใจ','เริ่มเล่นที่นี่',{hero:true,cta:'เลือกป่าที่จะออกสำรวจ'})}
 <div class="town-first-steps" aria-label="วิธีเริ่มเล่น"><span><b>1</b> เตรียมยาและผนึก</span><span><b>2</b> เลือกป่าและทางเดิน</span><span><b>3</b> ต่อสู้ · ผนึก · เก็บเลเวล</span><small>ออกจากป่าเมื่อชนะบอส พบทางออก หรือพ่ายแพ้</small></div>
 ${allStatsButton()}<details class="card town-ready"><summary>ตรวจความพร้อมของทีม <span>HP ${P.hp}/${s.hp}${P.free>0?' · มีแต้มตัวละครรออัป':''}${P.pets.some(p=>p.free>0)?' · อสูรมีแต้มรออัป':''}</span></summary><div class="stack">${miniStatus()}${advicePanel()}${canPromote(P)?'<button class="btn pri" data-a="go" data-v="hero">เลื่อนอาชีพได้แล้ว · ดูสายอาชีพ</button>':''}${P.free>0?'<button class="btn" data-a="go" data-v="hero">อัปสถานะตัวละคร</button>':''}</div></details>
 <div class="town-section-title"><h3>กิจกรรมท้าทาย</h3><span>รวมทีม · วางแผน · ลุ้นรางวัล</span></div><div class="town-event-grid">
 ${townTile('go','world',"assets/media/1620b9ca7d9052245fe7d7a1.webp",'บอสโลก · อาซารอธ','รวมทีม 1–4 คน วัดดาเมจและลุ้นอุปกรณ์ตำนาน','สัปดาห์ละ 3 ครั้ง · ทุกเลเวลลองได้ · แนะนำความพร้อม Lv 25+',{feature:true,className:'town-world',cta:'สร้างหรือเข้าร่วมปาร์ตี้'})}
 ${townTile('camp','',TOWN_ART.camp,'จู่โจมค่าย','เลือกค่ายคู่ต่อสู้ จัดอสูรคู่ใจ แล้วบุกชิงรางวัล',P.lv<10?'ปลดล็อก Lv 10':'วันละ 3 ครั้ง',{feature:true,className:'town-camp',disabled:P.lv<10,cta:P.lv<10?'เก็บเลเวลถึง 10 เพื่อเข้าร่วม':'เลือกค่ายที่ต้องการจู่โจม'})}
 </div><div class="town-section-title"><h3>เตรียมตัวและทดสอบฝีมือ</h3><span>ทุกการเดินทางเริ่มจากความพร้อม</span></div><div class="town-place-grid">
 ${townTile('go','shop',TOWN_ART.shop,'ตลาดช่างตีเหล็ก','ซื้ออาวุธ เกราะ ยา และผนึก · ขายชิ้นส่วน','ซื้อขายอุปกรณ์',{cta:'เข้าไปเลือกซื้อ'})}
 ${townTile('go','hospital',TOWN_ART.hospital,'โรงพยาบาลวิหารขาว','ฟื้น HP / MP และช่วยอสูรที่หมดสติ','พักฟื้นก่อนออกป่า',{cta:'เข้ารับการรักษา'})}
 ${townTile('go','arena',TOWN_ART.arena,'หอคอยประลองยุทธ','ท้าดวลผู้ผนึกทุกสายอาชีพและรับเงินรางวัล','ฝึกฝีมือกับคู่ประลอง',{cta:'เลือกคู่ประลอง'})}
 ${townTile('go','forge',TOWN_ART.shop,'โรงหลอมเทพอสูร','เปลี่ยนชิ้นส่วนอสูรเป็นอาวุธและอุปกรณ์พิเศษ','หลอมอุปกรณ์',{className:'town-forge',cta:'ดูสูตรและวัตถุดิบ'})}
 ${townTile('go','pvp','assets/media/d22b62fc32b6345a4255bd69.webp','PVP · ผู้ผนึกดวลกัน','สร้างห้องหรือเข้าด้วยรหัส ท้าดวลผู้เล่นจริง','ดวลกับเพื่อน',{className:'town-pvp',cta:'สร้างหรือเข้าห้อง'})}
 ${townTile('go','leader',BUILTIN_SCENES[1],'หอเกียรติยศ','ติดตามคะแนนสะสมและอันดับเหล่าผู้ผนึก','กระดานคะแนน',{cta:'ดูอันดับผู้ผนึก'})}
 ${townTile('story','',BUILTIN_SCENES[0],'บันทึกแห่งพันผนึก','อ่านเรื่องราวและบทที่ปลดล็อกจากการผจญภัย','เรื่องราวของโลก',{className:'town-story',cta:'เปิดบันทึก'})}
 </div>${currentStory()}</div>`;}
// @soulbeast-end 0367-vTown
// @soulbeast-unit 0370-vHospital

function vHospital(){return activityBackdrop('hospital','วิหารขาว · พักฟื้นพลังของคุณและอสูร')+vHospitalBase();}
// @soulbeast-end 0370-vHospital
// @soulbeast-unit 0371-vArena

function vArena(){return activityBackdrop('arena','หอคอยประลองยุทธ · เวทีพิสูจน์ฝีมือ')+vArenaBase();}
// @soulbeast-end 0371-vArena
// @soulbeast-unit 0375-vStart


function vStart(){const cl=S.ui.cls||'swordsman',gender=S.ui.gender==='female'?'female':'male',sel=starterSel(),c=CLS[cl];return `<div class="stack">
 ${sceneArt(0,'ตำนานผนึกอสูร')}<p class="sub" style="margin:0">ห้าดินแดน หนึ่งปราสาท และคำสาบานที่ผูกคุณกับอสูรคู่หู</p>${storyCard(0)}<button class="btn seal" data-a="story">อ่านบันทึกแห่งพันผนึก</button>
 <div class="card stack"><h3>ชื่อผู้ผนึก</h3><input type="text" id="nm" maxlength="20" placeholder="เช่น ภูผา" value=""><div class="creation-identity">${portrait('cls:'+cl,88,{gender})}<div class="grow"><h3>เลือกเพศ</h3><div class="creation-genders" role="group" aria-label="เลือกเพศตัวละคร">${[['male','ชาย'],['female','หญิง']].map(([id,label])=>`<button type="button" class="btn ${gender===id?'pri':''}" data-a="genderpick" data-v="${id}" aria-pressed="${gender===id}">${label}</button>`).join('')}</div><small class="sub">เพศมีผลเฉพาะภาพตัวละคร</small></div></div></div>
 <div class="card stack"><h3>เลือกอาชีพที่เหมาะกับคุณ</h3><p class="sub">อ่านข้อดีและข้อควรระวัง แล้วแตะอาชีพที่ต้องการ · ทุกสายมีแนวทางเล่นต่างกัน</p><div class="grid3 class-selection-grid">${BASES.map(k=>`<button class="pick ${cl===k?'on':''}" data-a="clspick" data-v="${k}">${portrait('cls:'+k,58,{gender})}<b>${CLS[k].n}</b><small>${WT[CLS[k].w].n}</small><span>${careerLines(k)}</span></button>`).join('')}</div>
  <div class="card" style="background:var(--panel2)"><b>${c.n}</b> <span class="sub">· ${c.d}</span><div class="lines" style="margin:6px 0 0;font-size:13px">${careerPanel(cl)}
  <div class="sub">เลื่อนขั้น Lv 25: ${childrenOf(cl).map(x=>CLS[x].n).join(' / ')} · Lv 40: ${childrenOf(cl).flatMap(childrenOf).map(x=>CLS[x].n).join(' / ')}</div></div></div></div>
 <div class="card stack"><h3>${clsSum(cl)>1?'อสูรคู่หูเริ่มต้น เลือกได้ 2 ตัว':'อสูรคู่หูตัวแรก'}</h3><div class="grid3">${STARTERS.map(k=>`<button class="pick ${sel.includes(k)?'on':''}" data-a="starterpick" data-v="${k}">${portrait(k,48)}<b>${SP[k].n}</b><small>${SP[k].o}</small><span class="row wrap" style="gap:3px;justify-content:center">${tChips(SP[k].t)}</span></button>`).join('')}</div></div>
 <button class="btn pri full" data-a="newgame">เริ่มการเดินทาง</button>${soundPanel()}${CLOUD.info?vCloud():''}${vระบบออนไลน์Save(true)}${vBackup(true)}</div>`}
// @soulbeast-end 0375-vStart
// @soulbeast-unit 0378-vHospitalBase

function vHospitalBase(){const P=S.P,s=pStats();return `<div class="stack"><div class="row"><h2 class="grow">โรงพยาบาลวิหารขาว</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>
 <p class="sub">หมอประจำวิหารรักษาทั้งผู้ผนึกและอสูรทุกตัวในผนึก รวมถึงตัวที่หมดสติ</p>
 ${allFull()?'<button class="btn full" disabled>ทุกคนพลังเต็มอยู่แล้ว</button>':`<button class="btn pri full" data-a="heal">รักษาทั้งหมด · <span class="num">${fmt(healCost())}</span> เหรียญ</button>`}${P.gold<healCost()?`<p class="sub" style="margin:0">เงินไม่พอ วิหารให้ติดหนี้ได้ เงินจะติดลบจนกว่าจะหามาใช้คืน (ระหว่างติดหนี้ซื้อของไม่ได้)</p>`:''}
 <div class="lst"><div class="item">${portrait('player',40)}<div class="grow"><b><span data-user-content>${esc(P.name)}</span></b>${bar(P.hp,s.hp)}<small class="num">HP ${P.hp}/${s.hp} · MP ${P.mp}/${s.mp}</small></div></div>
 ${P.pets.map(p=>{const q=calcPet(p);return `<div class="item">${portrait(p.sp,40)}<div class="grow"><b>${petName(p)} <span class="sub num">Lv ${p.lv}</span></b>${bar(Math.max(0,p.hp),q.hp)}<small class="num">${p.hp<=0?'หมดสติ':`HP ${p.hp}/${q.hp}`}</small></div></div>`}).join('')}</div>
 </div>`}
// @soulbeast-end 0378-vHospitalBase
// @soulbeast-unit 0379-vArenaBase

function vArenaBase(){const P=S.P;return `<div class="stack"><div class="row"><h2 class="grow">หอคอยประลองยุทธ</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>
 <p class="sub">ผู้ผนึก ${NPC.length} คน ครบทุกอาชีพ ตั้งแต่ Lv 3–60 พร้อมอสูร ชนะครั้งแรกได้รางวัลเต็ม ครั้งต่อไปได้ 30%</p>${miniStatus()}
 <div class="lst">${NPC.map((n,i)=>({n,i})).sort((a,b)=>a.n.lv-b.n.lv).map(({n,i})=>{const w=P.arena[i];return `<div class="item">${portrait('npc:'+n.cls,44)}<div class="grow"><b>${n.n}</b><small>Lv ${n.lv} · ${CLS[n.cls].n} · อสูร ${n.pets.map(([s,l])=>`${formName(s,formFor(s,l))} Lv ${l}`).join(', ')}<br>รางวัล <span class="num">${fmt(w?n.gold*.3:n.gold)}</span> เหรียญ${w?` · ชนะแล้ว ${w} ครั้ง`:''}</small></div><button class="btn sm ${P.lv+3>=n.lv?'pri':''}" data-a="arena" data-v="${i}">ท้าประลอง</button></div>`}).join('')}</div></div>`}
// @soulbeast-end 0379-vArenaBase
// @soulbeast-unit 0385-vLegendBase

function vLegendBase(){const P=S.P,L=P.legend||{},n=Object.keys(L).length;return `<div class="card stack"><div class="row"><h3 class="grow">ของในตำนาน</h3><span class="num sub">${n}/${ZN.filter(z=>!z.train&&!z.stageSeven).length*SLOTS.length+WORLD_LEGENDS.length}</span></div>
 <p class="sub" style="margin:0">หกด่านหลักมีของในตำนานครบทุกช่องสวมใส่ (ด่าน 7 ใช้ชุดของปราสาทจอมมาร) ช่องละ 1 ชิ้น หาได้จากหีบโบราณแห่งตำนาน หีบทองคำ หีบโลหิต และนักเดินทางปริศนาเท่านั้น</p>
 ${ZN.filter(z=>!z.train&&!z.stageSeven).map(z=>`<div><b style="font-size:13px">${z.n}</b> <span class="sub">${SLOTS.filter(([sl])=>L[z.id+'_'+sl]).length}/${SLOTS.length}</span><div class="sub" style="font-size:12px;line-height:1.7">${SLOTS.map(([sl,nm])=>{const it=EQ[sl==='weapon'?`lg${z.id}_weapon_${clsWeapon(P.cls)}`:`lg${z.id}_${sl}`];return L[z.id+'_'+sl]?`<span class="lgn">${it.n}</span> <span>(${PAS[it.pas].n}${it.sk?' · '+SK[it.sk].n:''}${it.ws?' · '+SK[it.ws].n:''})</span>`:`<span>${nm}: ???</span>`}).join('<br>')}</div></div>`).join('')}</div>`}
// @soulbeast-end 0385-vLegendBase
// @soulbeast-unit 0389-vHero

function vHero(){const P=S.P,s=pStats(),tab=S.ui.hero||'stat',w=EQ[P.eq.weapon],ch=chain(P.cls);
 const tabs=`<div class="tabs">${[['stat','สถานะ'],['skill','สกิล'],['gear','อุปกรณ์']].map(([k,n])=>`<button class="${tab===k?'on':''}" data-a="herotab" data-v="${k}">${n}</button>`).join('')}</div>`;
 const head=`<div class="card row unit-frame" ${UnitFrames.attributes({kind:'player',cls:P.cls})}>${UnitFrames.decoration()}${portrait('player',68)}<div class="grow"><h2><span data-user-content>${esc(P.name)}</span></h2><div class="sub">${ch.map(c=>CLS[c].n).join(' → ')} · โบนัสแต้ม ${focusFor(P.cls).map(k=>LBL[k]).join(" / ")} +${Math.round(focusBonus(P.cls,focusFor(P.cls)[0])*100)}% · <span class="num">Lv ${P.lv}</span></div>${bar(P.lv>=MAXLV?1:P.exp,P.lv>=MAXLV?1:need(P.lv),'xp')}<div class="sub num">${P.lv>=MAXLV?'เลเวลสูงสุด':`EXP ${fmt(P.exp)}/${fmt(need(P.lv))}`}${P.cleared?' · 🏆 ผู้ปราบจอมมาร':''} · อสูรออกสู้ได้ ${clsSum(P.cls)} ตัว</div>
  <div class="row wrap" style="gap:6px;margin-top:6px">${IMG.player?'':''}</div></div></div>`;
 const promo=canPromote(P)?`<div class="card stack" data-panel-art="promotion" style="border-color:var(--gold)"><h3>เลื่อนอาชีพได้แล้ว!</h3>${childrenOf(P.cls).map(c=>`<div class="item">${portrait('cls:'+c,40)}<div class="grow"><b>${CLS[c].n}</b><small>${CLS[c].d}<br>${careerLines(c)}<br>สกิล: ${CLS[c].sk.map(([l,k])=>`${SK[k].n} (Lv ${l})`).join(', ')}${CLS[c].pas.length?' · ความสามารถ: '+CLS[c].pas.map(k=>PAS[k].n).join(', '):''}${CLS[c].sum?` · อสูรออกสู้ ${CLS[c].sum} ตัว`:''}</small></div><button class="btn sm pri" data-a="promote" data-v="${c}">เลือก</button></div>`).join('')}</div>`:'';
 let body='';
 if(tab==='stat')body=`<div class="card stack" data-panel-art="stats"><div class="row"><h3 class="grow">ค่าสถานะ</h3>${P.free>0?`<span class="badge">แต้มเหลือ ${P.free}</span>`:''}</div>
  <div class="row"><span class="grow sub">HP / MP ปัจจุบัน</span><span class="num">${P.hp}/${s.hp} · ${P.mp}/${s.mp}</span></div>
  ${autoStatPanel()}${statGrid(s,P.free,'pt')}<p class="sub" style="margin:0">เลเวลอัปได้ 5 แต้ม ค่าสถานะรวมอาชีพและอุปกรณ์แล้ว · ความแม่นยำหักลบการหลบหลีกของเป้าหมาย = โอกาสโจมตีโดน</p></div>
  <div class="card stack"><h3>ความสามารถติดตัว</h3><div class="row wrap" style="gap:6px">${humanPas(P.cls,P.eq).map(k=>pasChip(k)).join('')||'<span class="sub">ไม่มี</span>'}</div>${[...new Set(humanPas(P.cls,P.eq))].map(k=>`<div class="sub" style="font-size:12px"><b>${PAS[k].n}</b> — ${PAS[k].d}</div>`).join('')}</div>`;
 if(tab==='skill'){const learn=ch.flatMap(c=>CLS[c].sk.map(([l,k])=>[l,k,c]));
  body=`<div class="card stack" data-panel-art="skills"><h3>สกิลอาชีพ (เรียนตามเลเวล)</h3>${learn.map(([l,k,c])=>skillRow(k,P.lv>=l,`${CLS[c].n} Lv ${l}`)).join('')}</div>
  <div class="card stack" data-panel-art="skills"><h3>สกิลจากอุปกรณ์</h3>${Object.values(P.eq).map(id=>EQ[id]).filter(it=>it&&(it.ws||it.sk)).map(it=>[it.ws,it.sk].filter(Boolean).map(k=>skillRow(k,true,it.n)).join('')).join('')||'<p class="sub" style="margin:0">อาวุธระดับ 1 ขึ้นไปและเครื่องประดับพิเศษบางชิ้นมีสกิลติดมา</p>'}</div>
  ${baseOf(P.cls)==='druid'?`<div class="card stack"><h3>ร่างแปลง</h3>${Object.entries(FORMS).map(([k,f])=>`<div><b>${f.em} ${f.n}</b> ${tChips(f.t)}<div class="sub" style="font-size:12px">${Object.entries(f.m).map(([x,v])=>`${SH[x]} ×${v}`).join(' ')} · สกิล ${f.sk.map(x=>SK[x].n).join(', ')}</div></div>`).join('')}</div>`:''}`}
 if(tab==='gear')body=`<div class="card stack" data-panel-art="equipment"><h3>อุปกรณ์ที่สวมใส่</h3><div class="lst">${SLOTS.map(([sl,n])=>{const it=EQ[P.eq[sl]];return `<div class="row">${it?itemIcon(P.eq[sl],38):''}<span class="sub" style="width:58px;flex:none">${n}</span><div class="grow">${it?`<b>${itemName(it)}</b> ${elChip(it.el)}<div class="sub" style="font-size:12px">${statLine(it.st)}${itemExtra(it)}</div>`:'<span class="sub">ว่าง</span>'}</div>${it&&sl!=='weapon'?`<button class="btn sm" data-a="unequip" data-v="${sl}">ถอด</button>`:''}</div>`}).join('')}</div></div>
 <div class="card stack" data-panel-art="inventory"><h3>อุปกรณ์ในกระเป๋า</h3>${P.owned.length?`<div class="lst">${P.owned.map(id=>{const it=EQ[id],same=P.eq[it.slot]===id,bad=same||it.lv>P.lv;return `<div class="row">${itemIcon(id)}<div class="grow"><b>${itemName(it)}</b> <span class="sub">${SLOTN[it.slot]}${it.wt?' · '+WT[it.wt].n:''}${it.slot==='weapon'&&it.wt!==clsWeapon(P.cls)?' · ข้ามอาชีพ: ค่าสถานะอาวุธ 80%':''}${same?' · ชิ้นสำรอง รุ่นเดียวกับที่สวม':''}</span><div class="sub" style="font-size:12px">${compareGear(it)}${elementItemExtra(it)}${it.lv>P.lv?` · ต้องการ Lv ${it.lv}`:''}</div></div><button class="btn sm pri" data-a="equip" data-v="${id}" ${bad?'disabled':''}>${same?'สวมรุ่นนี้อยู่':'สวม'}</button></div>`}).join('')}</div>`:'<p class="sub" style="margin:0">ซื้ออุปกรณ์ได้ที่ตลาด หรือเปิดหีบสมบัติในป่า</p>'}</div>`;
 if(tab==='gear')body+=vLegend();
 if(tab==='tree')body=vClassTree();
 return `<div class="stack">${head}<details class="card career-current"><summary>ข้อดีและข้อควรระวัง · ${CLS[P.cls].n}</summary>${careerPanel(P.cls)}</details>${tabs}${advicePanel()}${promo}${body}</div>`}
// @soulbeast-end 0389-vHero
// @soulbeast-unit 0390-vPet

function vPet(p){const s=calcPet(p),sp=SP[p.sp],inP=S.P.party.includes(p.uid);return `<div class="stack"><button class="btn sm" data-a="petview" data-v="" style="align-self:flex-start">← กลับรายการ</button>
 <div class="card row unit-frame" ${UnitFrames.attributes(p)}>${UnitFrames.decoration()}${portrait(p.sp,80,{form:p.form||0})}<div class="grow"><h2>${petName(p)}</h2><div class="sub">ตำนาน${sp.o} · <span class="num">Lv ${p.lv}</span>${inP?' <span class="badge">ในทีม</span>':''}${sp.solar?'<span class="chip solar-rarity-label" translate="no">'+ct('ตำนานสุริยคราส','Eclipse Legendary','日蚀传说')+'</span>':sp.rare?' <span class="chip" style="color:var(--gold)">หายาก</span>':''}</div><div class="row wrap" style="gap:4px;margin:4px 0">${tChips(sp.t)}${pasChip(sp.pas)}</div>${bar(p.exp,need(p.lv),'xp')}<div class="sub num">EXP ${fmt(p.exp)}/${fmt(need(p.lv))}</div></div></div>
 ${beastStoryButton(p.sp,p.form||0)}<div class="card stack" style="gap:4px"><h3>ความสามารถติดตัว</h3><div class="sub"><b>${PAS[sp.pas].n}</b> — ${PAS[sp.pas].d}</div></div>
 ${sp.ev?`<div class="card stack" style="gap:4px"><h3>สายพัฒนาร่าง</h3><div class="row wrap" style="gap:12px">${[[0,SP[p.sp].n],...sp.ev.map((e,i)=>[i+1,e[1]])].map(([form,name])=>`<div style="display:flex;flex-direction:column;align-items:center;gap:5px;max-width:100px">${portrait(p.sp,64,{form})}<small class="sub">${esc(name)}</small></div>`).join('')}</div><div class="sub">${[sp.n,...sp.ev.map(e=>e[1])].map((n,i)=>`<span style="${(p.form||0)===i?'color:var(--gold);font-weight:600':''}">${n}${i?` (Lv ${sp.ev[i-1][0]})`:''}</span>`).join(' → ')}</div><div class="sub" style="font-size:12px">พลังรวมจัดตามลำดับร่างและความหายาก โดยรักษาจุดเด่นแต่ละสาย ร่างสุดท้ายได้สกิลเฉพาะตัว</div></div>`:''}
 <div class="card stack"><div class="row"><h3 class="grow">ค่าสถานะ</h3>${p.free>0?`<span class="badge">แต้มเหลือ ${p.free}</span>`:''}</div>
  <div class="row"><span class="grow sub">HP ปัจจุบัน</span><span class="num">${p.hp<=0?'หมดสติ':p.hp+'/'+s.hp}</span></div>${autoStatPanel(p)}${statGrid(s,p.free,'ppt',p.uid)}<p class="sub" style="margin:0">อสูรไม่มีเครื่องสวมใส่ เติบโตด้วยเลเวล ร่างพัฒนา และแต้มสถานะ (เลเวลละ 3 แต้ม)</p></div>
 <div class="card stack"><h3>สกิล</h3>${sp.sk.map((id,i)=>skillRow(id,p.lv>=(sp.skillLevels||SKLV)[i],p.lv>=(sp.skillLevels||SKLV)[i]?'':'Lv '+SKLV[i])).join('')}${sp.sig?skillRow(sp.sig,sigLearned(p),sigLearned(p)?'เฉพาะตัว':sp.rare?'Lv '+(sp.signatureLevel||SIGLV):'ร่างสุดท้าย'):''}</div>
 <div class="row wrap" style="gap:8px"><button class="btn" data-a="${S.P.carried.includes(p.uid)?'petStore':'petCarry'}" data-v="${p.uid}" ${packLocked()?'disabled':''}>${S.P.carried.includes(p.uid)?'พักที่ค่าย':'นำติดตัว'}</button><button class="btn ${inP?'':'pri'}" data-a="partytoggle" data-v="${p.uid}">${inP?'เอาออกจากทีม':'เพิ่มเข้าทีม'}</button><button class="btn danger" data-a="release" data-v="${p.uid}">ปล่อยคืนป่า</button></div></div>`}
// @soulbeast-end 0390-vPet
// @soulbeast-unit 0391-vChart

function vChart(){const ks=Object.keys(EL);return `<p class="sub" style="margin:0">ผลของธาตุท่าโจมตีต่อธาตุของเป้าหมาย อสูร 2 ธาตุคูณผลเข้าด้วยกัน ท่าที่ธาตุตรงกับผู้ใช้แรงขึ้น 25% (ผู้ผนึกได้โบนัสจากธาตุอาวุธ)</p>
 <div class="tchart">${ks.map(a=>{const row=TC[a]||{},g=ks.filter(d=>row[d]===2),h=ks.filter(d=>row[d]===.5),z=ks.filter(d=>row[d]===.25);
  return `<div class="item">${elChip(a)}<div class="grow" style="font-size:13px;display:flex;flex-direction:column;gap:3px">
  ${g.length?`<div><span class="eff up">×2</span> ${g.map(elChip).join(' ')}</div>`:''}${h.length?`<div><span class="eff down">×½</span> ${h.map(elChip).join(' ')}</div>`:''}${z.length?`<div><span class="eff down">×¼</span> ${z.map(elChip).join(' ')}</div>`:''}</div></div>`}).join('')}</div>
 <h3>สถานะผิดปกติ</h3><div class="lst">${Object.entries(STS).map(([k,s])=>`<div class="item"><span class="chip" style="color:${s.c}">${s.n}</span><div class="grow" style="font-size:13px">${s.info}${IMM[k]?`<div class="sub" style="font-size:12px">ธาตุ${IMM[k].map(elementIcon).join('')}ไม่ติดสถานะนี้</div>`:''}</div></div>`).join('')}</div>`}
// @soulbeast-end 0391-vChart
// @soulbeast-unit 0403-handlers-Object

Object.assign(handlers,{
 camp:enterCamp,campRefresh:()=>campCall(CAMP.roomId?'camp_poll':'camp_list'),campRegister:async()=>{const pet=Number(document.getElementById('campPet')?.value);await gsSave(true);await campCall('camp_register',{pet});await campCall('camp_list')},
 campBegin:async target=>{const pet=Number(document.getElementById('campAttackPet')?.value);await gsSave(true);if(!CAMP.request)CAMP.request=crypto.randomUUID().replace(/-/g,'');await campCall('camp_begin',{target,pet,request:CAMP.request})},
 campTarget:id=>{CAMP.target=id;render()},campFriend:id=>{CAMP.friend=id;render()},
 campMove:id=>{if(!CAMP.request)CAMP.request=crypto.randomUUID().replace(/-/g,'');const r=CAMP.room;return campCall('camp_move',{skill:id,target:CAMP.target||r.battle.enemies.find(x=>x.hp>0)?.id,friend:CAMP.friend||r.battle.cur,rev:r.rev,request:CAMP.request})},
 campLeave:()=>{S.ui.confirm={msg:'ยอมแพ้และเสียเงินปัจจุบัน 20% ให้เจ้าของค่าย?',act:'campDoLeave'};render()},campDoLeave:()=>{S.ui.confirm=null;campCall('camp_leave')},
 campClear:()=>{CAMP.room=null;CAMP.roomId='';CAMP.token='';localStorage.removeItem('sealbeast_camp_v1');campCall('camp_list')},
 renameCharacter:async()=>{const name=document.getElementById('renameName')?.value?.trim();if(!name)return;await gsSave(true);await campCall('camp_profile',{name})}
});
// @soulbeast-end 0403-handlers-Object
// @soulbeast-unit 0413-handlers-Object

Object.assign(handlers,{partytoggle:toggleActive,petCarry:id=>movePet(id,true),petStore:id=>movePet(id,false),packFilter:id=>{S.ui.packFilter=id;render()}});
// @soulbeast-end 0413-handlers-Object
// @soulbeast-unit 0425-handlers-Object

Object.assign(handlers,{autoStats:uid=>autoStats(uid),pendingPets:()=>{S.ui.team='team';S.ui.packFilter='pending';go('team')},recommendedWeapon:()=>{S.ui.hero='gear';go('hero')}});
// @soulbeast-end 0425-handlers-Object
// @soulbeast-unit 0432-fullBestiary

function fullBestiary(tabs){const P=S.P,ks=Object.keys(SP);return `<div class="stack"><h2>สมุดอสูร · ${ks.length} ตัว</h2>${tabs}<p class="sub">ดูข้อมูลและร่างพัฒนาได้ทุกตัว · ประวัติพบและจับยังนับจากการเล่นจริง<br>คะแนนสังหาร/จับ = เลเวล × 8 (ทั่วไป), ×20 (ตัวหายาก), ×30 (บอส) · คะแนนขึ้นกับเลเวลและประเภทที่พบจริง</p><div class="dex">${ks.map(k=>{const q=SP[k],loc=beastLocations(k);return `<article class="card stack"><b>${esc(q.n)}</b>${dexForms(k)}${beastStoryButton(k)}<div>${tChips(q.t)} <span class="chip">${q.noseal?'บอสพิเศษ · ผนึกไม่ได้':q.rare?'หายาก':'ทั่วไป'}</span></div><small>${esc(q.o||'')} · ${esc(PAS[q.pas]?.n||'')}</small><small>คะแนนต่อเลเวล: ${q.rare?20:8} · เมื่อเป็นบอส: 30</small><small>พบที่: ${loc.length?loc.map(esc).join('<br>'):'ไม่พบในตารางป่าโดยตรง'}</small><small>${P.caught[k]?'จับแล้ว':P.seen[k]?'เคยพบ':'ยังไม่เคยพบ'}</small><details><summary>สกิล</summary>${q.sk.map(id=>skillRow(id)).join('')}</details></article>`}).join('')}</div></div>`}
// @soulbeast-end 0432-fullBestiary
// @soulbeast-unit 0433-handlers-Object

Object.assign(handlers,{teamAuto:toggleTeamAuto});
// @soulbeast-end 0433-handlers-Object
// @soulbeast-unit 0435-handlers-use

handlers.use=v=>{const [id,who]=v.split(':'),it=CON[id];if(!it||!S.P?.items[id])return;if(it.seal||it.cure)return;if(who==='P'&&it.rev)return;if(bagPotionDisabled(id,who)){toast('พลังเต็มแล้ว หรือเป้าหมายยังใช้ยานี้ไม่ได้');return}safeBagUse(v)};
// @soulbeast-end 0435-handlers-use
// @soulbeast-unit 0443-handlers-Object

Object.assign(handlers,{onlineAuto:mode=>{const r=onlineRoom(mode);if(!r)return;const enabled=!r.players[r.me]?.auto;if(mode==='pvp')pvpRequest({action:'pvp_auto',enabled});else wbCall('wb_auto',{enabled});}});
// @soulbeast-end 0443-handlers-Object
// @soulbeast-unit 0451-foldCard

function foldCard(title,body){return `<details class="card compact-info"><summary>${title}</summary><div class="stack">${body}</div></details>`}
// @soulbeast-end 0451-foldCard
// @soulbeast-unit 0452-vSettings

function vSettings(){const P=S.P;return `<div class="stack"><div class="row"><h2 class="grow">⚙ ตั้งค่า</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="card row">${portrait('player',64)}<div><h3><span data-user-content>${esc(P.name)}</span></h3><small>${esc(CLS[P.cls].n)} · Lv ${P.lv} · EXP ${fmt(P.exp)}</small></div></div><div class="achievement-grid">${[['✦','คะแนน',fmt(P.score||0)],['◈','ชนิดอสูรที่จับ',Object.keys(P.caught||{}).filter(k=>P.caught[k]).length],['⌕','ค้นพบ',Object.keys(P.seen||{}).filter(k=>P.seen[k]).length],['♛','ปราบจอมมาร',P.cleared||0],['◇','ตำนาน',Object.keys(P.legend||{}).length],['⚑','ป่าที่ปลดล็อก',P.zoneMax||1]].map(([g,n,v])=>`<div class="card"><b>${g} ${v}</b><small>${n}</small></div>`).join('')}</div>${profilePanel()}${soundPanel()}${foldCard('บันทึกและโหลดเซฟออนไลน์',vระบบออนไลน์Save())}${foldCard('สำรอง / นำเข้าเซฟ',vBackup())}${CLOUD.st==='off'?'':foldCard('เซฟคลาวด์',vCloud())}${foldCard('จัดการตัวละคร','<button class="btn danger" data-a="reset">เริ่มเกมใหม่</button>')}</div>`}
// @soulbeast-end 0452-vSettings
// @soulbeast-unit 0453-vWild

function vWild(){const chosen=ZN.find(z=>z.id===Number(S.ui.forestChoice));return `<div class="stack"><div class="row"><h2 class="grow">เลือกจุดหมาย</h2>${chosen?'<button class="btn sm" data-a="forestPick" data-v="">ดูป่าทั้งหมด</button>':''}</div>${chosen?forestDetail(chosen):`<div class="forest-gallery">${[...ZN.filter(z=>z.train),...ZN.filter(z=>!z.train)].map(z=>{const open=forestUnlocked(z.id);return `<button class="forest-portrait ${open?'':'sealed'}" data-a="forestPick" data-v="${z.id}" aria-label="${esc(z.n)}${open?'':' ยังไม่ปลดล็อก'}"><span class="forest-picture"><img src="${BUILTIN_SCENES[z.id===7?8:z.id+1]}" alt=""><span aria-hidden="true">${open?'✧':'🔒'}</span></span><strong class="forest-name">${esc(z.n)}</strong></button>`}).join('')}</div>`}</div>`}
// @soulbeast-end 0453-vWild
// @soulbeast-unit 0462-vStart

vStart=function(){return !S.ui.introSeen?cinemaView(true):startFull()};
// @soulbeast-end 0462-vStart
// @soulbeast-unit 0464-vHero

vHero=function(){let html=heroFull();const titles=['ความสามารถติดตัว','สกิลอาชีพ (เรียนตามเลเวล)','สกิลจากอุปกรณ์'];for(const title of titles){const needle='<div class="card stack"><h3>'+title+'</h3>',a=html.indexOf(needle);if(a<0)continue;let pos=a+needle.length,depth=1;const rx=/<\/?div\b[^>]*>/g;rx.lastIndex=pos;let m;while((m=rx.exec(html))&&depth){depth+=m[0].startsWith('</')?-1:1;if(!depth){html=html.slice(0,a)+foldCard(title,html.slice(pos,m.index))+html.slice(rx.lastIndex);break}}}return html};
// @soulbeast-end 0464-vHero
// @soulbeast-unit 0465-vLegend

vLegend=function(){return foldCard('ของในตำนาน / ตำนานสุริยคราส',legendFull())};
// @soulbeast-end 0465-vLegend
// @soulbeast-unit 0471-handlers-Object

Object.assign(handlers,{autoStatsAll,forestPick:v=>{S.ui.forestChoice=v?Number(v):null;render()},chapterPlay:v=>openCinema(Number(v),false,'story'),cinemaPrev:v=>{if(v==='intro')S.ui.introFrame=Math.max(0,(S.ui.introFrame||0)-1);else S.ui.cinema.index=Math.max(0,S.ui.cinema.index-1);render()},cinemaNext:v=>{const q=v==='intro'?{chapter:0,index:S.ui.introFrame||0}:S.ui.cinema;if(q.index>=storyFrames(q.chapter,q.after).length-1){endCinema(v==='intro');return}if(v==='intro')S.ui.introFrame=q.index+1;else q.index++;render()},cinemaEnd:v=>endCinema(v==='intro'),introLoad:()=>{S.ui.introSeen=true;render()}});
// @soulbeast-end 0471-handlers-Object
// @soulbeast-unit 0477-handlers-Object

Object.assign(handlers,{wagerOffer:async()=>{const r=PVP.room;if(!r||r.status!=='lobby'||PVP.busy||PVP.stakeBusy||GS.busy)return;const value=document.getElementById('wagerPick')?.value||'none:',[type,key]=value.split(':'),qty=Number(document.getElementById('wagerQty')?.value||1);PVP.stakeBusy=true;render();try{await gsSave(true);await pvpRequest({action:'pvp_wager',type,key,qty,wagerRev:r.wagers?.rev||0,request:crypto.randomUUID()});}finally{PVP.stakeBusy=false;render();}}});
// @soulbeast-end 0477-handlers-Object
// @soulbeast-unit 0478-render


function render(){
 if(S.P){normalizePack();initDiscovery()}const app=document.getElementById('app');if(S.screen!=='start'&&S.screen!=='story'&&!S.P)S.screen='start';
 if(S.screen==='battle'&&!S.battle)S.screen=S.zone?'zone':'town';
 if(S.screen==='zone'&&!S.zone)S.screen='wild';
 if(S.screen==='wild'&&S.zone)S.screen='zone';
 const V={beaststory:vBeastStory,statusbook:vStatusBook,guild:vGuild,guildwar:vGuildWar,elements:vGuideElements,guide:vGuide,bestiary:vGuideBestiary,classes:vGuideClasses,weaponbook:vWeaponBook,gacha:vGacha,friends:vFriends,settings:vSettings,world:vWorld,camp:vCamp,pvp:vPvp,story:vStory,leader:vLeader,forge:vForge,start:vStart,town:vTown,shop:vShop,hospital:vHospital,arena:vArena,wild:vWild,zone:vZone,battle:vBattle,hero:vHero,team:vTeam,bag:vBag}[S.screen]||vTown;
 const P=S.P,inB=S.screen==='battle',start=S.screen==='start'||!S.P;
 const priorMain=app.querySelector('main'),keepScroll=app.dataset.screen===S.screen,mainScroll=keepScroll&&priorMain?priorMain.scrollTop:0;
 const navOn=k=>({town:['statusbook','guild','guildwar','town','shop','hospital','arena','forge','leader','pvp','camp','weaponbook','gacha','friends','guide','bestiary','classes','elements'],wild:['wild','zone'],hero:['hero'],team:['team'],bag:['bag']})[k].includes(S.screen);
 const KEEP=['guildName','guildSearch','guildFlag','guildRename','wagerPick','wagerQty','renameName','wbRoomCode','nm','savein','gscode','gspin','gsnewpin','pvpRoomCode','campPet','campAttackPet','weaponBookType'],kept={};KEEP.forEach(id=>{const el=document.getElementById(id);if(el&&el.value)kept[id]=el.value});
 const wbChecked=[...document.querySelectorAll('input[name="wbPet"]:checked')].map(e=>e.value);app.innerHTML=(start?'':`<header class="top">${portrait('player',34)}<div class="who"><b><span data-user-content>${esc(P.name)}</span> <span class="sub" style="font-weight:400">${CLS[P.cls].n}</span></b><small class="num">Lv ${P.lv} · ${S.zone?ZN[S.zone.id-1].n+' · ก้าว '+S.zone.depth:'นครพันผนึก'}</small></div><span class="coin" style="${P.gold<0?'color:var(--bad)':''}">${P.gold<0?'หนี้ ':''}${fmt(P.gold)} <small style="font-family:var(--f-body);font-weight:400">เหรียญ</small></span><button class="btn sm friend-top" data-a="go" data-v="friends" aria-label="เพื่อนและผู้เล่นออนไลน์" translate="no">♟ ${ct('เพื่อน','Friends','好友')} <small>${COMMUNITY.ready?COMMUNITY.online.length:'—'}</small></button><button class="btn sm settings-button" data-a="go" data-v="settings" aria-label="ตั้งค่า">⚙</button>${couponShopButton('top')}</header><div class="brand-seam"><img src="assets/ui/soulbeast-logo-v2.webp" alt="SOULBEAST" width="368" height="124"></div>`)
  +`<main${S.ui.trapNotice?' inert':''}>${V()}${S.zone&&(!S.battle||!S.battle.over)?'<button class="btn danger full" style="margin-top:14px" data-a="surrender">ยอมแพ้ [ยอมตาย] · กลับเมืองพร้อมรับบทลงโทษ</button>':''}</main>`
  +(start||inB?'':`<nav class="bottom">${[['town','เมือง','城'],['hero','ตัวละคร','我'],['wild','ป่า','林'],['team','อสูร','封'],['bag','กระเป๋า','包']].map(([k,n,g])=>`<button class="${navOn(k)?'on':''} ${S.zone&&k==='town'?'lock':''} ${k==='wild'?'nav-wild':''}" data-a="go" data-v="${k}">${townNavArt(k)}${n}${k==='hero'&&canPromote(P)?' •':''}</button>`).join('')}</nav>`)
  +(S.ui.trapNotice&&(S.zone||S.battle)?`<div class="overlay trap-notice" role="dialog" aria-modal="true" aria-labelledby="trapTitle"><div class="card stack"><img src="assets/ui/traps/${['quicksand','leeches','fire-wall','spike-pit','rockfall','living-vines'][S.ui.trapNotice.index]||'spike-pit'}.webp" alt="${esc(S.ui.trapNotice.title)}" width="768" height="512"><h2 id="trapTitle">${esc(S.ui.trapNotice.title)}</h2><p>${esc(S.ui.trapNotice.message)}</p><button class="btn gold full" data-a="trapNoticeClose" autofocus>ไปต่อ</button></div></div>`:'')
  +(S.ui.confirm?`<div class="overlay"><div class="card stack"><p style="margin:0">${S.ui.confirm.msg}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="cancel">ยกเลิก</button><button class="btn danger" data-a="${S.ui.confirm.act}" data-v="${S.ui.confirm.v??''}">ยืนยัน</button></div></div></div>`:'');
 for(const id in kept){const el=document.getElementById(id);if(el)el.value=kept[id]}
 if(keepScroll&&S.screen==='world')document.querySelectorAll('input[name="wbPet"]').forEach(e=>e.checked=wbChecked.includes(e.value));app.insertAdjacentHTML?.('beforeend',onlineClockMarkup());app.dataset.screen=S.screen;const nextMain=app.querySelector('main');if(nextMain)nextMain.scrollTop=mainScroll;
 if(S.ui.trapNotice)app.querySelector?.('[data-a="trapNoticeClose"]')?.focus?.({preventScroll:true});
 const lg=document.getElementById('blog');if(lg)lg.scrollTop=lg.scrollHeight;
 if(inB&&VQ.length)(window.requestAnimationFrame||setTimeout)(flushVfx);
 Sound.sync();onlineClockTick();
 if(!inB)save();
 if(S.screen==='town'&&S.P&&SHEET_URL){lbSubmit();gsSave(false)}}
// @soulbeast-end 0478-render
// @soulbeast-unit 0479-vLegend


/* ================= BOOT & MIGRATION ================= */
function vLegend(){return vLegendBase()+`<div class="card stack"><h3>ตำนานสุริยคราส</h3><p>${ct('ได้จากบอสโลก กาชา หรือหีบตำนานหลังชนะจอมมาร','Available from World Bosses, gacha, or legendary chests after defeating the Demon Lord','来自世界首领、扭蛋或击败魔王后的传说宝箱')}</p>${WORLD_LEGENDS.map(id=>`<small>${S.P.legend?.[id]?'✦':'◇'} ${EQ[id].n}</small>`).join('')}</div>`;}
// @soulbeast-end 0479-vLegend
// @soulbeast-unit 0487-handlers-Object

Object.assign(handlers,{wbCreate:()=>wbCall('wb_create',{pets:worldPetSelection()}),wbJoin:()=>wbCall('wb_join',{room:(document.getElementById('wbRoomCode')?.value||'').trim().toUpperCase(),pets:worldPetSelection()}),wbStatus:()=>wbCall('wb_status'),wbReady:()=>wbCall('wb_ready'),wbStart:()=>wbCall('wb_start'),wbLeave:()=>wbCall('wb_leave'),wbFriend:id=>{WORLD.friend=id;render();},wbMove:id=>{if(!WORLD.room||WORLD.pending)return;WORLD.pending={skill:id,friend:WORLD.friend,rev:WORLD.room.rev,request:crypto.randomUUID()};wbCall('wb_move',WORLD.pending);},wbRetry:()=>WORLD.pending?wbCall('wb_move',WORLD.pending):wbCall('wb_poll'),wbClear:()=>{WORLD.room=null;WORLD.roomId='';WORLD.pending=null;localStorage.removeItem('sealbeast_world_v1');render();}});
// @soulbeast-end 0487-handlers-Object
// @soulbeast-unit 0494-handlers-use
handlers.use=function(v){const [id,who]=v.split(':'),it=CON[id];if(!it?.petExp)return expBagUse(v);const p=who==='P'?null:petBy(Number(who));if(p&&p.lv>=S.P.lv){toast('อสูรมีเลเวลเท่ากับหรือสูงกว่าผู้เล่นแล้ว ใช้ผลึกเติบโตไม่ได้');return;}if(!p||!carriedPets().some(x=>x.uid===p.uid)||p.lv>=MAXLV||p.hp<=0||statsLocked()||!(S.P.items[id]>0)){toast('ใช้กับอสูรที่พกติดตัวและยังไม่ถึงเลเวลสูงสุด นอกการต่อสู้เท่านั้น');return}const growth=growthCrystalExp(p,it.petExp);if(growth<=0)return;const text=gainExp(p,growth,false);S.P.items[id]--;save();render();toast((text.join(' · ')||('เพิ่ม EXP '+growth+' ให้ '+petName(p)))+(growth<it.petExp?' · ถึงขีดจำกัดเลเวลผู้เล่นแล้ว EXP ส่วนเกินไม่สะสม':''));};
// @soulbeast-end 0494-handlers-use
// @soulbeast-unit 0519-bestiaryKeys

function bestiaryKeys(filter=S.ui.dexRarity||'all'){return Object.keys(SP).filter(k=>filter==='all'||beastRarity(SP[k])===filter).sort(compareBeastBook);}
// @soulbeast-end 0519-bestiaryKeys
// @soulbeast-unit 0520-fullBestiary

fullBestiary=function(tabs){
 const P=S.P,filter=Object.hasOwn(BEAST_RARITY_LABELS,S.ui.dexRarity)?S.ui.dexRarity:'all',ks=bestiaryKeys(filter),all=Object.keys(SP);
 const controls=`<div class="rarity-filters" role="group" aria-label="กรองประเภทอสูร">${Object.entries(BEAST_RARITY_LABELS).map(([v,n])=>`<button class="btn sm ${filter===v?'pri':''}" data-a="dexRarity" data-v="${v}" aria-pressed="${filter===v}">${n}<span class="num">${v==='all'?all.length:bestiaryKeys(v).length}</span></button>`).join('')}</div>`;
 return `<div class="stack"><h2>สมุดอสูร · ${ks.length}/${all.length} ตัว</h2>${tabs}${controls}<p class="sub">ดูข้อมูลได้ทุกตัว ประวัติพบและจับยังนับจากการเล่นจริง · อสูรม่านหมอกมีร่างเดียวและสกิลเฉพาะตัว</p>${!mistLegendsUnlocked(P)&&(filter==='all'||filter==='legendary')?'<div class="card legend-locked">✦ อสูรในตำนานยังไม่ปรากฏในโลก ต้องชนะบอสจอมมารก่อนจึงจะพบและผนึกได้ในม่านหมอก</div>':''}<div class="dex">${ks.map(k=>{const q=SP[k],locked=q.legendary&&!mistLegendsUnlocked(P)&&!Object.values(P.gachaLegendPets||{}).includes(k),loc=mistLocations(k);return `<article class="card stack rarity-${beastRarity(q)}" data-panel-art="retinue" data-beast-frame="${k==='demonlord'?'boss':beastFrameKind(k)}"><b>${esc(q.n)}</b>${dexForms(k)}${beastStoryButton(k)}<div>${tChips(q.t)} <span class="chip">${q.noseal?'บอสพิเศษ · ผนึกไม่ได้':BEAST_RARITY_LABELS[beastRarity(q)]}</span>${q.mistNew?' <span class="chip">ร่างเดียว</span>':''}</div><small>${esc(q.o||'')} · ${esc(PAS[q.pas]?.n||'')}</small>${q.legendary?`<small class="legend-note">สกิลตำนานเฉพาะตัว</small>`:''}<small>คะแนนต่อเลเวล: ${q.rare?20:8} · เมื่อเป็นบอส: 30</small><small>พบที่: ${loc.map(esc).join('<br>')}</small><small>${locked?'ยังไม่ปลดล็อก':P.caught[k]?'จับแล้ว':P.seen[k]?'เคยพบ':'ยังไม่เคยพบ'}</small><details><summary>สกิล${q.sig?'และสกิลเฉพาะตัว':''}</summary>${q.sk.map(id=>skillRow(id)).join('')}${q.sig?skillRow(q.sig,true,'เฉพาะตัว · Lv '+(q.signatureLevel||SIGLV)):''}</details></article>`}).join('')}</div></div>`;
};
// @soulbeast-end 0520-fullBestiary
// @soulbeast-unit 0521-handlers-dexRarity

handlers.dexRarity=v=>{if(!Object.hasOwn(BEAST_RARITY_LABELS,v))return;S.ui.dexRarity=v;render();};
// @soulbeast-end 0521-handlers-dexRarity
// @soulbeast-unit 0586-weaponBookRarity

function weaponBookRarity(it){return it.craft?'craft':it.worldLegend?'eclipse':it.legend?'legend':'normal';}
// @soulbeast-end 0586-weaponBookRarity
// @soulbeast-unit 0587-WEAPON_BOOK_FILTERS

const WEAPON_BOOK_FILTERS={all:['ทั้งหมด','All','全部'],normal:['ทั่วไป','Common','普通'],craft:['คราฟต์หายาก','Rare Crafted','稀有锻造'],legend:['ในตำนาน','Legendary','传说'],eclipse:['ตำนานสุริยคราส','Eclipse Legends','日蚀传说']};
// @soulbeast-end 0587-WEAPON_BOOK_FILTERS
// @soulbeast-unit 0588-vWeaponBook

function vWeaponBook(){const filter=S.ui.weaponRarity||'all',type=S.ui.weaponType||'all',all=Object.entries(EQ),list=all.filter(([,it])=>(filter==='all'||weaponBookRarity(it)===filter)&&(type==='all'||it.wt===type||it.slot===type)).sort(compareWeaponBook);return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('ตำราอาวุธและอุปกรณ์','Equipment Guide','装备图鉴')} · ${list.length}/${all.length}</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="rarity-filters">${Object.entries(WEAPON_BOOK_FILTERS).map(([key,n])=>`<button class="btn ${filter===key?'pri':''}" data-a="weaponBookFilter" data-v="${key}" aria-pressed="${filter===key}" translate="no">${ct(...n)} <span class="num">${key==='all'?all.length:all.filter(([,it])=>weaponBookRarity(it)===key).length}</span></button>`).join('')}</div><label>${ctext('ประเภทอุปกรณ์','Equipment Type','装备种类')}<select id="weaponBookType"><option value="all" translate="no">${ct('ทุกประเภท','All Types','全部种类')}</option>${[...Object.entries(WT),...SLOTS.filter(([k])=>k!=='weapon').map(([k,n])=>[k,{n}])].map(([key,it])=>`<option value="${key}" ${type===key?'selected':''}>${it.n}</option>`).join('')}</select></label><div class="weapon-book-grid">${list.map(([id,it])=>`<article class="card stack"><div class="row">${itemIcon(id,64)}<div class="grow"><h3>${esc(it.n)}</h3><small>${WT[it.wt]?.n||SLOTS.find(([k])=>k===it.slot)?.[1]||it.slot} · Lv ${it.lv}</small></div></div><div>${it.el?elChip(it.el):''} <span translate="no">${ct(...WEAPON_BOOK_FILTERS[weaponBookRarity(it)])}</span></div><p class="sub">${statLine(it.st)}</p>${it.pas?`<div>${pasChip(it.pas)}<small>${PAS[it.pas].d}</small></div>`:''}${it.ws?`<details><summary>${ctext('สกิลอาวุธ','Weapon Skill','武器技能')}</summary>${skillRow(it.ws)}</details>`:''}<small translate="no">${ct('ได้จาก','Source','来源')}: ${it.eventCraft?ct('รางวัลปริศนาประจำป่า','Forest riddle reward','森林谜题奖励'):it.craft?ct('หลอมจากชิ้นส่วนอสูร','Beast-material crafting','妖兽素材锻造'):it.worldLegend?ct('บอสโลก / กาชา / หีบตำนานหลังชนะจอมมาร','World Boss / Gacha / post-Demon-Lord legendary chests','世界首领／扭蛋／击败魔王后的传说宝箱'):it.legend?ct('อุปกรณ์ตำนานประจำแผนที่ / กาชา','Zone legendary gear / Gacha','区域传说装备／扭蛋'):ct('ตลาดและรางวัล / กาชา','Shop and rewards / Gacha','商店与奖励／扭蛋')}</small></article>`).join('')}</div></div>`;}
// @soulbeast-end 0588-vWeaponBook
// @soulbeast-unit 0594-communityBaseTown

const communityBaseTown=vTown;
// @soulbeast-end 0594-communityBaseTown
// @soulbeast-unit 0595-vTown

vTown=function(){return communityBaseTown()+`<div class="community-links"><button class="card btn" data-a="go" data-v="weaponbook" translate="no">⚔ ${ct('ตำราอาวุธ','Weapon Guide','武器图鉴')}</button><button class="card btn" data-a="go" data-v="gacha" translate="no">✦ ${ct('กาชาปอง','Gachapon','扭蛋')}</button><button class="card btn" data-a="go" data-v="friends" translate="no">♟ ${ct('เพื่อนและผู้เล่นออนไลน์','Friends & Online Players','好友与在线玩家')}</button></div>`;};
// @soulbeast-end 0595-vTown
// @soulbeast-unit 0604-handlers-weaponBookFilter

handlers.weaponBookFilter=v=>{if(!Object.hasOwn(WEAPON_BOOK_FILTERS,v))return;S.ui.weaponRarity=v;render();};
// @soulbeast-end 0604-handlers-weaponBookFilter
// @soulbeast-unit 0624-releaseTown

const releaseTown=vTown;
// @soulbeast-end 0624-releaseTown
// @soulbeast-unit 0625-vTown

vTown=function(){return releaseTown().replace(/<div class="community-links">[\s\S]*?<\/div>$/,'')+`<div class="release-menu"><div class="coupon-town-links">${releaseArtButton('gacha','gachapon-square-v2',ct('กาชาปองแห่งพันผนึก','Soulseal Gachapon','封印扭蛋'),ct('ลุ้นอสูรและอาวุธตำนาน · ใช้คูปอง','Legendary beasts & weapons · Coupons only','传说妖兽与武器 · 仅限兑换券'))}${couponShopButton()}</div>${releaseArtButton('guide','handbook',ct('คู่มือผู้ผนึก','Soulkeeper Handbook','封印师指南'),ct('วิธีเล่น · สมุดอสูร · อาวุธ · อาชีพ','How to play · Beasts · Weapons · Classes','玩法 · 妖兽 · 武器 · 职业'))}</div>`;};
// @soulbeast-end 0625-vTown
// @soulbeast-unit 0626-guideBack

function guideBack(){return `<button class="btn sm" data-a="go" data-v="guide" translate="no">${ct('กลับคู่มือ','Back to Handbook','返回指南')}</button>`;}
// @soulbeast-end 0626-guideBack
// @soulbeast-unit 0627-vGuide

function vGuide(){const steps=[
 [portrait('player',64),['เตรียมตัวก่อนเข้าป่า','Prepare for the forest','探索前准备'],['ซื้อยาและผนึกที่ตลาด ตรวจ HP/MP และอุปกรณ์ เลือกป่าเริ่มต้นให้เหมาะกับเลเวล','Buy medicine and seals. Check HP/MP and equipment, then choose a forest suited to your level.','购买药品和封印，检查生命、魔力及装备，选择适合等级的森林。']],
 [portrait('goblin',64),['สำรวจ ต่อสู้ และผนึก','Explore, battle and seal','探索、战斗与封印'],['เลือกทางเดิน ใช้สกิลตามธาตุ ลด HP อสูรแล้วใช้ผนึกกับตัวที่จับได้ ระวังบอสที่ห้ามจับ','Choose a path, use elemental skills, weaken a capturable beast and use a seal. Some bosses cannot be captured.','选择路线，利用属性技能削弱可捕获妖兽后使用封印；部分首领无法捕获。']],
 [portrait('kappa',64),['จัดคู่หูและค่าย','Manage companions and camp','管理伙伴与营地'],['เลือกคู่หูออกสู้ เก็บอสูรสำรองในผนึก และพักตัวอื่นในค่าย แพ้โจรป่าอาจเสียเฉพาะตัวสำรองในกระเป๋า','Choose active companions, carry sealed reserves and rest others at camp. Bandits can steal only bag reserves after defeat.','选择出战伙伴、携带封印后备，其余留营。败给强盗时仅背包后备可能被偷。']],
 [portrait('cls:'+S.P.cls,64),['เติบโต หลอม และเลื่อนอาชีพ','Grow, forge and promote','成长、锻造与转职'],['ใช้แต้มสถานะ ติดอุปกรณ์ และหลอมชิ้นส่วนอสูร เลื่อนอาชีพเมื่อถึง Lv25 และ Lv40 การเลือกสายย้อนกลับไม่ได้','Spend stat points, equip gear and forge beast materials. Promote at Lv25 and Lv40; branch choices are permanent.','分配属性点，穿戴装备并使用妖兽素材锻造。25级、40级转职，分支选择不可撤回。']],
 [itemIcon('seal5',64),['จอมมาร ม่านหมอก และกาชา','Demon Lord, mist and gachapon','魔王、迷雾与扭蛋'],['ชนะจอมมารเพื่อพบตำนานในม่านหมอก 0.3% ต่อครั้ง ที่ Lv 40–60 ตำนานจากกาชาใช้ได้ทันที คูปองจอมมาร 10% และบอสโลกคะแนน 500 ขึ้นไป 50%','Defeat the Demon Lord to unlock a 0.3% legendary chance per mist visit at Lv40–60. Gacha legends work immediately. Coupon chance: Demon Lord 10%, World Boss score500+ 50%.','击败魔王后每次迷雾有0.3%概率遇见Lv40–60传说妖兽。扭蛋传说可立即使用。兑换券概率：魔王10%，世界首领500分以上50%。']],
 [portrait('cls:paladin',64),['บันทึกออนไลน์และเล่นกับเพื่อน','Save online and play with friends','在线存档与好友'],['บันทึกออนไลน์ในตั้งค่า เก็บรหัสและ PIN ไว้เป็นส่วนตัว ปุ่มเพื่อนอยู่ข้างตั้งค่า เพื่อนออนไลน์คือบันทึกใน5นาทีล่าสุด รับคำท้าเพื่อเข้าห้องPVPแล้วตรวจทีมก่อนพร้อมสู้','Save online in Settings; keep your code and PIN private. Friends is beside Settings. Online means saved within5minutes. Accept a challenge to enter PvP, then check your team and ready up.','在设置中在线保存，保管好存档码和PIN。好友位于设置旁，5分钟内保存视为在线。接受挑战进入PVP，检查队伍后准备。']]
 ];return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('คู่มือผู้ผนึก','Soulkeeper Handbook','封印师指南')}</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="guide-catalogs">${[['bestiary','สมุดอสูร','Bestiary','妖兽图鉴'],['weaponbook','ตำราอาวุธ','Weapon Guide','武器图鉴'],['classes','สายอาชีพและสกิล','Classes & Skills','职业与技能']].map(([k,...n])=>`<button class="btn" data-a="go" data-v="${k}" translate="no">${ct(...n)} →</button>`).join('')}</div><h3 translate="no">${ct('เริ่มผจญภัยใน 6 ขั้นตอน','Your adventure in 6 steps','六步开始冒险')}</h3>${steps.map(([art,title,body],i)=>`<article class="card guide-step"><div class="guide-visual"><span>${i+1}</span>${art}</div><div><h3 translate="no">${ct(...title)}</h3><p translate="no">${ct(...body)}</p></div></article>`).join('')}</div>`;}
// @soulbeast-end 0627-vGuide
// @soulbeast-unit 0628-vGuideBestiary

function vGuideBestiary(){return fullBestiary(guideBack());}
// @soulbeast-end 0628-vGuideBestiary
// @soulbeast-unit 0629-vGuideClasses

function vGuideClasses(){return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('สายอาชีพและสกิล','Classes & Skills','职业与技能')}</h2>${guideBack()}</div>${vClassTree()}</div>`;}
// @soulbeast-end 0629-vGuideClasses
// @soulbeast-unit 0630-releaseWeaponBook

const releaseWeaponBook=vWeaponBook;
// @soulbeast-end 0630-releaseWeaponBook
// @soulbeast-unit 0631-vWeaponBook

vWeaponBook=function(){return releaseWeaponBook().replace('<button class="btn sm" data-a="go" data-v="town">กลับเมือง</button>',guideBack());};
// @soulbeast-end 0631-vWeaponBook
// @soulbeast-unit 0632-releaseSettings

const releaseSettings=vSettings;
// @soulbeast-end 0632-releaseSettings
// @soulbeast-unit 0633-vSettings

vSettings=function(){return releaseSettings().replace(/<div class="card row wrap"><button class="btn" data-a="go" data-v="weaponbook"[\s\S]*?<\/div>$/,'')+`<div class="card">${releaseArtButton('guide','handbook',ct('คู่มือผู้ผนึก','Soulkeeper Handbook','封印师指南'),ct('วิธีเล่นและข้อมูลเกม','How to play & game reference','玩法与游戏资料'))}</div>`;};
// @soulbeast-end 0633-vSettings
// @soulbeast-unit 0636-handlers-teamtab

handlers.teamtab=(tab)=>{if(tab==='dex'){go('bestiary');return;}S.ui.team=tab;S.ui.petView=null;render();};
// @soulbeast-end 0636-handlers-teamtab
// @soulbeast-unit 0637-handlers-herotab

handlers.herotab=(tab)=>{if(tab==='tree'){go('classes');return;}S.ui.hero=tab;render();};
// @soulbeast-end 0637-handlers-herotab
// @soulbeast-unit 0638-releaseRender

const releaseRender=render;
// @soulbeast-end 0638-releaseRender
// @soulbeast-unit 0639-render

render=function(){releaseRender();if(S.screen==='gacha'&&!GACHA.busy&&GACHA.rewards.length&&ReleaseGacha.revealed!==GACHA.rewards){ReleaseGacha.revealed=GACHA.rewards;document.querySelector('.gacha-congratulations,.gacha-results')?.scrollIntoView?.({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}};
// @soulbeast-end 0639-render
// @soulbeast-unit 0646-vGuideElements

function vGuideElements(){return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('ตารางธาตุและรูปธาตุ','Elements & Type Chart','属性图示与克制表')}</h2>${guideBack()}</div><p translate="no">${ct('รูปเล็กบนสกิล อาวุธ และอสูรบอกธาตุ ไม่ใช่ระดับความหายาก ดูชื่อธาตุคู่กับรูปด้านล่าง แล้วอ่านตารางโดยเริ่มจากธาตุของท่าโจมตี','Icons on skills, weapons and beasts identify elements. Rarity is shown by portrait frames. Match each icon to its name below; read the chart from the attack element.','技能、武器和妖兽上的小图表示属性，头像边框表示稀有度。下方可查看每种图示对应的属性；克制表以攻击属性为起点。')}</p><div class="element-key">${Object.entries(EL).map(([k,e])=>`<div class="card element-key-card">${elementIcon(k)}<div><b>${esc(e.n)}</b><small translate="no">${ct(...ELEMENT_PICTURES[k])}</small></div></div>`).join('')}</div><div class="card"><p translate="no">${ct('×2 = ได้เปรียบ · ×½ = ถูกต้าน · ×¼ = ลดดาเมจ 75% · ธาตุที่ไม่ระบุมีผล ×1 อสูรสองธาตุคูณตัวคูณเข้าด้วยกัน เช่น ×2 กับ ×½ จะเหลือ ×1','×2 = super effective · ×½ = resisted · ×¼ = damage reduced by 75% · Unlisted matchups are ×1. Multiply both types for dual-type targets: ×2 and ×½ gives ×1.','×2：克制 · ×½：抵抗 · ×¼：伤害降低75% · 未列出的关系为×1。双属性目标需相乘，例如×2与×½相乘后为×1。')}</p></div>${vChart()}${beastFrameLegend()}</div>`;}
// @soulbeast-end 0646-vGuideElements
// @soulbeast-unit 0647-ornateGuide

const ornateGuide=vGuide;
// @soulbeast-end 0647-ornateGuide
// @soulbeast-unit 0648-vGuide

vGuide=function(){return ornateGuide().replace('<div class="guide-catalogs">',`<div class="guide-catalogs"><button class="btn" data-a="go" data-v="elements" translate="no">${ct('ตารางธาตุและรูปธาตุ','Elements & Type Chart','属性图示与克制表')} →</button>`);};
// @soulbeast-end 0648-vGuide
// @soulbeast-unit 0649-ornateBestiary

const ornateBestiary=vGuideBestiary;
// @soulbeast-end 0649-ornateBestiary
// @soulbeast-unit 0650-vGuideBestiary

vGuideBestiary=function(){return ornateBestiary()+beastFrameLegend();};
// @soulbeast-end 0650-vGuideBestiary
// @soulbeast-unit 0652-handlers-teamtab

handlers.teamtab=function(tab){if(tab==='chart'){go('elements');return;}ornateTeamTab(tab);};
// @soulbeast-end 0652-handlers-teamtab
// @soulbeast-unit 0659-ornateRender

const ornateRender=render;
// @soulbeast-end 0659-ornateRender
// @soulbeast-unit 0660-render

render=function(){ornateRender();if(GACHA.busy&&ReleaseGacha.active){const app=document.getElementById('app');if(app?.insertAdjacentHTML){app.insertAdjacentHTML('beforeend',gachaDrawOverlay());for(const child of app.children||[])if(!child.classList.contains('gacha-draw-overlay'))child.inert=true;app.querySelector('.gacha-draw-overlay')?.focus?.({preventScroll:true});}}};
// @soulbeast-end 0660-render
// @soulbeast-unit 0669-reliabilityRender

const reliabilityRender=render;
// @soulbeast-end 0669-reliabilityRender
// @soulbeast-unit 0670-render
render=function(){reliabilityRender();onlineShow();};
// @soulbeast-end 0670-render
// @soulbeast-unit 0721-compareBeastBook

function compareBeastBook(a,b){
 const rank=q=>q.solar?4:q.noseal?3:q.legendary?2:q.rare?1:0;
 return rank(SP[a])-rank(SP[b])||((SP[a].ev||[]).length-(SP[b].ev||[]).length);
}
// @soulbeast-end 0721-compareBeastBook
// @soulbeast-unit 0722-compareWeaponBook

function compareWeaponBook(a,b){
 const rank={normal:0,craft:1,legend:2,eclipse:3};
 return rank[weaponBookRarity(a[1])]-rank[weaponBookRarity(b[1])]||(a[1].lv||1)-(b[1].lv||1);
}
// @soulbeast-end 0722-compareWeaponBook
// @soulbeast-unit 0728-handlers-cont

handlers.cont=function(...args){forestFocusContinue(...args);focusForestChoicesAfterContinue();};
// @soulbeast-end 0728-handlers-cont
// @soulbeast-unit 0772-handlers-go
handlers.go=function(v){const result=guildGoBase(v);if(['guild','guildwar'].includes(v))return guildRequest();return result;};
// @soulbeast-end 0772-handlers-go
// @soulbeast-unit 0774-guildTownBase

const guildTownBase=vTown;
// @soulbeast-end 0774-guildTownBase
// @soulbeast-unit 0775-vTown
vTown=function(){return '<div class="stack" style="margin-bottom:14px">'+guildMenuTile()+guildMenuTile(true)+'</div>'+guildTownBase();};
// @soulbeast-end 0775-vTown
// @soulbeast-unit 0815-handlers-autoAllPets

handlers.autoAllPets=function(){if(statsLocked())return toast('อัปแต้มหลังจบการต่อสู้');let count=0;AUTO_STAT_BATCH=true;try{S.P.pets.filter(p=>p.free>0).forEach(p=>{const before=p.free;autoStats(p.uid);if(p.free<before)count++;});}finally{AUTO_STAT_BATCH=false;}save();render();toast('อัปแต้มอัตโนมัติแล้ว '+count+' ตัว');};
// @soulbeast-end 0815-handlers-autoAllPets
// @soulbeast-unit 0833-playRender

const playRender=render;
// @soulbeast-end 0833-playRender
// @soulbeast-unit 0835-render

let playForestView='';
render=function(){const changed=playScreen!==S.screen,battleChanged=playBattle!==S.battle,forestView=!S.battle&&S.screen==='zone'&&S.zone?(isBossDoorScene()?'boss:'+S.zone.id:S.zone.fork?'fork:'+S.zone.id+':'+S.zone.depth:''):'';if(battleChanged)S.ui.battleCommandsHidden=false;playRender();const main=document.querySelector('main');if(main){main.classList?.toggle('play-battle',!!S.battle);main.classList?.toggle('show-battle-details',!!S.ui.battleDetails);if(S.battle&&(battleChanged||changed))main.scrollTop=0;else if(changed&&S.screen!=='zone')main.scrollTop=0;if(forestView.startsWith('fork:')){const stage=main.querySelector?.('.forest-travel-stage');if(stage?.style)stage.style.minHeight=Math.max(0,main.clientHeight-24)+'px';}if(forestView&&forestView!==playForestView)(window.requestAnimationFrame||setTimeout)(()=>{if(S.battle||S.screen!=='zone'||forestView!==playForestView)return;const current=document.querySelector('main'),target=forestView.startsWith('boss:')?current?.querySelector?.('.boss-gate-art')?.closest('.card'):current?.querySelector?.('.forest-depth');if(target&&current.getBoundingClientRect)current.scrollTop+=target.getBoundingClientRect().top-current.getBoundingClientRect().top-12;});}playForestView=forestView;playScreen=S.screen;playBattle=S.battle;};
// @soulbeast-end 0835-render
// @soulbeast-unit 0861-configuredDefenseReady


function configuredDefenseReady(){return (CAMP.pets||[]).some(id=>carriedPets().some(p=>p.uid===id));}
// @soulbeast-end 0861-configuredDefenseReady
// @soulbeast-unit 0868-compactRoom

function compactRoom(mode=S.screen){return mode==='pvp'?PVP.room:mode==='world'?WORLD.room:mode==='camp'?CAMP.room:mode==='guildwar'?GUILD_UI.warRoom:null;}
// @soulbeast-end 0868-compactRoom
// @soulbeast-unit 0873-compactButton

function compactButton(action,text,value='',disabled=false,primary=false){return '<button class="btn sm '+(primary?'pri':'')+'" data-a="'+action+'" '+(value?'data-v="'+esc(value)+'" ':'')+(disabled?'disabled ':'')+'>'+text+'</button>';}
// @soulbeast-end 0873-compactButton
// @soulbeast-unit 0887-compactRenderBase

const compactRenderBase=render;
// @soulbeast-end 0887-compactRenderBase
// @soulbeast-unit 0888-render
render=function(){const active=compactBattleReady(),room=active?compactRoom():null,key=active?S.screen+':'+room.id:'';const previousBody=document.querySelector('.online-command-body'),scroll=ONLINE_COMPACT.key===key?previousBody?.scrollTop||0:0,previousBoard=document.querySelector('.online-combat-scroll'),boardScroll=previousBoard?.scrollTop||0,previousTurn=previousBoard?.dataset?.combatView;if(ONLINE_COMPACT.key!==key){ONLINE_COMPACT.key=key;ONLINE_COMPACT.hidden=false;ONLINE_COMPACT.details=false;ONLINE_COMPACT.effectStamp='';}compactRenderBase();const main=document.querySelector('main');main?.classList?.toggle('online-combat-screen',active);document.getElementById('app')?.classList?.toggle?.('online-combat-mode',active);if(active){if(main)main.scrollTop=0;const body=document.querySelector('.online-command-body');if(body)body.scrollTop=scroll;if(['pvp','world'].includes(S.screen)){const board=document.querySelector('.online-combat-scroll'),turn=S.screen==='pvp'?key+':'+room.battle.cur:key;if(board?.dataset&&board.getBoundingClientRect){board.dataset.combatView=turn;if(previousTurn===turn)board.scrollTop=boardScroll;else if(S.screen==='pvp'){const actor=board.querySelector('.battle-vital.acting');if(actor){const a=actor.getBoundingClientRect(),v=board.getBoundingClientRect();if(a.bottom>v.bottom-12)board.scrollTop+=a.bottom-v.bottom+12;else if(a.top<v.top+12)board.scrollTop+=a.top-v.top-12;}}}}if(S.screen==='guildwar'&&room.replaying){const b=room.battle,stamp=key+':'+b.cur+':'+b.round+':'+JSON.stringify([b.effects,[...b.allies,...b.enemies].map(u=>[u.id,u.hp,u.mp])]);if(stamp!==ONLINE_COMPACT.effectStamp){ONLINE_COMPACT.effectStamp=stamp;VQ.push(...(b.effects||[]).slice(-64));(window.requestAnimationFrame||setTimeout)(flushVfx);}}}};
// @soulbeast-end 0888-render
// @soulbeast-unit 0910-TOWN_ART-arena


TOWN_ART.arena='assets/ui/martial-tower-v1.webp';
// @soulbeast-end 0910-TOWN_ART-arena
// @soulbeast-unit 0929-handlers-arena

handlers.arena=()=>toast('เข้าหอคอยจากชั้น 1 ด้วยปุ่มยืนยันเท่านั้น');
// @soulbeast-end 0929-handlers-arena
// @soulbeast-unit 0945-vArenaBase

vArenaBase=function(){const run=S.P.towerRun,used=run?.day===TOWER_UI.today;if(towerActive()&&run.restPending)return towerRestView();return '<div class="stack"><div class="row"><h2 class="grow">หอคอยประลองยุทธ</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="card stack"><h3>'+TOWER_FLOORS.length+' ชั้น · สถิติสูงสุด '+fmt(S.P.towerBest||0)+' ชั้น</h3><p>สู้ต่อเนื่องจากชั้น 1 ขึ้นไป ใช้เฉพาะอสูรในกระเป๋า ห้ามใช้ยาและออกไปรักษา จนกว่าจะเคลียร์หอคอยหรือตาย ใช้สกิลฮีลและพักฟื้นได้</p><p>จุดพักทุก 5 ชั้น · ผ่านชั้นครั้งแรกได้คูปอง 2 ใบ · แพ้ไม่เสีย EXP หรือเงิน · ก่อนเข้าและเมื่อจบฟื้น HP/MP ทุกตัวฟรี</p><p>วันละครั้ง · รีเซ็ต 00:00 เวลาไทย · รางวัลเป็นเงินเท่านั้น และคูปอง 2 ใบเมื่อผ่านแต่ละชั้นครั้งแรก · ไม่มี EXP หรือไอเท็ม</p><button class="btn pri full" data-a="towerConfirm" '+(TOWER_UI.busy||!TOWER_UI.ready||used?'disabled':'')+'>'+(TOWER_UI.busy?'กำลังตรวจสิทธิ์…':used?'วันนี้ใช้สิทธิ์แล้ว':'ยืนยันเข้าหอคอย · เริ่มชั้น 1')+'</button><button class="btn sm" data-a="towerRefresh">ตรวจสิทธิ์อีกครั้ง</button>'+(TOWER_UI.error?'<p role="alert">'+esc(TOWER_UI.error)+'</p>':'')+'</div><details class="card"><summary>ดูคู่ต่อสู้ทุกชั้น</summary>'+TOWER_FLOORS.map(({n,i},floor)=>'<div class="item">'+portrait('npc:'+n.cls,38)+'<div><b>ชั้น '+(floor+1)+' · '+esc(n.n)+'</b><small>Lv '+n.lv+' · '+esc(CLS[n.cls].n)+' · '+fmt(S.P.arena[i]?Math.round(n.gold*.3):n.gold)+' เหรียญ</small></div></div>').join('')+'</details></div>';};
// @soulbeast-end 0945-vArenaBase
// @soulbeast-unit 0977-handlers-use
handlers.use=function(v){const [id,who]=v.split(':'),it=CON[id];if(!it?.cure)return forestUse(v);if(statsLocked()||towerActive())return toast('ใช้ยาแก้สถานะได้หลังจบการต่อสู้');const o=who==='P'?S.P:carriedPets().find(p=>p.uid===+who);if(!o||!(S.P.items[id]>0))return;const cured=it.cure.filter(k=>o.ailments?.[k]);if(!cured.length)return toast('ไม่มีสถานะที่ยานี้รักษาได้');cured.forEach(k=>delete o.ailments[k]);S.P.items[id]--;ExtraAudio.play('heal');save();render();toast('รักษา '+cured.map(k=>STS[k].n).join(' · '));};
// @soulbeast-end 0977-handlers-use
// @soulbeast-unit 1003-statusHandbook


const statusHandbook=vGuide;
// @soulbeast-end 1003-statusHandbook
// @soulbeast-unit 1004-vGuide
vGuide=function(){return statusHandbook().replace('<div class="guide-catalogs">','<div class="guide-catalogs"><button class="btn" data-a="go" data-v="statusbook">สมุดสถานะผิดปกติ →</button>');};
// @soulbeast-end 1004-vGuide
// @soulbeast-unit 1005-statusBookArt

function statusBookArt(key,name){const v=BATTLE_SPECIAL_ICONS[key];return '<span class="status-book-art">'+(v?'<span class="battle-effect-icon special-effect '+v[1]+'"><span class="battle-special-image" role="img" aria-label="'+esc(name)+'" style="background-position:'+(v[0]%6*20)+'% '+(Math.floor(v[0]/6)*100/3)+'%"></span></span>':'<span class="battle-effect-icon">'+battleEffectImage(key,name)+'</span>')+'</span>';}
// @soulbeast-end 1005-statusBookArt
// @soulbeast-unit 1006-statusBookCard

function statusBookCard(key,name,description,extra=''){return '<article class="card status-book-card">'+statusBookArt(key,name)+'<div><h3>'+esc(name)+'</h3><p>'+esc(description)+'</p>'+extra+'</div></article>';}
// @soulbeast-end 1006-statusBookCard
// @soulbeast-unit 1007-vStatusBook

function vStatusBook(){const ailments=Object.keys(STS).map(k=>{const cure=Object.values(CON).filter(it=>it.cure?.includes(k)).map(it=>it.n).join(' / '),persistent=PERSISTENT_AILMENTS.includes(k),description=k==='freeze'?'ขยับไม่ได้ แต่พลังป้องกันกายภาพและเวทเพิ่ม 50%':STS[k].info;return statusBookCard(k,STS[k].n,description,'<small class="status-book-persistence">'+(persistent?'ติดค้างหลังการต่อสู้ · ไม่หายเอง':'มีระยะเวลา · หายเมื่อครบผลของสถานะ'+(k==='sleep'?' หรือถูกโจมตี':''))+'</small><small>รักษาด้วย: '+esc(cure)+'</small>');}).join('');
 const names={patk:'พลังโจมตีกายภาพ',matk:'พลังโจมตีเวท',crit:'คริติคอล',acc:'ความแม่นยำ',eva:'หลบหลีก',spd:'ความเร็ว',pdef:'ป้องกันกายภาพ',mdef:'ป้องกันเวท'};
 const buffs=Object.entries(names).flatMap(([key,name])=>[true,false].map(up=>statusBookCard(key+(up?'-up':'-down'),(up?'เพิ่ม':'ลด')+name,'ปรับ'+name+' ตามเปอร์เซ็นต์และระยะเวลาของสกิล หมดผลเมื่อครบระยะเวลา ไม่ใช่สถานะติดค้างที่ต้องใช้ยา'))).join('');
 const extra=[['taunt','ยั่วยุ','ดึงการโจมตีเป้าหมายเดี่ยวส่วนใหญ่ให้เล็งผู้ยั่วยุ ช่วยป้องกันเพื่อน แต่ทำให้ตัวเองเสี่ยงถูกโจมตี'],['charging','กำลังชาร์จ','รวบรวมพลังเพื่อปล่อยสกิลเมื่อถึงจังหวะถัดไป'],['empowered','พลังโจมตีครั้งถัดไป','เพิ่มพลังการโจมตีครั้งถัดไปตามตัวคูณของสกิล'],['physicalImmune','ป้องกันกายภาพ 100%','ป้องกันการโจมตีกายภาพขณะผลยังทำงาน'],['magicImmune','ป้องกันเวท 100%','ป้องกันการโจมตีเวทขณะผลยังทำงาน'],['enchant','ประทับธาตุอาวุธ','ผสมธาตุที่ประทับกับการโจมตีปกติและสกิลโจมตีชั่วคราว ธาตุซ้ำนับครั้งเดียว'],['summonLife','ระยะเวลาอัญเชิญ','ผู้ช่วยอัญเชิญอยู่ได้ตามจำนวนเทิร์นที่เหลือ และออกจากสนามเมื่อหมดเวลา']];
 const dotKeys={'พายุไฟ':'firestorm','วังน้ำวน':'whirlpool','บีบรัด':'constrict'};for(const sk of Object.values(SK))if(sk.dot&&dotKeys[sk.dot.n]&&!extra.some(x=>x[0]===dotKeys[sk.dot.n]))extra.push([dotKeys[sk.dot.n],sk.dot.n,'เสีย HP ตอนจบเทิร์น '+Math.round(sk.dot.rate*100)+'% ของ HP เต็ม ก่อนคิดผลธาตุ นาน '+sk.dot.turns+' เทิร์น เป็นผลสกิลแยกจากติดไฟหรือติดพิษ ยาแก้สถานะทั่วไปไม่ล้างผลนี้']);
 for(const key of ['reflect50','counter50','omni','poisonTouch2','mpsave','regen','guardian'])extra.push([key,PAS[key].n,PAS[key].d+' · เป็นบัฟชั่วคราวเมื่อได้รับจากสกิล ระยะเวลาและผลอาจปรับตามโหมดต่อสู้']);
 for(const [key,f]of Object.entries(FORMS))extra.push([key,f.n,'ค่าสเตตัสขณะอยู่ในร่างนี้: '+Object.entries(f.m).map(([k,v])=>(names[k]||SH[k]||k)+' ×'+v).join(' · ')]);
 return '<div class="stack status-book"><div class="row"><h2 class="grow">สมุดสถานะผิดปกติ</h2>'+guideBack()+'</div><div class="card stack"><p>กรอบเขียว: ผลดี · กรอบแดง: ผลเสีย · กรอบเหลือง: มีทั้งข้อดีและข้อเสีย</p><p>สถานะที่ติดค้างต้องใช้ยาที่รักษาถูกชนิด รักษาในโรงพยาบาล แวะบ่อชำระล้าง หรือเข้า–ออกหอคอย ดูสถานะและกดใช้ยาได้ในกระเป๋า</p></div><h3>สถานะผิดปกติ · '+Object.keys(STS).length+' ชนิด</h3><div class="status-book-grid">'+ailments+'</div><details class="card"><summary>บัฟและดีบัฟค่าสเตตัส · 16 แบบ</summary><div class="status-book-grid">'+buffs+'</div></details><details class="card"><summary>ผลพิเศษและร่างแปลง · '+extra.length+' แบบ</summary><div class="status-book-grid">'+extra.map(([key,n,d])=>statusBookCard(key,n,d)).join('')+'</div></details></div>';}
// @soulbeast-end 1007-vStatusBook
// @soulbeast-unit 1070-balanceGuideView

const balanceGuideView=vGuide;
// @soulbeast-end 1070-balanceGuideView
// @soulbeast-unit 1071-vGuide
vGuide=function(){return balanceGuideView()+'<section class="card stack"><h3>ธาตุเกราะและการต่อสู้หมู่</h3><p>ผู้ผนึกและ NPC ใช้ธาตุจากเกราะกับมงกุฎรวมกัน ธาตุซ้ำไม่นับเพิ่ม ถ้าไม่ใส่เป็นธาตุปกติ ตรวจจุดอ่อนจากตารางธาตุก่อนเปลี่ยนชุด ธาตุเหล็กมีในอุปกรณ์ขั้นสูง แต่ยังแพ้ไฟ ดิน และต่อสู้</p><p>ดาเมจรวมท่าหมู่เทียบพลังพื้นฐาน: 1 เป้า 75% · 2 เป้า 100% · 3 เป้า 125% · 4 เป้าขึ้นไป 150% แบ่งดาเมจตามจำนวนเป้า ท่าชาร์จชดเชยเวลา 2 เทิร์น ธาตุ เกราะ คริติคอล และความสามารถของแต่ละเป้ายังคงมีผล ใน PVP อสูรโจมตีผู้ผนึกที่ 60% และอสูรหลายตัวแบ่งโบนัสประสานทีม เพื่อให้มีโอกาสตอบโต้ก่อนถูกสังหาร</p></section>';};
// @soulbeast-end 1071-vGuide
