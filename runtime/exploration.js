// Forests, forks, events and forest bosses
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0043-ZN


const ZN=SoulbeastContent.ZN();
// @soulbeast-end 0043-ZN
// @soulbeast-unit 0075-zoneOfSp

const zoneOfSp=k=>{let i=ZN.findIndex(z=>z.sp.includes(k));if(i<0)i=ZN.findIndex(z=>z.rare.includes(k));return Math.max(0,i)};
// @soulbeast-end 0075-zoneOfSp
// @soulbeast-unit 0181-ROUTE_ART-revival


ROUTE_ART.revival='assets/media/36e5c41c2ec0b1c8f2c4702d.webp';
// @soulbeast-end 0181-ROUTE_ART-revival
// @soulbeast-unit 0199-zoneArt

function zoneArt(id,small=false){return sceneArt(id===7?8:id+1,ZN[id-1].n,small)}
// @soulbeast-end 0199-zoneArt
// @soulbeast-unit 0291-banditStealablePets

// Only sealed reserves in the carried bag are exposed to NPC theft.
function banditStealablePets(P=S.P,b=B()){
 normalizePack(P);
 const protectedIds=new Set([...(P.party||[]),...(b?.used||[]),...(b?.allies||[]).filter(u=>u.kind==='pet').map(u=>u.uid)]);
 const carried=new Set(P.carried);
 return P.pets.filter(p=>carried.has(p.uid)&&!protectedIds.has(p.uid));
}
// @soulbeast-end 0291-banditStealablePets
// @soulbeast-unit 0294-ZDEPTH


/* ================= FOREST ================= */
const ZDEPTH=10;
// @soulbeast-end 0294-ZDEPTH
// @soulbeast-unit 0295-EV

const EV=SoulbeastContent.EV();
// @soulbeast-end 0295-EV
// @soulbeast-unit 0296-SAFE

const SAFE=SoulbeastContent.SAFE();
// @soulbeast-end 0296-SAFE
// @soulbeast-unit 0297-TRAPS

const TRAPS=SoulbeastContent.TRAPS();
// @soulbeast-end 0297-TRAPS
// @soulbeast-unit 0298-CHESTS

const CHESTS=SoulbeastContent.CHESTS();
// @soulbeast-end 0298-CHESTS
// @soulbeast-unit 0299-CHESTW

const CHESTW=SoulbeastContent.CHESTW();
// @soulbeast-end 0299-CHESTW
// @soulbeast-unit 0300-BANDITS

const BANDITS=SoulbeastContent.BANDITS();
// @soulbeast-end 0300-BANDITS
// @soulbeast-unit 0302-newFork

function newFork(){const z=S.zone,zd=ZN[z.id-1];z.ev=null;if(z.depth>=ZDEPTH){z.fork=null;return}
 const VH=['village','hospital'],clash=(a,k)=>k===a||(VH.includes(a)&&VH.includes(k));
 const keys=Object.keys(EV).filter(k=>k!=='beast'&&(k!=='exit'||(z.depth>=3&&z.depth<ZDEPTH-1))&&!(zd.train&&['bandit','stranger'].includes(k)));
 const w=ks=>wsel(Object.fromEntries(ks.map(k=>[k,EV[k].w])));let a,c;
 if(z.depth===ZDEPTH-1){a=pick(['spring','revival','cleanse','hospital','village']);c=Math.random()<.5?'beast':w(keys.filter(k=>!clash(a,k)&&k!=='exit'))}
 else{a=Math.random()<.5?'beast':w(keys);c=w(keys.filter(k=>!clash(a,k)))}
 const hid=Math.random()<.18?R(0,1):-1;
 z.fork=(Math.random()<.5?[a,c]:[c,a]).map((k,i)=>({k,h:i===hid&&!SAFE.includes(k)}))}
// @soulbeast-end 0302-newFork
// @soulbeast-unit 0303-zlog

function zlog(t){const zl=S.zone.log;zl.push(t);if(zl.length>12)zl.shift()}
// @soulbeast-end 0303-zlog
// @soulbeast-unit 0304-trap

function trap(){const t=pick(TRAPS),P=S.P,s=pStats();
 P.hp=Math.max(1,P.hp-Math.round(s.hp*t.p));if(t.mp)P.mp=Math.max(0,P.mp-Math.round(s.mp*t.mp));
 party().forEach(p=>{if(p.hp>0){const q=calcPet(p);p.hp=Math.max(1,p.hp-Math.round(q.hp*t.p));if(t.mp)p.mp=Math.max(0,p.mp-Math.round(q.mp*t.mp))}});
 return `กับดัก${t.n}! ${t.d} ทั้งทีมเสีย HP ${Math.round(t.p*100)}%${t.mp?` และ MP ${Math.round(t.mp*100)}%`:''}`}
// @soulbeast-end 0304-trap
// @soulbeast-unit 0305-ZT

const ZT=id=>ZN[id-1].train?0:id-1;
// @soulbeast-end 0305-ZT
// @soulbeast-unit 0307-openChest

function openChest(c){Sound.fx('chest');const z=ZN[S.zone.id-1],P=S.P,out=[],tier=ZT(z.id),add=(id,n=1)=>{P.items[id]=(P.items[id]||0)+n;out.push(`${CON[id].n}${n>1?' ×'+n:''}`)};
 const chestType=c;
 const gold=g=>{P.gold+=g;out.push(`${fmt(g)} เหรียญ`)},gear=id=>{P.owned.push(id);out.push((EQ[id].legend?'✦ ':'')+EQ[id].n+(EQ[id].pas?` (${PAS[EQ[id].pas].n})`:''))},lg=ch=>{if(Math.random()<ch){const id=legendDrop(z.id);if(id)gear(id)}};
 const base=R(6,14)*z.lv[0]+R(5,20),pot=['pot','pot','pot2','pot2','pot3','pot3'][tier];
 if(c==='wood'){gold(base);add(pot,R(1,2));if(Math.random()<.4)add(tier>=3?'eth2':'eth')}
 if(c==='jade'){for(let i=0;i<3;i++)add(pick(CURES));add(pot);if(Math.random()<.35)add('allcure')}
 if(c==='azure'){add(SEALS[Math.min(4,tier)],R(2,3));if(Math.random()<.3&&tier<4)add(SEALS[tier+1])}
 if(c==='amethyst'){gear(gearDrop(tier+(Math.random()<.2?1:0),Math.random()<.35));if(Math.random()<.15)gear(`wp_${clsWeapon(P.cls)}${Math.min(5,tier+2)}`)}
 if(c==='legend'){const id=legendDrop(z.id);if(id){gear(id);gold(base*2)}else{out.push('ของในตำนานของแผนที่นี้ถูกพบครบแล้ว');c='gold'}}
 if(c==='gold'){lg(.12);gold(base*4);gear(gearDrop(tier+1,Math.random()<.6));add(SEALS[Math.min(4,tier+1)]);add(pot,2);add('allcure')}
 if(c==='blood'){lg(.18);out.push(trap().split('!')[0]+'จากคำสาป');gold(base*3);gear(gearDrop(tier+1,true));gear(gearDrop(tier,false));add(SEALS[Math.min(4,tier+1)],2);add('rev')}
 if(Math.random()<({wood:.01,jade:.02,azure:.02,amethyst:.03,gold:.06,legend:.08,blood:.08}[chestType]||0))add('revivePotion');
 return out}
// @soulbeast-end 0307-openChest
// @soulbeast-unit 0309-SUF

const SUF=SoulbeastContent.SUF();
// @soulbeast-end 0309-SUF
// @soulbeast-unit 0310-travelerUnits

function travelerUnits(zd){const P=S.P,lv=clamp(P.lv+R(-5,2),zd.lv[0],zd.boss.lv),tier=lv>=40?2:lv>=25?1:0;
 const cls=pick(Object.keys(CLS).filter(k=>tierOf(k)===tier)),h=humanUnit(CLS[cls].n+pick(SUF),cls,lv,0);
 ['hp','patk','matk','pdef','mdef','spd'].forEach(k=>h.st[k]=Math.round(h.st[k]*1.1));h.hp=h.st.hp;h.mp=h.st.mp;
 const np=clamp(+wsel({1:55,2:35,3:10})+(clsSum(cls)>1?1:0),1,3),es=[h];
 for(let i=0;i<np;i++){const u=wildUnit(pick(Math.random()<.12?zd.rare:zd.sp),Math.max(1,lv-R(0,3)),i+1);u.name=`${u.name}ของ${CLS[cls].n}`;u.kind='npcpet';es.push(u)}return es}
// @soulbeast-end 0310-travelerUnits
// @soulbeast-unit 0311-travelerLoot

function travelerLoot(h){const P=S.P,z=S.zone?S.zone.id:Math.min(5,Math.ceil(h.lv/9)),out=[],tier=ZT(z),g=h.lv*40+R(0,h.lv*20);P.gold+=g;out.push(`ค่าหัวนักเดินทาง ${fmt(g)} เหรียญ`);
 const give=id=>{P.owned.push(id);out.push('ได้ '+(EQ[id].legend?'✦ ':'')+EQ[id].n)};
 let id=Math.random()<.3?legendDrop(z):null;if(id)give(id);
 give(Math.random()<.5?pick(Object.keys(SG).filter(k=>SG[k].lv<=h.lv+6)):pick(Object.keys(SLOTBASE))+'_'+clamp(tier+1,0,4));
 const it=[SEALS[Math.min(4,tier+1)],['pot','pot2','pot2','pot3','pot3','pot3'][tier],'allcure'];it.forEach(k=>{P.items[k]=(P.items[k]||0)+1});out.push('ได้ '+it.map(k=>CON[k].n).join(', '));return out}
// @soulbeast-end 0311-travelerLoot
// @soulbeast-unit 0312-chestEv

const chestEv=(src,msg)=>({type:'chest',chest:wsel(CHESTW[src]),msg,opened:false});
// @soulbeast-end 0312-chestEv
// @soulbeast-unit 0314-banditGroup

function banditGroup(zd){const lv=R(zd.lv[0]+1,zd.lv[1]),tier=lv>=40?2:lv>=25?1:0,cls=pick(BANDCLS[tier]);
 const es=[humanUnit(pick(BANDITS),cls,lv,0)],np=+wsel(zd.id>=3?{1:40,2:40,3:20}:{1:70,2:30});
 for(let i=0;i<np;i++){const sp=pick(zd.sp),u=wildUnit(sp,Math.max(1,lv-R(0,2)),i+1);u.name=`${u.name}ของโจร`;u.kind='npcpet';es.push(u)}return es}
// @soulbeast-end 0314-banditGroup
// @soulbeast-unit 0315-chooseFork

function chooseFork(i){const z=S.zone,zd=ZN[z.id-1],P=S.P,door=z.fork[i],type=door.k;z.fork=null;z.depth++;
 zlog(`ก้าวที่ ${z.depth}: เลือกทาง${i?'ขวา':'ซ้าย'}${door.h?'ซึ่งมืดมิด':''} — ${EV[type].n}`);
 let pre='';if(!SAFE.includes(type)&&Math.random()<.14){pre=trap();zlog(pre)}
 const fight=(es,kind='wild',aft=null)=>{z.ev=null;z.after=aft;startBattle(es,kind,z.id,pre||null);save();render()};
 const show=ev=>{if(pre)ev.msg=`<span style="color:var(--bad)">${pre}</span><br>${ev.msg}`;z.ev=ev};
 if(type==='beast')return fight(wildGroup(zd,zd.train?{1:65,2:30,3:5}:undefined));
 if(type==='bush'){const r=Math.random();if(r<.5)return fight(wildGroup(zd,{1:60,2:30,3:10}));
  if(r<.88)show(chestEv('bush','ในพุ่มไม้มีหีบซ่อนอยู่'));else{P.items.pot=(P.items.pot||0)+1;show({type,msg:'เจอสมุนไพรป่า ทำเป็นยาฟื้นพลังได้ 1 ขวด'})}}
 if(type==='mist'){const r=Math.random();
  const mistBeast=mistEncounter(zd,r);if(mistBeast)return fight([mistBeast]);
  if(r<.58)show(chestEv('mist','หมอกจางลงเผยให้เห็นหีบสมบัติโบราณ'));
  else if(r<.82)return fight(wildGroup(zd,zd.train?{2:1}:{2:35,3:40,4:25}));
  else show({type,msg:'หลงวนอยู่ในหมอกจนเหนื่อย ไม่เจออะไรเลย'})}
 if(type==='ruins'){if(Math.random()<.35){const e=wildUnit(pick(zd.sp),zd.lv[1]+1,0);e.name='ผู้เฝ้า'+e.name;return fight([e],'wild',chestEv('ruins','ผู้เฝ้าล้มลง เผยให้เห็นหีบที่มันปกป้องไว้'))}
  show(chestEv('ruins','ในห้องลับของวิหารมีหีบสมบัติวางอยู่'))}
 if(type==='bandit')return fight(banditGroup(zd),'bandit');
 if(type==='revival'){const down=carriedPets().filter(p=>p.hp<=0);let healed='';if(!down.length){const candidates=[{o:P,s:pStats(),name:P.name},...carriedPets().map(p=>({o:p,s:calcPet(p),name:petName(p)}))].filter(x=>x.o.hp>0&&x.o.hp<x.s.hp).sort((a,b)=>a.o.hp/a.s.hp-b.o.hp/b.s.hp);const target=candidates[0];if(target){const before=target.o.hp;target.o.hp=Math.min(target.s.hp,target.o.hp+Math.round(target.s.hp*.5));healed=esc(target.name)+' ฟื้น HP '+(target.o.hp-before)+' (สูงสุด 50% ของ HP เต็ม)';}}
  down.forEach(p=>{const s=calcPet(p);p.hp=s.hp;p.mp=Math.round(s.mp*.5)});
  show({type,msg:down.length?`แสงจากบ่อปลุก ${down.map(p=>esc(petName(p))).join(' และ ')} ให้ฟื้นคืนสติ ทุกตัวฟื้น HP เต็มและ MP ครึ่งหนึ่ง`:(healed||'ไม่มีผู้หมดสติ ทุกคน HP เต็มแล้ว')})}
 if(type==='spring'){const s=pStats();P.hp=Math.min(s.hp,P.hp+Math.round(s.hp*.35));P.mp=Math.min(s.mp,P.mp+Math.round(s.mp*.35));
  carriedPets().forEach(p=>{if(p.hp>0){const q=calcPet(p);p.hp=Math.min(q.hp,p.hp+Math.round(q.hp*.35));p.mp=Math.min(q.mp,p.mp+Math.round(q.mp*.35))}});show({type,msg:'น้ำในลำธารเย็นสดชื่น ทุกคนฟื้น HP และ MP 35%'})}
 if(type==='shrine'){const r=Math.random();
  if(r<.45){const raw=expFor(zd.lv[1])*2,x=progressionRewardExp(P,raw),l=gainExp(P,x,true);party().forEach(p=>l.push(...gainExp(p,progressionRewardExp(p,raw),false)));show({type,msg:`เทพประทานพร ได้ EXP ${fmt(x)}${l.length?'<br>'+l.join('<br>'):''}`})}
  else if(r<.75){const id=SEALS[Math.min(4,ZT(z.id))];P.items[id]=(P.items[id]||0)+2;show({type,msg:`บนแท่นบูชามี${CON[id].n} 2 ใบ คุณเก็บมาอย่างนอบน้อม`})}
  else{const s=pStats();P.mp=s.mp;carriedPets().forEach(p=>{if(p.hp>0)p.mp=calcPet(p).mp});show({type,msg:'แสงศักดิ์สิทธิ์โอบล้อม MP ของทุกคนเต็ม'})}}
 if(type==='village')show({type,msg:'ชาวบ้านต้อนรับนักเดินทาง ร้านค้าเปิดให้ซื้อสินค้า ราคาแพงกว่าในเมืองนิดหน่อย'});
 if(type==='hospital')show({type,msg:'หมอยาประจำป่ายินดีรักษาให้ ถ้ามีค่าตอบแทน',healed:false});
 if(type==='stranger'){const r=Math.random();
  if(r<.6)return fight(travelerUnits(zd),'traveler');
  if(r<.8)show({type,msg:pick(['ชาวบ้านเก็บสมุนไพรเปิดผ้าคลุมทักทาย แล้วเดินจากไป','นักแสวงบุญขอทางผ่าน แล้วหายไปในหมอก','พ่อค้าเร่ที่หลงทางถามทางไปเมือง คุณชี้ทางให้','นักบวชชราพยักหน้าให้เงียบ ๆ แล้วเดินสวนไป'])});
  else{const out=[];if(Math.random()<.15){const id=legendDrop(zd.id);if(id){P.owned.push(id);out.push('✦ '+EQ[id].n)}}
   if(!out.length){const ks=[SEALS[Math.min(4,ZT(z.id))],['pot','pot2','pot2','pot3','pot3','pot3'][ZT(z.id)],pick(CURES),'eth'];ks.slice(0,R(2,4)).forEach(k=>{P.items[k]=(P.items[k]||0)+1;out.push(CON[k].n)})}
   show({type,msg:`นักเดินทางผู้ใจดีมอบของให้: ${out.join(', ')}`})}}
 if(type==='exit')show({type,msg:'แสงแดดลอดผ่านต้นไม้ เห็นกำแพงเมืองอยู่ไกล ๆ จะกลับเมืองตอนนี้ หรือเดินลึกเข้าไปต่อ?'});
 if(z.ev)zlog(z.ev.msg.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,100));save();render()}
// @soulbeast-end 0315-chooseFork
// @soulbeast-unit 0351-surrenderForest

function surrenderForest(){if(!S.zone){S.ui.confirm=null;render();return}
 const P=S.P;let message;
 if(S.battle&&!S.battle.over){endBattle('lose');message=S.battle.over.lines.join(' · ')}
 else{const lost=Math.max(0,Math.floor(P.gold*.1));P.gold-=lost;const xp=loseExp(P,.08);party().forEach(p=>loseExp(p,.08));P.hp=Math.max(1,Math.round(pStats().hp*.3));message=`ยอมแพ้กลับเมือง เสีย ${fmt(lost)} เหรียญ และ EXP ${fmt(xp)} (เลเวลไม่ลด)`}
 S.zone=null;S.battle=null;VQ.length=0;S.ui.confirm=null;S.screen='hospital';save();render();toast(message)}
// @soulbeast-end 0351-surrenderForest
// @soulbeast-unit 0353-document-addEventListener

document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;if(t.dataset.a!=='soundtoggle'){Sound.unlock();if(!['fork','bt'].includes(t.dataset.a))Sound.fx('click')}const f=handlers[t.dataset.a];if(f)f(t.dataset.v??'')});
// @soulbeast-end 0353-document-addEventListener
// @soulbeast-unit 0354-document-addEventListener

document.addEventListener('input',e=>{if(e.target.id==='soundVolume'){Sound.setVolume(Number(e.target.value)/100);const o=document.getElementById('soundPercent');if(o)o.textContent=Math.round(Sound.volume*100)+'%'}});
// @soulbeast-end 0354-document-addEventListener
// @soulbeast-unit 0355-document-addEventListener

document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(PVP.timer);Sound.mute();if(Sound.ctx)Sound.ctx.suspend().catch(()=>{})}else{if(Sound.enabled)Sound.unlock();pvpSchedule()}});
// @soulbeast-end 0355-document-addEventListener
// @soulbeast-unit 0357-document-getElementById

document.getElementById('imgIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f||!pendingImg)return;const key=pendingImg;const rd=new FileReader();
 rd.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),z=key==='profile'?80:256;c.width=c.height=z;const g=c.getContext('2d'),m=Math.min(im.width,im.height);
  g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,z,z);let u=c.toDataURL('image/webp',.85);if(!u.startsWith('data:image/webp'))u=c.toDataURL('image/png');if(key==='profile'){S.P.profile=u;save()}else{IMG[key]=u;saveImg()}render();toast('ใส่รูปแล้ว')};im.src=rd.result};rd.readAsDataURL(f)});
// @soulbeast-end 0357-document-getElementById
// @soulbeast-unit 0380-vZone


function vZone(){const zs=S.zone,z={...ZN[zs.id-1],boss:zs.boss||ZN[zs.id-1].boss},P=S.P;let main='';
 if(zs.ev){const ev=zs.ev,e=EV[ev.type]||{n:'หีบสมบัติ',g:'寶'};let extra='',contLbl='เดินลึกเข้าไปต่อ';
  if(ev.type==='chest'){const c=CHESTS[ev.chest];
   extra=`<div class="chest ${ev.opened?'open':''}" style="--cc:${c.c}"></div><div style="text-align:center"><b style="color:${c.c}">${c.n}</b><div class="sub">${c.d}</div></div>
   ${ev.opened?`<div class="card" style="background:var(--panel2)"><b>ได้รับ</b><div class="lines" style="margin:4px 0 0">${ev.got.map(x=>`<div>${x}</div>`).join('')}</div></div>`:`<button class="btn pri full" data-a="openchest">เปิดหีบ</button>`}`;
   if(!ev.opened)contLbl='เดินผ่านไป ไม่เปิด'}
  if(ev.type==='village'){const parts=Object.entries(P.parts).filter(([,n])=>n>0);
   extra=`<div class="lst">${Object.entries(CON).filter(([,c])=>!c.rareLoot).sort(compareShopItems).map(([id,c])=>{const pr=Math.round(priceOf(c)*1.25),lock=c.lv&&P.lv<c.lv;return `<div class="item">${itemIcon(id)}<div class="grow"><b>${c.n}</b><small>${c.d} · มีอยู่ ${P.items[id]||0}${c.lv>1?` · ต้องการ Lv ${c.lv}`:''}</small></div><button class="btn sm ${lock?'':'pri'}" data-a="vbuy" data-v="${id}" ${P.gold<pr||lock?'disabled':''}><span class="num">${fmt(pr)}</span></button></div>`}).join('')}</div>
   `;}
  if(ev.type==='hospital')extra=ev.healed?'<p class="sub" style="margin:0">ทุกคนหายดีแล้ว</p>':allFull()?'<button class="btn full" disabled>ทุกคนพลังเต็มอยู่แล้ว</button>':`<button class="btn pri full" data-a="zheal">รักษาทั้งทีม · <span class="num">${fmt(Math.round(healCost()*1.5))}</span> เหรียญ</button>`;
  if(ev.type==='exit')extra=`<button class="btn pri full" data-a="exitzone">กลับเมือง</button>`;
  main=`<div class="card stack">${routePicture(ev.type,false,true)}<div class="row"><span class="door-g">${e.g}</span><div class="grow"><h3>${e.n}</h3></div></div><p style="margin:0">${ev.msg}</p>${extra}</div>
  <button class="btn ${ev.type==='chest'&&!ev.opened?'':'pri'} full" data-a="cont" style="min-height:50px">${contLbl}</button>`}
 else if(!zs.fork){main=`<div class="card stack" style="border-color:var(--bad)"><img class="boss-gate-art" src="assets/ui/boss-gates/gate-${z.id}.webp" alt="ประตูห้องบอส ${z.n}" width="480" height="320"><div class="row"><span class="door-g" style="color:var(--bad)">王</span><div class="grow"><h3>รังของ${z.boss.n}</h3><div class="sub">บอส Lv ${z.boss.lv} · ${tChips(SP[z.boss.sp].t)}${z.mini?` · มีสมุน ${z.mini} ตัว`:''} · หนีไม่ได้</div><small class="sub">ออร่าบอส: HP เพิ่มจากฐานบอส 15% · โจมตี +20% · ป้องกัน/MP +15% · เร็ว +10% · ผนึกแล้วออร่าหาย</small></div></div>
  <p class="sub" style="margin:0">ทางสิ้นสุดตรงนี้ ชนะบอสเพื่อกลับเมืองและปลดล็อกพื้นที่ถัดไป ถ้าต้องการใช้ยา เปิดกระเป๋าก่อนได้</p>
  <div class="row"><button class="btn" data-a="go" data-v="bag">กระเป๋า</button><button class="btn danger grow" data-a="boss">เข้าสู้บอส</button></div></div>`}
 else main=`<p class="sub" style="margin:0">ทางแยกข้างหน้า เลือกทางที่จะเดินต่อ</p><div class="grid2">${zs.fork.map((d,i)=>{const e=d.h?{g:'?',n:'ทางมืด',d:'มืดจนมองไม่เห็นว่ามีอะไรรออยู่'}:EV[d.k];return `<button class="door ${d.h?'hid':''}" data-a="fork" data-v="${i}">${routePicture(d.k,d.h)}<span class="sub">ทาง${i?'ขวา':'ซ้าย'}</span><span class="door-g">${e.g}</span><b>${e.n}</b><small>${e.d}</small></button>`}).join('')}</div>`;
 return `<div class="stack">${zoneArt(z.id)}${z.train?'<div class="card story-card"><p>ก่อนออกเดินทาง ธาราเทพแนะนำให้ฝึกในป่าเล็กหลังเมือง เรียนรู้จังหวะต่อสู้และดูแลคู่หูของคุณ</p></div>':storyCard(z.id)}<button class="btn sm seal" data-a="story">อ่านบันทึกการเดินทาง</button><div><h2>${z.n}</h2><span class="sub">อสูร Lv ${z.lv[0]}–${z.lv[1]} · ออกได้เมื่อชนะบอส เจอทางออก หรือพ่ายแพ้</span></div>
 <div class="card stack" style="gap:6px"><div class="row"><span class="grow sub">ความลึก</span><span class="num">${Math.min(zs.depth,ZDEPTH)}/${ZDEPTH}</span></div><div class="steps">${Array.from({length:ZDEPTH+1},(_,i)=>`<i class="${i<zs.depth?'done':i===zs.depth?'now':''} ${i===ZDEPTH?'boss':''}"></i>`).join('')}</div></div>
 ${miniStatus()}${main}<div class="log">${zs.log.map(l=>`<p>${l}</p>`).join('')}</div></div>`}
// @soulbeast-end 0380-vZone
// @soulbeast-unit 0454-forestDetail

function forestDetail(z){const open=z.train||S.P.zoneMax>=z.id;return `<div class="card stack forest-detail">${zoneArt(z.id)}<h2>${esc(z.n)}</h2><p>${esc(z.d)}</p><small>อสูร Lv ${z.lv.join('–')} · บอส Lv ${z.boss.lv}</small><div class="row wrap">${z.sp.map(k=>`<span title="${esc(SP[k].n)}">${portrait(k,42)}</span>`).join('')}</div><div class="row wrap"><small>หายาก</small>${z.rare.map(k=>portrait(k,42)).join('')}</div>${open?`<button class="btn pri full" data-a="zone" data-v="${z.id}">เข้าสู่${esc(z.n)}</button>`:'<p>ชนะบอสในดินแดนก่อนหน้าเพื่อปลดล็อก</p>'}</div>`}
// @soulbeast-end 0454-forestDetail
// @soulbeast-unit 0467-zoneEnterFull

const zoneEnterFull=handlers.dozone;
// @soulbeast-end 0467-zoneEnterFull
// @soulbeast-unit 0468-handlers-dozone
handlers.dozone=v=>{zoneEnterFull(v);if(S.zone&&Number(S.zone.id)===Number(v)){S.P.lastForestId=Number(v);save()}if(Number(v)!==7)openCinema(Number(v),false,'zone');else{S.ui.cinema={chapter:7,index:0,after:false,back:'zone',training:true};S.screen='story';render()}};
// @soulbeast-end 0468-handlers-dozone
// @soulbeast-unit 0488-document-addEventListener

document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(WORLD.timer);else wbClientSchedule();});
// @soulbeast-end 0488-document-addEventListener
// @soulbeast-unit 0492-latestForestArt


/* Additive compatibility patch: existing saves keep all pets and inventories. */
function latestForestArt(){const p=S.P,id=Number(p?.lastForestId)||Math.max(1,Math.min(6,p?.zoneMax||1));return BUILTIN_SCENES[id===7?8:id+1]||BUILTIN_SCENES[2];}
// @soulbeast-end 0492-latestForestArt
// @soulbeast-unit 0550-document-addEventListener

document.addEventListener('change',event=>{if(event.target?.id==='gameLanguage')setGameLanguage(event.target.value);});
// @soulbeast-end 0550-document-addEventListener
// @soulbeast-unit 0605-document-addEventListener

document.addEventListener('change',event=>{if(event.target?.id==='weaponBookType'){S.ui.weaponType=event.target.value;render();}});
// @soulbeast-end 0605-document-addEventListener
// @soulbeast-unit 0723-forestForkShown


let forestForkShown=null;
// @soulbeast-end 0723-forestForkShown
// @soulbeast-unit 0804-document-addEventListener

document.addEventListener('change',e=>{if(e.target?.id==='guildFlag'&&SP[e.target.value]){GUILD_UI.flag=e.target.value;render();}});
// @soulbeast-end 0804-document-addEventListener
// @soulbeast-unit 0818-playForestBase

// Only forest previews are grey; viewing a preview never marks discovery.
const playForestBase=forestDetail;
// @soulbeast-end 0818-playForestBase
// @soulbeast-unit 0819-forestDetail
forestDetail=function(z){const original=portrait;portrait=function(key,size,opts){const image=original(key,size,opts);return SP[key]&&!S.P.seen?.[key]?'<span class="forest-unseen" title="ยังไม่เคยพบ">'+image+'</span>':image;};try{return playForestBase(z);}finally{portrait=original;}};
// @soulbeast-end 0819-forestDetail
// @soulbeast-unit 0853-document-addEventListener

document.addEventListener('input',event=>{const kinds={soundMusicVolume:['music','soundMusicPercent'],soundEffectsVolume:['effects','soundEffectsPercent']},entry=kinds[event.target?.id];if(!entry)return;Sound.setChannelVolume(entry[0],Number(event.target.value)/100);const output=document.getElementById(entry[1]);if(output)output.textContent=Math.round(Sound[entry[0]+'Volume']*100)+'%';});
// @soulbeast-end 0853-document-addEventListener
// @soulbeast-unit 0858-document-addEventListener

document.addEventListener('change',event=>{const el=event.target;if(!['campGuardPets','campRaidPets'].includes(el?.name))return;const field=el.name==='campGuardPets'?'guardPicks':'raidPicks',ids=campSelection(el.name),cap=baseOf(S.P.cls)==='summoner'?3:1;if(el.checked&&!ids.includes(Number(el.value))&&ids.length<cap)ids.push(Number(el.value));if(!el.checked)CAMP[field]=ids.filter(id=>id!==Number(el.value));render();});
// @soulbeast-end 0858-document-addEventListener
// @soulbeast-unit 0903-progressionExtraPlay

const progressionExtraPlay=ExtraAudio.play;
// @soulbeast-end 0903-progressionExtraPlay
// @soulbeast-unit 0951-document-addEventListener

document.addEventListener('visibilitychange',()=>{if(!document.hidden&&towerActive())towerResumePending();});
// @soulbeast-end 0951-document-addEventListener
// @soulbeast-unit 0956-forestPassed


function forestPassed(z){return (S.P.forestClears?.[z.id]||0)>0||(!z.train&&(z.final?(S.P.cleared||0)>0:(S.P.zoneMax||1)>z.id));}
// @soulbeast-end 0956-forestPassed
// @soulbeast-unit 0957-forestBossFor

function forestBossFor(z){return forestPassed(z)?pick(z.bosses||[z.boss]):z.boss;}
// @soulbeast-end 0957-forestBossFor
// @soulbeast-unit 0970-forestBattleAction

// Swapped-out pets also keep their ailments when their battle unit leaves the field.
const forestBattleAction=battleAction;
// @soulbeast-end 0970-forestBattleAction
// @soulbeast-unit 0971-battleAction
battleAction=function(v){if(forestAutoLocked()&&String(v).startsWith('auto:'))return toast('ต่อสู้อัตโนมัติปลดล็อกเลเวล 10');if(String(v).startsWith('swap:'))syncBack();return forestBattleAction(v);};
// @soulbeast-end 0971-battleAction
// @soulbeast-unit 0978-forestSteal

const forestSteal=steal;
// @soulbeast-end 0978-forestSteal
// @soulbeast-unit 0979-steal
steal=function(u,t){if(S.battle?.towerRun){blog('หอคอยไม่อนุญาตให้ขโมยเงินหรือไอเท็มจากคู่ต่อสู้');return;}return forestSteal(u,t);};
// @soulbeast-end 0979-steal
// @soulbeast-unit 0980-forestAutoLocked

// Both player and pet autoplay unlock at level 10 in forest battles.
function forestAutoLocked(){return !!S.zone&&S.P.lv<10;}
// @soulbeast-end 0980-forestAutoLocked
// @soulbeast-unit 0985-forestStartBattle

const forestStartBattle=startBattle;
// @soulbeast-end 0985-forestStartBattle
// @soulbeast-unit 0986-startBattle
startBattle=function(...args){if(S.zone&&S.P.lv<10){S.ui.autoTeam=false;S.ui.autoPet=false;}const out=forestStartBattle(...args);if(S.zone&&S.P.lv>=10&&!S.P.forestAutoIntroduced){S.P.forestAutoIntroduced=true;S.ui.forestAutoNotice=true;save();render();}return out;};
// @soulbeast-end 0986-startBattle
// @soulbeast-unit 0987-handlers-forestAutoNotice

handlers.forestAutoNotice=function(){S.ui.forestAutoNotice=false;render();};
// @soulbeast-end 0987-handlers-forestAutoNotice
// @soulbeast-unit 0990-villageGearEligible

function villageGearEligible(id){const it=EQ[id];return !!it&&it.slot==='weapon'&&!!it.craft&&!it.legend&&!it.worldLegend;}
// @soulbeast-end 0990-villageGearEligible
// @soulbeast-unit 0991-villageGearStock

function villageGearStock(ev){if(!Array.isArray(ev.gearStock)||ev.gearStock.some(v=>!villageGearEligible(v.id))){const pool=Object.keys(EQ).filter(k=>villageGearEligible(k)&&EQ[k].lv<=Math.max(10,S.P.lv+8));ev.gearStock=[];while(pool.length&&ev.gearStock.length<2){const i=R(0,pool.length-1);ev.gearStock.push({id:pool.splice(i,1)[0],sold:false});}save();}return ev.gearStock;}
// @soulbeast-end 0991-villageGearStock
// @soulbeast-unit 0993-handlers-villageGear

handlers.villageGear=function(value){const ev=S.zone?.ev;if(ev?.type!=='village'||S.battle||towerActive())return;const entry=villageGearStock(ev)[+value];if(!entry||entry.sold)return;const price=villageGearPrice(entry.id);if(S.P.gold<price)return toast('เหรียญไม่พอ');S.P.gold-=price;S.P.owned.push(entry.id);entry.sold=true;ExtraAudio.play('buy');save();render();};
// @soulbeast-end 0993-handlers-villageGear
// @soulbeast-unit 0994-forestZoneView

const forestZoneView=vZone;
// @soulbeast-end 0994-forestZoneView
// @soulbeast-unit 0995-vZone
vZone=function(){let html=forestZoneView(),ev=S.zone?.ev;if(ev?.type!=='village')return html;const cont='<button class="btn pri full" data-a="cont">เดินป่าต่อ →</button>',gear='<section class="card stack village-gear"><h3>อาวุธหลอม / คราฟต์หายาก · สุ่มขาย 2 ชิ้น</h3><small>ราคาสูงกว่าร้านทั่วไป · ชิ้นละหนึ่งชิ้นต่อการพบหมู่บ้าน</small>'+villageGearStock(ev).map((v,i)=>'<div class="item">'+itemIcon(v.id)+'<div class="grow"><b>'+esc(EQ[v.id].n)+'</b><small>คราฟต์หายาก · Lv '+EQ[v.id].lv+' · '+compareGear(EQ[v.id])+'</small></div><button class="btn sm" data-a="villageGear" data-v="'+i+'" '+(v.sold||S.P.gold<villageGearPrice(v.id)?'disabled':'')+'>'+(v.sold?'ขายแล้ว':fmt(villageGearPrice(v.id))+' เหรียญ')+'</button></div>').join('')+'</section>';return html.replace(/(<div class="card stack">)(<img class="route-banner")/,'$1'+cont+'$2').replace('<div class="lst">',gear+'<div class="lst">');};
// @soulbeast-end 0995-vZone
// @soulbeast-unit 1010-EV-cleanse


EV.cleanse=SoulbeastContent.EV_cleanse_1();
// @soulbeast-end 1010-EV-cleanse
// @soulbeast-unit 1012-ROUTE_ART-cleanse
ROUTE_ART.cleanse='assets/ui/purification-pool-v1.webp';
// @soulbeast-end 1012-ROUTE_ART-cleanse
// @soulbeast-unit 1014-cleansingChooseFork

const cleansingChooseFork=chooseFork;
// @soulbeast-end 1014-cleansingChooseFork
// @soulbeast-unit 1015-chooseFork
chooseFork=function(i){const z=S.zone;if(z?.fork?.[i]?.k!=='cleanse')return cleansingChooseFork(i);if(S.battle&&!S.battle.over)return;z.fork=null;z.depth++;const n=cleanseAllAilments();z.ev={type:'cleanse',msg:n?'น้ำศักดิ์สิทธิ์ชำระสถานะผิดปกติให้ผู้ผนึกและอสูรทุกตัว รวมในค่ายแล้ว พร้อมฟื้น HP/MP 10% ให้ผู้ที่ยังมีสติ ฟรี':'ผู้ผนึกและอสูรทุกตัวไม่มีสถานะผิดปกติ น้ำในบ่อฟื้น HP/MP 10% ให้ผู้ที่ยังมีสติแล้ว'};zlog('ก้าวที่ '+z.depth+': บ่อชำระล้าง · '+z.ev.msg);save();render();};
// @soulbeast-end 1015-chooseFork
// @soulbeast-unit 1073-progressionWildUnit

// Preserve the original boss HP baseline and ordinary capture reconstruction.
const progressionWildUnit=wildUnit;
// @soulbeast-end 1073-progressionWildUnit
// @soulbeast-unit 1074-wildUnit

wildUnit=function(sp,lv,i,boss){const u=progressionWildUnit(sp,lv,i,boss);if(!boss)return u;u.st.hp=Math.round(u.st.hp*1.15);u.st.mp=Math.round(u.st.mp*1.15);for(const k of ['patk','matk'])u.st[k]=Math.round(u.st[k]*1.2/1.15);u.st.spd=Math.round(u.st.spd*1.1);u.hp=u.st.hp;u.mp=u.st.mp;u.bossAura=true;return u;};
// @soulbeast-end 1074-wildUnit
// @soulbeast-unit 1075-isBossDoorScene

function isBossDoorScene(){return S.screen==='zone'&&!!S.zone&&!S.zone.ev&&!S.zone.fork&&S.zone.depth>=ZDEPTH;}
// @soulbeast-end 1075-isBossDoorScene
