// Additional Lv10 class defenses and opening priority.
// @soulbeast-unit 1084-classTen
// Lv10 class abilities. Transient battle state is serialized with units/buffs, never the save's base stats.
PAS.class10_barrier={n:'บาเรียเวทย์ · Lv10',d:'เริ่มการต่อสู้ ป้องกันท่าโจมตีกายภาพ เวท หรือผสมได้ 1 ท่า รวมทุกฮิต'};
PAS.class10_range={n:'ทิ้งระยะห่าง · Lv10',d:'ได้ลำดับแรกในรอบเปิดการต่อสู้ หากเจอสายมือปืนด้วยกันวัดความเร็ว'};
PAS.class10_parry={n:'ตั้งสมาธิปัดป้อง',d:'ป้องกันท่าโจมตี 1 ท่า รวมทุกฮิต แล้วสมาธิหาย ระยะเวลา 3 เทิร์น'};
PAS.class10_stealth={n:'ล่องหน',d:'ไม่เป็นเป้าท่าเดี่ยว 3 เทิร์น โดนท่าหมู่ได้ หายเมื่อเริ่มโจมตี ใช้บัฟและยาได้'};
SK.class10_parry={n:'ตั้งสมาธิปัดป้อง',t:'buff',tg:'self',pas:'class10_parry',tn:3,mp:8,cd:5};
SK.class10_stealth={n:'ล่องหน',t:'buff',tg:'self',pas:'class10_stealth',tn:3,mp:10,cd:5};
CLS.swordsman.sk.push([10,'class10_parry']);CLS.archer.sk.push([10,'class10_stealth']);
CLS.mage.pas.push('class10_barrier');CLS.gunner.pas.push('class10_range');
function class10Invisible(u){return !!u&&u.hp>0&&(u.buffs||[]).some(x=>x.pas==='class10_stealth'&&x.tn>0);}
function class10Offensive(sk){return !!sk&&['p','m','h','auto','status','debuff'].includes(sk.t);}
function class10Damaging(sk){return !!sk&&['p','m','h','auto'].includes(sk.t);}
function class10VisibleFoes(u){return foesOf(u).filter(x=>x.hp>0&&!class10Invisible(x));}
function class10OpeningOrder(a,b,battle=B()){
 if(battle?.round!==1||!a||!b)return 0;
 const first=u=>u.lv>=10&&!u.temporary&&hasPas(u,'class10_range');
 const aa=first(a),bb=first(b);if(aa!==bb)return aa?-1:1;
 return aa&&bb?eff(b,'spd')-eff(a,'spd'):0;
}
const class10UnitPrevious=unit;
unit=function(o){const u=class10UnitPrevious(o);if(u.lv<10)u.pas=u.pas.filter(k=>!['class10_barrier','class10_range'].includes(k));
 if(!u.class10Initialized){u.class10Initialized=true;if(u.lv>=10&&!u.temporary&&hasPas(u,'class10_barrier'))u.class10Barrier=1;}
 return u;
};
// One context per skill execution: blocking a multihit skill consumes one charge, not one per hit.
const class10AttackContexts=[];
function class10BlockedAlready(u,t){return !!class10AttackContexts.at(-1)?.blocked.has(t.id+'|'+u.id);}
function class10BlockHit(u,sk,t,damaging){
 if(class10BlockedAlready(u,t))return true;
 const parry=(t.buffs||[]).some(x=>x.pas==='class10_parry'&&x.tn>0),barrier=damaging&&t.class10Barrier>0;
 if(!parry&&!barrier)return false;
 if(parry)t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');else t.class10Barrier=0;
 class10AttackContexts.at(-1)?.blocked.add(t.id+'|'+u.id);
 blog(t.name+' ใช้ '+(parry?'ตั้งสมาธิปัดป้อง':'บาเรียเวทย์')+' ป้องกัน '+sk.n);vfx('buff',t.id);return true;
}
const class10HitPrevious=hitOne;
hitOne=function(u,sk,t,...args){
 if(!t||class10BlockedAlready(u,t)||class10Invisible(t)&&!sk.all)return;
 if(class10Damaging(sk))u.buffs=u.buffs.filter(x=>x.pas!=='class10_stealth');
 const own=!class10AttackContexts.length;if(own)class10AttackContexts.push({blocked:new Set()});
 try{return class10HitPrevious(u,sk,t,...args);}finally{if(own)class10AttackContexts.pop();}
};
const class10ActPrevious=act;
act=function(u,id,target,friend,free){
 const sk=SK[id];if(!sk)return false;
 if(class10Offensive(sk)&&!sk.all){const visible=class10VisibleFoes(u);if(!visible.length){blog('ไม่มีเป้าหมายเดี่ยวที่มองเห็นได้');return false;}if(class10Invisible(target)){if(!sk.rt){blog('เป้าหมายกำลังล่องหน');return false;}target=visible[0];}}
 const before=(u.buffs||[]).slice();if(class10Damaging(sk)&&!cooldownOf(u,id)&&costOf(u,sk)<=u.mp)u.buffs=u.buffs.filter(x=>x.pas!=='class10_stealth');
 class10AttackContexts.push({blocked:new Set()});
 try{const ok=class10ActPrevious(u,id,target,friend,free);if(!ok)u.buffs=before;return ok;}finally{class10AttackContexts.pop();}
};
// The chooser must never repeatedly select an untargetable single-target action.
function class10AutoMove(u,move){
 const sk=SK[move.id];if(!class10Offensive(sk)||sk.all)return move;
 const visible=class10VisibleFoes(u);if(visible.length){if(!move.target||class10Invisible(move.target))move.target=visible.find(x=>x.taunt>0)||visible[0];return move;}
 const area=u.skills.find(id=>SK[id]?.all&&class10Damaging(SK[id])&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp);
 return area?{id:area,target:foesOf(u).find(x=>x.hp>0),friend:u}:{id:'rest',target:null,friend:u};
}
function class10AutoDefense(u){
 if(u.hp<=0||u.temporary||u.hp/u.st.hp>.65||!foesOf(u).some(x=>x.hp>0))return null;
 if(u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp&&u.hp/u.st.hp<.4))return null;
 const id=u.skills.includes('class10_parry')?'class10_parry':u.skills.includes('class10_stealth')?'class10_stealth':null;
 return id&&!hasPas(u,id)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp?id:null;
}
function applyClass10Replay(b,f){
 for(const u of f.spawns||[])if(![...b.allies,...b.enemies].some(x=>x.id===u.id))(u.side==='ally'?b.allies:b.enemies).push(JSON.parse(JSON.stringify(u)));
 if(f.enemyIds)b.enemies=b.enemies.filter(u=>f.enemyIds.includes(u.id));
 for(const [id,barrier,buffs] of f.class10Units||[]){const u=[...b.allies,...b.enemies].find(x=>x.id===id);if(u){u.class10Barrier=barrier;u.buffs=JSON.parse(JSON.stringify(buffs));}}
}

const class10ChoosePrevious=aiChoose;aiChoose=function(u){const id=class10AutoDefense(u),m=id?{id,target:foesOf(u).find(x=>x.hp>0),friend:u}:(()=>{const a=class10ChoosePrevious(u);return {id:a[0],target:a[1],friend:a[2]};})();const out=class10AutoMove(u,m);return [out.id,out.target,out.friend];};
const class10EffectsPrevious=battleSpecialEffects;battleSpecialEffects=function(u){const out=class10EffectsPrevious(u),add=(key,label,index)=>out.push('<span class="battle-effect-icon special-effect good" data-effect="'+key+'" title="'+esc(label)+'" aria-label="'+esc(label)+'"><span class="battle-special-image" style="background-position:'+(index%6*20)+'% '+(Math.floor(index/6)*100/3)+'%"></span></span>');if(u.class10Barrier>0)add('class10_barrier','บาเรียเวทย์ · ป้องกันได้ 1 ท่า',3);if(hasPas(u,'class10_parry'))add('class10_parry','ตั้งสมาธิปัดป้อง · ป้องกันได้ 1 ท่า',22);if(class10Invisible(u))add('class10_stealth','ล่องหน · ไม่เป็นเป้าท่าเดี่ยว',14);return out;};
const class10CareerPrevious=careerPanel;careerPanel=function(cls){return class10CareerPrevious(cls)+(baseOf(cls)==='mage'?'<p class="sub">Lv10: บาเรียเวทย์ ป้องกันท่าโจมตีแรกได้ 1 ท่า</p>':baseOf(cls)==='gunner'?'<p class="sub">Lv10: ทิ้งระยะห่าง ได้ลำดับแรกในรอบเปิดการต่อสู้ หากเจอสายปืนด้วยกันวัดความเร็ว</p>':'');};
const class10SkillDescPrevious=skillDesc;skillDesc=function(id){return class10SkillDescPrevious(id)+(id==='class10_parry'?' · '+PAS.class10_parry.d:id==='class10_stealth'?' · '+PAS.class10_stealth.d:'');};
// @soulbeast-end 1084-classTen
